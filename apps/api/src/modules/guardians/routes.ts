import { z } from "zod";
import { eq } from "drizzle-orm";
import { db, guardians } from "../../db/index";

const listSchema = z.object({
  studentId: z.string().uuid(),
  cursor: z.string().optional(),
  limit: z.coerce.number().min(1).max(100).default(20),
});

export async function guardiansRoutes(fastify: any) {
  fastify.get(
    "/guardians",
    { schema: { querystring: listSchema } },
    async (req: any, reply: any) => {
      const { studentId, cursor, limit } = listSchema.parse(req.query);
      const tenantId = req.user?.tenantId;
      if (!tenantId) return reply.code(401).send({ code: "unauthorized", message: "no tenant context" });

      const all = await db
        .select()
        .from(guardians)
        .where(eq(guardians.tenantId, tenantId) && eq(guardians.studentId, studentId));
      const start = cursor ? Number(cursor) : 0;
      const page = all.slice(start, start + limit);
      const nextCursor = start + limit < all.length ? String(start + limit) : null;

      return reply.send({ items: page, nextCursor, hasMore: !!nextCursor });
    }
  );
}
