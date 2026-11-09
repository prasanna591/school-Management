import { sign, verify } from "jsonwebtoken";

const ACCESS_SECRET = process.env.ACCESS_TOKEN_SECRET || "access-secret-change-me";
const REFRESH_SECRET = process.env.REFRESH_TOKEN_SECRET || "refresh-secret-change-me";
const ACCESS_TTL = "15m";
const REFRESH_TTL = "7d";

export type TokenPayload = { sub: string; tenantId: string; role: string };

export function signAccessToken(userId: string, tenantId: string, role: string) {
  return sign({ sub: userId, tenantId, role }, ACCESS_SECRET, { expiresIn: ACCESS_TTL });
}

export function signRefreshToken(userId: string) {
  return sign({ sub: userId }, REFRESH_SECRET, { expiresIn: REFRESH_TTL });
}

export function verifyAccessToken(token: string): TokenPayload {
  return verify(token, ACCESS_SECRET) as TokenPayload;
}

export function verifyRefreshToken(token: string): { sub: string } {
  return verify(token, REFRESH_SECRET) as { sub: string };
}
