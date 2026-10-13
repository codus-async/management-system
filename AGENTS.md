# CEO PA Management System

## Stack

- **Language / Runtime**: TypeScript, Node 20
- **Framework**: Next.js 16 (App Router, React 19) in `client/`; Express 5 in `backend/`
- **Key dependencies**: Prisma 7 on Postgres (Neon), Better Auth, Zod, Tailwind CSS 4 + shadcn/ui, pino
- **Package manager**: npm (no workspaces; install in the root for tooling, plus `client/` and `backend/`)

## Build approach

Tracer Bullet (one thin real path through every layer first, then thicken one segment at a time).

## Commands

```bash
# Install (run once in the root, client/, and backend/)
npm install

# Dev: client on 3000, backend on 4000, Next rewrites /api/* to the backend
npm run dev

# Build and start (same scripts in both apps)
npm run build && npm run start

# Root only (tooling)
npm run format         # prettier --write .
npm run format:check   # prettier --check .
npm run verify         # format + lint + typecheck; what the pre-commit hook runs

# Backend only
npm run lint           # eslint
npm run typecheck      # tsc --noEmit
npm test               # vitest run
npm run db:migrate     # prisma migrate dev
npm run seed           # first accounts

# Client only
npm run lint           # eslint
npm run typecheck      # next typegen && tsc --noEmit
```

Backend note: in `backend/`, the `typescript` package is aliased to the TypeScript 6 API so typescript-eslint can load, and `tsc` comes from `@typescript/native` (TypeScript 7).

## Specs

Stored in `docs/specs/`. Format: `docs/specs/NNNN-title/index.md`, with `rationale.md` and `verify.md` beside it.

## Rules

- Clean Architecture: four layers (domain, application, infrastructure, presentation); outer layers depend on inner ones, never the reverse; domain has zero external imports.
- Use cases are thin orchestrators; infrastructure implements interfaces defined by domain or application (dependency inversion); no framework or ORM code inside `domain/` or `application/`.
- Entities are plain objects with no ORM decorators and enforce their own invariants; cross boundary communication uses DTOs or plain objects, no domain entities leak into the presentation layer.
- Tests: domain and application layers unit tested with no infrastructure mocks; infrastructure integration tested against real systems (Vitest + supertest, Playwright for browser tests).
- Folder by feature for new code; the scaffolded `routes/`/`lib/`/`config/` layout in `backend/` stays as it is.
- Before every commit: lint, format, typecheck; the pre-commit hook blocks the commit when one fails.
- Test gate before a feature is done: unit plus integration; browser tests come with the features that need them.
- CI on push: format check, lint, typecheck, test on GitHub.
- General craft: consistent error handling, consistent naming, documented public APIs, conventional commit messages, named exports only, DRY, YAGNI, reusability, modularity, performance first, accessibility baseline (WCAG AA).
- server components for all root pages in client/
- separation of concerns (hooks hold logic, data holds data, components render view)
- file strictly under 600 lines
- comments only when necessary and single line only
- Domain writes go through `backend/src/lib/repository.ts` (UUID v4 ids from `crypto.randomUUID`, an Activity row for created and updated, closed set columns validated against `backend/src/lib/constants.ts`); default reads filter `deletedAt IS NULL`, and reads that cross a relation filter soft deleted parents
- Day boundaries come from `backend/src/lib/timezone.ts`, which reads the `TIMEZONE` env var (IANA zone, default UTC, an unparseable value fails config load); no other code builds a Date for domain logic
- API errors answer as JSON `{ error }` from the central handler in `backend/src/app.ts`: a throw in a route becomes that body, a 4xx keeps its message, a 500 is logged by pino and returns "Internal server error" with no internals, so routes do not need their own catch for the envelope

## Git

- Create a new branch for every new feature when /develop is used
- integration: on
- branch prefix: feat/, fix/, chore/
- commit: per-milestone
- enforced by hooks: pre-commit runs the branch prefix check plus `npm run verify`; commit-msg runs commitlint (conventional messages)

## Agent skills

Load only the ones the current task needs.

- [antfu](.agents/skills/antfu/): `antfu/skills`, opinionated lint and format workflow conventions for JS/TS
- [api-and-interface-design](.agents/skills/api-and-interface-design/): `addyosmani/agent-skills`, API surface and interface design
- [api-design-principles](.agents/skills/api-design-principles/): `wshobson/agents`, REST API design
- [better-auth-best-practices](.agents/skills/better-auth-best-practices/): `better-auth/skills`, Better Auth config, adapters, sessions
- [better-auth-security-best-practices](.agents/skills/better-auth-security-best-practices/): `better-auth/skills`, auth secrets, CSRF, trusted origins, audit logging
- [bullmq-specialist](.agents/skills/bullmq-specialist/): `sickn33/agentic-awesome-skills`, BullMQ job queues
- [cloudinary-docs](.agents/skills/cloudinary-docs/): `cloudinary-devs/skills`, Cloudinary documentation
- [cloudinary-next](.agents/skills/cloudinary-next/): `cloudinary-devs/skills`, Cloudinary with Next.js
- [cloudinary-react](.agents/skills/cloudinary-react/): `cloudinary-devs/skills`, Cloudinary React SDK
- [cloudinary-transformations](.agents/skills/cloudinary-transformations/): `cloudinary-devs/skills`, transformation URLs
- [conventional-commit](.agents/skills/conventional-commit/): `github/awesome-copilot`, authoring conventional commit messages
- [create-auth](.agents/skills/create-auth/): `better-auth/skills`, scaffolding auth flows
- [deploy-to-vercel](.agents/skills/deploy-to-vercel/): `vercel-labs/agent-skills`, Vercel deploys
- [e2e-testing-patterns](.agents/skills/e2e-testing-patterns/): `wshobson/agents`, E2E suite structure
- [email-and-password-best-practices](.agents/skills/email-and-password-best-practices/): `better-auth/skills`, verification, resets, password policy
- [frontend-design](.agents/skills/frontend-design/): `anthropics/skills`, art direction and interface writing for any UI generation
- [neon](.agents/skills/neon/): `neondatabase/agent-skills`, Neon platform operations
- [neon-postgres](.agents/skills/neon-postgres/): `neondatabase/agent-skills`, Neon Postgres usage
- [neon-postgres-branches](.agents/skills/neon-postgres-branches/): `neondatabase/agent-skills`, database branches per environment
- [nextjs-app-router-patterns](.agents/skills/nextjs-app-router-patterns/): `wshobson/agents`, App Router layout and data fetching
- [nodejs-backend-patterns](.agents/skills/nodejs-backend-patterns/): `wshobson/agents`, Node and Express backend patterns
- [observability-and-instrumentation](.agents/skills/observability-and-instrumentation/): `addyosmani/agent-skills`, instrumentation for the API
- [organization-best-practices](.agents/skills/organization-best-practices/): `better-auth/skills`, orgs, members, RBAC
- [playwright-best-practices](.agents/skills/playwright-best-practices/): `currents-dev/playwright-best-practices-skill`, stable selectors, less flake
- [playwright-cli](.agents/skills/playwright-cli/): `microsoft/playwright-cli`, official Playwright CLI
- [postgresql-optimization](.agents/skills/postgresql-optimization/): `github/awesome-copilot`, Postgres features incl. full text search
- [prisma-cli](.agents/skills/prisma-cli/): `prisma/skills`, Prisma CLI and migrations
- [prisma-client-api](.agents/skills/prisma-client-api/): `prisma/skills`, Prisma Client queries
- [prisma-driver-adapter-implementation](.agents/skills/prisma-driver-adapter-implementation/): `prisma/skills`, Prisma 7 driver adapters (`@prisma/adapter-pg`)
- [prisma-orm-setup](.agents/skills/prisma-orm-setup/): `prisma/skills`, Prisma setup and config
- [prisma-upgrade-v7](.agents/skills/prisma-upgrade-v7/): `prisma/skills`, v6 to v7 breaking changes
- [react-hook-form](.agents/skills/react-hook-form/): `pproenca/dot-skills`, React Hook Form performance, patterns, and the v7 render prop components
- [sentry-create-alert](.agents/skills/sentry-create-alert/): `getsentry/sentry-agent-skills`, Sentry alert setup
- [sentry-fix-issues](.agents/skills/sentry-fix-issues/): `getsentry/sentry-agent-skills`, triage and fix captured issues
- [sentry-nextjs-sdk](.agents/skills/sentry-nextjs-sdk/): `getsentry/sentry-agent-skills`, `@sentry/nextjs` setup
- [sentry-react-sdk](.agents/skills/sentry-react-sdk/): `getsentry/sentry-agent-skills`, Sentry React SDK
- [shadcn](.agents/skills/shadcn/): `shadcn-ui/ui`, shadcn components
- [shared-tooling-eslint-prettier](.agents/skills/shared-tooling-eslint-prettier/): `agents-inc/skills`, ESLint 9 flat config and Prettier v3 shared setup for TS projects
- [suggest-lucide-icons](.agents/skills/suggest-lucide-icons/): `nweii/agent-stuff`, pick Lucide icons for a concept or UI element
- [tailwind-design-system](.agents/skills/tailwind-design-system/): `wshobson/agents`, Tailwind tokens and design system
- [tailwind-v4-shadcn](.agents/skills/tailwind-v4-shadcn/): `secondsky/claude-skills`, Tailwind 4 with shadcn
- [two-factor-authentication-best-practices](.agents/skills/two-factor-authentication-best-practices/): `better-auth/skills`, TOTP, OTP, backup codes
- [upstash-qstash-js](.agents/skills/upstash-qstash-js/): `upstash/skills`, QStash message queue
- [upstash-ratelimit-js](.agents/skills/upstash-ratelimit-js/): `upstash/skills`, rate limiting on Redis
- [upstash-redis-js](.agents/skills/upstash-redis-js/): `upstash/skills`, serverless Redis client
- [vercel-optimize](.agents/skills/vercel-optimize/): `vercel-labs/agent-skills`, Vercel cost and perf tuning
- [vercel-react-best-practices](.agents/skills/vercel-react-best-practices/): `vercel-labs/agent-skills`, React and Next.js performance
- [vercel-react-view-transitions](.agents/skills/vercel-react-view-transitions/): `vercel-labs/agent-skills`, View Transitions
- [vitest](.agents/skills/vitest/): `antfu/skills`, Vitest testing
- [zod](.agents/skills/zod/): `pproenca/dot-skills`, Zod schema validation

MCP servers: Neon (recommended), Brevo (recommended), Sentry (recommended), Cloudinary (recommended) — picked, not yet connected.

## Context files

- [client/AGENTS.md](client/AGENTS.md): Next.js agent rules block, regenerated by `next dev`, leave it as it is

_Drafted by /audit from the repo, worth a quick human pass. Edit freely: once a line stops matching this draft, later runs treat it as curated and will flag rather than overwrite it._
