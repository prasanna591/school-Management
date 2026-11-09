import { z } from "zod";
import { eq, desc, and } from "drizzle-orm";
import { db, homeworks, homeworkSubmissions } from "../../db/index";

const homeworkSchema = z.object({
  classId: z.string().uuid(),
  sectionId: z.string().uuid().optional(),
  subject: z.string().min(1),
  title: z.string().min(1),
  description: z.string().optional(),
  dueDate: z.string().datetime().optional(),
  submissionType: z.enum(["none", "photo", "pdf", "text"]).default("none"),
});

export async function homeworkRoutes(fastify: any) {
  fastify.get("/homeworks", async (req: any, reply: any) => {
    const tenantId = req.user?.tenantId;
    if (!tenantId) return reply.code(401).send({ code: "unauthorized", message: "no tenant context" });
    const { classId } = req.query as { classId?: string };
    const conditions = [eq(homeworks.tenantId, tenantId)];
    if (classId) conditions.push(eq(homeworks.classId, classId));
    const items = await db.select().from(homeworks).where(and(...conditions)).orderBy(desc(homeworks.createdAt));
    return reply.send({ items });
  });

  fastify.post(
    "/homeworks",
    { schema: { body: homeworkSchema } },
    async (req: any, reply: any) => {
      const tenantId = req.user?.tenantId;
      if (!tenantId) return reply.code(401).send({ code: "unauthorized", message: "no tenant context" });
      const { classId, sectionId, subject, title, description, dueDate, submissionType } = homeworkSchema.parse(req.body);
      const [hw] = await db
        .insert(homeworks)
        .values({
          tenantId,
          classId,
          sectionId,
          subject,
          title,
          description,
          dueDate: dueDate ? new Date(dueDate) : null,
          submissionType,
          createdBy: req.user?.sub,
        })
        .returning();
      return reply.code(201).send(hw);
    }
  );

  const submissionSchema = z.object({
    homeworkId: z.string().uuid(),
    fileUrl: z.string().optional(),
    textAnswer: z.string().optional(),
  });

  fastify.post(
    "/homework-submissions",
    { schema: { body: submissionSchema } },
    async (req: any, reply: any) => {
      const tenantId = req.user?.tenantId;
      if (!tenantId) return reply.code(401).send({ code: "unauthorized", message: "no tenant context" });
      const { homeworkId, fileUrl, textAnswer } = submissionSchema.parse(req.body);
      const [sub] = await db
        .insert(homeworkSubmissions)
        .values({ tenantId, studentId: req.user?.sub, homeworkId, fileUrl, textAnswer })
        .returning();
      return reply.code(201).send(sub);
    }
  );

  fastify.get(
    "/homeworks/:id/submissions",
    async (req: any, reply: any) => {
      const tenantId = req.user?.tenantId;
      if (!tenantId) return reply.code(401).send({ code: "unauthorized", message: "no tenant context" });
      const items = await db
        .select()
        .from(homeworkSubmissions)
        .where(and(eq(homeworkSubmissions.homeworkId, req.params.id), eq(homeworkSubmissions.tenantId, tenantId)));
      return reply.send({ items });
    }
  );
}
