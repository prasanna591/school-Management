import { eq } from "drizzle-orm";
import { db, users } from "../../db/index";
import { generateOtp, otpExpiry } from "../../lib/otp";
import Redis from "ioredis";
import * as crypto from "crypto";

let redis: Redis | null = null;

function getRedis() {
  if (!redis) {
    const url = process.env.REDIS_URL;
    if (!url) return null;
    redis = new Redis(url, { lazyConnect: true });
  }
  return redis;
}

const OTP_TTL_SECONDS = 5 * 60; // 5 minutes
const MAX_ATTEMPTS = 5;
const RESEND_COOLDOWN_SECONDS = 60; // 1 minute between resends
const HOURLY_RESEND_CAP = 10; // max 10 resends per phone per hour

function otpKey(phone: string) {
  return `otp:${phone}`;
}
function otpAttemptsKey(phone: string) {
  return `otp_attempts:${phone}`;
}
function resendCooldownKey(phone: string) {
  return `otp_resend_cd:${phone}`;
}
function hourlyResendKey(phone: string) {
  return `otp_hourly_resend:${phone}`;
}

function hashOtp(otp: string, phone: string) {
  return crypto.createHmac("sha256", phone).update(otp).digest("hex");
}

function constantTimeCompare(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

export async function sendOtp(phone: string, ip?: string) {
  const r = getRedis();
  if (!r) {
    throw new Error("redis_unavailable");
  }

  // Resend throttling: cooldown per phone
  const cd = await r.get(resendCooldownKey(phone));
  if (cd) {
    // Same response whether or not we can resend (no enumeration)
    return { phone, otpSent: true, rateLimited: true };
  }

  // Hourly resend cap per phone
  const hourly = await r.get(hourlyResendKey(phone));
  if (hourly && Number(hourly) >= HOURLY_RESEND_CAP) {
    return { phone, otpSent: true, rateLimited: true };
  }

  // Per-IP hourly cap (if IP provided)
  if (ip) {
    const ipHourly = await r.get(`otp_ip_hourly:${ip}`);
    if (ipHourly && Number(ipHourly) >= HOURLY_RESEND_CAP) {
      return { phone, otpSent: true, rateLimited: true };
    }
  }

  const otp = generateOtp();
  const otpHash = hashOtp(otp, phone);
  const expiry = otpExpiry();

  // Store hash with TTL, single-use (deleted after verify)
  await r.setex(otpKey(phone), OTP_TTL_SECONDS, otpHash);
  // Track attempts
  await r.set(otpAttemptsKey(phone), "0");
  await r.expire(otpAttemptsKey(phone), OTP_TTL_SECONDS);
  // Set resend cooldown
  await r.setex(resendCooldownKey(phone), RESEND_COOLDOWN_SECONDS, "1");
  // Increment hourly resend counter
  await r.incr(hourlyResendKey(phone));
  await r.expire(hourlyResendKey(phone), 60 * 60);

  if (ip) {
    await r.incr(`otp_ip_hourly:${ip}`);
    await r.expire(`otp_ip_hourly:${ip}`, 60 * 60);
  }

  // In production: send via DLT-registered SMS template. Log only the fact, not the OTP.
  console.log(`[otp] ${phone}: otp issued (expires ${expiry.toISOString()})`);
  return { phone, otpSent: true };
}

export async function verifyOtp(phone: string, otp: string, tenantId: string) {
  const r = getRedis();
  if (!r) {
    throw new Error("redis_unavailable");
  }

  // Dev/test shortcut: fixed OTP only in non-production
  if (process.env.NODE_ENV !== "production" && otp === "000000") {
    await r.del(otpKey(phone));
    await r.del(otpAttemptsKey(phone));
    return await getOrCreateUser(phone, tenantId);
  }

  const storedHash = await r.get(otpKey(phone));
  if (!storedHash) {
    // Same response whether OTP expired, never issued, or already used (no enumeration)
    throw new Error("no_otp_issued");
  }

  // Attempt tracking
  const attemptsKey = otpAttemptsKey(phone);
  const currentAttempts = Number(await r.get(attemptsKey)) || 0;
  if (currentAttempts >= MAX_ATTEMPTS) {
    await r.del(otpKey(phone));
    await r.del(attemptsKey);
    throw new Error("otp_locked");
  }

  const otpHash = hashOtp(otp, phone);
  if (!constantTimeCompare(otpHash, storedHash)) {
    await r.incr(attemptsKey);
    await r.expire(attemptsKey, OTP_TTL_SECONDS);
    throw new Error("invalid_otp");
  }

  // OTP is single-use: delete immediately after successful verification
  await r.del(otpKey(phone));
  await r.del(attemptsKey);
  await r.del(resendCooldownKey(phone));

  return await getOrCreateUser(phone, tenantId);
}

async function getOrCreateUser(phone: string, tenantId: string) {
  let [user] = await db.select().from(users).where(eq(users.phone, phone)).limit(1);
  if (!user) {
    [user] = await db
      .insert(users)
      .values({ phone, tenantId, role: "parent", phoneVerified: true })
      .returning();
  } else if (!user.tenantId) {
    await db
      .update(users)
      .set({ tenantId, phoneVerified: true, updatedAt: new Date() })
      .where(eq(users.id, user.id));
    user = { ...user, tenantId };
  }
  return user;
}
