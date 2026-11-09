import { z } from "zod";
import { eq, and, desc } from "drizzle-orm";
import { db, feeHeads, feeStructures, feeLedgerEntries, payments } from "../../db/index";

const headSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  isOptional: z.boolean().default(false),
});

const structureSchema = z.object({
  classId: z.string().uuid(),
  term: z.string().min(1),
  feeHeadId: z.string().uuid(),
  amountPaise: z.coerce.number().int().nonnegative(),
  dueDate: z.string().datetime().optional(),
});

export async function feeRoutes(fastify: any) {
  // Fee heads
  fastify.get("/fee-heads", async (req: any, reply: any) => {
    const tenantId = req.user?.tenantId;
    if (!tenantId) return reply.code(401).send({ code: "unauthorized", message: "no tenant context" });
    const heads = await db.select().from(feeHeads).where(eq(feeHeads.tenantId, tenantId));
    return reply.send({ items: heads });
  });

  fastify.post(
    "/fee-heads",
    { schema: { body: headSchema } },
    async (req: any, reply: any) => {
      const tenantId = req.user?.tenantId;
      if (!tenantId) return reply.code(401).send({ code: "unauthorized", message: "no tenant context" });
      const { name, description, isOptional } = headSchema.parse(req.body);
      const [head] = await db
        .insert(feeHeads)
        .values({ tenantId, name, description, isOptional })
        .returning();
      return reply.code(201).send(head);
    }
  );

  // Fee structures
  fastify.get("/fee-structures", async (req: any, reply: any) => {
    const tenantId = req.user?.tenantId;
    if (!tenantId) return reply.code(401).send({ code: "unauthorized", message: "no tenant context" });
    const { classId, term } = req.query as { classId?: string; term?: string };
    const conditions = [eq(feeStructures.tenantId, tenantId)];
    if (classId) conditions.push(eq(feeStructures.classId, classId));
    if (term) conditions.push(eq(feeStructures.term, term));
    const structures = await db.select().from(feeStructures).where(and(...conditions));
    return reply.send({ items: structures });
  });

  fastify.post(
    "/fee-structures",
    { schema: { body: structureSchema } },
    async (req: any, reply: any) => {
      const tenantId = req.user?.tenantId;
      if (!tenantId) return reply.code(401).send({ code: "unauthorized", message: "no tenant context" });
      const { classId, term, feeHeadId, amountPaise, dueDate } = structureSchema.parse(req.body);
      const [structure] = await db
        .insert(feeStructures)
        .values({
          tenantId,
          classId,
          term,
          feeHeadId,
          amountPaise,
          dueDate: dueDate ? new Date(dueDate) : null,
        })
        .returning();
      return reply.code(201).send(structure);
    }
  );

  // Student dues
  fastify.get("/students/:studentId/dues", async (req: any, reply: any) => {
    const tenantId = req.user?.tenantId;
    if (!tenantId) return reply.code(401).send({ code: "unauthorized", message: "no tenant context" });
    const { studentId } = req.params;

    const charges = await db
      .select({ id: feeLedgerEntries.id, type: feeLedgerEntries.type, amountPaise: feeLedgerEntries.amountPaise, description: feeLedgerEntries.description, occurredAt: feeLedgerEntries.occurredAt })
      .from(feeLedgerEntries)
      .where(and(eq(feeLedgerEntries.tenantId, tenantId), eq(feeLedgerEntries.studentId, studentId), eq(feeLedgerEntries.type, "charge")))
      .orderBy(desc(feeLedgerEntries.occurredAt));

    const payments_ = await db
      .select({ id: payments.id, amountPaise: payments.amountPaise, status: payments.status, paidAt: payments.paidAt })
      .from(payments)
      .where(and(eq(payments.tenantId, tenantId), eq(payments.studentId, studentId), eq(payments.status, "success")))
      .orderBy(desc(payments.paidAt));

    const totalCharged = charges.reduce((s, c) => s + Number(c.amountPaise), 0);
    const totalPaid = payments_.reduce((s, p) => s + Number(p.amountPaise), 0);

    return reply.send({
      studentId,
      totalChargedPaise: totalCharged,
      totalPaidPaise: totalPaid,
      balancePaise: totalCharged - totalPaid,
      charges,
      payments: payments_,
    });
  });

  // Record a payment (counter collection / online)
  const paymentSchema = z.object({
    studentId: z.string().uuid(),
    amountPaise: z.coerce.number().int().positive(),
    channel: z.enum(["upi", "card", "net_banking", "cash", "cheque", "dd", "bank_transfer", "payment_link"]),
    reference: z.string().optional(),
    idempotencyKey: z.string().uuid(),
    description: z.string().optional(),
  });

  fastify.post(
    "/payments",
    { schema: { body: paymentSchema } },
    async (req: any, reply: any) => {
      const tenantId = req.user?.tenantId;
      if (!tenantId) return reply.code(401).send({ code: "unauthorized", message: "no tenant context" });
      const { studentId, amountPaise, channel, reference, idempotencyKey, description } = paymentSchema.parse(req.body);

      // Idempotency: if already processed, return existing
      const [existing] = await db.select().from(payments).where(eq(payments.idempotencyKey, idempotencyKey)).limit(1);
      if (existing) return reply.send(existing);

      const [payment] = await db
        .insert(payments)
        .values({
          tenantId,
          studentId,
          amountPaise,
          channel,
          status: "success",
          idempotencyKey,
          gatewayReference: reference,
          paidAt: new Date(),
        })
        .returning();

      await db.insert(feeLedgerEntries).values({
        tenantId,
        studentId,
        type: "payment",
        amountPaise,
        reference,
        description: description ?? "Payment",
        occurredAt: new Date(),
      });

      return reply.code(201).send(payment);
    }
  );
}
