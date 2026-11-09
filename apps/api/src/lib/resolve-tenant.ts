import { eq } from "drizzle-orm";
import { db, tenants } from "../db/index";

export async function resolveTenant(code: string) {
  const [tenant] = await db.select().from(tenants).where(eq(tenants.slug, code)).limit(1);
  if (!tenant) throw new Error("tenant_not_found");
  if (tenant.status !== "active") throw new Error("tenant_inactive");
  return tenant;
}
