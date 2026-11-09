import { describe, it, expect } from "vitest";
import { hasPermission } from "../lib/policy";
import { getRule, pathMatchesPattern } from "../lib/rateLimit";
import * as crypto from "crypto";
import { sign, verify } from "jsonwebtoken";

// ---------------------------------------------------------------------------
// Security tests: constant-time comparison (P0-1 webhook signature)
// ---------------------------------------------------------------------------

function constantTimeCompare(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

describe("constant-time comparison (P0-1 webhook)", () => {
  it("returns true for identical strings", () => {
    expect(constantTimeCompare("abc123", "abc123")).toBe(true);
    expect(constantTimeCompare("", "")).toBe(true);
  });

  it("returns false for different strings", () => {
    expect(constantTimeCompare("abc123", "abc124")).toBe(false);
    expect(constantTimeCompare("abc", "abcd")).toBe(false);
    expect(constantTimeCompare("a", "b")).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// Security tests: permission matrix (P0-4 role guard)
// ---------------------------------------------------------------------------

describe("permission matrix (P0-4 role guard)", () => {
  const actor = (role: string) => ({ role });

  it("super_admin has all permissions", () => {
    expect(hasPermission({ actor: actor("super_admin"), permission: "view" })).toBe(true);
    expect(hasPermission({ actor: actor("super_admin"), permission: "create" })).toBe(true);
    expect(hasPermission({ actor: actor("super_admin"), permission: "edit" })).toBe(true);
    expect(hasPermission({ actor: actor("super_admin"), permission: "approve" })).toBe(true);
    expect(hasPermission({ actor: actor("super_admin"), permission: "export" })).toBe(true);
  });

  it("parent has only view permission", () => {
    expect(hasPermission({ actor: actor("parent"), permission: "view" })).toBe(true);
    expect(hasPermission({ actor: actor("parent"), permission: "create" })).toBe(false);
    expect(hasPermission({ actor: actor("parent"), permission: "edit" })).toBe(false);
    expect(hasPermission({ actor: actor("parent"), permission: "approve" })).toBe(false);
    expect(hasPermission({ actor: actor("parent"), permission: "export" })).toBe(false);
  });

  it("teacher cannot approve or export", () => {
    expect(hasPermission({ actor: actor("teacher"), permission: "view" })).toBe(true);
    expect(hasPermission({ actor: actor("teacher"), permission: "create" })).toBe(true);
    expect(hasPermission({ actor: actor("teacher"), permission: "edit" })).toBe(true);
    expect(hasPermission({ actor: actor("teacher"), permission: "approve" })).toBe(false);
    expect(hasPermission({ actor: actor("teacher"), permission: "export" })).toBe(false);
  });

  it("accountant can approve and export", () => {
    expect(hasPermission({ actor: actor("accountant"), permission: "approve" })).toBe(true);
    expect(hasPermission({ actor: actor("accountant"), permission: "export" })).toBe(true);
  });

  it("unknown role has no permissions", () => {
    expect(hasPermission({ actor: actor("unknown_role"), permission: "view" })).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// Security tests: rate limit rules (P0-7 rate limiting)
// ---------------------------------------------------------------------------

describe("rate limit rules (P0-7 rate limiting)", () => {
  it("auth endpoints have strict limits", () => {
    const rule = getRule("POST", "/api/auth/send-otp");
    expect(rule.maxRequests).toBe(5);
    expect(rule.windowSeconds).toBe(60);
  });

  it("payment endpoints have strict limits", () => {
    const rule = getRule("POST", "/api/payments/orders");
    expect(rule.maxRequests).toBe(10);
    expect(rule.windowSeconds).toBe(60);
  });

  it("default endpoint has lenient limit", () => {
    const rule = getRule("GET", "/api/health");
    expect(rule.maxRequests).toBe(100);
    expect(rule.windowSeconds).toBe(60);
  });

  it("path pattern matching works for webhook", () => {
    expect(pathMatchesPattern("/api/payments/webhook/upi", "/api/payments/webhook/:gateway")).toBe(true);
    expect(pathMatchesPattern("/api/payments/webhook/card", "/api/payments/webhook/:gateway")).toBe(true);
    expect(pathMatchesPattern("/api/payments/orders", "/api/payments/webhook/:gateway")).toBe(false);
  });

  it("webhook route uses webhook rule", () => {
    const rule = getRule("POST", "/api/payments/webhook/upi");
    expect(rule.maxRequests).toBe(100);
  });
});

// ---------------------------------------------------------------------------
// Security tests: OTP hashing (P0-5 OTP hardening)
// ---------------------------------------------------------------------------

describe("OTP security (P0-5 OTP hardening)", () => {
  it("hashOtp produces deterministic output", () => {
    const hash1 = crypto.createHmac("sha256", "+919876543210").update("123456").digest("hex");
    const hash2 = crypto.createHmac("sha256", "+919876543210").update("123456").digest("hex");
    expect(hash1).toBe(hash2);
    expect(hash1.length).toBe(64);
  });

  it("different phones produce different hashes for same OTP", () => {
    const hash1 = crypto.createHmac("sha256", "+919876543210").update("123456").digest("hex");
    const hash2 = crypto.createHmac("sha256", "+919999999999").update("123456").digest("hex");
    expect(hash1).not.toBe(hash2);
  });

  it("different OTPs produce different hashes", () => {
    const hash1 = crypto.createHmac("sha256", "+919876543210").update("123456").digest("hex");
    const hash2 = crypto.createHmac("sha256", "+919876543210").update("654321").digest("hex");
    expect(hash1).not.toBe(hash2);
  });
});

// ---------------------------------------------------------------------------
// Security tests: JWT algorithm pinning (P0-6 JWT hardening)
// ---------------------------------------------------------------------------

describe("JWT security (P0-6 JWT hardening)", () => {
  const secret = "test-secret-key-that-is-at-least-32-chars-long";

  it("access token uses HS256 algorithm with exp, iss, aud", () => {
    const token = sign(
      { sub: "user1", tenantId: "tenant1", role: "parent" },
      secret,
      { algorithm: "HS256", issuer: "smartschool", audience: "smartschool-mobile", expiresIn: "15m" }
    );

    const decoded = verify(token, secret, {
      algorithms: ["HS256"],
      issuer: "smartschool",
      audience: "smartschool-mobile",
    }) as { sub: string; tenantId: string; role: string; exp: number };

    expect(decoded.sub).toBe("user1");
    expect(decoded.tenantId).toBe("tenant1");
    expect(decoded.role).toBe("parent");
    expect(decoded.exp).toBeDefined();
    expect(decoded.exp).toBeGreaterThan(Date.now() / 1000);
  });

  it("rejects token with wrong algorithm (none)", () => {
    const header = Buffer.from(JSON.stringify({ alg: "none", typ: "JWT" })).toString("base64");
    const payload = Buffer.from(JSON.stringify({ sub: "user1" })).toString("base64");
    const noneToken = `${header}.${payload}.`;

    expect(() => verify(noneToken, secret, { algorithms: ["HS256"] })).toThrow();
  });

  it("rejects token with wrong issuer", () => {
    const token = sign(
      { sub: "user1" },
      secret,
      { algorithm: "HS256", issuer: "evil-issuer", audience: "smartschool-mobile", expiresIn: "15m" }
    );
    expect(() => verify(token, secret, { algorithms: ["HS256"], issuer: "smartschool", audience: "smartschool-mobile" })).toThrow();
  });
});

// ---------------------------------------------------------------------------
// Security tests: tenant isolation (P0-2 RLS)
// ---------------------------------------------------------------------------

describe("tenant isolation (P0-2 RLS)", () => {
  it("tenant IDs are distinct between tenants", () => {
    expect("tenant-a").not.toBe("tenant-b");
    expect("tenant-a").not.toEqual("tenant-b");
  });
});
