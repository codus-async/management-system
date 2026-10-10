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

- [x] `psql "$DATABASE_URL_UNPOOLED" -c '\dt'` → auth tables plus Meeting, MeetingAttendee, Contact, Task, FollowUp, PendingDecision, Attachment, Notification, Activity → AC-1
- [x] `psql "$DATABASE_URL_UNPOOLED" -c '\d "user"'` → role text NOT NULL DEFAULT 'PA' with user_role_check limiting it to PA or CEO → AC-1, AC-4
- [x] `psql "$DATABASE_URL_UNPOOLED" -c 'SELECT email, role FROM "user" ORDER BY role'` → exactly one PA and one CEO, every row carries a role → AC-4
- [x] `psql "$DATABASE_URL_UNPOOLED" -c '\d "MeetingAttendee"'` → no id column, primary key on (meetingId, contactId) → AC-3
- [x] `psql "$DATABASE_URL_UNPOOLED" -c '\d "Meeting"'` → startsAt and endsAt are timestamp without time zone, deletedAt nullable, createdById NOT NULL → AC-2, AC-7, AC-9
- [x] `psql "$DATABASE_URL_UNPOOLED" -c "SELECT table_name FROM information_schema.columns WHERE column_name='deletedAt' AND table_schema='public' ORDER BY 1"` → Meeting, Contact, Task, FollowUp, PendingDecision and nothing else → AC-2
- [x] `psql "$DATABASE_URL_UNPOOLED" -c "SELECT tablename, indexname FROM pg_indexes WHERE schemaname='public' ORDER BY 1"` → indexes on Meeting(startsAt), Task(status, dueAt), FollowUp(dueAt), PendingDecision(status, dueAt), Contact(name), Notification(userId, readAt), Attachment(parentType, parentId), Activity(entityType, entityId) → AC-6
- [x] `psql "$DATABASE_URL_UNPOOLED" -c "\d \"Task\""` → assigneeId and createdById NO ACTION (Restrict) on User, relatedContactId and relatedMeetingId SET NULL → AC-9
- [x] `psql "$DATABASE_URL_UNPOOLED" -c "\d \"Activity\""` → actorId SET NULL is absent, it is NO ACTION, and payload is jsonb → AC-9

## Commands

- [x] `npm --prefix backend run db:migrate` → "Already in sync, no schema change or pending migration was found", no new migration file → AC-1
- [x] `npm --prefix backend run seed` → `exists PA pa@example.com`, then `repaired ceo@example.com role -> CEO` on a stale row, then one PA and one CEO → AC-4
- [x] `npm --prefix backend run seed` again → both lines say `exists`, user count stays at 2 → AC-4
- [x] `npm --prefix backend test` → 12 files, 67 tests pass, including the fresh database suite that migrates into a scratch schema → AC-1, AC-3, AC-4, AC-5
- [x] `npm --prefix backend test -- src/lib/timezone.test.ts` → 5 pass, the four zone tests stub their own zone (UTC, Africa/Lagos, America/New_York, Pacific/Kiritimati) → AC-7
- [x] `npm --prefix backend test -- src/config/env.test.ts` → 7 pass, TIMEZONE unset defaults to UTC in a spawned child, Africa/Lagos accepted, Not/AZone rejected → AC-7
- [x] `cd backend && TIMEZONE=Not/AZone npx tsx src/index.ts` → exit 1, prints `TIMEZONE: must be a valid IANA time zone`, never prints the listening line → AC-7
- [x] `npm run verify` → exit 0, prettier clean, both lints clean, both typechecks clean → conventions

## Value sourcing, one step each

- [x] New domain row id: created a meeting through the repository helper (scratch script in /tmp, then removed) → id `dfb362da-a74e-4aa1-a4c6-d12dcaffc273`, matched the UUID v4 pattern → AC-3
- [x] Meeting wall clock: wrote startsAt as 2026-10-10T23:30:00.000Z, read it back identical, and psql showed the stored value as `2026-10-10 23:30:00` with no offset, so the column is naive wall clock → AC-7
- [x] createdById: the PA user id `oKtjtNpCnx7KXb0fCIYpcd5niks6RlvB` appeared on the meeting and matched the actor → AC-9
- [x] Activity actor: two rows for the meeting, action `created` with the full after payload, then action `updated` with before and after holding only the changed title key, both with actorId set → AC-3, AC-9
- [x] Status tokens: a raw insert of status `archived` on Task was accepted by the database (rolled back), and the same write through the repository was rejected with `status must be one of open, in_progress, done, cancelled` → AC-5
- [x] Invalid TIMEZONE: the config fail step above, plus a raw insert of role `ROOT` was refused live by `user_role_check` → AC-7

## Acceptance-criteria coverage

- AC-1 met: migration listing, role column and check constraint, clean re migrate
- AC-2 met: deletedAt present on exactly the five specced tables
- AC-3 met: MeetingAttendee composite key with no id column, UUID v4 from the repository helper
- AC-4 met: one PA and one CEO after the seed, idempotent second run, live refusal of a role outside the pair
- AC-5 met: constants module rejects `archived` while the database accepts it, defaults match the sketch
- AC-6 met: all eight indexes present
- AC-7 met: UTC default proven in a spawned child, zone math proven per zone, config refuses a bad zone with exit 1, naive wall clock proven at the column
- AC-8 met by design: the reserved columns checklist in index.md is the evidence, nothing to run here
- AC-9 met: createdById on all five specced tables, actorId Restrict, and a live delete of a referenced user was refused
- AC-10 met as convention only: no product read crosses a relation yet (grep of backend/src finds no find or aggregate call on the domain tables), so there is no surface to violate the rule. The convention sits in the one line comment at the top of backend/src/lib/prisma.ts. The first feature that reads across a relation must prove the parent filter, then the step here should be replaced with a live check.

## Known edges worth varying

- [x] Restrict on a referenced user: inside one transaction insert a Meeting whose createdById is the PA user, then `DELETE FROM "user" WHERE email = 'pa@example.com'` → Postgres refuses with `violates RESTRICT setting of foreign key constraint "Meeting_createdById_fkey"`. Note the bare delete with no referencing rows succeeds, so this step needs the meeting row first (rolled back in the run above) → AC-9
- [x] Set TIMEZONE=America/New_York and repeat the helper tests → the four zone tests still pass because each stubs its own zone, and the one test that reads the ambient process env (`falls back to UTC when TIMEZONE is unset`) fails with `expected 'Africa/Lagos' to be 'UTC'`. That is the proof the helper reads the env var rather than a fixed zone. Follow up for `/test`: that single assertion in `backend/src/lib/timezone.test.ts` depends on the test process having no TIMEZONE exported, so a developer or CI that exports TIMEZONE sees one red test while the product is fine. `backend/src/config/env.test.ts` already does this correctly by deleting TIMEZONE in a spawned child → AC-7
- [x] Insert a MeetingAttendee row with a roleLabel of `optional` and then `mandatory` in one transaction → the database stored both, because only User.role is check constrained; the constants module is what bounds the set (rolled back in the run above) → AC-5
