import { z } from "zod";
import { sendOtp, verifyOtp } from "./service";
import { signAccessToken, signRefreshToken, verifyRefreshToken } from "./jwt";

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
      await sendOtp(phone);
      return reply.send({ ok: true });
    }
  );

  fastify.post(
    "/auth/verify-otp",
    { schema: { body: verifyOtpSchema } },
    async (req: any, reply: any) => {
      const { phone, otp, tenantId } = verifyOtpSchema.parse(req.body);
      const user = await verifyOtp(phone, otp, tenantId);
      const accessToken = signAccessToken(user.id, user.tenantId || "", user.role);
      const refreshToken = signRefreshToken(user.id);
      return reply.send({
        accessToken,
        refreshToken,
        user: { id: user.id, role: user.role, phone: user.phone, tenantId: user.tenantId },
      });
    }
  );

  fastify.post(
    "/auth/refresh",
    { schema: { body: refreshSchema } },
    async (req: any, reply: any) => {
      const { refreshToken } = refreshSchema.parse(req.body);
      const { sub: userId } = verifyRefreshToken(refreshToken);
      const accessToken = signAccessToken(userId, "", "");
      return reply.send({ accessToken, refreshToken: signRefreshToken(userId) });
    }
  );

  fastify.post("/auth/logout", async (_req: any, reply: any) => {
    return reply.send({ ok: true });
  });
}
