import { z } from "zod";
import { eq, and, desc } from "drizzle-orm";
import { db, attendanceSessions, attendanceRecord, students } from "../../db/index";

const createSessionSchema = z.object({
  classId: z.string().uuid(),
  sectionId: z.string().uuid().optional(),
  date: z.string().datetime(),
  period: z.string().optional(),
});

const markSchema = z.object({
  studentId: z.string().uuid(),
  status: z.enum([
    "present",
    "absent",
    "late",
    "half-day",
    "medical-leave",
    "approved-leave",
  ]),
  remark: z.string().optional(),
});

export async function attendanceRoutes(fastify: any) {
  fastify.post(
    "/attendance/sessions",
    { schema: { body: createSessionSchema } },
    async (req: any, reply: any) => {
      const { classId, sectionId, date, period } = createSessionSchema.parse(req.body);
      const tenantId = req.user?.tenantId;
      if (!tenantId) return reply.code(401).send({ code: "unauthorized", message: "no tenant context" });

      const conditions = [
        eq(attendanceSessions.tenantId, tenantId),
        eq(attendanceSessions.classId, classId),
        eq(attendanceSessions.date, new Date(date)),
      ];
      if (period) conditions.push(eq(attendanceSessions.period, period));

      const [existing] = await db
        .select()
        .from(attendanceSessions)
        .where(and(...conditions))
        .limit(1);
      if (existing) return reply.send(existing);

      const [session] = await db
        .insert(attendanceSessions)
        .values({ tenantId, classId, sectionId, date: new Date(date), period, isLocked: false })
        .returning();
      return reply.code(201).send(session);
    }
  );

  fastify.post(
    "/attendance/sessions/:id/mark",
    { schema: { body: markSchema } },
    async (req: any, reply: any) => {
      const tenantId = req.user?.tenantId;
      if (!tenantId) return reply.code(401).send({ code: "unauthorized", message: "no tenant context" });

      const [session] = await db
        .select()
        .from(attendanceSessions)
        .where(and(eq(attendanceSessions.id, req.params.id), eq(attendanceSessions.tenantId, tenantId)))
        .limit(1);
      if (!session) return reply.code(404).send({ code: "not_found", message: "session not found" });
      if (session.isLocked) return reply.code(409).send({ code: "session_locked", message: "session is locked" });

      const { studentId, status, remark } = markSchema.parse(req.body);
      const [existing] = await db
        .select()
        .from(attendanceRecord)
        .where(
          and(
            eq(attendanceRecord.sessionId, session.id),
            eq(attendanceRecord.studentId, studentId)
          )
        )
        .limit(1);
      let record;
      if (existing) {
        [record] = await db
          .update(attendanceRecord)
          .set({ status, remark: remark ?? null, markedBy: req.user?.sub, markedAt: new Date(), updatedAt: new Date() })
          .where(eq(attendanceRecord.id, existing.id))
          .returning();
      } else {
        [record] = await db
          .insert(attendanceRecord)
          .values({
            tenantId,
            sessionId: session.id,
            studentId,
            status,
            remark: remark ?? null,
            markedBy: req.user?.sub,
            markedAt: new Date(),
          })
          .returning();
      }
      return reply.send(record);
    }
  );

  fastify.post(
    "/attendance/sessions/:id/submit",
    async (req: any, reply: any) => {
      const tenantId = req.user?.tenantId;
      if (!tenantId) return reply.code(401).send({ code: "unauthorized", message: "no tenant context" });

      const [session] = await db
        .select()
        .from(attendanceSessions)
        .where(and(eq(attendanceSessions.id, req.params.id), eq(attendanceSessions.tenantId, tenantId)))
        .limit(1);
      if (!session) return reply.code(404).send({ code: "not_found", message: "session not found" });
      if (session.isLocked) return reply.code(409).send({ code: "session_locked", message: "already submitted" });

      const [updated] = await db
        .update(attendanceSessions)
        .set({ isLocked: true, submittedBy: req.user?.sub, submittedAt: new Date(), updatedAt: new Date() })
        .where(eq(attendanceSessions.id, session.id))
        .returning();

      // TODO: trigger absence alerts to parents of absent students
      return reply.send(updated);
    }
  );

  fastify.get("/attendance/sessions", async (req: any, reply: any) => {
    const tenantId = req.user?.tenantId;
    if (!tenantId) return reply.code(401).send({ code: "unauthorized", message: "no tenant context" });
    const { classId, date } = req.query as { classId?: string; date?: string };
    const conditions = [eq(attendanceSessions.tenantId, tenantId)];
    if (classId) conditions.push(eq(attendanceSessions.classId, classId));
    if (date) conditions.push(eq(attendanceSessions.date, new Date(date)));
    const sessions = await db
      .select()
      .from(attendanceSessions)
      .where(and(...conditions))
      .orderBy(desc(attendanceSessions.date));
    return reply.send({ items: sessions });
  });

  fastify.get("/attendance/sessions/:id/records", async (req: any, reply: any) => {
    const tenantId = req.user?.tenantId;
    if (!tenantId) return reply.code(401).send({ code: "unauthorized", message: "no tenant context" });
    const records = await db
      .select({ record: attendanceRecord, student: students })
      .from(attendanceRecord)
      .innerJoin(students, eq(students.id, attendanceRecord.studentId))
      .where(
        and(
          eq(attendanceRecord.sessionId, req.params.id),
          eq(attendanceRecord.tenantId, tenantId)
        )
      );
    return reply.send({ items: records.map((r) => r.record) });
  });
}
