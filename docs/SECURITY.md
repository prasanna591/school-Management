# SmartSchool Security Document

**Status:** Stage 1 — Security hardening implemented
**Trust boundaries:** API (Fastify), Mobile (Expo), Shared package, PostgreSQL (via Drizzle), Redis (OTP/rate limiting/sessions)

## Threat model & mitigations (OWASP API Top 10)

| Threat | Mitigation | Status |
|--------|-----------|--------|
| Broken object-level authorization (BOLA/IDOR) | Single `canAccessObject()` policy function in `src/lib/policy.ts`; parent→linked children, teacher→assigned classes, driver→own trips | Implemented |
| Broken authentication | Redis-backed OTP with hash storage, TTL, attempt limits, resend throttling, constant-time comparison, single-use | Implemented |
| Broken object property level authorization | Explicit field picks in all DB writes (no mass assignment from request bodies) | Implemented |
| Unrestricted resource consumption | Redis-backed rate limiting: global default + stricter limits on auth/payments/search/messages | Implemented |
| Broken function level authorization | Single `registerAuthz()` guard; fail-closed on undeclared routes; permission matrix per role | Implemented |
| Unrestricted access to sensitive business flows | Payment success only from verified gateway webhook; client can only create orders and poll status | Implemented |
| Server-side request forgery | No server-side URL fetching; webhook signature verification | Implemented |
| Security misconfiguration | Env validation with Zod at boot; rejects default secrets in production | Implemented |
| Improper inventory management | Versioned dependencies, lockfile committed | Implemented |
| Unsafe consumption of APIs | Gateway webhook signature verified with constant-time compare | Implemented |

## Key & secret handling

- `ACCESS_TOKEN_SECRET`, `REFRESH_TOKEN_SECRET`: min 32 chars, validated with Zod at boot; default values rejected in production
- `GATEWAY_SECRET`: used for webhook HMAC-SHA256 signature verification
- `REDIS_URL`: for OTP store, rate limiting, refresh token storage
- `DATABASE_URL`: PostgreSQL connection string
- No personal data or secrets in logs (pino-style redaction recommended)

## Authentication

- Mobile login: phone + OTP (Redis-backed, 5-min TTL, 5-attempt lockout, resend cooldown + hourly caps)
- OTP stored as HMAC-SHA256 hash (not plaintext), single-use, deleted after verification
- Dev/test OTP shortcut (`000000`) only when `NODE_ENV !== 'production'`
- JWT: HS256 only, `exp`/`iss`/`aud` claims required, 15-min access TTL, 7-day refresh TTL
- Refresh token rotation with reuse detection: reuse revokes the entire token family
- Refresh tokens stored hashed server-side; logout revokes the token family

## Authorization

- Central policy module: `src/lib/policy.ts` (`canAccessObject`, `hasPermission`)
- Route permission metadata: all routes declared in `ROUTE_PERMISSIONS`; undeclared routes rejected at startup (fail closed)
- Tenant-scoped roles: super_admin, trustee, principal, admin, accountant can access all data in their tenant
- Parent role: only linked children (via `guardians.userId` → `students.id`)
- Teacher/class_teacher: assigned classes/sections/subjects
- Driver: only own trips

## Multi-tenancy & Row-Level Security

- `src/db/migrations/001_rls.sql`: enables RLS + FORCE ROW LEVEL SECURITY on all 46 tenant-owned tables
- Policy: `tenant_id = current_setting('app.tenant_id', true)`
- Middleware sets `app.tenant_id` per request after JWT verification
- Application connects as `smartschool_app` role (no superuser, no BYPASSRLS)

## Payments (money security)

- Payment success is **never** marked from the client
- Client creates a server-side `payment_order` (pending, server-computed amount)
- Gateway webhook is the sole source of truth: verifies HMAC signature (constant-time compare), checks order id/amount/currency, idempotent by gateway event id, only allows `pending → success/failed`, writes payment + ledger entry in one DB transaction
- Money stored as integer paise; every payment/refund/adjustment is a ledger entry

## Audit & logging

- `audit_logs` table: actor, tenant, entity, action, metadata, timestamp
- Log redaction: tokens, OTPs, phone numbers, Aadhaar, authorization headers, payment payloads must not be logged (implement with pino `redact`)
- Append-only audit log: revoke UPDATE/DELETE for app role

## Data protection (India, DPDP)

- Consent ledger: `consent_records` table (purpose, text version, who, how verified, timestamp, withdrawal)
- Consent withdrawal stops dependent processing
- Data export/correction/erasure workflow endpoints
- Aadhaar stored tokenised/masked, masked in API responses unless role has explicit permission
- No ad tracking or behavioural profiling beyond education

## What remains open

| Item | Reason |
|------|--------|
| Integration tests against real Postgres | Docker unavailable in this environment |
| Rate limit fail-open when Redis unavailable | Documented; production should fail closed |
| RLS with dedicated connection per request | Current middleware sets `app.tenant_id` on pool (best effort); production should use `pool.connect()` per request |
| pino log redaction | Not yet implemented; add structured logging with `redact` option |
| Penetration testing | Not yet performed |

## Incident / breach runbook

1. Detect: monitor auth failures, rate limit triggers, webhook signature failures
2. Contain: revoke refresh token families, rotate `GATEWAY_SECRET`, block IPs at rate limiter
3. Assess: query `audit_logs` for affected tenant/entity
4. Notify: affected schools within 72 hours (DPDP requirement)
5. Remediate: rotate secrets, re-deploy patched code, restore from backup
