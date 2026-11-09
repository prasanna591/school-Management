import Fastify from "fastify";
import cors from "@fastify/cors";
import cookie from "@fastify/cookie";
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
import { admissionsRoutes } from "./modules/admissions/routes";
import { timetableRoutes } from "./modules/timetable/routes";
import { hrRoutes } from "./modules/hr/routes";
import { libraryRoutes } from "./modules/library/routes";
import { notificationRoutes } from "./modules/notifications/routes";
import { communicationRoutes } from "./modules/communications/routes";
import { fileRoutes } from "./modules/files/routes";
import { exportRoutes } from "./modules/exports/routes";
import { registerAuthz } from "./lib/authz";
import { checkRateLimit } from "./lib/rateLimit";
import { setTenantContext } from "./db/index";

export function buildApp() {
  const app = Fastify({ logger: true });

  app.register(cors, { origin: true, credentials: true });
  app.register(cookie);
  app.register(jwt, {
    secret: process.env.ACCESS_TOKEN_SECRET || "access-secret-change-me",
  });

  app.addHook("onRequest", async (req: any, reply: any) => {
    const auth = req.headers.authorization;
    if (auth?.startsWith("Bearer ")) {
      try {
        const payload: any = app.jwt.verify(auth.slice(7));
        req.user = {
          sub: payload.sub,
          tenantId: payload.tenantId,
          role: payload.role,
        };
      } catch {
        req.user = undefined;
      }
    }

    // Capture raw body for webhook signature verification
    if (req.url?.startsWith("/api/payments/webhook/")) {
      req.rawBody = await new Promise<string>((resolve, reject) => {
        const chunks: Buffer[] = [];
        req.raw.on("data", (chunk: Buffer) => chunks.push(chunk));
        req.raw.on("end", () => resolve(Buffer.concat(chunks).toString("utf8")));
        req.raw.on("error", reject);
      });
    }

    // Rate limiting: per user (authenticated) or per IP (unauthenticated)
    const identifier = req.user?.sub || req.ip || "unknown";
    const rl = await checkRateLimit({
      method: req.method,
      path: req.routerPath ?? req.url,
      identifier,
    });
    if (!rl.allowed) {
      reply.code(429).send({
        code: "rate_limited",
        message: "Too many requests. Please try again later.",
        retryAfter: Math.max(0, rl.reset - Math.floor(Date.now() / 1000)),
      });
      return;
    }

    // Set tenant context for RLS (after auth, before route handler)
    if (req.user?.tenantId) {
      await setTenantContext(req.user.tenantId);
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
  app.register(admissionsRoutes, { prefix: "/api" });
  app.register(timetableRoutes, { prefix: "/api" });
  app.register(hrRoutes, { prefix: "/api" });
  app.register(libraryRoutes, { prefix: "/api" });
  app.register(notificationRoutes, { prefix: "/api" });
  app.register(communicationRoutes, { prefix: "/api" });
  app.register(fileRoutes, { prefix: "/api" });
  app.register(exportRoutes, { prefix: "/api" });

  // Authorization guard: permission check + object-level authorization
  registerAuthz(app);

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
if (process.env.NODE_ENV !== "test") {
  app.listen({ port, host: "0.0.0.0" }, (err: Error | null) => {
    if (err) {
      app.log.error(err);
      process.exit(1);
    }
    console.log(`SmartSchool API listening on :${port}`);
  });
}
