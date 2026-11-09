import { z } from "zod";
import { eq, desc } from "drizzle-orm";
import { db, leaveRequests } from "../../db/index";

const leaveSchema = z.object({
  studentId: z.string().uuid().optional(),
  startDate: z.string().datetime(),
  endDate: z.string().datetime(),
  reason: z.string().min(1),
});

export async function leaveRoutes(fastify: any) {
  fastify.get("/leave-requests", async (req: any, reply: any) => {
    const tenantId = req.user?.tenantId;
    if (!tenantId) return reply.code(401).send({ code: "unauthorized", message: "no tenant context" });
    const items = await db.select().from(leaveRequests).where(eq(leaveRequests.tenantId, tenantId)).orderBy(desc(leaveRequests.createdAt));
    return reply.send({ items });
  });

  fastify.post(
    "/leave-requests",
    { schema: { body: leaveSchema } },
    async (req: any, reply: any) => {
      const tenantId = req.user?.tenantId;
      if (!tenantId) return reply.code(401).send({ code: "unauthorized", message: "no tenant context" });
      const { studentId, startDate, endDate, reason } = leaveSchema.parse(req.body);
      const [lr] = await db
        .insert(leaveRequests)
        .values({ tenantId, studentId, userId: req.user?.sub, startDate: new Date(startDate), endDate: new Date(endDate), reason })
        .returning();
      return reply.code(201).send(lr);
    }
  );

  fastify.post(
    "/leave-requests/:id/decision",
    { schema: { body: z.object({ status: z.enum(["approved", "rejected"]), comment: z.string().optional() }) } },
    async (req: any, reply: any) => {
      const tenantId = req.user?.tenantId;
      if (!tenantId) return reply.code(401).send({ code: "unauthorized", message: "no tenant context" });
      const { status } = req.body;
      const [updated] = await db
        .update(leaveRequests)
        .set({ status, approvedBy: req.user?.sub, updatedAt: new Date() })
        .where(eq(leaveRequests.id, req.params.id))
        .returning();
      if (!updated) return reply.code(404).send({ code: "not_found", message: "leave request not found" });
      return reply.send(updated);
    }
  );
}
