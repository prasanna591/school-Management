import { eq } from "drizzle-orm";

export function tenantScope<T extends { tenantId: any }>(table: T, tenantId: string) {
  return eq(table.tenantId, tenantId);
}
