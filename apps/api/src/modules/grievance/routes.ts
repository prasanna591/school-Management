import { z } from "zod";
import { eq, desc } from "drizzle-orm";
import { db, grievances } from "../../db/index";

const grievanceSchema = z.object({
  category: z.string().min(1),
  subject: z.string().min(1),
  description: z.string().optional(),
});

export async function grievanceRoutes(fastify: any) {
  fastify.get("/grievances", async (req: any, reply: any) => {
    const tenantId = req.user?.tenantId;
    if (!tenantId) return reply.code(401).send({ code: "unauthorized", message: "no tenant context" });
    const items = await db.select().from(grievances).where(eq(grievances.tenantId, tenantId)).orderBy(desc(grievances.createdAt));
    return reply.send({ items });
  });

  fastify.post(
    "/grievances",
    { schema: { body: grievanceSchema } },
    async (req: any, reply: any) => {
      const tenantId = req.user?.tenantId;
      if (!tenantId) return reply.code(401).send({ code: "unauthorized", message: "no tenant context" });
      const { category, subject, description } = grievanceSchema.parse(req.body);
      const [g] = await db.insert(grievances).values({ tenantId, userId: req.user?.sub, category, subject, description }).returning();
      return reply.code(201).send(g);
    }
  );

  fastify.post(
    "/grievances/:id/decision",
    { schema: { body: z.object({ status: z.enum(["open", "in_progress", "resolved", "closed"]), assigneeId: z.string().uuid().optional(), comment: z.string().optional() }) } },
    async (req: any, reply: any) => {
      const tenantId = req.user?.tenantId;
      if (!tenantId) return reply.code(401).send({ code: "unauthorized", message: "no tenant context" });
      const { status, assigneeId } = req.body;
      const [updated] = await db
        .update(grievances)
        .set({ status, assigneeId, updatedAt: new Date() })
        .where(eq(grievances.id, req.params.id))
        .returning();
      if (!updated) return reply.code(404).send({ code: "not_found", message: "grievance not found" });
      return reply.send(updated);
    }
  );
}
