# Verify: Stack & architecture · spec 0001 · updated 2026-10-09

_Steps derived from spec 0001 and the feature's Done when. `/check verify` runs these; `/test` locks the durable ones._

Acceptance criteria, taken from the scope's Done when:

- AC-1 both apps run locally against Neon with migrations applied
- AC-2 Better Auth sign in works through the proxy
- AC-3 the first deploy targets Vercel and Render with the environment variables documented

## UI / manual

- [x] Open http://localhost:3000, then http://localhost:3000/api/v1/health in the browser → the health JSON comes back from the web app's own origin → AC-1, AC-2

## Commands

- [x] `cd backend && npm run dev` → log line `"msg":"api listening"` with port 4000 → AC-1
- [x] `cd client && npm run dev` → `Ready` on http://localhost:3000 → AC-1
- [x] `curl http://localhost:4000/api/v1/health` → `{"status":"ok","database":"up"}` → API reaches Neon on its own → AC-1
- [x] `curl http://localhost:3000/api/v1/health` → `{"status":"ok","database":"up"}` → the rewrite proxies to the API → AC-1
- [x] `psql "$DATABASE_URL_UNPOOLED" -c '\dt'` → `user`, `session`, `account`, `verification`, `_prisma_migrations` → migration applied and schema live → AC-1
- [x] `cd backend && npm run seed` → `created` or `exists` for both accounts → AC-2
- [x] `curl -X POST http://localhost:3000/api/auth/sign-in/email -H 'Content-Type: application/json' -H 'Origin: http://localhost:3000' -d '{"email":"pa@example.com","password":"<SEED_PASSWORD>"}' -c cookies.txt` → HTTP 200, `set-cookie: better-auth.session_token=...; HttpOnly; SameSite=Lax`, user JSON → AC-2
- [x] `curl -b cookies.txt http://localhost:3000/api/auth/get-session` → session JSON for `pa@example.com` → cookie is usable on the web app's own origin → AC-2
- [x] `curl http://localhost:3000/api/v1/nope` → HTTP 404 → unknown API routes do not fall through to the web app → AC-2
- [x] `cd backend && npm run typecheck` → passes → AC-1
- [x] `cd backend && npm run build && PORT=4100 node dist/index.js` → `api listening`, health returns ok → production API build runs → AC-3
- [x] `cd client && npm run build` → build finishes → production web build runs → AC-3
- [ ] `test -f render.yaml && grep -q 'prisma migrate deploy' render.yaml` → Render build applies migrations → AC-3
- [x] `test -f docs/deploy.md && test -f backend/.env.example && test -f client/.env.example` → environment variables documented → AC-3
- [x] `git -C . check-ignore backend/.env client/.env.local` → both ignored → secrets stay out of the repo → AC-3

## Acceptance-criteria coverage

- AC-1 covered by the boot, health, proxy and migration steps above
- AC-2 covered by the seed, sign in, get session and 404 steps
- AC-3 covered by the build, `render.yaml`, deploy doc and ignore checks

## Known edges worth varying

- Change `SEED_PASSWORD` or use `ceo@example.com` and repeat the sign in step, so a wrong or missing credential path is exercised, not just the happy one.
- Stop the API and repeat `curl http://localhost:3000/api/v1/health` → expect a 500 rather than a silent hang, which shows the proxy fails loudly when the API is down.
