import { z } from "zod";
import { eq, desc, and } from "drizzle-orm";
import { db, exams, marksEntries, students } from "../../db/index";

const examSchema = z.object({
  name: z.string().min(1),
  term: z.string().min(1),
  classId: z.string().uuid().optional(),
  sectionId: z.string().uuid().optional(),
  subject: z.string().min(1),
  maxMarks: z.coerce.number().int().positive(),
  passMarks: z.coerce.number().int().nonnegative(),
});

export async function examsRoutes(fastify: any) {
  fastify.get("/exams", async (req: any, reply: any) => {
    const tenantId = req.user?.tenantId;
    if (!tenantId) return reply.code(401).send({ code: "unauthorized", message: "no tenant context" });
    const { classId, term } = req.query as { classId?: string; term?: string };
    const conditions = [eq(exams.tenantId, tenantId)];
    if (classId) conditions.push(eq(exams.classId, classId));
    if (term) conditions.push(eq(exams.term, term));
    const items = await db.select().from(exams).where(and(...conditions)).orderBy(desc(exams.createdAt));
    return reply.send({ items });
  });

  fastify.post(
    "/exams",
    { schema: { body: examSchema } },
    async (req: any, reply: any) => {
      const tenantId = req.user?.tenantId;
      if (!tenantId) return reply.code(401).send({ code: "unauthorized", message: "no tenant context" });
      const { name, term, classId, sectionId, subject, maxMarks, passMarks } = examSchema.parse(req.body);
      const [exam] = await db
        .insert(exams)
        .values({ tenantId, name, term, classId, sectionId, subject, maxMarks, passMarks })
        .returning();
      return reply.code(201).send(exam);
    }
  );

  const markSchema = z.object({
    examId: z.string().uuid(),
    studentId: z.string().uuid(),
    marksObtained: z.coerce.number().int().nonnegative(),
    status: z.enum(["present", "absent"]).default("present"),
    grade: z.string().optional(),
  });

  fastify.post(
    "/marks",
    { schema: { body: markSchema } },
    async (req: any, reply: any) => {
      const tenantId = req.user?.tenantId;
      if (!tenantId) return reply.code(401).send({ code: "unauthorized", message: "no tenant context" });
      const { examId, studentId, marksObtained, status, grade } = markSchema.parse(req.body);
      const [exam] = await db.select().from(exams).where(eq(exams.id, examId)).limit(1);
      if (!exam) return reply.code(404).send({ code: "not_found", message: "exam not found" });
      if (exam.isLocked) return reply.code(409).send({ code: "exam_locked", message: "exam is locked" });

      const [existing] = await db
        .select()
        .from(marksEntries)
        .where(and(eq(marksEntries.examId, examId), eq(marksEntries.studentId, studentId)))
        .limit(1);
      let entry;
      if (existing) {
        [entry] = await db
          .update(marksEntries)
          .set({ marksObtained, status, grade: grade ?? null, updatedAt: new Date() })
          .where(eq(marksEntries.id, existing.id))
          .returning();
      } else {
        [entry] = await db
          .insert(marksEntries)
          .values({ tenantId, examId, studentId, marksObtained, status, grade: grade ?? null })
          .returning();
      }
      return reply.send(entry);
    }
  );

  fastify.post(
    "/exams/:id/lock",
    async (req: any, reply: any) => {
      const tenantId = req.user?.tenantId;
      if (!tenantId) return reply.code(401).send({ code: "unauthorized", message: "no tenant context" });
      const [updated] = await db
        .update(exams)
        .set({ isLocked: true, updatedAt: new Date() })
        .where(eq(exams.id, req.params.id))
        .returning();
      if (!updated) return reply.code(404).send({ code: "not_found", message: "exam not found" });
      return reply.send(updated);
    }
  );

  fastify.get(
    "/exams/:id/marks",
    async (req: any, reply: any) => {
      const tenantId = req.user?.tenantId;
      if (!tenantId) return reply.code(401).send({ code: "unauthorized", message: "no tenant context" });
      const items = await db
        .select({ entry: marksEntries, student: students })
        .from(marksEntries)
        .innerJoin(students, eq(students.id, marksEntries.studentId))
        .where(and(eq(marksEntries.examId, req.params.id), eq(marksEntries.tenantId, tenantId)));
      return reply.send({ items: items.map((i) => i.entry) });
    }
  );

  fastify.get(
    "/students/:studentId/report-card",
    async (req: any, reply: any) => {
      const tenantId = req.user?.tenantId;
      if (!tenantId) return reply.code(401).send({ code: "unauthorized", message: "no tenant context" });
      const items = await db
        .select({ entry: marksEntries, exam: exams })
        .from(marksEntries)
        .innerJoin(exams, eq(exams.id, marksEntries.examId))
        .where(and(eq(marksEntries.studentId, req.params.studentId), eq(marksEntries.tenantId, tenantId)));
      return reply.send({ items: items.map((i) => ({ ...i.entry, exam: i.exam })) });
    }
  );
}
