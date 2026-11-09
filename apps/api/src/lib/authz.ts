import { FastifyInstance } from "fastify";
import { CHILD_SCOPED_ROUTES, canAccessObject, hasPermission } from "../lib/policy";

// Permission required per route (method + path).
// Routes not listed here are rejected at startup in CI (fail closed).
const ROUTE_PERMISSIONS: Record<string, { method: string; permission: "view" | "create" | "edit" | "approve" | "export" }> = {
  "GET:/api/fee-heads": { method: "GET", permission: "view" },
  "POST:/api/fee-heads": { method: "POST", permission: "create" },
  "GET:/api/fee-structures": { method: "GET", permission: "view" },
  "POST:/api/fee-structures": { method: "POST", permission: "create" },
  "GET:/api/students/:studentId/dues": { method: "GET", permission: "view" },
  "POST:/api/payments/orders": { method: "POST", permission: "create" },
  "GET:/api/payments/orders/:id": { method: "GET", permission: "view" },
  "POST:/api/payments/webhook/:gateway": { method: "POST", permission: "view" },
  "GET:/api/notices": { method: "GET", permission: "view" },
  "POST:/api/notices": { method: "POST", permission: "create" },
  "GET:/api/message-threads": { method: "GET", permission: "view" },
  "POST:/api/message-threads": { method: "POST", permission: "create" },
  "GET:/api/homeworks": { method: "GET", permission: "view" },
  "POST:/api/homeworks": { method: "POST", permission: "create" },
  "POST:/api/homework-submissions": { method: "POST", permission: "create" },
  "GET:/api/attendance/sessions": { method: "GET", permission: "view" },
  "POST:/api/attendance/sessions": { method: "POST", permission: "create" },
  "POST:/api/attendance/sessions/:id/mark": { method: "POST", permission: "edit" },
  "POST:/api/attendance/sessions/:id/submit": { method: "POST", permission: "edit" },
  "GET:/api/exams": { method: "GET", permission: "view" },
  "POST:/api/exams": { method: "POST", permission: "create" },
  "POST:/api/marks": { method: "POST", permission: "edit" },
  "POST:/api/exams/:id/lock": { method: "POST", permission: "approve" },
  "GET:/api/trips": { method: "GET", permission: "view" },
  "POST:/api/trips": { method: "POST", permission: "create" },
  "POST:/api/trips/:id/start": { method: "POST", permission: "edit" },
  "POST:/api/trips/:id/end": { method: "POST", permission: "edit" },
  "POST:/api/trip-points": { method: "POST", permission: "edit" },
  "GET:/api/gate-passes": { method: "GET", permission: "view" },
  "POST:/api/gate-passes": { method: "POST", permission: "create" },
  "POST:/api/gate-passes/:id/verify": { method: "POST", permission: "edit" },
  "GET:/api/visitor-logs": { method: "GET", permission: "view" },
  "POST:/api/visitor-logs": { method: "POST", permission: "create" },
  "GET:/api/consent-records": { method: "GET", permission: "view" },
  "POST:/api/consent-records/:id/withdraw": { method: "POST", permission: "edit" },
  "GET:/api/admissions": { method: "GET", permission: "view" },
  "POST:/api/admissions": { method: "POST", permission: "create" },
  "GET:/api/timetable": { method: "GET", permission: "view" },
  "POST:/api/timetable": { method: "POST", permission: "create" },
  "GET:/api/staff": { method: "GET", permission: "view" },
  "POST:/api/staff": { method: "POST", permission: "create" },
  "GET:/api/payslips": { method: "GET", permission: "view" },
  "GET:/api/library/books": { method: "GET", permission: "view" },
  "POST:/api/library/books": { method: "POST", permission: "create" },
  "POST:/api/library/issues": { method: "POST", permission: "create" },
  "GET:/api/library/issues": { method: "GET", permission: "view" },
  "GET:/api/principal/dashboard": { method: "GET", permission: "view" },
  "GET:/api/principal/approvals": { method: "GET", permission: "view" },
  "POST:/api/principal/approvals/:id/decision": { method: "POST", permission: "approve" },
  "GET:/api/leave-requests": { method: "GET", permission: "view" },
  "POST:/api/leave-requests": { method: "POST", permission: "create" },
  "GET:/api/grievances": { method: "GET", permission: "view" },
  "POST:/api/grievances": { method: "POST", permission: "create" },
  "GET:/api/tenants/me": { method: "GET", permission: "view" },
  "GET:/api/tenants/resolve": { method: "GET", permission: "view" },
  "POST:/api/auth/send-otp": { method: "POST", permission: "view" },
  "POST:/api/auth/verify-otp": { method: "POST", permission: "view" },
  "GET:/api/health": { method: "GET", permission: "view" },
};

/**
 * Register authorization middleware on the Fastify instance.
 * - Fails closed: any route without a declared permission is rejected at startup.
 * - Permission check: one guard for all routes.
 * - Object-level authorization: child-scoped routes verify the actor can access the target.
 */
export function registerAuthz(app: FastifyInstance) {
  // Permission guard: runs on every authenticated request.
  app.addHook("onRequest", async (req: any, reply: any) => {
    const path = (req.routerPath as string) || req.url;
    const method = req.method as string;
    const key = `${method}:${path}`;

    const rule = ROUTE_PERMISSIONS[key];
    if (!rule) {
      // Undeclared route: fail closed
      return reply.code(403).send({
        code: "permission_required",
        message: `No permission declared for ${method} ${path}`,
      });
    }

    // Public auth routes don't require a user session
    const isPublicAuth =
      path === "/api/auth/send-otp" || path === "/api/auth/verify-otp";
    // Webhook routes are authenticated by signature, not session
    const isWebhook = path.startsWith("/api/payments/webhook/");
    if (!isPublicAuth && !isWebhook) {
      const actor: any = req.user;
      if (!actor) {
        return reply.code(401).send({
          code: "unauthorized",
          message: "No tenant context",
        });
      }

      // Permission check
      if (!hasPermission({ actor, permission: rule.permission })) {
        return reply.code(403).send({
          code: "forbidden",
          message: `Insufficient permission: ${rule.permission}`,
        });
      }

      // Object-level authorization for child-scoped routes
      const scoped = CHILD_SCOPED_ROUTES.find(
        (s) =>
          s.method === method &&
          path.startsWith(s.path.replace("/:id", "").replace("/:studentId", ""))
      );
      if (scoped) {
        const paramName = scoped.param;
        const targetId = (req.params as Record<string, string>)[paramName];
        if (targetId) {
          const allowed = await canAccessObject({
            actor: {
              userId: actor.sub,
              role: actor.role,
              tenantId: actor.tenantId,
            },
            targetType: scoped.targetType,
            targetId,
          });
          if (!allowed) {
            return reply.code(403).send({
              code: "forbidden",
              message: "Not authorized to access this object",
            });
          }
        }
      }
    }
  });
}
