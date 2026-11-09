import { z } from "zod";
import { eq, desc } from "drizzle-orm";
import { db, notices } from "../../db/index";

const noticeSchema = z.object({
  title: z.string().min(1),
  body: z.string().optional(),
  audience: z.string(),
  audienceIds: z.array(z.string().uuid()).default([]),
  expiresAt: z.string().datetime().optional(),
});

export async function noticesRoutes(fastify: any) {
  fastify.get("/notices", async (req: any, reply: any) => {
    const tenantId = req.user?.tenantId;
    if (!tenantId) return reply.code(401).send({ code: "unauthorized", message: "no tenant context" });
    const items = await db.select().from(notices).where(eq(notices.tenantId, tenantId)).orderBy(desc(notices.createdAt));
    return reply.send({ items });
  });

  fastify.post(
    "/notices",
    { schema: { body: noticeSchema } },
    async (req: any, reply: any) => {
      const tenantId = req.user?.tenantId;
      if (!tenantId) return reply.code(401).send({ code: "unauthorized", message: "no tenant context" });
      const { title, body, audience, audienceIds, expiresAt } = noticeSchema.parse(req.body);
      const [notice] = await db
        .insert(notices)
        .values({
          tenantId,
          title,
          body,
          audience,
          audienceIds,
          createdBy: req.user?.sub,
          publishedAt: new Date(),
          expiresAt: expiresAt ? new Date(expiresAt) : null,
        })
        .returning();
      return reply.code(201).send(notice);
    }
  );
}
