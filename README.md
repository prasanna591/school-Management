# SmartSchool

Monorepo: `apps/api` (Fastify + Drizzle + PostgreSQL), `apps/mobile` (Expo), `packages/shared`.

## Commands
- `pnpm install` — install dependencies
- `docker compose up -d` — start Postgres + Redis
- `cp .env.example .env` — configure environment
- `pnpm db:push` — push schema to database
- `pnpm db:seed` — seed demo school
- `pnpm dev` — run API and mobile in parallel
- `pnpm typecheck` — typecheck all workspaces
- `pnpm lint` — lint all workspaces
- `pnpm test` — run all tests

## Stack
API: Fastify, PostgreSQL, Drizzle ORM, Zod. Mobile: Expo, React Native, TanStack Query, Zustand, expo-sqlite.
