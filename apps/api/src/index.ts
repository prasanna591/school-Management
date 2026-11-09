import Fastify from "fastify";
import cors from "@fastify/cors";
import cookie from "@fastify/cookie";
import rateLimit from "@fastify/rate-limit";
import jwt from "@fastify/jwt";
import { authRoutes } from "./modules/auth/routes";
import { tenantRoutes } from "./modules/tenants/routes";

export function buildApp() {
  const app = Fastify({ logger: true });

  app.register(cors, { origin: true, credentials: true });
  app.register(cookie);
  app.register(rateLimit, { max: 100, timeWindow: 60000 });
  app.register(jwt, { secret: process.env.ACCESS_TOKEN_SECRET || "access-secret-change-me" });

  app.decorateRequest("user", null as any);

  app.addHook("onRequest", async (req: any) => {
    const auth = req.headers.authorization;
    if (auth?.startsWith("Bearer ")) {
      try {
        const payload: any = app.jwt.verify(auth.slice(7));
        req.user = { sub: payload.sub, tenantId: payload.tenantId, role: payload.role };
      } catch {
        req.user = null;
      }
    }
  });

  app.register(authRoutes, { prefix: "/api" });
  app.register(tenantRoutes, { prefix: "/api" });

  app.get("/api/health", async () => ({ ok: true }));

  app.setErrorHandler((error: any, _req: any, reply: any) => {
    const statusCode = error.statusCode || 500;
    return reply.status(statusCode).send({
      code: error.code || "internal_error",
      message: error.message,
    });
  });

  return app;
}

const app = buildApp();

const port = Number(process.env.PORT) || 3001;
app.listen({ port, host: "0.0.0.0" }, (err: Error | null) => {
  if (err) {
    app.log.error(err);
    process.exit(1);
  }
  console.log(`SmartSchool API listening on :${port}`);
});
