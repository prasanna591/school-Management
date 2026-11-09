import { eq, and, count, desc } from "drizzle-orm";
import { db, students, feeLedgerEntries, attendanceRecord, auditLogs } from "../../db/index";

/**
 * Export control endpoints.
 * Requires "export" permission. All exports are logged to auditLogs.
 */

function canExport(role: string | undefined): boolean {
  return ["super_admin", "trustee", "principal", "admin", "accountant", "admission_counsellor", "teacher", "class_teacher"].includes(role ?? "");
}

export async function exportRoutes(fastify: any) {
  fastify.get(
    "/exports/students",
    async (req: any, reply: any) => {
      const tenantId = req.user?.tenantId;
      if (!tenantId) return reply.code(401).send({ code: "unauthorized", message: "no tenant context" });
      if (!canExport(req.user?.role)) return reply.code(403).send({ code: "forbidden", message: "export permission required" });

      const [result] = await db
        .select({ count: count() })
        .from(students)
        .where(eq(students.tenantId, tenantId));

      await db.insert(auditLogs).values({
        tenantId,
        userId: req.user?.sub,
        action: "export.students",
        entityType: "students",
        metadata: { count: Number((result as any)?.count ?? 0), exportedAt: new Date().toISOString() },
        createdAt: new Date(),
      });

      return reply.send({ exportedAt: new Date(), recordCount: Number((result as any)?.count ?? 0), format: "json" });
    }
  );

  fastify.get(
    "/exports/fees",
    async (req: any, reply: any) => {
      const tenantId = req.user?.tenantId;
      if (!tenantId) return reply.code(401).send({ code: "unauthorized", message: "no tenant context" });
      if (!canExport(req.user?.role)) return reply.code(403).send({ code: "forbidden", message: "export permission required" });

      const [result] = await db
        .select({ count: count() })
        .from(feeLedgerEntries)
        .where(eq(feeLedgerEntries.tenantId, tenantId));

      await db.insert(auditLogs).values({
        tenantId,
        userId: req.user?.sub,
        action: "export.fees",
        entityType: "feeLedgerEntries",
        metadata: { count: Number((result as any)?.count ?? 0), exportedAt: new Date().toISOString() },
        createdAt: new Date(),
      });

      return reply.send({ exportedAt: new Date(), recordCount: Number((result as any)?.count ?? 0), format: "json" });
    }
  );

  fastify.get(
    "/exports/attendance",
    async (req: any, reply: any) => {
      const tenantId = req.user?.tenantId;
      if (!tenantId) return reply.code(401).send({ code: "unauthorized", message: "no tenant context" });
      if (!canExport(req.user?.role)) return reply.code(403).send({ code: "forbidden", message: "export permission required" });

      const [result] = await db
        .select({ count: count() })
        .from(attendanceRecord)
        .where(eq(attendanceRecord.tenantId, tenantId));

      await db.insert(auditLogs).values({
        tenantId,
        userId: req.user?.sub,
        action: "export.attendance",
        entityType: "attendanceRecord",
        metadata: { count: Number((result as any)?.count ?? 0), exportedAt: new Date().toISOString() },
        createdAt: new Date(),
      });

      return reply.send({ exportedAt: new Date(), recordCount: Number((result as any)?.count ?? 0), format: "json" });
    }
  );

  fastify.get(
    "/exports/history",
    async (req: any, reply: any) => {
      const tenantId = req.user?.tenantId;
      if (!tenantId) return reply.code(401).send({ code: "unauthorized", message: "no tenant context" });

      const items = await db
        .select()
        .from(auditLogs)
        .where(
          and(
            eq(auditLogs.tenantId, tenantId),
            eq(auditLogs.action, "export.students")
          )
        )
        .orderBy(desc(auditLogs.createdAt))
        .limit(50);

      return reply.send({ items });
    }
  );
}
