# Deploy

One repository, two apps. Vercel runs the web app (`client/`), Render runs the API (`backend/`), Neon holds the database. The browser only ever talks to the web app: Next.js rewrites `/api/*` to the API, so session cookies stay first party.

## Local development

Node 20 or newer. The Better Auth schema CLI (`npx auth generate`) wants Node 22.

```bash
# API on port 4000
cd backend
cp .env.example .env      # fill in the Neon URLs and a secret: openssl rand -base64 32
npm install
npm run db:migrate        # applies prisma/migrations
npm run seed              # creates the first accounts
npm run dev

# Web app on port 3000, in a second terminal
cd client
cp .env.example .env.local
npm install
npm run dev
```

Open http://localhost:3000. Requests to `/api/*` reach the API on port 4000 through the rewrite.

Useful commands in `backend/`: `npm run typecheck`, `npm run build`, `npm run db:studio`, `npm run db:deploy` (apply migrations without creating one).

## Environment variables

### Vercel (client)

| Name | Value | Why |
|---|---|---|
| `API_ORIGIN` | `https://<your-api>.onrender.com` | The API's base address. The rewrite in `next.config.ts` sends `/api/*` here. Local default is `http://localhost:4000`. |

No `vercel.json` is needed: Vercel detects Next.js. Set the Root Directory to `client` in the project settings.

### Render (backend)

Described by `render.yaml` at the repository root. The build command runs `prisma generate`, `tsc`, then `prisma migrate deploy`.

| Name | Value | Why |
|---|---|---|
| `DATABASE_URL` | Neon pooled string (host contains `-pooler`) | The app's database connections. |
| `DATABASE_URL_UNPOOLED` | Neon direct string (no `-pooler`) | Migrations only. Pooling breaks migration tooling in ways that never say "pooling". |
| `BETTER_AUTH_SECRET` | 32+ random characters | Signs session cookies. `render.yaml` generates one for you. |
| `BETTER_AUTH_URL` | The Vercel app URL, e.g. `https://your-app.vercel.app` | The address the browser talks to, so origin checks and links match. |
| `PORT` | Set by Render | The app binds to whatever is here. |
| `NODE_ENV` | `production` | Turns on secure cookies. |
| `LOG_LEVEL` | `info` (optional) | pino log level. Logs are JSON on stdout, which Render captures. |

Keep it on the paid Starter tier: the free tier sleeps, which would silently stop scheduled reminders when those arrive.

### Not used yet

These are named by the stack decision and arrive with their own features, so leave them unset for now: `EMAIL_FROM` and `APP_URL` (Brevo, with tasks and reminders), Upstash Redis variables (background jobs), Cloudinary credentials (file attachments), `SENTRY_AUTH_TOKEN` and the Sentry DSN (error tracking).

## First deploy

1. Push the repository to GitHub (the `origin` remote already points there).
2. **Render**: create a service from Blueprint, point it at this repository. `render.yaml` supplies the API service; fill in the `sync: false` variables by hand.
3. **Vercel**: import the repository, set Root Directory to `client`, add `API_ORIGIN`.
4. Set `BETTER_AUTH_URL` on Render to the Vercel URL, then redeploy the API so origin checks match.
5. Seed the first accounts once against the production database: copy production `DATABASE_URL` into `backend/.env` locally and run `npm run seed`.

## Costs worth knowing

- Vercel's free Hobby plan forbids commercial use, and an internal company tool may count as one. Budget for Vercel Pro (about 20 dollars a month) or confirm the terms.
- Render Starter (about 7 dollars a month) is effectively required for the reason above.
- Neon, Upstash and Sentry all have free tiers that cover the start.
