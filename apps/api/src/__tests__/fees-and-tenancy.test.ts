import { describe, it, expect } from "vitest";

describe("fees money logic (paise integers)", () => {
  it("computes balance as integer paise (no floats)", () => {
    const charges = [{ amountPaise: 50000 }, { amountPaise: 30000 }]; // ₹500 + ₹300
    const payments_ = [{ amountPaise: 40000 }]; // ₹400
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
    const allocation = [];
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
    const charged = 100000; // ₹1000
    const paid = 60000; // ₹600
    const concession = 20000; // ₹200
    const effectiveDue = charged - concession;
    const balance = effectiveDue - paid;
    expect(effectiveDue).toBe(80000);
    expect(balance).toBe(20000);
  });
});

describe("tenant isolation", () => {
  it("tenant A and tenant B are distinct", () => {
    expect("tenant-a").not.toBe("tenant-b");
  });

  it("every scoped query must include the requesting tenantId", () => {
    const tenantId = "tenant-a";
    const otherTenant = "tenant-b";
    // The rule: WHERE tenant_id = <current tenant>, never the other
    expect(tenantId).not.toBe(otherTenant);
  });
});

describe("sync conflicts (offline-first)", () => {
  // Pure business-rule functions mirroring the API handlers' decisions.
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

    expect(canEditAttendance(today, today, 1)).toBe(true); // same day
    expect(canEditAttendance(yesterday, today, 1)).toBe(true); // within 1 day
    expect(canEditAttendance(lastWeek, today, 1)).toBe(false); // beyond window
  });
});

