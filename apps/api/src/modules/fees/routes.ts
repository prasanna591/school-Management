import { z } from "zod";
import { eq, and, desc } from "drizzle-orm";
import * as crypto from "crypto";
import { PDFDocument, rgb, StandardFonts } from "pdf-lib";
import {
  db,
  feeHeads,
  feeStructures,
  feeLedgerEntries,
  payments,
  paymentOrders,
  students,
} from "../../db/index";

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

const orderSchema = z.object({
  studentId: z.string().uuid(),
  amountPaise: z.coerce.number().int().positive(),
  gateway: z.enum(["upi", "card", "net_banking"]),
  channel: z.enum(["upi", "card", "net_banking", "cash", "cheque", "dd", "bank_transfer", "payment_link"]).optional(),
  idempotencyKey: z.string().uuid(),
});

const webhookSchema = z.object({
  gatewayEventId: z.string(),
  orderId: z.string().uuid(),
  status: z.enum(["success", "failed"]),
  amountPaise: z.coerce.number().int().nonnegative(),
  currency: z.string().default("INR"),
  signature: z.string(),
  reference: z.string().optional(),
});

/**
 * Constant-time signature comparison to prevent timing attacks.
 */
function constantTimeCompare(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) {
    diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return diff === 0;
}

/**
 * Verify gateway webhook signature. In production this uses the gateway's
 * shared secret. Here we use HMAC-SHA256 with GATEWAY_SECRET from env.
 */
function verifyGatewaySignature(
  gateway: string,
  rawBody: string,
  signature: string
): boolean {
  const secret = process.env.GATEWAY_SECRET || "gateway-secret-change-me";
  const expected = crypto
    .createHmac("sha256", secret)
    .update(`${gateway}:${rawBody}`)
    .digest("hex");
  return constantTimeCompare(expected, signature);
}

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
      .select({
        id: feeLedgerEntries.id,
        type: feeLedgerEntries.type,
        amountPaise: feeLedgerEntries.amountPaise,
        description: feeLedgerEntries.description,
        occurredAt: feeLedgerEntries.occurredAt,
      })
      .from(feeLedgerEntries)
      .where(
        and(
          eq(feeLedgerEntries.tenantId, tenantId),
          eq(feeLedgerEntries.studentId, studentId),
          eq(feeLedgerEntries.type, "charge")
        )
      )
      .orderBy(desc(feeLedgerEntries.occurredAt));

    const payments_ = await db
      .select({
        id: payments.id,
        amountPaise: payments.amountPaise,
        status: payments.status,
        paidAt: payments.paidAt,
      })
      .from(payments)
      .where(
        and(
          eq(payments.tenantId, tenantId),
          eq(payments.studentId, studentId),
          eq(payments.status, "success")
        )
      )
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

  // --- Server-side payment order (client creates, server owns amount) ---

  fastify.post(
    "/payments/orders",
    { schema: { body: orderSchema } },
    async (req: any, reply: any) => {
      const tenantId = req.user?.tenantId;
      if (!tenantId) return reply.code(401).send({ code: "unauthorized", message: "no tenant context" });
      const { studentId, amountPaise, gateway, channel, idempotencyKey } =
        orderSchema.parse(req.body);

      // Idempotency: if already created, return existing
      const [existing] = await db
        .select()
        .from(paymentOrders)
        .where(eq(paymentOrders.idempotencyKey, idempotencyKey))
        .limit(1);
      if (existing) return reply.send(existing);

      // Verify student belongs to this tenant
      const [s] = await db
        .select({ id: students.id, tenantId: students.tenantId })
        .from(students)
        .where(eq(students.id, studentId))
        .limit(1);
      if (!s || s.tenantId !== tenantId) {
        return reply.code(404).send({ code: "not_found", message: "student not found" });
      }

      // Server computes the checkout URL (gateway-specific); amount is server-trusted
      const checkoutUrl = `${process.env.PUBLIC_BASE_URL || "http://localhost:3001"}/pay/checkout/${idempotencyKey}`;

      const [order] = await db
        .insert(paymentOrders)
        .values({
          tenantId,
          studentId,
          amountPaise,
          currency: "INR",
          gateway,
          channel: channel ?? gateway,
          status: "pending",
          idempotencyKey,
          checkoutUrl,
        })
        .returning();

      return reply.code(201).send({
        id: order.id,
        status: order.status,
        amountPaise: order.amountPaise,
        currency: order.currency,
        checkoutUrl: order.checkoutUrl,
        createdAt: order.createdAt,
      });
    }
  );

  // Client polls order status (never marks success from client)
  fastify.get(
    "/payments/orders/:id",
    async (req: any, reply: any) => {
      const tenantId = req.user?.tenantId;
      if (!tenantId) return reply.code(401).send({ code: "unauthorized", message: "no tenant context" });
      const [order] = await db
        .select()
        .from(paymentOrders)
        .where(
          and(eq(paymentOrders.id, req.params.id), eq(paymentOrders.tenantId, tenantId))
        )
        .limit(1);
      if (!order) return reply.code(404).send({ code: "not_found", message: "order not found" });
      return reply.send({
        id: order.id,
        status: order.status,
        amountPaise: order.amountPaise,
        currency: order.currency,
        paidAt: order.paidAt,
        gatewayReference: order.gatewayReference,
      });
    }
  );

  // --- Gateway webhook: sole source of truth for payment success ---

  fastify.post(
    "/payments/webhook/:gateway",
    async (req: any, reply: any) => {
      const { gateway } = req.params as { gateway: string };
      const rawBody = req.rawBody as string;
      const { gatewayEventId, orderId, status, amountPaise, currency, signature, reference } =
        webhookSchema.parse(req.body);

      // 1. Verify signature (constant-time compare)
      if (!verifyGatewaySignature(gateway, rawBody, signature ?? "")) {
        return reply.code(401).send({ code: "invalid_signature", message: "Invalid webhook signature" });
      }

      // 2. Load order
      const [order] = await db
        .select()
        .from(paymentOrders)
        .where(eq(paymentOrders.id, orderId))
        .limit(1);
      if (!order) return reply.code(404).send({ code: "not_found", message: "order not found" });

      // 3. Idempotency: same gateway event id already processed
      if (order.gatewayEventId === gatewayEventId) {
        return reply.send({ id: order.id, status: order.status });
      }

      // 4. Validate amount/currency match the order (never trust webhook amount blindly)
      if (order.amountPaise !== amountPaise || order.currency !== currency) {
        return reply.code(409).send({
          code: "amount_mismatch",
          message: "Webhook amount/currency does not match order",
        });
      }

      // 5. Only allow pending -> success/failed transitions
      if (order.status !== "pending") {
        return reply.code(409).send({
          code: "invalid_transition",
          message: `Cannot transition from ${order.status} to ${status}`,
        });
      }

      // 6. Write payment + ledger entry in one transaction
      const payment = await db.transaction(async (tx) => {
        const [p] = await tx
          .insert(payments)
          .values({
            tenantId: order.tenantId,
            studentId: order.studentId,
            amountPaise: order.amountPaise,
            channel: (order.channel as any) || order.gateway,
            status,
            gatewayReference: reference,
            gatewayEventId,
            idempotencyKey: order.idempotencyKey,
            orderId: order.id,
            paidAt: status === "success" ? new Date() : null,
          })
          .returning();

        if (status === "success") {
          await tx.insert(feeLedgerEntries).values({
            tenantId: order.tenantId,
            studentId: order.studentId,
            type: "payment",
            amountPaise: order.amountPaise,
            reference,
            description: "Payment via " + gateway,
            occurredAt: new Date(),
          });
        }

        return p;
      });

      // 7. Update order status
      await db
        .update(paymentOrders)
        .set({
          status,
          gatewayReference: reference,
          gatewayEventId,
          paidAt: status === "success" ? new Date() : null,
          updatedAt: new Date(),
        })
        .where(eq(paymentOrders.id, order.id));

      return reply.send({
        id: payment.id,
        status: payment.status,
        amountPaise: payment.amountPaise,
      });
    }
  );

  // PDF receipt generation
  fastify.get(
    "/payments/:paymentId/receipt.pdf",
    async (req: any, reply: any) => {
      const tenantId = req.user?.tenantId;
      if (!tenantId) return reply.code(401).send({ code: "unauthorized", message: "no tenant context" });

      const [payment] = await db
        .select()
        .from(payments)
        .where(
          and(
            eq(payments.id, req.params.paymentId),
            eq(payments.tenantId, tenantId),
            eq(payments.status, "success")
          )
        )
        .limit(1);
      if (!payment) return reply.code(404).send({ code: "not_found", message: "payment not found" });

      const [student] = await db
        .select()
        .from(students)
        .where(eq(students.id, payment.studentId))
        .limit(1);

      const pdfDoc = await PDFDocument.create();
      const page = pdfDoc.addPage([600, 400]);
      const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
      const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

      page.drawText("SmartSchool - Fee Receipt", {
        x: 50,
        y: 350,
        size: 20,
        font: boldFont,
        color: rgb(0.1, 0.2, 0.3),
      });
      page.drawText(`Receipt #: ${payment.idempotencyKey}`, {
        x: 50,
        y: 320,
        size: 12,
        font,
        color: rgb(0.3, 0.3, 0.3),
      });
      page.drawText(
        `Student: ${student?.firstName ?? ""} ${student?.lastName ?? ""}`,
        { x: 50, y: 290, size: 12, font, color: rgb(0.3, 0.3, 0.3) }
      );
      page.drawText(
        `Amount: ₹${(payment.amountPaise / 100).toFixed(2)}`,
        { x: 50, y: 260, size: 12, font: boldFont, color: rgb(0.1, 0.2, 0.3) }
      );
      page.drawText(
        `Date: ${new Date(payment.paidAt ?? Date.now()).toLocaleDateString()}`,
        { x: 50, y: 230, size: 12, font, color: rgb(0.3, 0.3, 0.3) }
      );
      page.drawText(`Channel: ${payment.channel ?? "N/A"}`, {
        x: 50,
        y: 200,
        size: 12,
        font,
        color: rgb(0.3, 0.3, 0.3),
      });
      page.drawText(`Gateway Ref: ${payment.gatewayReference ?? "N/A"}`, {
        x: 50,
        y: 170,
        size: 12,
        font,
        color: rgb(0.3, 0.3, 0.3),
      });

      const pdfBytes = await pdfDoc.save();

      reply
        .header("Content-Type", "application/pdf")
        .header(
          "Content-Disposition",
          `attachment; filename=receipt-${payment.idempotencyKey}.pdf`
        )
        .send(pdfBytes);
    }
  );
}
