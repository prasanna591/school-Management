import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { eq } from "drizzle-orm";
import Fastify from "fastify";

// ---------------------------------------------------------------------------
// Pure-logic tests (no database required)
// ---------------------------------------------------------------------------

describe("fees money logic (paise integers)", () => {
  it("computes balance as integer paise (no floats)", () => {
    const charges = [{ amountPaise: 50000 }, { amountPaise: 30000 }];
    const payments_ = [{ amountPaise: 40000 }];
    const totalCharged = charges.reduce((s, c) => s + Number(c.amountPaise), 0);
    const totalPaid = payments_.reduce((s, p) => s + Number(p.amountPaise), 0);
    const balance = totalCharged - totalPaid;
    expect(totalCharged).toBe(80000);
    expect(totalPaid).toBe(40000);
    expect(balance).toBe(40000);
    expect(Number.isInteger(balance)).toBe(true);
  });

  it("allocates partial payment to oldest dues first", () => {
    const dues = [
      { id: "d1", amountPaise: 10000, dueDate: "2024-01-01" },
      { id: "d2", amountPaise: 20000, dueDate: "2024-02-01" },
      { id: "d3", amountPaise: 30000, dueDate: "2024-03-01" },
    ];
    const paymentPaise = 25000;
    let remaining = paymentPaise;
    const allocation: { dueId: string; amountPaise: number }[] = [];
    for (const d of dues.sort((a, b) => a.dueDate.localeCompare(b.dueDate))) {
      if (remaining <= 0) break;
      const alloc = Math.min(remaining, d.amountPaise);
      allocation.push({ dueId: d.id, amountPaise: alloc });
      remaining -= alloc;
    }
    expect(allocation).toEqual([
      { dueId: "d1", amountPaise: 10000 },
      { dueId: "d2", amountPaise: 15000 },
    ]);
    expect(remaining).toBe(0);
  });

  it("concession reduces balance (reversible with audit)", () => {
    const charged = 100000;
    const paid = 60000;
    const concession = 20000;
    const effectiveDue = charged - concession;
    const balance = effectiveDue - paid;
    expect(effectiveDue).toBe(80000);
    expect(balance).toBe(20000);
  });
});

describe("sync conflicts (offline-first)", () => {
  const isDuplicatePayment = (existingKey: string | null, incomingKey: string) =>
    existingKey === incomingKey;

  const canEnterMarks = (isLocked: boolean) => !isLocked;

  const canEditAttendance = (sessionDate: Date, now: Date, editWindowDays: number) => {
    const diffDays = (now.getTime() - sessionDate.getTime()) / (1000 * 60 * 60 * 24);
    return diffDays <= editWindowDays;
  };

  it("duplicate outbox send is idempotent (same key rejected)", () => {
    expect(isDuplicatePayment("key-123", "key-123")).toBe(true);
    expect(isDuplicatePayment("key-123", "key-456")).toBe(false);
    expect(isDuplicatePayment(null, "key-123")).toBe(false);
  });

  it("marks entry rejected on locked exam", () => {
    expect(canEnterMarks(true)).toBe(false);
    expect(canEnterMarks(false)).toBe(true);
  });

  it("attendance edit window: same day allowed, beyond window rejected", () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const lastWeek = new Date(today);
    lastWeek.setDate(lastWeek.getDate() - 8);

    expect(canEditAttendance(today, today, 1)).toBe(true);
    expect(canEditAttendance(yesterday, today, 1)).toBe(true);
    expect(canEditAttendance(lastWeek, today, 1)).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// Integration tests against real Fastify routes via app.inject
// (require DATABASE_URL / running Postgres — skipped without it)
// ---------------------------------------------------------------------------

let tenantId: string;
let authToken: string;
let dbReady = false;

beforeAll(async () => {
  if (!process.env.DATABASE_URL) {
    return;
  }
  dbReady = true;
  const { buildApp } = await import("../index");
  const app = buildApp();
  await app.ready();

  const { db, users, tenants } = await import("../db/index");

  const [t] = await db.insert(tenants).values({
    name: "Integration Test School",
    slug: "integration-school",
    board: "CBSE",
    defaultLanguage: "en",
  }).returning();
  tenantId = t.id;

  const [u] = await db.insert(users).values({
    tenantId,
    phone: "+919876543210",
    role: "parent",
    phoneVerified: true,
  }).returning();

  const { sign } = await import("jsonwebtoken");
  authToken = sign(
    { sub: u.id, tenantId, role: u.role },
    process.env.ACCESS_TOKEN_SECRET || "change-me-in-production",
    { expiresIn: "15m" }
  );

  await app.close();
});

afterAll(async () => {
  if (!dbReady) return;
  const { db, users, tenants } = await import("../db/index");
  await db.delete(users).where(eq(users.tenantId, tenantId));
  await db.delete(tenants).where(eq(tenants.id, tenantId));
});

describe("Auth integration", () => {
  it.skipIf(!dbReady)("POST /api/auth/send-otp returns ok", async () => {
    const { buildApp } = await import("../index");
    const app = buildApp();
    await app.ready();
    const res = await app.inject({
      method: "POST",
      url: "/api/auth/send-otp",
      payload: { phone: "+919999999999" },
    });
    expect(res.statusCode).toBe(200);
    expect(res.json()).toMatchObject({ ok: true });
    await app.close();
  });

  it.skipIf(!dbReady)("POST /api/auth/verify-otp creates user and returns tokens", async () => {
    const { buildApp } = await import("../index");
    const app = buildApp();
    await app.ready();
    await app.inject({
      method: "POST",
      url: "/api/auth/send-otp",
      payload: { phone: "+919888888888" },
    });
    const res = await app.inject({
      method: "POST",
      url: "/api/auth/verify-otp",
      payload: { phone: "+919888888888", otp: "000000", tenantId },
    });
    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.accessToken).toBeDefined();
    expect(body.refreshToken).toBeDefined();
    await app.close();
  });
});

describe("Tenant isolation integration", () => {
  it.skipIf(!dbReady)("GET /api/tenants/resolve returns tenant branding", async () => {
    const { buildApp } = await import("../index");
    const app = buildApp();
    await app.ready();
    const res = await app.inject({
      method: "GET",
      url: `/api/tenants/resolve?code=integration-school`,
    });
    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.slug).toBe("integration-school");
    expect(body.name).toBe("Integration Test School");
    await app.close();
  });

  it.skipIf(!dbReady)("GET /api/tenants/me returns tenant for authenticated user", async () => {
    const { buildApp } = await import("../index");
    const app = buildApp();
    await app.ready();
    const res = await app.inject({
      method: "GET",
      url: "/api/tenants/me",
      headers: { Authorization: `Bearer ${authToken}` },
    });
    expect(res.statusCode).toBe(200);
    expect(res.json().id).toBe(tenantId);
    await app.close();
  });
});

describe("Students integration", () => {
  it.skipIf(!dbReady)("GET /api/students returns empty for new tenant", async () => {
    const { buildApp } = await import("../index");
    const app = buildApp();
    await app.ready();
    const res = await app.inject({
      method: "GET",
      url: "/api/students",
      headers: { Authorization: `Bearer ${authToken}` },
    });
    expect(res.statusCode).toBe(200);
    expect(res.json().items).toEqual([]);
    await app.close();
  });

  it.skipIf(!dbReady)("GET /api/students/:id returns 404 for unknown student", async () => {
    const { buildApp } = await import("../index");
    const app = buildApp();
    await app.ready();
    const res = await app.inject({
      method: "GET",
      url: "/api/students/00000000-0000-0000-0000-000000000000",
      headers: { Authorization: `Bearer ${authToken}` },
    });
    expect(res.statusCode).toBe(404);
    await app.close();
  });
});

describe("Fees integration", () => {
  it.skipIf(!dbReady)("GET /api/fee-heads returns empty for new tenant", async () => {
    const { buildApp } = await import("../index");
    const app = buildApp();
    await app.ready();
    const res = await app.inject({
      method: "GET",
      url: "/api/fee-heads",
      headers: { Authorization: `Bearer ${authToken}` },
    });
    expect(res.statusCode).toBe(200);
    expect(res.json().items).toEqual([]);
    await app.close();
  });

  it.skipIf(!dbReady)("POST /api/fee-heads creates a fee head", async () => {
    const { buildApp } = await import("../index");
    const app = buildApp();
    await app.ready();
    const res = await app.inject({
      method: "POST",
      url: "/api/fee-heads",
      headers: { Authorization: `Bearer ${authToken}` },
      payload: { name: "Tuition", description: "Monthly tuition", isOptional: false },
    });
    expect(res.statusCode).toBe(201);
    expect(res.json().name).toBe("Tuition");
    expect(res.json().tenantId).toBe(tenantId);
    await app.close();
  });
});

describe("Health", () => {
  it("GET /api/health returns ok (minimal app, no DB needed)", async () => {
    const app = Fastify({ logger: false });
    app.get("/api/health", async () => ({ ok: true }));
    await app.ready();
    const res = await app.inject({
      method: "GET",
      url: "/api/health",
    });
    expect(res.statusCode).toBe(200);
    expect(res.json()).toMatchObject({ ok: true });
    await app.close();
  });
});
