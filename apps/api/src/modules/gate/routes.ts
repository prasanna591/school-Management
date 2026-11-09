import { z } from "zod";
import { randomUUID } from "crypto";
import { eq, desc, and } from "drizzle-orm";
import { db, gatePasses, visitorLogs, consentRecords } from "../../db/index";

const passSchema = z.object({
  studentId: z.string().uuid(),
  guardianName: z.string().min(1),
  guardianPhone: z.string().min(1),
  expiresAt: z.string().datetime(),
});

export async function gateRoutes(fastify: any) {
  fastify.get("/gate-passes", async (req: any, reply: any) => {
    const tenantId = req.user?.tenantId;
    if (!tenantId) return reply.code(401).send({ code: "unauthorized", message: "no tenant context" });
    const items = await db.select().from(gatePasses).where(eq(gatePasses.tenantId, tenantId)).orderBy(desc(gatePasses.createdAt));
    return reply.send({ items });
  });

  fastify.post(
    "/gate-passes",
    { schema: { body: passSchema } },
    async (req: any, reply: any) => {
      const tenantId = req.user?.tenantId;
      if (!tenantId) return reply.code(401).send({ code: "unauthorized", message: "no tenant context" });
      const { studentId, guardianName, guardianPhone, expiresAt } = passSchema.parse(req.body);
      const qrCode = `gp-${randomUUID()}`;
      const [pass] = await db
        .insert(gatePasses)
        .values({ tenantId, studentId, guardianName, guardianPhone, qrCode, expiresAt: new Date(expiresAt) })
        .returning();
      return reply.code(201).send(pass);
    }
  );

  fastify.post(
    "/gate-passes/:id/verify",
    { schema: { body: z.object({}) } },
    async (req: any, reply: any) => {
      const tenantId = req.user?.tenantId;
      if (!tenantId) return reply.code(401).send({ code: "unauthorized", message: "no tenant context" });
      const [pass] = await db
        .update(gatePasses)
        .set({ status: "used", usedAt: new Date(), updatedAt: new Date() })
        .where(eq(gatePasses.id, req.params.id))
        .returning();
      if (!pass) return reply.code(404).send({ code: "not_found", message: "gate pass not found" });
      return reply.send(pass);
    }
  );

  fastify.get("/visitor-logs", async (req: any, reply: any) => {
    const tenantId = req.user?.tenantId;
    if (!tenantId) return reply.code(401).send({ code: "unauthorized", message: "no tenant context" });
    const items = await db.select().from(visitorLogs).where(eq(visitorLogs.tenantId, tenantId)).orderBy(desc(visitorLogs.createdAt));
    return reply.send({ items });
  });

  const visitorSchema = z.object({
    visitorName: z.string().min(1),
    visitorPhone: z.string().optional(),
    purpose: z.string().optional(),
    hostId: z.string().uuid().optional(),
  });

  fastify.post(
    "/visitor-logs",
    { schema: { body: visitorSchema } },
    async (req: any, reply: any) => {
      const tenantId = req.user?.tenantId;
      if (!tenantId) return reply.code(401).send({ code: "unauthorized", message: "no tenant context" });
      const [log] = await db.insert(visitorLogs).values({ tenantId, ...visitorSchema.parse(req.body) }).returning();
      return reply.code(201).send(log);
    }
  );
}

export async function consentRoutes(fastify: any) {
  fastify.get("/consent-records", async (req: any, reply: any) => {
    const tenantId = req.user?.tenantId;
    if (!tenantId) return reply.code(401).send({ code: "unauthorized", message: "no tenant context" });
    const { userId } = req.query as { userId?: string };
    const conditions = [eq(consentRecords.tenantId, tenantId)];
    if (userId) conditions.push(eq(consentRecords.userId, userId));
    const items = await db
      .select()
      .from(consentRecords)
      .where(conditions.length === 1 ? conditions[0] : and(...conditions))
      .orderBy(desc(consentRecords.givenAt));
    return reply.send({ items });
  });

  fastify.post(
    "/consent-records/:id/withdraw",
    async (req: any, reply: any) => {
      const tenantId = req.user?.tenantId;
      if (!tenantId) return reply.code(401).send({ code: "unauthorized", message: "no tenant context" });
      const [updated] = await db
        .update(consentRecords)
        .set({ withdrawnAt: new Date() })
        .where(eq(consentRecords.id, req.params.id))
        .returning();
      if (!updated) return reply.code(404).send({ code: "not_found", message: "consent record not found" });
      return reply.send(updated);
    }
  );
}
