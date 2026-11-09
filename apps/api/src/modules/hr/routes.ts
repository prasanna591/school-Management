import { z } from "zod";
import { eq, desc, and } from "drizzle-orm";
import { db, staff, salaryStructures, payrollRuns, payslips } from "../../db/index";

const staffSchema = z.object({
  employeeNumber: z.string().min(1),
  firstName: z.string().min(1),
  lastName: z.string().optional(),
  designation: z.string().optional(),
  department: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email().optional(),
});

export async function hrRoutes(fastify: any) {
  fastify.get("/staff", async (req: any, reply: any) => {
    const tenantId = req.user?.tenantId;
    if (!tenantId) return reply.code(401).send({ code: "unauthorized", message: "no tenant context" });
    const items = await db.select().from(staff).where(eq(staff.tenantId, tenantId)).orderBy(desc(staff.createdAt));
    return reply.send({ items });
  });

  fastify.post(
    "/staff",
    { schema: { body: staffSchema } },
    async (req: any, reply: any) => {
      const tenantId = req.user?.tenantId;
      if (!tenantId) return reply.code(401).send({ code: "unauthorized", message: "no tenant context" });
      const [s] = await db.insert(staff).values({ tenantId, ...staffSchema.parse(req.body) }).returning();
      return reply.code(201).send(s);
    }
  );

  fastify.get("/salary-structures", async (req: any, reply: any) => {
    const tenantId = req.user?.tenantId;
    if (!tenantId) return reply.code(401).send({ code: "unauthorized", message: "no tenant context" });
    const items = await db.select().from(salaryStructures).where(eq(salaryStructures.tenantId, tenantId));
    return reply.send({ items });
  });

  fastify.get("/payroll-runs", async (req: any, reply: any) => {
    const tenantId = req.user?.tenantId;
    if (!tenantId) return reply.code(401).send({ code: "unauthorized", message: "no tenant context" });
    const items = await db.select().from(payrollRuns).where(eq(payrollRuns.tenantId, tenantId)).orderBy(desc(payrollRuns.year), desc(payrollRuns.month));
    return reply.send({ items });
  });

  fastify.get("/payslips", async (req: any, reply: any) => {
    const tenantId = req.user?.tenantId;
    if (!tenantId) return reply.code(401).send({ code: "unauthorized", message: "no tenant context" });
    const { staffId } = req.query as { staffId?: string };
    const conditions = [eq(payslips.tenantId, tenantId)];
    if (staffId) conditions.push(eq(payslips.staffId, staffId));
    const items = await db.select().from(payslips).where(conditions.length === 1 ? conditions[0] : and(...conditions)).orderBy(desc(payslips.createdAt));
    return reply.send({ items });
  });
}
