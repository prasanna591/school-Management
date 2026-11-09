import { z } from "zod";
import { eq, and } from "drizzle-orm";
import { db, students } from "../../db/index";
import { tenantScope } from "../../lib/paginate";

const listSchema = z.object({
  cursor: z.string().optional(),
  limit: z.coerce.number().min(1).max(100).default(20),
  classId: z.string().uuid().optional(),
  sectionId: z.string().uuid().optional(),
  search: z.string().optional(),
});

export async function studentsRoutes(fastify: any) {
  fastify.get(
    "/students",
    { schema: { querystring: listSchema } },
    async (req: any, reply: any) => {
      const { cursor, limit, classId, sectionId, search } = listSchema.parse(req.query);
      const tenantId = req.user?.tenantId;
      if (!tenantId) return reply.code(401).send({ code: "unauthorized", message: "no tenant context" });

      const conditions = [tenantScope(students, tenantId)];
      if (classId) conditions.push(eq(students.classId, classId));
      if (sectionId) conditions.push(eq(students.sectionId, sectionId));
      if (search) conditions.push(eq(students.firstName, search));

      const all = await db.select().from(students).where(and(...conditions));
      const total = all.length;
      const start = cursor ? Number(cursor) : 0;
      const page = all.slice(start, start + limit);
      const nextCursor = start + limit < total ? String(start + limit) : null;

      return reply.send({ items: page, nextCursor, hasMore: !!nextCursor, total });
    }
  );

  fastify.get(
    "/students/:id",
    async (req: any, reply: any) => {
      const tenantId = req.user?.tenantId;
      if (!tenantId) return reply.code(401).send({ code: "unauthorized", message: "no tenant context" });
      const [student] = await db.select().from(students).where(eq(students.id, req.params.id)).limit(1);
      if (!student || student.tenantId !== tenantId) {
        return reply.code(404).send({ code: "not_found", message: "student not found" });
      }
      return reply.send(student);
    }
  );
}
