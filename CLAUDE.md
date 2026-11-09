# SmartSchool

## Stack
- Monorepo with pnpm workspaces: `apps/api`, `apps/web`, `apps/mobile`, `packages/shared`
- TypeScript everywhere
- API: Fastify, PostgreSQL, Drizzle ORM, Zod validation, BullMQ + Redis
- Web: Next.js + React, Tailwind, shadcn/ui, TanStack Query
- Mobile: React Native with Expo, Expo Router, expo-sqlite offline store, Zustand, TanStack Query
- Auth: mobile + OTP (SMS DLT template for India); proven library, no custom crypto

## Folder map
- `packages/shared` — shared types, Zod schemas, constants (imported by api, web, mobile)
- `apps/api` — Fastify backend, Drizzle migrations, jobs
- `apps/web` — admin dashboard (Next.js)
- `apps/mobile` — parent/teacher/driver app (Expo)

## Commands
- `pnpm dev` — run all apps in parallel
- `pnpm build` — build all
- `pnpm lint` — lint all
- `pnpm typecheck` — typecheck all
- `pnpm test` — run all tests
- `pnpm db:generate` — generate Drizzle client
- `pnpm db:push` — push schema to DB
- `pnpm db:seed` — seed demo school

## Code economy rules (section 0 of prompt.md)
1. Least code that correctly solves the problem — no speculative abstractions
2. Reuse before writing — libraries over hand-rolling; state reason in commit message
3. No dead code — no unused files, commented blocks, placeholder TODOs
4. One way to do each thing — one validation, data-fetching, styling, date library
5. Share, don't duplicate — types/schemas/constants live once in `packages/shared`
6. Small files, small functions — plain functions over classes
7. Generate from schema where possible
8. Tests where they pay off — money, permissions, tenant isolation, attendance sync, compliance
9. Performance by default — index FKs + tenant columns, paginate every list, avoid N+1
10. Config or DB row before new code

## Multi-tenancy & security
- Single DB, shared schema, `tenant_id` on every tenant-owned table, enforced centrally (middleware + RLS or automatic query scope)
- Tests proving tenant A cannot read/write tenant B's data
- Parents access only linked children — tested
- Audit log for every create/update/delete on sensitive entities
- Money in paise (integers); ledger entries for every payment/refund/adjustment
- DPDP: consent ledger, data export/correction/erasure, no personal data in logs
- No ad tracking or behavioural profiling beyond education
