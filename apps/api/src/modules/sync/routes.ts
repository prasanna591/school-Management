import { z } from "zod";
import { eq, desc, and } from "drizzle-orm";
import { db, attendanceRecord } from "../../db/index";

const syncSchema = z.object({
  since: z.string().optional(),
  limit: z.coerce.number().min(1).max(200).default(100),
});

export async function syncRoutes(fastify: any) {
  fastify.get(
    "/sync/attendance",
    { schema: { querystring: syncSchema } },
    async (req: any, reply: any) => {
      const { since, limit } = syncSchema.parse(req.query);
      const tenantId = req.user?.tenantId;
      if (!tenantId) return reply.code(401).send({ code: "unauthorized", message: "no tenant context" });

      const conditions = [eq(attendanceRecord.tenantId, tenantId)];
      if (since) conditions.push(eq(attendanceRecord.updatedAt, new Date(since))); // simplified cursor

      const records = await db
        .select()
        .from(attendanceRecord)
        .where(and(...conditions))
        .orderBy(desc(attendanceRecord.updatedAt))
        .limit(limit);

      const nextCursor = records.length === limit
        ? records[records.length - 1]?.updatedAt?.toISOString() ?? null
        : null;

      return reply.send({ items: records, nextCursor, hasMore: !!nextCursor });
    }
  );
}
