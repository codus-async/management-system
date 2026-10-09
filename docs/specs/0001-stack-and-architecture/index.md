# 0001. Stack and architecture

**Date**: 2026-10-09
**Status**: Accepted

## Summary

We will build the CEO PA system as two TypeScript apps: a Next.js web app for the screens and a small Express server for the API (the programming interface the screens call). Data lives in Postgres (the standard relational database) on Neon, reached through Prisma (a typed query layer, meaning your queries are checked by the compiler). Sign in uses Better Auth, a proven auth library that keeps accounts inside your own database. Hosting is split on purpose: Vercel runs the web app, Render runs the API, Upstash Redis handles background jobs (scheduled work such as reminder emails) through BullMQ (a job queue), Brevo sends the emails, Cloudinary stores uploaded files, and Sentry collects errors. Everything is right sized for a two person internal tool that must run dependably every day.

## Decision

**Chosen option**: Option 1: the managed piecemeal stack (Next.js plus Express, Postgres on Neon through Prisma, Better Auth, hosted services per layer).

Keep the two scaffolded apps, fill every open layer with a proven hosted or self hosted tool, and let one product decision at a time pick the exact service (basis: your picks in this design conversation, plus the boring technology practice).

**Implementation skills**: `prisma-client-api` (`prisma/skills`, `.agents/skills/prisma-client-api/`) · `prisma-orm-setup` (`prisma/skills`, `.agents/skills/prisma-orm-setup/`) · `prisma-cli` (`prisma/skills`, `.agents/skills/prisma-cli/`) · `better-auth-best-practices` (`better-auth/skills`, `.agents/skills/better-auth-best-practices/`) · `create-auth` (`better-auth/skills`, `.agents/skills/create-auth/`) · `neon-postgres` (`neondatabase/agent-skills`, `.agents/skills/neon-postgres/`) · `neon-postgres-branches` (`neondatabase/agent-skills`, `.agents/skills/neon-postgres-branches/`) · `cloudinary-next` (`cloudinary-devs/skills`, `.agents/skills/cloudinary-next/`) · `cloudinary-docs` (`cloudinary-devs/skills`, `.agents/skills/cloudinary-docs/`) · `shadcn` (`shadcn-ui/ui`, `.agents/skills/shadcn/`)

## Proposed stack

| Layer | Choice | Reason |
|---|---|---|
| Language | TypeScript | One language across both apps; the scaffold already uses it. |
| Web app | Next.js 16 (App Router) with React 19 | Already scaffolded in `client/`, and Vercel hosts it best. |
| UI styling | Tailwind CSS 4 with shadcn/ui components | Already scaffolded; shadcn components are copied into your repo and owned by you, accessible by default. |
| API | Express 5, REST over JSON, under `/api/v1` | Already scaffolded in `backend/`; plain JSON endpoints are simple to build, test, and read. |
| Primary database | Postgres on Neon, reached through Prisma | Relational data with real relations (meetings link to contacts and tasks); Neon clones a branch of the database per environment for free. |
| Auth | Better Auth, self hosted, email and password, sessions stored in your Postgres | Proven library doing the hard parts (hashing, sessions, resets); identities never leave your systems (basis: installed better-auth skill). |
| Browser to API | Next.js rewrite proxies `/api/*` to the API host | The browser talks to one address only, so session cookies stay first party and cross origin headaches disappear. |
| Background jobs | BullMQ on Upstash Redis | Durable scheduled and retried jobs (reminders, nudges) outside the request path. |
| Email | Brevo transactional API | Your pick; a generous free tier covers reminder volume many times over. |
| File storage | Cloudinary, signed uploads only | Your pick; files live on a delivery network and the API signs each upload, so only your app can write. |
| Search | Postgres full text search | No new service to run; plenty at this data size (basis: database search first practice). |
| Validation | Zod | One schema language at the API boundary and for environment variables. |
| Testing | Vitest for unit and API tests, Playwright for browser tests | Fast TypeScript native tests plus a real browser, matching the Beta workflow. |
| Web hosting | Vercel | First class Next.js hosting with preview deploys. |
| API hosting | Render, Starter tier | Runs the long lived Express process and its job worker; the paid Starter tier keeps it awake. |
| Errors and logs | Sentry plus pino structured logs | Errors with stack traces in one place; structured (machine readable) logs for the rest. |
| Repo layout | One git repo at the root, `client/` and `backend/`, npm | One history for both apps; no workspace tooling needed at this size. |

## Settled mechanics

Decisions the build would otherwise have to invent. Recorded here so `/develop` inherits them.

**Proxy and API**
- The web app reads `API_ORIGIN` (the API's base address) from the environment, and the Next.js config rewrites `/api/*` to it. Local dev: Next on port 3000 rewriting to Express on port 4000. Express owns every path under `/api` (versioned routes at `/api/v1/*`, auth routes at `/api/auth/*`).
- The API being directly reachable on Render is not the security boundary: no permissive cross origin headers are sent, and every API route requires a valid session cookie.

**Auth**
- Better Auth mounts on Express through its Node handler, behind the rewrite. One shared auth config module lives in `backend/`. Environment: `BETTER_AUTH_SECRET`, `BETTER_AUTH_URL`.
- Session cookies use Better Auth's defaults, explicitly enabled: httpOnly, secure in production, SameSite lax, sliding expiry. Express runs with `trust proxy` on. Absolute session expiry stays at the library default for now; revisit if it ever locks the CEO out mid day.
- Roles are a plain domain column on the user record (PA or CEO), enforced in Express middleware. Not Better Auth's role plugin, so the schema stays yours.

**Database**
- Only the API talks to Postgres; the web app gets its data through the API. Prisma uses Neon's pooled connection string with a small pool.
- Migrations: the Render build command runs `prisma generate && prisma migrate deploy`. Local work runs `prisma migrate dev` against a personal Neon branch. The seed script (`npm run seed` in `backend/`) creates the first accounts.

**Jobs**
- The BullMQ worker starts inside the API process at boot, concurrency one, single Render instance.
- Failed jobs are logged and captured by Sentry, never silently dropped; a poison message must not stop reminders with no signal.

**Email**
- `EMAIL_FROM` (a Brevo verified sender) and `APP_URL` (the base address for links inside emails) come from the environment. Templates are TypeScript files in `backend/`.

**Files**
- Uploads: 20 megabyte cap, an allowlist of documents and images, signed by the API with a fixed payload that includes a destination folder. Downloads use Cloudinary's signed delivery URLs directly, never proxied through Vercel, which caps response size.
- Deleting an attachment removes the Cloudinary asset first, then the database row; a sweep script finds orphans when the second step fails.

**Tests**
- Vitest with supertest against the real Express app; the test database is a dedicated Neon branch, or a disposable local Postgres. Playwright config lives at the repo root and its web server mode starts both apps. No continuous integration yet; there is no git remote.

**Errors and logs**
- `@sentry/nextjs` in the web app (source maps uploaded at build time with `SENTRY_AUTH_TOKEN`), `@sentry/node` in the API. pino writes structured logs to standard output, where Render captures them.

## Consequences

**Positive**:
- Every layer is a proven tool with real docs and a real community, so `/develop` solves familiar problems.
- Free tiers cover the start: Neon, Upstash, and Sentry all have one; the monthly floor is roughly the Render Starter price plus whatever the Vercel plan costs.
- Neon database branches give each environment its own copy of the data with no setup.
- The single origin proxy removes a whole class of session cookie and cross origin bugs.

**Negative / tradeoffs**:
- Seven external accounts to create, secure, and keep track of (Vercel, Render, Neon, Upstash, Brevo, Cloudinary, Sentry).
- Two deployables to release together; the web app and the API need coordinated deploys when the API contract changes.
- BullMQ on Redis is more machinery than two users of reminders strictly need; an in process scheduler reading due times from the database would have removed the queue and the Upstash account (the premature optimisation pattern). The cost of keeping it is one more account plus idempotent jobs (a retried job must not send the same reminder twice).
- Vercel's free Hobby plan forbids commercial use, and an internal company tool may count as commercial; budget for Vercel Pro (about 20 dollars a month) or confirm the terms.
- Render's free tier sleeps, which would silently break scheduled reminders, so the paid Starter tier (about 7 dollars a month) is effectively required.

**Neutral**:
- Better Auth brings its own tables (user, session, account, verification) into the Prisma schema; the domain entities (meetings, tasks, contacts, and so on) belong to the data model feature's spec, designed on top of those.
- Files live in Cloudinary, not the database, so deleting an attachment must remove both the database row and the stored asset.
- Timestamps are stored in UTC (the universal time standard) and agenda grouping uses a timezone stored per user.
- Structured logging uses pino on the API; environment variables are validated with Zod at startup, with `.env.example` files committed as the template.

## Follow-up

- [ ] Root `AGENTS.md` does not exist yet. `/audit` should create it with an `## Agent skills` section listing the ten installed skills (paths under `.agents/skills/`), an `MCP servers:` line for Prisma, Neon, and Sentry, and a `Declined:` line for anything passed over.
- [ ] Connect the three MCP servers in your agent: Prisma (`npx prisma mcp` or `mcp.prisma.io/mcp`), Neon (`mcp.neon.tech/mcp`), Sentry (`npx @sentry/mcp-server` or `mcp.sentry.dev/mcp`). Connecting is a config step in your agent, not something this repo can do for you.
- [ ] Brevo: verify a sending domain before the tasks and reminders slice ships; no emails deliver without it.
- [ ] Cloudinary: create the account and a signed upload preset before the file attachments slice.
- [ ] Vercel plan: confirm the Hobby terms for an internal company tool, and budget Pro if needed.
- [ ] Initialize git at the repository root and fold `client/.git` into it, per the repo layout decision (natural first step of the scaffold work).
- [ ] BullMQ on the Upstash free tier: a one hour spike before the tasks and reminders slice, checking command quotas and blocking reads; fallback is the in process poller named in [rationale.md](rationale.md).
- [ ] Backup restore drill: once the first real data exists, restore a Neon branch into a scratch database and confirm the app runs on it.
- [ ] The data model feature's spec designs the domain entities on top of Better Auth's tables; this spec deliberately does not design them.

## Rationale

Reasoning, options considered, and the verified landscape notes: see [rationale.md](rationale.md).
