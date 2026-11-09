import { z } from "zod";
import { eq } from "drizzle-orm";
import { resolveTenant } from "../../lib/resolve-tenant";
import { tenants } from "../../db/index";
import { db } from "../../db/index";

const resolveSchema = z.object({ code: z.string().min(1) });

export async function tenantRoutes(fastify: any) {
  fastify.get(
    "/tenants/resolve",
    { schema: { querystring: resolveSchema } },
    async (req: any, reply: any) => {
      const { code } = resolveSchema.parse(req.query);
      const tenant = await resolveTenant(code);
      return reply.send({
        id: tenant.id,
        name: tenant.name,
        slug: tenant.slug,
        brandingLogoUrl: tenant.brandingLogoUrl,
        brandingPrimaryColor: tenant.brandingPrimaryColor,
        defaultLanguage: tenant.defaultLanguage,
      });
    }
  );

  fastify.get("/tenants/me", async (req: any, reply: any) => {
    const tenantId = req.user?.tenantId;
    if (!tenantId) return reply.code(401).send({ code: "unauthorized", message: "no tenant context" });
    const [tenant] = await db.select().from(tenants).where(eq(tenants.id, tenantId)).limit(1);
    if (!tenant) return reply.code(404).send({ code: "not_found", message: "tenant not found" });
    return reply.send(tenant);
  });
}
