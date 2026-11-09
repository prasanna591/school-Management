# SmartSchool: Build Brief for Claude Code

You are the lead engineer on **SmartSchool**, a multi-tenant school management system for Indian schools: a backend API, a web admin dashboard, and a mobile app (parents, teachers, students, drivers).

Work phase by phase. Before writing code, follow the "Start here" steps. Do not build everything at once.

---

## 0. Non-negotiable engineering rules

**Write the least code that correctly solves the problem.**

1. **Proportionality.** If the logic is ~100 lines, the code is ~100 lines. No speculative abstractions, no "future-proof" layers, no factories/managers/wrappers around a single call.
2. **Reuse before writing.** Use the framework's built-ins and well-maintained libraries instead of hand-rolling (auth, validation, forms, date handling, PDF, queues, payments SDKs). Install a package only when it removes more code than it adds. State the reason in the commit message.
3. **No dead code.** No unused files, commented-out blocks, placeholder TODOs, mock modules, or "example" scaffolding left behind.
4. **One way to do each thing.** One validation library, one data-fetching approach, one styling approach, one date library across the monorepo.
5. **Share, don't duplicate.** Types, validation schemas, constants, and API client live once in a `packages/shared` and are imported by backend, web, and mobile.
6. **Small files, small functions.** Split when a file does two jobs, not before. Prefer plain functions over classes unless the framework requires classes.
7. **Generate from schema where possible** (typed API client, DB types, form validation) instead of writing it by hand.
8. **Tests where they pay off.** Test money, permissions, tenant isolation, attendance sync and compliance logic thoroughly. Skip trivial getters and UI snapshots.
9. **Performance by default.** Index foreign keys and tenant columns, paginate every list endpoint, avoid N+1 queries, keep mobile bundles lean, and design for low-end Android and poor networks.
10. **Before adding a feature, ask: can this be a config or a row in the database instead of new code?**

If you are about to write more than ~150 lines for a single feature, stop and check whether a library, a generated artifact, or a simpler design removes most of it.

---

## 1. Start here (do this first, in order)

1. **Inspect the repo.** If a SmartSchool monorepo already exists (backend, web admin, mobile), read it first: structure, stack, schema, existing modules, tests, scripts. **Keep the existing stack and conventions.** Do not rewrite or re-scaffold working code. Produce a short audit: what exists, what is missing against the feature scope below, what is broken or duplicated.
2. **If starting from empty**, use this default stack unless I say otherwise:
   - Monorepo with pnpm workspaces: `apps/api`, `apps/web`, `apps/mobile`, `packages/shared`
   - TypeScript everywhere
   - API: Fastify or NestJS (pick one, whichever needs less boilerplate), PostgreSQL, Prisma or Drizzle, Zod for validation, BullMQ + Redis for jobs
   - Web: Next.js or Vite + React, Tailwind, shadcn/ui, TanStack Query and Table
   - Mobile: React Native with Expo, offline storage with SQLite or WatermelonDB for attendance and marks sync
   - Auth: use a proven library or service rather than custom crypto
3. **Git and GitHub.**
   - Ensure a git repo exists (`git init` if not). Use `gh` CLI to create or connect the remote repository if it is installed and authenticated; if not, tell me the one command to run and continue locally.
   - Branching: `main` (stable) and short-lived `feat/<module>` branches. Conventional Commits (`feat:`, `fix:`, `refactor:`, `test:`, `chore:`).
   - Commit small and often, one logical change per commit. Add a `.gitignore`, `.env.example` (never commit secrets), and a CI workflow (lint, typecheck, test) on pull requests.
4. **Claude Code tooling.** Check what is already available (`/plugin`, `/mcp`, installed skills). Install only what is clearly useful for this project, and tell me what you installed and why. Candidates, if available:
   - a frontend/UI design skill or plugin for the web and mobile screens
   - a GitHub integration (or `gh` CLI) for repos, issues and PRs
   - a documentation lookup tool for current library docs (use it instead of guessing APIs)
   - a database/Postgres tool for inspecting schema and running queries
   Do not install anything you will not use this session.
5. **Write `CLAUDE.md`** at the repo root (keep under ~80 lines): stack, folder map, commands (dev, test, lint, migrate), the code-economy rules from section 0, and the multi-tenancy and security rules from section 3. Update it when conventions change.
6. **Write a short plan** (milestones for the phase you are about to build) and wait for my "go" only if the audit reveals a major architectural problem. Otherwise proceed.

---

## 2. Product context

- Users: super admin (us), trustee, principal, admin/office staff, accountant, admission counsellor, teacher, class teacher, parent, student, driver/attendant, gate staff, librarian, nurse.
- Market: private K-12 schools in India (CBSE, ICSE, State boards, IB), including Tier 2/3 towns with weak connectivity. Tamil Nadu and Puducherry matter, so multi-language is a core need (English, Tamil, Hindi first).
- Differentiators to protect in every decision:
  1. **Radical simplicity**: one "today" screen per role; teacher attendance in under 10 seconds; parent fee payment in about 3 taps; no training needed.
  2. **Fees done right**: concessions, sibling discounts, refunds, carry-forward, UPI AutoPay, reconciliation.
  3. **Tracked WhatsApp + push communication** with delivery status and regional-language templates.
  4. **Compliance built in**: DPDP consent ledger, APAAR/UDISE+ readiness checks.
  5. **Offline-first mobile.**
  6. **Practical, human-approved AI** (not a chatbot gimmick).
  7. **Easy migration** from Excel, Entab and Fedena exports.
  8. **Flat, transparent per-student pricing, 0% gateway markup.**

---

## 3. Architecture and security rules

**Multi-tenancy**
- Single database, shared schema, `tenant_id` on every tenant-owned table, enforced centrally (middleware plus Postgres row-level security or an automatic query scope). Never rely on developers remembering a `where tenant_id`.
- Write tests proving tenant A can never read or write tenant B's data through any endpoint.
- Per-tenant branding, feature flags, academic year and settings stored as data.

**Auth and permissions**
- Role-based access with custom roles and field-level rules; permission checks live in one place (policy layer), not scattered in handlers.
- MFA for admin roles, short-lived access tokens plus refresh, rate limiting, secure session handling.
- Parents can access only their linked children. Verify this in tests.
- Audit log for every create/update/delete on sensitive entities (fees, marks, attendance edits, student data, permissions).

**Data protection (India, DPDP Act)**
- Treat all student data as children's data. Collect the minimum needed.
- Consent ledger: who consented, for what purpose, when, how verified, withdrawal history.
- Support data export, correction and erasure workflows; define retention rules.
- No ad tracking, no behavioural profiling beyond educational purposes. Biometric/face features are optional and consent-gated.
- Encrypt in transit and at rest; hash or tokenise Aadhaar and similar identifiers; never log personal data or secrets.
- Breach-notification workflow stub documented in the repo.

**Reliability**
- Idempotent payment webhooks and message sending. Retries with backoff in the job queue.
- Money stored as integers (paise), never floats. Every payment, refund and adjustment is a ledger entry; balances are derived.
- Offline sync: client-generated IDs, last-write rules defined per entity, conflict test cases for attendance and marks.

---

## 4. Feature scope by phase

Build one phase at a time. Each module is done only when it meets the Definition of Done (section 6). ★ = key differentiator, polish these most.

### Phase 1: Core (MVP people pay for)
1. **Foundation**: tenant onboarding wizard (school profile, board, academic year, classes and sections in under 30 minutes), roles and permissions, branding, super-admin console, audit logs, data import wizard (Excel first), backup/export.
2. **Student information**: profiles, guardians, siblings, documents vault, admission number, PEN and APAAR fields, bulk import/export, duplicate detection, promotion and transfer.
3. **Attendance ★**: daily/period marking with "all present, mark exceptions", offline marking and sync, instant parent alert on absence, leave requests, staff attendance, percentage alerts.
4. **Fees ★**: structures by class/category/term, concessions and sibling discounts with approval, late fees, refunds, advances and carry-forward, UPI/cards/net banking, payment links via WhatsApp/SMS, counter receipts (cash/cheque), reconciliation, dues dashboard, automated reminders, PDF receipts.
5. **Communication ★**: notices and circulars (all/class/section/individual), unified composer for push, SMS, WhatsApp Business API and email with delivery and read status, two-way parent-teacher chat, templates in multiple languages, emergency broadcast.
6. **Homework and daily diary**: post, submit (photo/PDF), feedback.
7. **Apps**: parent app (multi-child switch, fees, attendance, notices, homework, leave), teacher app (attendance, homework, marks, chat), principal dashboard.

### Phase 2: Operations and compliance
8. **Admissions CRM**: enquiry capture (web form, QR, WhatsApp, walk-in), pipeline and follow-ups, online application and fee, document upload with OCR auto-fill ★, tests/interviews, merit and waitlist, seat matrix, conversion to student.
9. **Exams and results**: exam schemes, datesheet, hall tickets, marks entry with validation and bulk import, board-specific grading, rank, report-card templates and bulk PDF, NEP holistic progress card, AI-drafted remarks with teacher approval ★, result publishing rules.
10. **Timetable**: builder with clash detection, workload balance, substitutions.
11. **Transport**: routes, stops, vehicles, student assignment, live GPS and ETA, parent alerts (bus started, nearing, arrived), driver app, SOS, document-expiry reminders.
12. **Compliance ★**: DPDP consent ledger and parental-consent flows, APAAR status tracker with Aadhaar-name mismatch checker, UDISE+ completeness checks and export, data erasure workflow, RTE/board report packs.
13. **Certificates and ID cards**: TC, bonafide, conduct, bulk print, QR-verified.
14. **Gate and visitor management ★**: QR gate pass, pre-approved pickup, authorised guardian verification.

### Phase 3: Depth and growth
15. **HR and payroll**: staff records, leave, salary structures (including pay-commission scales, PF/ESI, state professional tax, TDS), payslips, bank advice, recruitment, appraisals.
16. **Library, hostel, inventory/stores, canteen wallet, health/infirmary, events and clubs, facility booking, alumni.**
17. **LMS-lite**: online quizzes and question bank with auto-grading, AI question-paper generator ★, resources library, live-class links.
18. **Analytics and AI ★**: principal dashboard, early-warning flags (attendance, marks, fee delay) with human review, natural-language "ask your data", auto-drafted parent updates, regional-language translation, custom report builder.
19. **Multi-branch/group reporting, public API and webhooks, accounting export (Tally), DigiLocker integration, subscription billing for schools.**

---

## 5. UX rules

- Mobile-first, one primary action per screen, large touch targets, readable on cheap phones in sunlight.
- Role-specific home screen showing only what needs action today.
- Every list: search, filter, pagination, empty state, loading state, error state with a clear next step.
- Multi-language UI with a language selector; no hardcoded user-facing strings (use the i18n resource files).
- Accessibility: contrast, scalable text, labels for screen readers.
- Design system: reuse components; do not create near-duplicate buttons, cards or forms.
- Use the design skill/plugin you installed for polish, but keep component count small.

---

## 6. Definition of Done (per module)

- Works end to end: database migration, API, web screen, mobile screen where relevant.
- Permissions enforced and tested; tenant isolation tested.
- Inputs validated with shared schemas; errors are friendly.
- Tests cover critical logic (see rule 8); lint and typecheck pass; CI green.
- Seed script produces realistic demo data (one demo school with students, staff, fees, attendance) so the app can be demoed immediately.
- `CLAUDE.md` and a short module note in `/docs` updated (what it does, key decisions), not long essays.
- No dead code, no unused dependencies. Run a dependency and unused-code check before finishing.
- Committed in small Conventional Commits and pushed to the feature branch with a PR description summarising what changed and why.

---

## 7. How to work with me

- Start every session by stating the phase, the module, and the plan in 5 to 10 lines.
- When a requirement is ambiguous, choose the simplest reasonable interpretation, note the assumption in the PR, and continue. Ask me only when the choice is expensive to reverse (data model, payments, auth).
- When you find a better, simpler approach than what is in this brief, say so and use it.
- At the end of each module, report: what was built, what was deliberately left out, test status, and suggested next step. Keep the report short.
- Never claim something works without running it. Run the tests and the app, and show the result.

**Begin with section 1 now: inspect the repository, run the audit, set up git and tooling, write `CLAUDE.md`, then start Phase 1, module 1.**