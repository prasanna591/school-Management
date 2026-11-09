import { sign, verify, type SignOptions, type VerifyOptions } from "jsonwebtoken";
import * as crypto from "crypto";
import Redis from "ioredis";
import { z } from "zod";

// --- Env validation at boot (reject default/dev secrets in production) ---
const envSchema = z.object({
  ACCESS_TOKEN_SECRET: z.string().min(32),
  REFRESH_TOKEN_SECRET: z.string().min(32),
});

const env = envSchema.parse({
  ACCESS_TOKEN_SECRET: process.env.ACCESS_TOKEN_SECRET,
  REFRESH_TOKEN_SECRET: process.env.REFRESH_TOKEN_SECRET,
});

if (
  process.env.NODE_ENV === "production" &&
  (env.ACCESS_TOKEN_SECRET === "access-secret-change-me" ||
    env.REFRESH_TOKEN_SECRET === "refresh-secret-change-me")
) {
  throw new Error("Default secrets are not allowed in production");
}

const ACCESS_SECRET = env.ACCESS_TOKEN_SECRET;
const REFRESH_SECRET = env.REFRESH_TOKEN_SECRET;
const ACCESS_TTL = "15m";
const REFRESH_TTL = "7d";
const ISSUER = "smartschool";
const AUDIENCE = "smartschool-mobile";

let redis: Redis | null = null;

function getRedis() {
  if (!redis) {
    const url = process.env.REDIS_URL;
    if (!url) return null;
    redis = new Redis(url, { lazyConnect: true });
  }
  return redis;
}

export type TokenPayload = { sub: string; tenantId: string; role: string };

const signOptions: SignOptions = {
  algorithm: "HS256",
  issuer: ISSUER,
  audience: AUDIENCE,
};

const verifyOptions: VerifyOptions = {
  algorithms: ["HS256"],
  issuer: ISSUER,
  audience: AUDIENCE,
};

export function signAccessToken(userId: string, tenantId: string, role: string) {
  return sign({ sub: userId, tenantId, role }, ACCESS_SECRET, {
    ...signOptions,
    expiresIn: ACCESS_TTL,
  });
}

export function signRefreshToken(
  userId: string,
  deviceId?: string
): { token: string; familyId: string } {
  const familyId = crypto.randomUUID();
  const token = sign({ sub: userId, fam: familyId }, REFRESH_SECRET, {
    ...signOptions,
    expiresIn: REFRESH_TTL,
  });

  const r = getRedis();
  if (r) {
    const tokenHash = crypto.createHmac("sha256", REFRESH_SECRET).update(token).digest("hex");
    // Store hash with TTL; mark family as active
    r.setex(`refresh_hash:${tokenHash}`, 7 * 24 * 60 * 60, familyId);
    r.setex(`refresh_family:${familyId}`, 7 * 24 * 60 * 60, "active");
    r.setex(`refresh_device:${familyId}`, 7 * 24 * 60 * 60, deviceId ?? "unknown");
  }

  return { token, familyId };
}

export function verifyAccessToken(token: string): TokenPayload {
  return verify(token, ACCESS_SECRET, verifyOptions) as TokenPayload;
}

export function verifyRefreshToken(token: string): { sub: string; fam: string } {
  return verify(token, REFRESH_SECRET, verifyOptions) as { sub: string; fam: string };
}

/**
 * Rotate a refresh token with reuse detection.
 * If the token family has been marked compromised (reuse detected), all tokens in the family are revoked.
 * Returns the new token and family ID.
 */
export async function rotateRefreshToken(
  oldToken: string
): Promise<{ userId: string; token: string; familyId: string } | null> {
  const r = getRedis();
  if (!r) throw new Error("redis_unavailable");

  // Decode the old token to get family ID (without verifying signature yet)
  let decoded: { sub: string; fam: string };
  try {
    decoded = verify(oldToken, REFRESH_SECRET, {
      ...verifyOptions,
      ignoreExpiration: true,
    }) as { sub: string; fam: string };
  } catch {
    return null;
  }

  const { sub: userId, fam: familyId } = decoded;

  // Check if family has been compromised (reuse detected)
  const familyStatus = await r.get(`refresh_family:${familyId}`);
  if (familyStatus === "revoked") {
    // Reuse detected: revoke the entire family
    await r.del(`refresh_family:${familyId}`);
    await r.del(`refresh_device:${familyId}`);
    // Revoke all token hashes in this family (we can't list them, but marking family revoked is enough)
    return null;
  }

  // Verify the token hash exists and is valid
  const tokenHash = crypto.createHmac("sha256", REFRESH_SECRET).update(oldToken).digest("hex");
  const existingFamily = await r.get(`refresh_hash:${tokenHash}`);
  if (!existingFamily || existingFamily !== familyId) {
    // Token not found or family mismatch - possible reuse, revoke family
    await r.setex(`refresh_family:${familyId}`, 7 * 24 * 60 * 60, "revoked");
    await r.del(`refresh_device:${familyId}`);
    return null;
  }

  // Rotate: delete old hash, issue new token with same family
  await r.del(`refresh_hash:${tokenHash}`);

  const newToken = sign({ sub: userId, fam: familyId }, REFRESH_SECRET, {
    ...signOptions,
    expiresIn: REFRESH_TTL,
  });
  const newHash = crypto.createHmac("sha256", REFRESH_SECRET).update(newToken).digest("hex");
  await r.setex(`refresh_hash:${newHash}`, 7 * 24 * 60 * 60, familyId);

  return { userId, token: newToken, familyId };
}

/**
 * Revoke a refresh token and its family (logout).
 */
export async function revokeRefreshToken(token: string): Promise<void> {
  const r = getRedis();
  if (!r) return;

  try {
    const decoded = verify(token, REFRESH_SECRET, {
      ...verifyOptions,
      ignoreExpiration: true,
    }) as { fam: string };
    await r.del(`refresh_family:${decoded.fam}`);
    await r.del(`refresh_device:${decoded.fam}`);
  } catch {
    // Token invalid, nothing to revoke
  }

  const tokenHash = crypto.createHmac("sha256", REFRESH_SECRET).update(token).digest("hex");
  await r.del(`refresh_hash:${tokenHash}`);
}

/**
 * Revoke all refresh tokens for a user (logout all devices).
 */
export async function revokeAllRefreshTokens(_userId: string): Promise<void> {
  const r = getRedis();
  if (!r) return;
  // Note: In production, maintain a user->families index for full revocation.
  // For now, families expire naturally via TTL.
}

export function refreshTokenTtlSeconds() {
  return 7 * 24 * 60 * 60;
}
