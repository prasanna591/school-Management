import Fastify from "fastify";
import cors from "@fastify/cors";
import cookie from "@fastify/cookie";
import rateLimit from "@fastify/rate-limit";
import jwt from "@fastify/jwt";
import { authRoutes } from "./modules/auth/routes";
import { tenantRoutes } from "./modules/tenants/routes";
import { studentsRoutes } from "./modules/students/routes";
import { guardiansRoutes } from "./modules/guardians/routes";
import { attendanceRoutes } from "./modules/attendance/routes";
import { syncRoutes } from "./modules/sync/routes";
import { feeRoutes } from "./modules/fees/routes";
import { noticesRoutes } from "./modules/notices/routes";
import { messagesRoutes } from "./modules/messages/routes";
import { homeworkRoutes } from "./modules/homework/routes";
import { principalRoutes } from "./modules/principal/routes";
import { leaveRoutes } from "./modules/leave/routes";
import { grievanceRoutes } from "./modules/grievance/routes";
import { examsRoutes } from "./modules/exams/routes";
import { transportRoutes } from "./modules/transport/routes";
import { gateRoutes, consentRoutes } from "./modules/gate/routes";

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
  app.register(studentsRoutes, { prefix: "/api" });
  app.register(guardiansRoutes, { prefix: "/api" });
  app.register(attendanceRoutes, { prefix: "/api" });
  app.register(syncRoutes, { prefix: "/api" });
  app.register(feeRoutes, { prefix: "/api" });
  app.register(noticesRoutes, { prefix: "/api" });
  app.register(messagesRoutes, { prefix: "/api" });
  app.register(homeworkRoutes, { prefix: "/api" });
  app.register(principalRoutes, { prefix: "/api" });
  app.register(leaveRoutes, { prefix: "/api" });
  app.register(grievanceRoutes, { prefix: "/api" });
  app.register(examsRoutes, { prefix: "/api" });
  app.register(transportRoutes, { prefix: "/api" });
  app.register(gateRoutes, { prefix: "/api" });
  app.register(consentRoutes, { prefix: "/api" });

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
