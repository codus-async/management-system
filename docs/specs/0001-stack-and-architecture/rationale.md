# 0001. Stack and architecture: reasoning

## Context

> ⚠️ Premise note: BullMQ on Redis is more machinery than two users of reminders strictly need. An in process scheduler reading due times straight from the database would remove Upstash and the queue operational surface entirely, and at this scale nothing would notice. That is the premature optimisation pattern: infrastructure bought before a measured problem exists. The engineer chose BullMQ deliberately during the walk, so the decision stands. The cost is recorded under Consequences in [index.md](index.md): one more account, plus jobs that must be safe to retry so a reminder never sends twice.

The product is an internal web tool for a CEO and their personal assistant: schedule, meetings, tasks, reminders, contacts, follow ups, and daily briefings, with a dashboard. Two to five daily users, no deadline, but real daily reliance: a missed meeting or a lost contact is a visible failure. The data is private (a CEO's schedule and personal contact details), though nothing here is formally regulated (no payments, no health data, no children's data).

What already exists: a Next.js 16 client scaffold in `client/` (React 19, Tailwind 4, ESLint 9) and an Express 5 backend scaffold in `backend/` that does not boot yet (its dev script points at a missing file). TypeScript is used on both sides, npm manages packages. The scope records a Tracer Bullet build approach: thin real paths through every layer, thickened slice by slice. There is no root `AGENTS.md` yet, no database, no auth, no hosting choice, and no git repository at the root.

The forces that shaped this decision: keep operations light for a small team that has no infrastructure function; prefer boring, proven tools over interesting new ones; keep the monthly floor in single digit dollars until the tool proves itself; keep every layer replaceable later without a rewrite; and reuse what the scaffold already gives rather than churning it. The consequence of not deciding: every feature slice would invent its own data access, its own session handling, and its own glue, which is exactly how a two app project turns into a tangle by slice five.

## Options considered

### Option 1: Managed piecemeal stack (chosen)

Two scaffolded apps kept as they are. Postgres on Neon reached through Prisma. Better Auth for sign in, sessions in your own database. Vercel hosts the web app, Render hosts the API, Upstash hosts Redis for BullMQ jobs, Brevo sends email, Cloudinary stores files, Sentry collects errors, Postgres full text handles search, Zod validates input, Vitest and Playwright test it.

**Pros**:
- Reuses the existing scaffolds; nothing already built is thrown away.
- Every layer is a proven tool with current docs, and free tiers cover the early period.
- Each service is swappable on its own (change email provider without touching auth).

**Cons**:
- Seven external accounts to create and secure; two deployables to coordinate.
- More moving parts than a single host setup; cross service failures need Sentry to see them at all.

### Option 2: One Next.js app, one host, SQLite

Drop the Express scaffold. Put API endpoints in Next.js route handlers, use SQLite (a database that is a single file on the host) and in process scheduling, run it all on one Railway project.

**Pros**:
- One deploy, one host, one bill; the simplest possible operations story.
- No CORS, no cross origin cookies, no second release.

**Cons**:
- Throws away the backend scaffold and the API surface the scope already assumes.
- SQLite and local files tie you to one machine, making backups and moves manual.
- Jobs and file work live inside the web app process, mixing product code with infrastructure.

### Option 3: Everything on one small server with Docker Compose

Both apps, Postgres, and Redis in containers on one virtual private server (about 4 to 6 dollars a month flat). Full control, no platform lock in.

**Pros**:
- Cheapest flat cost and complete control over versions and backups.
- One machine, so data and files are trivially backed up together.

**Cons**:
- You own security patches, certificate renewal, backups, and recovery drills, forever.
- No preview environments; every experiment runs on the production box.
- The operational burden lands on exactly the people who should be building the product.

### Option 4: Supabase centered platform

Next.js on Vercel plus Supabase for Postgres, auth, storage, and realtime in one platform. Fewer accounts, one dashboard.

**Pros**:
- One vendor covers database, auth, and storage with a generous free tier.
- Built in admin panel for looking at rows while debugging.

**Cons**:
- The engineer already chose Better Auth (identities in your own database) and Cloudinary, so most of Supabase's value would go unused.
- Auth and storage choices couple to one vendor's platform primitives, which is harder to unwind than separate small services.

## Rationale

Option 1 wins because it honors what already exists and what the engineer chose, layer by layer, while following the boring technology practice at every step: Postgres over any exotic store, a proven auth library over hand rolled sessions, REST over any fancier contract, the database's own search over a search engine. The scaffold is the strongest force in the room: two runnable apps already exist, the scope enrolls them, and Tracer Bullet wants a thin real thread through real layers, not a rewrite of the layers first. Where the engineer's pick differed from my recommendation (Postgres over SQLite, Prisma over Drizzle, BullMQ over an in process scheduler, Vercel plus Render over a single host, Brevo and Cloudinary over my listed options), I recorded their choice and the honest cost rather than arguing; each is a reasonable position, and the Consequences section keeps the prices visible (basis: your picks in this design conversation).

The split hosting (Vercel plus Render) is the one choice that needs a rule attached, so the spec settles the access pattern itself: the browser only ever calls the web app's own address, and a Next.js rewrite forwards `/api/*` to the API host. That keeps session cookies first party (set by a site you are actually visiting, not a third party) and removes CORS (the browser rule that blocks calls to other origins) from the design entirely. Without that rule, Better Auth's cookie would have to travel cross site with relaxed browser protections, which is a classic source of mysterious sign out bugs.

Scale expectations stay honest: two to five users, private data, daily use. Nothing here is sized for thousands of users, and nothing blocks getting there later (Postgres, Prisma, and both hosts scale far beyond this). Premature scaling was refused in both directions: no microservices, no multi region, no cache, no dedicated search engine, and equally no cutting corners on auth, error tracking, or a relational database, which are the places small tools usually bleed later.

## References

**Project sources** (verifiable, in this repo):
- Your answers in the design conversation of 2026-10-09 (database, hosting, queue, email, storage, and repo layout picks).
- The existing scaffolds: `client/` (Next.js 16, React 19, Tailwind 4, ESLint 9) and `backend/` (Express 5, tsx, TypeScript).
- The scope header in `docs/scope/scope.md`: Tracer Bullet build approach, Beta workflow.
- Installed community skills under `.agents/skills/`: `prisma/*`, `better-auth/*`, `neondatabase/*`, `cloudinary-devs/*`, `shadcn-ui/ui`.

**Practices & standards**:
- Boring and proven technology over new and exciting, every time.
- Monolith first: two apps (web and API) is a standard split, not a service architecture; extract nothing further.
- Never roll your own authentication; use a proven library or service.
- Database full text search before a dedicated search engine.
- Structured logging and error tracking from day one, not after the first outage.

**Links** (web verified in the landscape check of 2026-10-09):
- Better Auth: https://www.better-auth.com
- WorkOS comparison of WorkOS, Better Auth, and Clerk: https://workos.com/blog/workos-vs-betterauth-vs-clerk
- Prisma on where to host a TypeScript stack with Postgres: https://www.prisma.io/blog/where-to-host-typescript-frontend-node-api-postgres
- Drizzle ORM (runner up data layer): https://drizzle.dev
- Railway pricing (runner up host): https://railway.com/pricing
- Resend pricing (runner up email): https://resend.com/pricing
- Sentry pricing: https://sentry.io/pricing/
- Cloudflare R2 pricing (runner up storage): https://developers.cloudflare.com/r2/pricing

## Landscape scan (evidence, 2026-10-09)

Notes captured by the read only web check during the design conversation. Freshness matters in this category; recheck before any layer is reopened.

- **Data layer**: Drizzle actively maintained (v0.45.x stable, v1 release candidate in flight, team hired by PlanetScale in March 2026). Prisma 7 dropped the Rust engine, shipping a pure TypeScript client. Hosted Postgres free tiers (Neon, and Prisma's hosted option) are the current norm for small TypeScript apps.
- **Auth**: Better Auth (MIT, sessions in your own database) absorbed Auth.js in September 2025 and announced a move to Vercel in 2026; an optional hosted dashboard exists but is not required. Clerk repriced in February 2026 (free to 50,000 monthly active users, Pro at 25 dollars a month). WorkOS and Auth0 sit at enterprise pricing, overkill here.
- **Hosting**: Railway (Hobby, 5 dollars usage included) and Render (Starter, 7 dollars a month flat) both run long lived containers; Render's free tier sleeps after inactivity and its free database expires. Vercel is serverless only, which is why the Express API needs its own host. Fly.io has no free tier since 2024.
- **Email**: Resend (3,000 a month free forever) leads on developer experience; Postmark's free tier is only 100 a month (test level); AWS SES new accounts default to the Essentials plan (0.16 dollars per 1,000) since July 2026; SendGrid has no permanent free tier. Brevo was the engineer's own pick and was not part of this scan.
- **Errors and storage**: Sentry's free developer plan now allows one seat (5,000 errors a month); a team seat is 26 dollars a month. GlitchTip (self hosted, Sentry compatible) and Axiom (logs) are current alternatives. Cloudflare R2: 10GB free, zero egress cost; S3 costs more per gigabyte plus egress.
