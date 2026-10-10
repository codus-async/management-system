# 0002. Domain data model: reasoning

## Context

Every feature after the foundation reads or writes shared rows: the schedule needs meetings and attendees, the dashboard needs tasks, decisions, and commitments, the briefing compiles from all of them, and trash needs a way to delete without destroying. If each slice invents its own tables and keys, the schema fragments and later slices force breaking migrations. The scope feature "Data model" exists so one coherent model lands first.

Forces that shaped this: one CEO and one PA use the system (single tenant, no tenant key on rows); the PA edits everything while the CEO reads and acts on approvals only (a role must live somewhere queryable); deleted items must be restorable (soft delete columns and an activity log, reserved now even though the trash UI is slice 16); the daily briefing assembles from live data rather than stored snapshots (no briefing table); and external calendar sync comes later (meetings stay single rows for now, recurrence can expand later without redesign).

The existing schema holds only the Better Auth tables (User, Session, Account, Verification). User gains a role column; the auth tables otherwise stay as the library owns them.

## Options considered

### Option 1: Full target model in one migration (chosen)

Define all ten entities and the User.role column now, apply one migration, and let every later slice write against a complete schema.

**Pros**: Matches the done when of no breaking migration; later slices only add features, not foundations; one review of the whole shape.
**Cons**: The first migration is large; some tables (Attachment, Notification) sit unused until their slices, which slightly delays feedback on those shapes.

### Option 2: Skeleton only

Model only what slice 1 needs (User.role, Meeting, MeetingAttendee) and grow the rest slice by slice.

**Pros**: Smallest first migration, fastest feedback on the schedule path.
**Cons**: Every later slice migrates new tables and backfills relations; the done when of supporting every slice without a breaking migration is not met at foundation time.

### Option 3: Full model, migration sliced across slices

Design the whole target in the spec but land the migration piecemeal as each slice builds.

**Cons for this project**: The Tracer Bullet default still wants one thin real thread, but a data model is not a vertical thread; splitting one logical migration across time recreates the churn option 2 has, with none of its speed. Rejected.

## Rationale

The scope names this feature as the foundation every later slice builds on, and its done when is explicit: support schedule, tasks, contacts, follow ups, decisions, and briefings without a breaking migration. That rules out a skeleton. Slicing the migration across slices was weighed and rejected because a schema is one coherent artifact; partial application buys little and keeps every later feature opening with migration risk.

Single tenancy was confirmed against the product (one CEO, one PA), so no tenant column appears anywhere; adding multi tenancy later would be a breaking change, and that tradeoff is accepted consciously. Soft delete was reserved now, against a general preference for leaner deletes, because trash and restore is a named slice and retrofitting deletedAt across five tables after data exists is the expensive path. The activity log stays generic (entity type, entity id, action, actor, payload JSON) so trash restore and a basic change trail share one append only table without field level history overhead.

Statuses are strings with fixed sets rather than database enums because the sets are small, application validation already sits at the write boundary, and adding a value should not require a migration. Recurrence stays out of Meeting (single rows only) so external calendar sync in slice 15 can choose expansion or rules without this model having guessed wrong. The briefing stays a read time assembly, no table, matching the scope description that it compiles from the system's own data.
