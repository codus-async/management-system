# CEO PA Management System

## Stack

- **Language / Runtime**: TypeScript, Node 20
- **Framework**: Next.js 16 (App Router, React 19) in `client/`; Express 5 in `backend/`
- **Key dependencies**: Prisma 7 on Postgres (Neon), Better Auth, Zod, Tailwind CSS 4 + shadcn/ui, pino
- **Package manager**: npm (no workspaces; `client/` and `backend/` install separately)

## Build approach

Tracer Bullet (one thin real path through every layer first, then thicken one segment at a time).

## Commands

```bash
# Install (run once in client/ and once in backend/)
npm install

# Dev: client on 3000, backend on 4000, Next rewrites /api/* to the backend
npm run dev

# Build and start (same scripts in both apps)
npm run build && npm run start

# Backend only
npm run typecheck      # tsc --noEmit
npm test               # vitest run
npm run db:migrate     # prisma migrate dev
npm run seed           # first accounts

# Client only
npm run lint           # eslint
```

## Specs

Stored in `docs/specs/`. Format: `docs/specs/NNNN-title.md`.

## Rules

- Clean Architecture: four layers (domain, application, infrastructure, presentation); outer layers depend on inner ones, never the reverse; domain has zero external imports.
- Use cases are thin orchestrators; infrastructure implements interfaces defined by domain or application (dependency inversion); no framework or ORM code inside `domain/` or `application/`.
- Entities are plain objects with no ORM decorators and enforce their own invariants; cross boundary communication uses DTOs or plain objects, no domain entities leak into the presentation layer.
- Tests: domain and application layers unit tested with no infrastructure mocks; infrastructure integration tested against real systems (Vitest + supertest, Playwright for browser tests).
- Folder by feature for new code; the scaffolded `routes/`/`lib/`/`config/` layout in `backend/` stays as it is.
- Before every commit: lint, format, typecheck; the pre-commit hook blocks the commit when one fails.
- Test gate before a feature is done: unit plus integration; browser tests come with the features that need them.
- CI on push: lint, typecheck, test on GitHub.
- General craft: consistent error handling, consistent naming, documented public APIs, conventional commit messages, named exports only, DRY, YAGNI, reusability, modularity, performance first, accessibility baseline (WCAG AA).
- server components for all root pages in client/
- separation of concerns (hooks hold logic, data holds data, components render view)
- file strictly under 600 lines
- comments only when necessary and single line only

## Git

- integration: on
- branch prefix: feat/, fix/, chore/
- commit: per-milestone

## Agent skills

Load only the ones the current task needs.

- [api-and-interface-design](.agents/skills/api-and-interface-design/): `addyosmani/agent-skills`, API surface and interface design
- [api-design-principles](.agents/skills/api-design-principles/): `wshobson/agents`, REST API design
- [better-auth-best-practices](.agents/skills/better-auth-best-practices/): `better-auth/skills`, Better Auth config, adapters, sessions
- [better-auth-security-best-practices](.agents/skills/better-auth-security-best-practices/): `better-auth/skills`, auth secrets, CSRF, trusted origins, audit logging
- [bullmq-specialist](.agents/skills/bullmq-specialist/): `sickn33/agentic-awesome-skills`, BullMQ job queues
- [cloudinary-docs](.agents/skills/cloudinary-docs/): `cloudinary-devs/skills`, Cloudinary documentation
- [cloudinary-next](.agents/skills/cloudinary-next/): `cloudinary-devs/skills`, Cloudinary with Next.js
- [cloudinary-react](.agents/skills/cloudinary-react/): `cloudinary-devs/skills`, Cloudinary React SDK
- [cloudinary-transformations](.agents/skills/cloudinary-transformations/): `cloudinary-devs/skills`, transformation URLs
- [create-auth](.agents/skills/create-auth/): `better-auth/skills`, scaffolding auth flows
- [deploy-to-vercel](.agents/skills/deploy-to-vercel/): `vercel-labs/agent-skills`, Vercel deploys
- [e2e-testing-patterns](.agents/skills/e2e-testing-patterns/): `wshobson/agents`, E2E suite structure
- [email-and-password-best-practices](.agents/skills/email-and-password-best-practices/): `better-auth/skills`, verification, resets, password policy
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
- [sentry-create-alert](.agents/skills/sentry-create-alert/): `getsentry/sentry-agent-skills`, Sentry alert setup
- [sentry-fix-issues](.agents/skills/sentry-fix-issues/): `getsentry/sentry-agent-skills`, triage and fix captured issues
- [sentry-nextjs-sdk](.agents/skills/sentry-nextjs-sdk/): `getsentry/sentry-agent-skills`, `@sentry/nextjs` setup
- [sentry-react-sdk](.agents/skills/sentry-react-sdk/): `getsentry/sentry-agent-skills`, Sentry React SDK
- [shadcn](.agents/skills/shadcn/): `shadcn-ui/ui`, shadcn components
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
