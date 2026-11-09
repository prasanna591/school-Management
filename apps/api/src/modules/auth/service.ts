import { eq } from "drizzle-orm";
import { db, users } from "../../db/index";
import { generateOtp, otpExpiry } from "../../lib/otp";

const otpStore = new Map<string, { otp: string; expiresAt: Date }>();

export async function sendOtp(phone: string) {
  const otp = generateOtp();
  otpStore.set(phone, { otp, expiresAt: otpExpiry() });
  // In production: send via DLT-registered SMS template. Log only the fact, not the OTP.
  console.log(`[otp] ${phone}: otp issued (expires ${otpExpiry().toISOString()})`);
  return { phone, otpSent: true };
}

export async function verifyOtp(phone: string, otp: string, tenantId: string) {
  const record = otpStore.get(phone);
  if (!record) throw new Error("no_otp_issued");
  if (record.expiresAt < new Date()) {
    otpStore.delete(phone);
    throw new Error("otp_expired");
  }
  if (record.otp !== otp) throw new Error("invalid_otp");
  otpStore.delete(phone);

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
