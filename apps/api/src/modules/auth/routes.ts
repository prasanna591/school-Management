import { z } from "zod";
import { sendOtp, verifyOtp } from "./service";
import { signAccessToken, signRefreshToken, rotateRefreshToken, revokeRefreshToken } from "./jwt";

const sendOtpSchema = z.object({
  phone: z.string().min(10, "Invalid phone number"),
});

const verifyOtpSchema = z.object({
  phone: z.string().min(10, "Invalid phone number"),
  otp: z.string().length(6, "OTP must be 6 digits"),
  tenantId: z.string().uuid(),
});

const refreshSchema = z.object({
  refreshToken: z.string(),
});

export async function authRoutes(fastify: any) {
  fastify.post(
    "/auth/send-otp",
    { schema: { body: sendOtpSchema } },
    async (req: any, reply: any) => {
      const { phone } = sendOtpSchema.parse(req.body);
      const ip = (req.headers["x-forwarded-for"] as string) ?? req.ip ?? undefined;
      try {
        await sendOtp(phone, ip);
      } catch {
        // Same response whether Redis is down or not (no enumeration)
      }
      return reply.send({ ok: true });
    }
  );

  fastify.post(
    "/auth/verify-otp",
    { schema: { body: verifyOtpSchema } },
    async (req: any, reply: any) => {
      const { phone, otp, tenantId } = verifyOtpSchema.parse(req.body);
      try {
        const user = await verifyOtp(phone, otp, tenantId);
        const accessToken = signAccessToken(user.id, user.tenantId || "", user.role);
        const { token: refreshToken } = signRefreshToken(user.id);
        return reply.send({
          accessToken,
          refreshToken,
          user: { id: user.id, role: user.role, phone: user.phone, tenantId: user.tenantId },
        });
      } catch {
        throw new Error("invalid_otp");
      }
    }
  );

  fastify.post(
    "/auth/refresh",
    { schema: { body: refreshSchema } },
    async (req: any, reply: any) => {
      const { refreshToken } = refreshSchema.parse(req.body);
      const rotated = await rotateRefreshToken(refreshToken);
      if (!rotated) {
        return reply.code(401).send({
          code: "token_revoked",
          message: "Refresh token revoked or reused. Please log in again.",
        });
      }
      const accessToken = signAccessToken(rotated.userId, "", "");
      return reply.send({
        accessToken,
        refreshToken: rotated.token,
      });
    }
  );

  fastify.post("/auth/logout", async (req: any, reply: any) => {
    const auth = req.headers.authorization;
    if (auth?.startsWith("Bearer ")) {
      try {
        await revokeRefreshToken(auth.slice(7));
      } catch {
        // Best effort revocation
      }
    }
    return reply.send({ ok: true });
  });
}
