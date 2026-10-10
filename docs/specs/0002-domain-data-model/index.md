# 0002. Domain data model

**Date**: 2026-10-10
**Status**: Accepted

## Summary

This spec decides the core tables the whole product stores data in: users with roles, meetings, contacts, tasks, follow ups, pending decisions, attachments, notifications, and an activity log for trash. The model is designed once, for every later slice, so those slices can build on it without a breaking migration (a migration that would force rewrites of existing code or loss of data). The database is Postgres through Prisma, already decided in spec 0001, and Better Auth tables already exist; this spec adds the domain tables on top and a role column on User.

The reasoning behind this decision lives in [rationale.md](rationale.md).

## Requirements

**User stories**:
- As the PA, I want one shared set of tables for meetings, tasks, contacts, follow ups, and decisions so that every screen reads the same truth.
- As the CEO, I want my role recorded on my user row so that read only and approval rules can be enforced consistently.
- As the PA, I want deleted items restorable later without losing history, so trash can be added without a breaking migration.

**Acceptance criteria** (the contract, each criterion is IDed and independently checkable):
- **AC-1**: One migration creates Meeting, MeetingAttendee, Contact, Task, FollowUp, PendingDecision, Attachment, Notification, and Activity with the fields, relations, and foreign key delete rules in the data model sketch below, adds a role column to User with database default "PA" and a check constraint limiting it to "PA" or "CEO", backfills any existing user rows to "PA", and applies cleanly on a fresh database with the existing auth tables intact.
- **AC-2**: Meeting, Task, Contact, FollowUp, and PendingDecision each carry a nullable deletedAt column; User, MeetingAttendee, Attachment, Notification, and Activity do not. PendingDecision rows soft delete only while status is pending; decided rows are immutable.
- **AC-3**: Every new domain entity uses a String primary key holding a UUID v4 generated in one repository create helper via crypto.randomUUID; schema ids carry no database default, so every insert path is forced to pass an id. MeetingAttendee uses the composite primary key (meetingId, contactId) with no surrogate id.
- **AC-4**: User.role holds "PA" or "CEO", defaults to "PA" on insert, and is configured in Better Auth as an additional field with input disabled so no sign up request can set it. The seed ensures exactly one user per role (keys on role, falls back to email, repairs an existing row that has no role), and re running the seed stays idempotent.
- **AC-5**: Status, priority, activity action, attachment parent type, and attendee role label columns are plain strings (no database enums). Canonical tokens live in one backend constants module in lower snake case as listed in this spec, every status and priority column carries the `@default` named in the model sketch, and all writes, including seed and import, go through that module's validation.
- **AC-6**: Indexes exist on Meeting.startsAt, Task (status, dueAt), FollowUp.dueAt, PendingDecision (status, dueAt), Contact.name, Notification (userId, readAt), Attachment (parentType, parentId), and Activity (entityType, entityId), so dashboard, schedule, and list queries stay fast.
- **AC-7**: The backend reads a TIMEZONE environment variable (IANA zone, default UTC when unset, config load fails on an unparseable value). Meetings and due dates store naive local wall clock times (Prisma DateTime, mapped to a timestamp without time zone). No code constructs a Date for domain logic outside the timezone helper, which exposes startOfDay and endOfDay. A null dueAt means unscheduled and is excluded from due today queries.
- **AC-8**: The schema supports every later slice (schedule, tasks, contacts, follow ups, decisions, briefings, attachments, trash) without requiring a breaking migration; new slices may add columns or tables but must not rename or repurpose these. The reserved columns checklist in the feature design is the evidence.
- **AC-9**: Meeting, Contact, Task, FollowUp, and PendingDecision each carry a required createdById pointing at User. Import and bulk create paths default it to the PA user.
- **AC-10**: Soft-deleted parents never appear as live rows in any read that crosses a relation; those reads either omit the parent or show a plain deleted placeholder.

## Decision

**Chosen option**: Option 1: Full target model in one migration.

Land the whole confirmed model as one Prisma migration on Postgres, add role to User with default PA, a check constraint, and Better Auth input disabled, reserve soft delete and activity columns now, keep statuses as validated strings owned by one constants module, assign UUIDs in one repository create helper, freeze foreign key delete rules in the first migration, and store the system timezone in one environment variable read through a single helper.

**Implementation skills**: `prisma-orm-setup` (`prisma/skills`, `.agents/skills/prisma-orm-setup/`) · `prisma-cli` (`prisma/skills`, `.agents/skills/prisma-cli/`) · `prisma-client-api` (`prisma/skills`, `.agents/skills/prisma-client-api/`)

## Feature design

**Data model sketch**:

Delete rules: Restrict on required parent references (Contact, Meeting, User), SetNull on optional related and decidedBy columns, Restrict on Activity.actorId and Attachment.uploadedById, Cascade on MeetingAttendee's two foreign keys. Slice 16 owns any hard purge and its order; this migration freezes the rules above so no later data forces a breaking change.

| Entity | Key fields (type, nullability, defaults) | Relations (delete rule) |
|---|---|---|
| User | id String PK (UUID, library filled), Better Auth fields unchanged, role String @default("PA") with check constraint ("PA" or "CEO"), createdAt, updatedAt | parent of createdById, assignee, decidedBy, uploadedBy, actorId, userId columns |
| Meeting | id String PK (UUID), title String, startsAt DateTime, endsAt DateTime, location String?, notes String?, status String @default("scheduled") ("scheduled" or "cancelled"), createdById FK → User (Restrict, required), createdAt, updatedAt, deletedAt DateTime? | many to many Contact through MeetingAttendee; optional related Task, FollowUp, PendingDecision (SetNull) |
| MeetingAttendee | meetingId FK → Meeting (Cascade), contactId FK → Contact (Cascade), roleLabel String? ("required" or "optional"), composite primary key (meetingId, contactId) | join only, no soft delete, no surrogate id |
| Contact | id String PK (UUID), name String, company String?, email String?, phone String?, notes String?, createdById FK → User (Restrict, required), createdAt, updatedAt, deletedAt DateTime? | attendee of Meetings; optional source of Task and FollowUp (SetNull). No unique constraint on email (shared addresses are normal) |
| Task | id String PK (UUID), title String, description String?, dueAt DateTime? (null means unscheduled), priority String @default("medium") ("low", "medium", "high", "urgent"), status String @default("open") (see transitions), assigneeId FK → User (Restrict, required, defaults to PA on import and bulk paths), createdById FK → User (Restrict, required), relatedContactId FK → Contact? (SetNull), relatedMeetingId FK → Meeting? (SetNull), createdAt, updatedAt, deletedAt DateTime? | many to one User, Contact, Meeting |
| FollowUp | id String PK (UUID), title String, dueAt DateTime? (null means unscheduled), status String @default("pending") (see transitions), assigneeId FK → User (Restrict, required, defaults to PA on import and bulk paths), sourceContactId FK → Contact? (SetNull), sourceMeetingId FK → Meeting? (SetNull), createdById FK → User (Restrict, required), createdAt, updatedAt, deletedAt DateTime? | mirrors Task's link shape |
| PendingDecision | id String PK (UUID), title String, context String?, status String @default("pending") (see transitions), dueAt DateTime?, relatedMeetingId FK → Meeting? (SetNull), decidedById FK → User? (SetNull), decisionComment String?, decidedAt DateTime?, createdById FK → User (Restrict, required), createdAt, updatedAt, deletedAt DateTime? | CEO acts here; decidedBy null while pending; soft delete only while pending, decided rows immutable |
| Attachment | id String PK (UUID), fileName String, mimeType String, size Int, storagePath String (Cloudinary id or path in slice 13), parentType String ("meeting", "task", "contact", "follow_up"), parentId String, uploadedById FK → User (Restrict, required), createdAt, updatedAt | polymorphic pointer, no soft delete, no DB foreign key on parentId (application checks existence); index on (parentType, parentId); slice 16 purge deletes attachments before their parent |
| Notification | id String PK (UUID), userId FK → User (Restrict, required), type String (values owned by slice 6, for example task_due), title String, body String?, relatedType String?, relatedId String?, readAt DateTime?, createdAt | in app feed; email delivery joins in slice 6; composite index (userId, readAt) |
| Activity | id String PK (UUID), entityType String (closed set: meeting, contact, task, follow_up, pending_decision, attachment, notification, user), entityId String, action String ("created", "updated", "deleted", "restored"), actorId FK → User? (Restrict, never SetNull), payload Json? ({before, after} field delta, only changed keys), createdAt | append only, no soft delete, no updates; dangling entityId after a hard delete is intended audit residue |

Table naming: Prisma default names for domain tables (Meeting, Task, and so on). The lowercase @@map names on auth tables stay, those are the library's convention.

Canonical tokens live in one backend constants module (statuses, priorities, activity actions, attachment parent types, attendee role labels, activity entity types). Seed, import, and every repository write validate against it. Schema ids stay plain `String @id` with no `@default` so inserts must pass a UUID from the repository create helper.

**State transitions** (canonical tokens in lower snake case, owned by the constants module):

- Meeting: scheduled → cancelled, cancelled → scheduled (PA un cancels or trash restore). No other states. Default scheduled.
- Task: open → in_progress → done; open or in_progress → cancelled. done and cancelled are terminal except trash restore. Default open, priority default medium.
- FollowUp: pending → done, pending → dismissed. Both terminal except trash restore. Default pending.
- PendingDecision: pending → approved or declined. Terminal; decidedById, decisionComment, and decidedAt fill on the transition. Soft delete is allowed only while pending. The CEO triggers the transition in slice 11. Default pending.
- Trash restore: clears deletedAt, leaves status unchanged, writes an Activity row with action restored and the prior status in the payload.

**API surface**:

None in this feature. This is schema, migration, seed, and one env var. Each later slice owns its own endpoints; this model is the storage they read and write.

**Value sourcing**:

| Value produced or displayed | Source |
|---|---|
| New domain row id | one repository create helper using crypto.randomUUID; schema has no id default (AC-3) |
| Meeting wall clock times | input from the PA; stored in startsAt and endsAt as naive local times; interpreted in the TIMEZONE helper (AC-7) |
| createdById on domain rows | the signed in user's id; import and bulk paths default to the PA user (AC-9) |
| Actor on Activity rows | the signed in user's id; Restrict delete, never SetNull (AC-9) |
| Attachment.storagePath | upload result from Cloudinary in slice 13; column reserved now |
| Notification.userId and related ids | the user being notified and the source row's id |
| Status, priority, action, parent type, role label, entity type values | the backend constants module; lower snake case tokens listed in this spec (AC-5) |
| Timezone for day boundaries | TIMEZONE env var via the timezone helper's startOfDay and endOfDay; invalid values fail config load (AC-7) |

**Key invariants**:

- Meeting endsAt is after startsAt; enforced in the application write path, not the database.
- Status, priority, and the other closed set columns accept only tokens from the constants module. Seed, import, and repository writes all route through it; there is no database check on these, only on User.role.
- Default list and detail queries filter deletedAt IS NULL. Every read that crosses into a parent relation filters soft deleted parents and shows a plain deleted placeholder instead of a live looking join (AC-10). The trash feature (slice 16) queries the rest.
- PendingDecision soft deletes only while status is pending; a decided row is immutable so the approval trail survives.
- Restore clears deletedAt, leaves status unchanged, writes Activity action restored with the prior status in payload.
- Activity is append only: no updates, no deletes, actorId Restrict never SetNull. A dangling entityId after a hard delete is intended audit residue.
- The repository write path owns Activity rows (created, updated, deleted, restored) from the first feature onward; entityType comes from the closed set in the sketch; payload is a {before, after} object with only changed keys.
- Attachment.parentId must point at a live row of parentType; checked in the application because polymorphic relations have no single foreign key. Slice 16 hard purge deletes attachments before their parent.
- Overlapping meetings are not blocked at the database; slice 5 queries for overlaps and flags them in the UI (intentional double bookings stay possible).
- A null dueAt means unscheduled; due today and due soon queries exclude it.
- No code outside the timezone helper constructs a Date for domain logic; invalid TIMEZONE fails config load rather than falling through silently.

**Security model**:

Role lives on User as a plain string with database default "PA", a check constraint limiting values to "PA" or "CEO", and Better Auth additionalFields configured input disabled so no sign up request can set role. Feature 4 (auth and roles) owns session checks and route enforcement: the PA writes domain rows; the CEO reads and only transitions PendingDecision. This spec stores the column, constrains it, and seeds one of each role; it does not enforce authorization. Contact details and meeting notes are personal data for a single organization; no regulated scope (payments, health) applies. Secrets stay in environment variables, never in these tables.

**Configuration required**:

- `TIMEZONE`: IANA zone name for the CEO's home city, for example Africa/Lagos; default UTC when unset; config load fails on an unparseable value (AC-7).

**Reserved columns checklist** (evidence for AC-8; later slices add behavior, not foundations):

| Later slice | Already reserved here | Still owned by that slice |
|---|---|---|
| 6 Tasks and reminders | Notification table, task dueAt and status | type value set, email delivery join, reminder scheduling |
| 11 CEO view and approvals | PendingDecision status, decidedBy, decidedAt, decisionComment | route enforcement, comment UX |
| 13 File attachments | Attachment table, storagePath, parent polymorphic pointer | Cloudinary provider, upload limits, purge wiring with 16 |
| 15 External calendar sync | Meeting single rows, no recurrence column | provider choice, expansion strategy, external event key column added by that slice |
| 16 Trash and restore | deletedAt on five tables, Activity table and actions | restore UI, purge order, export |

**Critical test scenarios** (each maps to an acceptance criterion in ## Requirements):
- Happy path: fresh database, run the migration, run the seed, find one PA user and one CEO user and ten new tables present, verifies **AC-1**, **AC-4**
- Happy path: repository create helper inserts a meeting with two attendees; ids are UUID v4, MeetingAttendee has no surrogate id, createdById and actor fill from the session user, verifies **AC-3**, **AC-9**
- Happy path: repository create and read of a meeting with two attendees round trips all fields including null optional columns, verifies **AC-1**, **AC-3**
- Failure case: a write with status "archived" on a task is rejected by the constants module before reaching the database, verifies **AC-5**
- Failure case: a sign up request that includes role=CEO is ignored or rejected; role stays at the database default, verifies **AC-4**
- Failure case: a read of a task whose related meeting is soft deleted omits the meeting or shows the deleted placeholder, never a live looking join, verifies **AC-10**
- Failure case: re running the seed creates no duplicate users, repairs a user missing a role, and leaves one user per role, verifies **AC-4**
- Failure case: loading config with TIMEZONE=Not/AZone fails rather than silently defaulting, verifies **AC-7**
- Auth/permission: not enforced in this feature; role values are stored and readable so feature 4 can gate routes, verifies **AC-4**

## Build plan

Tracer Bullet ordering: this feature is itself the thin real foundation thread (schema to database to seed), so the plan lands the whole model at once rather than thickening one entity at a time. One migration, matching option 1.

1. [x] Create the backend constants module with the canonical tokens (statuses, priorities, activity actions, attachment parent types, attendee role labels, activity entity types) and their `@default` companions, satisfies **AC-5**
2. [x] Extend `backend/prisma/schema.prisma`: add role to User (default PA, check constraint), define the nine new models with createdById, foreign key delete rules, composite MeetingAttendee key, status and priority defaults, and the AC-6 composite indexes, satisfies **AC-1**, **AC-2**, **AC-3**, **AC-5**, **AC-6**, **AC-9**
3. [x] Configure Better Auth user.additionalFields for role (defaultValue PA, input false), satisfies **AC-4**
4. [x] Generate and apply the migration against the local Neon database; confirm a fresh migrate dev run is clean and existing user rows backfill to PA, satisfies **AC-1**. The CHECK constraint on role is hand written in the migration SQL, since Prisma has no schema syntax for it; a later `migrate dev` run reports no schema changes, so the constraint does not count as drift.
5. [x] Add one repository create helper that assigns UUID v4 ids and routes writes through the constants module; wire Activity created and updated writes into the repository path, satisfies **AC-3**, **AC-5**
6. [x] Update `backend/prisma/seed.ts` to key on role (fall back to email), set PA and CEO explicitly, and repair a user that exists without a role, keeping the idempotent exists check, satisfies **AC-4**. `signUpEmail` returns `{ token, user }`, so the CEO role update reads `created.user.id`.
7. [x] Add `TIMEZONE` to backend config with UTC default, fail on unparseable values, and expose one timezone helper with startOfDay and endOfDay that all date logic reads, satisfies **AC-7**
8. [x] Document in the backend conventions (root AGENTS.md or a short comment in the prisma lib) that default queries filter deletedAt, relation reads filter soft deleted parents, and statuses validate against the constants module, satisfies **AC-2**, **AC-5**, **AC-8**, **AC-10**. Recorded as one comment line at the top of `backend/src/lib/prisma.ts`; `/sync` should promote it into root `AGENTS.md`.
9. [x] Write schema level tests: migrate fresh, seed twice, assert one user per role, assert UUID v4 format on new ids, assert invalid status and invalid TIMEZONE are rejected (extends the existing seed test), satisfies **AC-1**, **AC-3**, **AC-4**, **AC-5**, **AC-7**. The fresh database suite lives in `backend/src/lib/schema.test.ts` and skips itself when `DATABASE_URL_UNPOOLED` is unset (CI) or the database cannot be reached.

## Consequences

**Positive**:
- Every later slice starts from a complete schema; schedule, tasks, contacts, follow ups, decisions, and trash need no foundation migration.
- Trash can land as a pure feature (UI and restore logic) because deletedAt and Activity already exist, and restore semantics are defined.
- Foreign key delete rules, status defaults, and the role insert path are frozen in migration 1, so no later slice re-litigates them against live data.
- One review of the whole model catches relation mistakes while the schema is still cheap to change.

**Negative / tradeoffs**:
- Attachment, Notification, and Activity tables ship before their features; their shapes get less real use feedback until slices 6, 11, and 13.
- Soft delete means every default query must remember the deletedAt filter, and every relation read must filter soft deleted parents; forgetting either shows ghost rows. The shared helper and the documented convention are the mitigation.
- Adding a status value later is easy (string set in the constants module), which trades database level completeness for discipline in the application validation layer. User.role is the one column with a database check, because that set never changes.
- Single tenancy is now a hard assumption; a second CEO in one deployment would be a breaking redesign, accepted for this product.
- A required assignee on Task and FollowUp means "unassigned" is foreclosed; relaxing it later changes generated types and counts as breaking under AC-8.
- App-side id generation means every insert path must remember to call the repository create helper; a direct prisma create that skips it fails on the missing primary key, which is loud but still a footgun for anyone bypassing the repository.

**Neutral**:
- Better Auth continues to own Session, Account, and Verification; User changes only by the role column and its additionalFields configuration.
- Cloudinary, email delivery, and calendar sync providers are not chosen here; the columns reserve their places (storagePath, Notification delivery, Meeting single rows).
- Prisma client types regenerate from the schema; repositories and later use cases import the generated client from `backend/src/generated/prisma` as today.
- MeetingAttendee uses a composite primary key rather than a surrogate id; slightly less idiomatic Prisma, one fewer index and one fewer invented UUID.

## Follow-up

- [ ] Feature 4 (auth and roles) wires session middleware that reads User.role and enforces PA write / CEO read plus decision transitions; this spec only stores and constrains the column.
- [ ] When the first feature needs list queries, add a small shared soft delete filter helper in the backend lib so every repository does not reinvent deletedAt IS NULL and the relation parent filter (AC-10).
- [ ] Slice 6 owns the Notification.type value set and the email delivery join; slice 13 owns Cloudinary wiring for Attachment.storagePath; slice 16 owns hard purge order and export; none is chosen in this spec beyond the reserved columns.
- [ ] Prisma schema and migration conventions from the installed prisma skills should be reflected in root AGENTS.md Rules if they are not already, so every later task follows them without rediscovery.
- [ ] Import (slice 14) and any bulk path must default createdById and assigneeId to the PA user and route status writes through the constants module; call this out when that slice is designed.
