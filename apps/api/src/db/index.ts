import { Pool } from "pg";
import { drizzle } from "drizzle-orm/node-postgres";
import type { NodePgDatabase } from "drizzle-orm/node-postgres";
import * as schema from "./schema";

type DbType = NodePgDatabase<typeof schema>;

let pool: Pool | null = null;

export function getPool() {
  if (!pool) {
    if (!process.env.DATABASE_URL) {
      return null;
    }
    pool = new Pool({ connectionString: process.env.DATABASE_URL });
  }
  return pool;
}

let dbInstance: DbType | null = null;

export function getDb() {
  if (!dbInstance) {
    const p = getPool();
    if (!p) return null;
    dbInstance = drizzle(p, { schema }) as unknown as DbType;
  }
  return dbInstance;
}

export const db = new Proxy(Object.create(null), {
  get(_, prop: string) {
    const instance = getDb();
    if (!instance) {
      throw new Error("DATABASE_URL is not set");
    }
    return Reflect.get(instance, prop);
  },
}) as unknown as DbType;

export * from "./schema";
