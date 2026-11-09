import { z } from "zod";
import { eq, desc, and } from "drizzle-orm";
import { db, admissions } from "../../db/index";

const admissionSchema = z.object({
  childName: z.string().min(1),
  childDob: z.string().datetime().optional(),
  parentName: z.string().min(1),
  parentPhone: z.string().min(1),
  parentEmail: z.string().email().optional(),
  source: z.enum(["web", "qr", "whatsapp", "phone", "walkin"]),
  stage: z.string().default("new"),
  followUpDate: z.string().datetime().optional(),
  notes: z.string().optional(),
});

export async function admissionsRoutes(fastify: any) {
  fastify.get("/admissions", async (req: any, reply: any) => {
    const tenantId = req.user?.tenantId;
    if (!tenantId) return reply.code(401).send({ code: "unauthorized", message: "no tenant context" });
    const { stage, status } = req.query as { stage?: string; status?: string };
    const conditions = [eq(admissions.tenantId, tenantId)];
    if (stage) conditions.push(eq(admissions.stage, stage));
    if (status) conditions.push(eq(admissions.status, status));
    const items = await db
      .select()
      .from(admissions)
      .where(conditions.length === 1 ? conditions[0] : and(...conditions))
      .orderBy(desc(admissions.createdAt));
    return reply.send({ items });
  });

  fastify.post(
    "/admissions",
    { schema: { body: admissionSchema } },
    async (req: any, reply: any) => {
      const tenantId = req.user?.tenantId;
      if (!tenantId) return reply.code(401).send({ code: "unauthorized", message: "no tenant context" });
      const { childName, childDob, parentName, parentPhone, parentEmail, source, stage, followUpDate, notes } = admissionSchema.parse(req.body);
      const [a] = await db
        .insert(admissions)
        .values({
          tenantId,
          childName,
          parentName,
          parentPhone,
          parentEmail,
          source,
          stage,
          childDob: childDob ? new Date(childDob) : null,
          followUpDate: followUpDate ? new Date(followUpDate) : null,
          notes,
        })
        .returning();
      return reply.code(201).send(a);
    }
  );

  fastify.post(
    "/admissions/:id/stage",
    { schema: { body: z.object({ stage: z.string() }) } },
    async (req: any, reply: any) => {
      const tenantId = req.user?.tenantId;
      if (!tenantId) return reply.code(401).send({ code: "unauthorized", message: "no tenant context" });
      const { stage } = req.body;
      const [updated] = await db
        .update(admissions)
        .set({ stage, updatedAt: new Date() })
        .where(eq(admissions.id, req.params.id))
        .returning();
      if (!updated) return reply.code(404).send({ code: "not_found", message: "admission not found" });
      return reply.send(updated);
    }
  );
}
