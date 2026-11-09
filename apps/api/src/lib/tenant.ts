import { eq } from "drizzle-orm";
import { db, tenants } from "../db/index";

export async function resolveTenantBySlug(slug: string) {
  const [tenant] = await db.select().from(tenants).where(eq(tenants.slug, slug)).limit(1);
  return tenant;
}
