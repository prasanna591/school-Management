import { z } from "zod";
import { eq, desc, count, sql } from "drizzle-orm";
import { db, attendanceSessions, attendanceRecord, payments, notices, approvals, students } from "../../db/index";

export async function principalRoutes(fastify: any) {
  fastify.get("/principal/dashboard", async (req: any, reply: any) => {
    const tenantId = req.user?.tenantId;
    if (!tenantId) return reply.code(401).send({ code: "unauthorized", message: "no tenant context" });

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [attToday] = await db
      .select({ count: count() })
      .from(attendanceRecord)
      .innerJoin(attendanceSessions, eq(attendanceSessions.id, attendanceRecord.sessionId))
      .where(
        eq(attendanceSessions.tenantId, tenantId) && eq(attendanceSessions.date, today)
      );

    const [feeToday] = await db
      .select({ total: sql<number>`COALESCE(SUM(${payments.amountPaise}), 0)` })
      .from(payments)
      .where(eq(payments.tenantId, tenantId) && eq(payments.status, "success"));

    const [pendingApprovals] = await db
      .select({ count: count() })
      .from(approvals)
      .where(eq(approvals.tenantId, tenantId) && eq(approvals.status, "pending"));

    const [totalStudents] = await db.select({ count: count() }).from(students).where(eq(students.tenantId, tenantId));
    const [totalNotices] = await db.select({ count: count() }).from(notices).where(eq(notices.tenantId, tenantId));

    return reply.send({
      attendanceToday: attToday?.count ?? 0,
      feesCollectedTodayPaise: Number(feeToday?.total ?? 0),
      pendingApprovals: pendingApprovals?.count ?? 0,
      totalStudents: totalStudents?.count ?? 0,
      totalNotices: totalNotices?.count ?? 0,
    });
  });

  fastify.get("/principal/approvals", async (req: any, reply: any) => {
    const tenantId = req.user?.tenantId;
    if (!tenantId) return reply.code(401).send({ code: "unauthorized", message: "no tenant context" });
    const items = await db
      .select()
      .from(approvals)
      .where(eq(approvals.tenantId, tenantId))
      .orderBy(desc(approvals.createdAt));
    return reply.send({ items });
  });

  const decisionSchema = z.object({
    decision: z.enum(["approved", "rejected"]),
    comment: z.string().optional(),
  });

  fastify.post(
    "/principal/approvals/:id/decision",
    { schema: { body: decisionSchema } },
    async (req: any, reply: any) => {
      const tenantId = req.user?.tenantId;
      if (!tenantId) return reply.code(401).send({ code: "unauthorized", message: "no tenant context" });
      const { decision, comment } = decisionSchema.parse(req.body);
      const [updated] = await db
        .update(approvals)
        .set({ status: decision, decision, decidedBy: req.user?.sub, decidedAt: new Date(), comment: comment ?? null, updatedAt: new Date() })
        .where(eq(approvals.id, req.params.id))
        .returning();
      if (!updated) return reply.code(404).send({ code: "not_found", message: "approval not found" });
      return reply.send(updated);
    }
  );
}
