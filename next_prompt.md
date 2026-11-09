# SmartSchool: Next Upgrade Prompt

You are continuing work on **SmartSchool** (pnpm monorepo: `apps/api`, `apps/mobile`, `packages/shared`). The previous implementation summary lists 13 modules as "done". Treat that summary as **claims, not evidence**. This upgrade has six stages with gates. **Do not start a stage until the previous stage's gate evidence is shown.** All rules in `CLAUDE.md` (code economy, git, multi-tenancy, security, Definition of Done) and the functional spec in `/docs` still apply.

Global rules for this upgrade:
- Write the least code that correctly does the job. Reuse libraries and generated artifacts; no speculative abstractions; no dead code; remove unused dependencies at the end of every stage.
- Small Conventional Commits on `feat/<stage>` branches, one PR per stage with a short summary, evidence and risks.
- Never claim something works without running it and showing output.
- Security and money/permission/sync correctness beat brevity.

---

## Stage 0: Verify reality (gate: `docs/VERIFICATION.md`)

The summary says the schema was never pushed to a real database, the mobile app was never run on a device, and tests are mostly pure-logic. Establish the truth.

1. Provide `docker-compose.yml` (Postgres + Redis) and make `pnpm db:push`/migrations, `pnpm db:seed`, `pnpm dev:api` work from a clean clone using `.env.example`. Document in README (max 20 lines).
2. Run typecheck, lint, tests. Then write **integration tests against a real Postgres** (Vitest + the compose database or testcontainers) that call the actual Fastify routes via `app.inject`, not re-implementations of logic. Replace any unit test that duplicates production logic instead of calling it.
3. Smoke-test every module's main endpoints against the seeded database. Record pass/fail per endpoint.
4. Run the mobile app (Expo) against the local API; record which screens work end to end and which are stubs, with screenshots or notes.
5. Reconcile inconsistencies in the summary (e.g. "16 tables" vs the longer table list; HR payroll listed both done and remaining) and correct the summary file.
6. Output `docs/VERIFICATION.md`: a table of module → API verified? → mobile verified? → tests → known gaps. Be blunt about stubs.

Gate: show the integration test run and the verification table.

---

## Stage 1: Security hardening (gate: security test suite green + `docs/SECURITY.md`)

Fix these in priority order. Each item needs an automated test that fails before the fix and passes after.

### P0 (fix first)
1. **Payment success must come only from a verified gateway webhook.** Currently success is marked on a client request. Implement:
   - `POST /payments/orders` creates a server-side order in `pending` state with the server-computed amount (never trust a client amount).
   - Webhook endpoint reads the **raw body**, verifies the gateway **signature** with a constant-time compare, checks order id, amount and currency against the stored order, is **idempotent by gateway event id**, only allows `pending → success/failed`, and writes ledger entries in one DB transaction.
   - A job reconciles stale `pending` orders by querying the gateway status.
   - The client can only create an order and poll its status. Remove any client path that marks success.
2. **Tenant isolation enforced centrally, not per handler.** Implement Postgres **Row-Level Security** on every tenant-owned table: application connects as a non-superuser role **without BYPASSRLS**, `FORCE ROW LEVEL SECURITY`, and each request runs inside a transaction that sets the tenant (`set_config('app.tenant_id', $1, true)`). Handlers must not be the only line of defence. Add tests: tenant A cannot read/update/delete tenant B rows through **every route group** (generate the test matrix from the route list).
3. **Object-level authorization (BOLA/IDOR).** One policy function decides access; all child-scoped endpoints use it:
   - Parent → only linked children (via guardian-student link).
   - Student → only self.
   - Teacher → only assigned classes/sections/subjects.
   - Driver → only their own trips.
   - Accountant/admin/principal → by permission matrix.
   Test with two parents in the same tenant: parent A requesting parent B's child by ID must get 403/404 on every child-scoped route (students, attendance, fees, homework, exams, report card, transport, leave, consent, messages).
4. **Role/permission enforcement as a single guard** (route metadata `permission: 'fees:collect'` checked by one hook). Fail closed: routes without declared permission are rejected at startup in CI.
5. **OTP hardening.** Replace the in-memory store with Redis. Store only a **hash** of the OTP with short TTL (e.g. 5 min), max verify attempts (e.g. 5) then lockout, resend throttling (cooldown + per-phone and per-IP hourly caps), constant-time comparison, identical responses for unknown vs known numbers (no user enumeration), single-use. Dev/test OTP shortcuts only when `NODE_ENV !== 'production'` and must be impossible to enable in production (fail fast at boot).
6. **JWT/session hardening.** Pin algorithm, require `exp`, `iss`, `aud`; short access TTL; **refresh token rotation with reuse detection** (reuse revokes the token family); store refresh tokens hashed server-side so logout and "log out other devices" truly revoke; bind sessions to device records; secrets from validated env (Zod schema at boot; reject default/dev secrets in production).
7. **Rate limiting** (`@fastify/rate-limit` backed by Redis): global default, stricter on auth, payments, search, and message-send endpoints; per-tenant and per-user keys where relevant.

### P1
8. **Security headers and CORS**: `@fastify/helmet`, strict CORS allow-list (web origin only), body size limits, request timeouts.
9. **Input validation everywhere**: every route validates params, query, body with shared Zod schemas; reject unknown fields (no mass assignment: never spread request bodies into DB writes; use explicit field picks). No raw SQL string building; use Drizzle parameterised queries only.
10. **Audit log integrity**: confirm audit entries are actually written for fees, marks, attendance edits after lock, student data, permission changes, exports, impersonation. Make the table append-only (revoke UPDATE/DELETE for the app role). Include actor, tenant, entity, before/after (redacted), IP, request id.
11. **Logging redaction** (pino `redact`): tokens, OTPs, phone numbers, Aadhaar, authorization headers, payment payloads. Add a test that logs from an auth + payment flow contain none of these.
12. **PII protection**: Aadhaar and similar identifiers stored encrypted or tokenised (application-level encryption with a key from env/secret manager; masked in API responses unless the role has explicit permission); sensitive fields (medical notes, counselling) behind separate permissions and logged on read.
13. **Gate passes**: QR payload is a signed, tenant-bound, short-expiry, **single-use** token; verification checks signature, expiry, used state and that the scanner is gate staff of the same tenant. Test replay and cross-tenant use.
14. **GPS/transport privacy**: only the assigned driver of an active trip can post points; parents read live location only for their child's route while the trip is active; points retained for a configurable window then deleted by a scheduled job.
15. **Consent and DPDP endpoints**: consent capture (purpose, text version, who, how verified, timestamp), withdrawal that actually stops dependent processing, **data export, correction and erasure request workflow** with status tracking and deadlines, retention job. Schools may keep records they are legally required to keep: erasure should anonymise or delete according to a retention table, and log the action.
16. **Idempotency**: mutating endpoints used by the mobile outbox require an idempotency key stored with the response; same key + different payload is rejected.
17. **Super-admin impersonation** (if present): time-limited, visibly flagged, fully audited, never allowed to take payment or change permissions.

### P2 (CI and process)
18. CI security gates: `pnpm audit` (fail on high/critical), secret scanning (gitleaks or equivalent), CodeQL or equivalent static analysis, Dependabot/Renovate config, lockfile integrity.
19. Backup and restore: scripted daily backup + a tested restore procedure documented in `docs/SECURITY.md`.
20. `docs/SECURITY.md` (keep under 150 lines): trust boundaries, threat list (OWASP API Top 10 mapped to what was done), key and secret handling, incident/breach runbook, what remains open.

Gate: security tests for items 1 to 7 and 13 passing in CI; document anything deferred with a reason.

---

## Stage 2: Design system (gate: component gallery + screenshots)

Goal: the product should feel **designed by an expert product design team**, not generated. Calm, trustworthy, warm, modern; parents should feel at ease and staff should feel fast.

If a design/frontend skill or plugin is available in Claude Code, use it. Before coding screens, write `docs/DESIGN.md` (max ~120 lines) covering: principles, tokens, components, patterns, accessibility, motion, and writing tone.

**Tokens (one source in `packages/shared/tokens.ts`, consumed by web Tailwind config and mobile theme):**
- Colour: neutral scale; a **tenant brand colour** from which an accessible palette (hover, pressed, subtle background, on-colour text) is derived automatically with contrast checks; semantic colours (success, warning, danger, info) always paired with an icon and text, never colour alone; a colour-blind-safe chart palette; light and dark themes.
- Typography: a single versatile family with excellent Indic coverage (Latin + Tamil + Devanagari fallbacks), a clear type scale, tabular numerals for money and tables. Test with long Tamil and Hindi strings (text expands); no clipped or truncated critical text.
- Spacing 4/8 grid; radius, elevation and border tokens; motion tokens (150 to 250 ms ease-out, respects reduced-motion).
- Iconography: one icon set only.

**Core components (build only what screens need, reuse everywhere):** Button, IconButton, Input/Field with inline validation, Select, DatePicker, Checkbox/Switch, Card, Badge/StatusPill, Avatar (photo or initials), List item, Tabs, Sheet/Dialog, Toast with undo, Skeleton, EmptyState (lightweight illustration + one clear action), ErrorState with retry, Table (web), Chart wrapper (web), Stat/KPI card.

**Patterns:** loading skeletons (not spinners) for content, optimistic updates with rollback, destructive actions require confirmation with consequence stated, forms keep drafts, every list has search + filters + pagination + empty/error states, writing tone is plain, kind and specific ("Fee due 5 Dec" not "Payment pending").

**Quality bar:** WCAG AA contrast, visible focus states, keyboard operability on web, minimum touch target 44 pt (48 dp), screen-reader labels, text scaling to 200% without breaking layout.

**Verification:** a dev-only component gallery (`/design` route on web, hidden screen on mobile) showing all components in all states, in English and Tamil, light and dark. Capture screenshots (Playwright for web; emulator screenshots for mobile). Review them against the checklist above and fix visible issues (alignment, spacing, truncation, contrast) before moving on.

---

## Stage 3: Web dashboard `apps/web` (gate: running dashboard + Playwright smoke tests)

The web dashboard is for principals, admins, accountants, admission counsellors, office staff and the super admin. It does the heavy work that doesn't belong on a phone.

**Stack (use these unless the repo dictates otherwise):** Next.js (App Router) + TypeScript, Tailwind, shadcn/ui as the base for components (restyled with the design tokens), TanStack Query and Table, React Hook Form + shared Zod schemas, Recharts (or similar) for charts, typed API client generated from or shared with `packages/shared`. Add libraries only when they remove more code than they add.

**Web security requirements:**
- Auth via **httpOnly, Secure, SameSite cookies** (not tokens in localStorage). CSRF protection on mutating requests (SameSite + CSRF token or double-submit).
- Staff/admin roles require a second factor (TOTP) in addition to OTP login; session timeout and re-authentication for sensitive actions (refunds, permission changes, exports, impersonation).
- Strict CSP, `frame-ancestors 'none'`, no `dangerouslySetInnerHTML`, sanitise any rendered rich text, safe file download headers.
- Authorization is enforced by the API; the UI hides unavailable actions but is never the control.

**Layout and UX (the "expert designer" feel):**
- Left sidebar navigation grouped by area, collapsible, role-aware; top bar with school switcher (for groups), academic year selector, global search, notifications, profile.
- **Command palette** (Cmd/Ctrl+K): jump to any student, page or action.
- Tables: sticky header, column visibility, saved filters, sort, bulk select with bulk actions, row-click opens a **side sheet** with details and quick actions, keyboard navigation, export to Excel/PDF, density toggle.
- Dashboards: KPI cards with trend vs previous period, drill-down into the underlying list, charts with clear labels, "needs attention" panel at the top.
- Forms: sectioned, inline validation, autosave drafts, unsaved-changes guard, keyboard-friendly.
- Print styles for receipts, report cards, certificates.
- Responsive down to tablet; usable on a mobile browser for quick checks.
- Dark mode and language switch (English, Tamil, Hindi).

**Pages (build in this order; each uses existing API modules, extend the API only where missing):**
1. Auth + shell (login, TOTP, layout, command palette, role routing)
2. **Overview dashboard** (attendance today, fees collected/dues, admissions funnel, alerts, approvals)
3. **Students** (list, profile side sheet/page, documents, guardians, siblings, import wizard with validation preview and downloadable error report, bulk actions, promotion)
4. **Attendance** (class view, corrections with audit, reports, chronic-absence list for review)
5. **Fees** (structures, concessions with approval queue, counter collection, dues and defaulters, reminders, refunds, reconciliation, collection reports, receipts)
6. **Communication** (composer with audience builder, schedule, delivery/read status, templates per language, grievance desk)
7. **Admissions CRM** (kanban pipeline, enquiry detail, follow-ups, seat matrix, conversion to student)
8. **Exams** (schemes, marks review and lock, report card generation and publish)
9. **Timetable** (grid with clash detection, substitutions)
10. **Transport** (routes, vehicles, live trip map, document-expiry list)
11. **HR and payroll** (staff, leave, salary structures, payroll run preview/lock, payslips)
12. **Compliance** (consent ledger, data requests queue, APAAR tracker, UDISE+ completeness checker)
13. **Settings** (school profile, branding, academic year and rollover, roles and permissions, integrations, feature flags)
14. **Audit log** (filter by actor, entity, date; export)
15. **Super-admin console** (separate area: tenants, plans, usage, feature flags, support impersonation with audit)

Gate: dashboard runs against the seeded API; Playwright smoke tests cover login, student search, fee counter collection, approval decision and a bulk import; screenshots of Overview, Students, Fees and Admissions pages reviewed against the design checklist.

---

## Stage 4: Mobile UI/UX uplift (gate: before/after screenshots + performance check)

Apply Stage 2 tokens and components to the existing Expo app, replacing ad-hoc styles. Do not rewrite working logic; change presentation and interaction.

- **Today screen** per role as the product's hero: ordered cards by urgency (parent: attendance status, dues, homework, bus, latest notice; teacher: next period, attendance pending, marks pending; principal: KPIs and approvals).
- **Attendance marking**: big tappable student tiles with photo/initials, "All present" default, tap toggles through absent/late/leave, sticky submit bar with counts, instant haptic feedback, offline-saved indicator.
- **Fees**: clear amount hierarchy, itemised breakdown in a bottom sheet, one primary Pay button, calm success/failure/processing states, shareable receipt.
- **Navigation**: max 5 tabs, consistent headers, child switcher that is obvious but unobtrusive, gestures that follow platform conventions.
- **States**: skeletons, empty states with a purposeful action, error states with retry, offline banner with pending sync count.
- **Motion**: subtle transitions (list item enter, sheet open, success check) using the motion tokens; no gratuitous animation; honour reduced-motion.
- **Localisation QA**: screenshot every main screen in English, Tamil and Hindi at default and large text sizes; fix overflow.
- **Accessibility**: labels, roles, focus order, contrast.
- **Performance**: measure cold start and attendance flow on a low-end Android profile; fix regressions; run a bundle analysis and remove heavy unused packages.

---

## Stage 5: Missing core integrations (one PR each; each needs tests)

1. **Push notifications + in-app inbox**: device token registration per session, server-side inbox table, categories and per-user toggles, non-mutable emergency category, deep links, quiet hours. Use one notification service abstraction only if two channels share it.
2. **Real payment gateway** integration finishing Stage 1 item 1 (hosted checkout/SDK, UPI intent, receipts as PDF).
3. **PDFs** generated server-side from templates: fee receipts, report cards, certificates, ID cards, hall tickets. Templates stored as data; fonts embedded for Tamil/Hindi.
4. **File uploads**: signed upload URLs to private storage, tenant-prefixed keys, size limits, content-type and magic-byte validation, virus scanning hook, short-lived signed download URLs, no public listing; mobile image compression before upload.
5. **SMS/WhatsApp provider** adapters with delivery status webhooks (signature-verified), channel fallback order, per-tenant template registry (note DLT/Meta approval requirements in docs).
6. **Admin audit and export controls**: exports require permission, are watermarked or logged, and rate limited.

---

## Stage 6: Remaining scope (only after Stages 0 to 5 gates pass)

Compliance depth (APAAR tracker with name-mismatch checker, UDISE+ completeness checker and export after verifying the current official format, certificates and ID cards), then Phase 3 modules in this order: hostel, inventory/stores, canteen wallet, health/infirmary, events/clubs, LMS-lite and AI-assisted features (human review required, no personal data sent to external AI unless explicitly enabled and minimised), analytics and early-warning suggestions, multi-branch reporting, public API/webhooks.

---

## Definition of Done for every stage

- Evidence shown: test output, running app, screenshots where UI is involved.
- Typecheck, lint, tests and CI security checks pass.
- Security tests for any new endpoint (authz, tenant isolation, validation).
- No dead code or unused dependencies; bundle/API size checked.
- `CLAUDE.md`, `docs/DESIGN.md`, `docs/SECURITY.md`, `docs/VERIFICATION.md` updated where relevant.
- PR description: what changed, why, how verified, residual risks.

## Reporting format at the end of each stage
1. What was built (5 lines max).
2. Evidence (commands run and results).
3. What was deliberately not done and why.
4. Risks or decisions needed from me.
5. Proposed next stage.

**Begin with Stage 0 now.**