# Verify: Domain data model · spec 0002 · updated 2026-10-10

_Steps derived from spec 0002 and the feature's Value sourcing table. `/check verify` runs these; `/test` locks the durable ones._

Acceptance criteria, taken from the spec's Requirements:

- AC-1 one migration creates the nine tables plus User.role (default "PA", check constrained), backfills existing users to PA, applies cleanly on a fresh database with the auth tables intact
- AC-2 deletedAt on Meeting, Task, Contact, FollowUp, PendingDecision; not on User, MeetingAttendee, Attachment, Notification, Activity
- AC-3 String UUID v4 ids from one repository create helper, no database id default, MeetingAttendee composite primary key (meetingId, contactId)
- AC-4 role PA or CEO, default PA, Better Auth input disabled, seed keys on role and stays idempotent
- AC-5 status, priority, action, parent type, role label, entity type are plain strings validated by one constants module, schema defaults match
- AC-6 the eight named indexes exist
- AC-7 TIMEZONE env var (IANA, UTC default, config fails on a bad value), naive local wall clock times, startOfDay and endOfDay in one helper, null dueAt means unscheduled
- AC-8 the reserved columns checklist holds so no later slice needs a breaking migration (a design claim, not a runnable step)
- AC-9 createdById on Meeting, Contact, Task, FollowUp, PendingDecision pointing at User; Activity.actorId Restrict
- AC-10 soft-deleted parents never appear as live rows in a read that crosses a relation

## UI / manual

None. This feature ships no UI and no API surface. The database checks below are the observable surfaces.

## Database

- [ ] `psql "$DATABASE_URL_UNPOOLED" -c '\dt'` → auth tables plus Meeting, MeetingAttendee, Contact, Task, FollowUp, PendingDecision, Attachment, Notification, Activity → AC-1
- [ ] `psql "$DATABASE_URL_UNPOOLED" -c '\d "user"'` → role text NOT NULL DEFAULT 'PA' with user_role_check limiting it to PA or CEO → AC-1, AC-4
- [ ] `psql "$DATABASE_URL_UNPOOLED" -c 'SELECT email, role FROM "user" ORDER BY role'` → exactly one PA and one CEO, every row carries a role → AC-4
- [ ] `psql "$DATABASE_URL_UNPOOLED" -c '\d "MeetingAttendee"'` → no id column, primary key on (meetingId, contactId) → AC-3
- [ ] `psql "$DATABASE_URL_UNPOOLED" -c '\d "Meeting"'` → startsAt and endsAt are timestamp without time zone, deletedAt nullable, createdById NOT NULL → AC-2, AC-7, AC-9
- [ ] `psql "$DATABASE_URL_UNPOOLED" -c "SELECT table_name FROM information_schema.columns WHERE column_name='deletedAt' AND table_schema='public' ORDER BY 1"` → Meeting, Contact, Task, FollowUp, PendingDecision and nothing else → AC-2
- [ ] `psql "$DATABASE_URL_UNPOOLED" -c "SELECT tablename, indexname FROM pg_indexes WHERE schemaname='public' ORDER BY 1"` → indexes on Meeting(startsAt), Task(status, dueAt), FollowUp(dueAt), PendingDecision(status, dueAt), Contact(name), Notification(userId, readAt), Attachment(parentType, parentId), Activity(entityType, entityId) → AC-6
- [ ] `psql "$DATABASE_URL_UNPOOLED" -c "\d \"Task\""` → assigneeId and createdById NO ACTION (Restrict) on User, relatedContactId and relatedMeetingId SET NULL → AC-9
- [ ] `psql "$DATABASE_URL_UNPOOLED" -c "\d \"Activity\""` → actorId SET NULL is absent, it is NO ACTION, and payload is jsonb → AC-9

## Commands

- [ ] `npm --prefix backend run db:migrate` → "No schema changes were found", no new migration file → AC-1
- [ ] `npm --prefix backend run seed` → `created` or `exists` for one PA and one CEO → AC-4
- [ ] `npm --prefix backend run seed` again → both lines say `exists`, no duplicate rows → AC-4
- [ ] `npm --prefix backend test` → 67 tests pass, including the fresh database suite that migrates into a scratch schema → AC-1, AC-3, AC-4, AC-5
- [ ] `npm --prefix backend test -- src/lib/timezone.test.ts` → startOfDay and endOfDay land on local day boundaries for the configured zone → AC-7
- [ ] `npm --prefix backend test -- src/config/env.test.ts` → TIMEZONE unset defaults to UTC, Africa/Lagos accepted, Not/AZone rejected → AC-7
- [ ] `cd backend && TIMEZONE=Not/AZone npx tsx src/index.ts` → the process exits on config load and names TIMEZONE, it does not start → AC-7
- [ ] `npm run verify` → format check, lint, typecheck clean across root, backend and client → conventions

## Value sourcing, one step each

- [ ] New domain row id: create a meeting through the repository helper, then `SELECT id FROM "Meeting" ORDER BY "createdAt" DESC LIMIT 1` → v4 UUID shape, 36 chars with hyphens → AC-3
- [ ] Meeting wall clock: insert a meeting with startsAt set to 23:30 local in the TIMEZONE zone, then read it back through Prisma → the same wall clock comes back, no UTC shift → AC-7
- [ ] createdById: the seed's PA user id appears on rows the repository created with that actor → AC-9
- [ ] Activity actor: `SELECT "actorId", action, payload FROM "Activity" ORDER BY "createdAt" DESC LIMIT 1` → actor is the creating user, payload holds only changed keys on an update → AC-3, AC-9
- [ ] Status tokens: `psql "$DATABASE_URL_UNPOOLED" -c "INSERT INTO \"Task\" (id, title, status, priority, \"assigneeId\", \"createdById\", \"createdAt\", \"updatedAt\") VALUES (gen_random_uuid(), 'x', 'archived', 'medium', (SELECT id FROM \"user\" LIMIT 1), (SELECT id FROM \"user\" LIMIT 1), now(), now())"` → the database accepts it, which proves the set lives only in the constants module; the repository path rejects the same write → AC-5
- [ ] Invalid TIMEZONE: the config fail step above → AC-7

## Acceptance-criteria coverage

- AC-1 covered by the migration listing, the role column check, and the clean re migrate step
- AC-2 covered by the deletedAt presence check
- AC-3 covered by the MeetingAttendee structure check and the UUID assertions in the test suite
- AC-4 covered by the one user per role query and the double seed
- AC-5 covered by the repository rejection test and the value sourcing insert above
- AC-6 covered by the index listing
- AC-7 covered by the two timezone test steps and the config fail step
- AC-8 is a design claim: the reserved columns checklist in index.md is the evidence, nothing to run here
- AC-9 covered by the createdById and foreign key rule checks
- AC-10 has no API to drive yet; it is recorded as a convention in backend/src/lib/prisma.ts and the first feature that reads across a relation must prove the parent filter, then a step here should replace this line

## Known edges worth varying

- Try `psql "$DATABASE_URL_UNPOOLED" -c 'DELETE FROM "user" LIMIT 1'` → Postgres refuses because createdById and assigneeId are Restrict, which is the rule freezing row deletion for now → AC-9
- Set TIMEZONE=America/New_York and repeat the startOfDay test → boundaries move a day off the Lagos expectation, which shows the helper reads the env var rather than hardcoding a zone → AC-7
- Insert a MeetingAttendee row with a roleLabel of "optional" and then "mandatory" → the second value is not in the constants set; the database accepts both strings because only User.role is check constrained → AC-5
