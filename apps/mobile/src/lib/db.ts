import * as SQLite from "expo-sqlite";

export const db = SQLite.openDatabaseSync("smartschool.db");

export async function initDb() {
  await db.execAsync(
    `CREATE TABLE IF NOT EXISTS outbox (
      id TEXT PRIMARY KEY,
      entity TEXT NOT NULL,
      payload TEXT NOT NULL,
      created_at TEXT NOT NULL,
      retry_count INTEGER NOT NULL DEFAULT 0
    );`
  );
}

export async function pushOutbox(entity: string, payload: Record<string, unknown>) {
  const id = (globalThis as any).crypto?.randomUUID?.() ?? Math.random().toString(36).slice(2);
  await db.runAsync(
    `INSERT INTO outbox (id, entity, payload, created_at, retry_count) VALUES (?, ?, ?, ?, 0)`,
    [id, entity, JSON.stringify(payload), new Date().toISOString()]
  );
  return id;
}
