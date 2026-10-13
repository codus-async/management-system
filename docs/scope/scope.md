# Scope: CEO PA Management System

A management system for a CEO and their personal assistant: schedule, meetings, tasks, reminders, contacts, follow ups, and daily briefings, with a dashboard tracking priorities, pending decisions, and upcoming commitments. The PA runs the system day to day. The CEO gets a read only view plus approvals.

**Build approach:** Tracer Bullet (one thin real path through every layer first, then thicken one segment at a time). (basis: tracer bullet development)
**Workflow:** Beta (after each build: verify on the real app, then tests). The project default level of rigor. `/architect` is the recommended first stop for a feature with a real decision, but skippable when you already know the build. Any feature can carry its own tag (e.g. `· GA`) to do more or less.

_These are recommendations to keep your build orderly, not requirements. Skip anything that does not fit: if you already know how to build a feature, use `/develop` and skip `/architect`. You decide when a feature is `done`._

## At a glance

| # | Feature | Phase | Status |
|---|---------|-------|--------|
| A | Client scaffold | Foundation | existing |
| B | Backend scaffold | Foundation | in-progress |
| 18 | Stack & architecture | Foundation | done |
| 1 | Coding standards & tooling | Foundation | done |
| 2 | Data model | Foundation | done |
| 3 | Design system & UI foundation | Foundation | in-progress |
| 4 | Auth & roles | Slice 1 | planned |
| 5 | Schedule & meetings | Slice 1 | planned |
| 6 | Tasks & reminders | Slice 2 | planned |
| 7 | Contacts | Slice 2 | planned |
| 8 | Follow ups | Slice 2 | planned |
| 9 | Dashboard | Slice 3 | planned |
| 10 | Daily briefing | Slice 4 | planned |
| 11 | CEO view & approvals | Slice 4 | planned |
| 12 | Search | Slice 5 | planned |
| 13 | File attachments | Slice 5 | planned |
| 14 | Import from files | Slice 5 | planned |
| 15 | External calendar sync | Slice 5 | planned |
| 16 | Trash, restore & export | Slice 6 | planned |
| 17 | Usage & error tracking | Slice 6 | planned |

## Foundations

### A. Client scaffold · existing
Pre workflow Next.js app: default start page, Tailwind, ESLint, and its own Next.js agent rules. code in `client/`

### B. Backend scaffold · in-progress
Express and TypeScript started but not running yet: the dev script points at a missing `src/index.ts` and both source files are empty, so it does not boot. Finishing it is the first build job, via `/develop`. code in `backend/`

### 18. Stack & architecture · done
Execute the stack decision from spec 0001: one git repo at the root, both apps booting locally on the decided services, the database migrated, auth mounted, and the proxy working.
**Done when:** both apps run locally against Neon with migrations applied, Better Auth sign in works through the proxy, and the first deploy targets Vercel and Render with the environment variables documented.
- [x] Design it (spec): `/architect stack & architecture`
- [x] Scaffold from the decision: `/develop stack & architecture`
- [x] Verify it: `/check verify stack & architecture`
- [x] Test it: `/test stack & architecture`
Spec [0001](../specs/0001-stack-and-architecture/index.md) · code in `backend/`, `client/`, `render.yaml`, `docs/deploy.md`

### 1. Coding standards & tooling · done
Capture conventions from the real scaffold, then install lint, format, and pre commit checks. There is no root `AGENTS.md` yet, so this is the first stop for real context.
**Done when:** root `AGENTS.md` reflects the real stack, and lint, format, and pre commit checks run clean.
- [x] Capture conventions and tooling choices: `/audit`
- [x] Install the tooling: `/develop tooling`
- [x] Check it runs clean: `/test`
Tooling in `package.json`, `.prettierrc.json`, `.husky/pre-commit`, `.husky/commit-msg`, `commitlint.config.js`, `.github/workflows/ci.yml`, `backend/eslint.config.mjs`, `backend/vitest.config.ts`, `AGENTS.md`

### 2. Data model · done
The core entities every later slice builds on: users and roles, meetings, tasks, contacts, follow ups, pending decisions, attachments, activity for trash.
**Done when:** entities and relationships support every later slice (schedule, tasks, contacts, follow ups, decisions, briefings) without a breaking migration.
- [x] Design it (spec): `/architect data model`
- [x] Build it: /develop data model
  - [x] Schema and migration: constants module, Prisma models, role config, one migration, satisfies AC-1, AC-2, AC-3, AC-5, AC-6, AC-9
  - [x] Write path: repository create helper, Activity wiring, soft delete conventions, satisfies AC-3, AC-8, AC-10
  - [x] Seed roles and timezone helper, satisfies AC-4, AC-7
  - [x] Schema level tests, satisfies AC-1, AC-3, AC-4, AC-5, AC-7
- [x] Verify it: /check verify data model
- [x] Test it: /test data model
Spec [0002](../specs/0002-domain-data-model/index.md) · code in `backend/prisma/`, `backend/src/lib/`

### 3. Design system & UI foundation
Visual language, layout, and base components so every screen feels like one product and works from the keyboard.
**Done when:** `design.md` covers type, color, spacing, and components, base components handle focus and keyboard, text contrast meets WCAG 2.2 minimums on interactive boundaries, light mode has a real surface ladder so cards separate without a heavy border, and hover and selection states are visible (basis: WCAG 2.2).
- [x] Design it (spec): `/architect design system & UI foundation`
- [x] Build it: /develop design system & UI foundation
  - [x] Tokens and theme: shadcn init, contrast safe border, input, ring, and per theme accent tokens, Inter, next-themes with the three way toggle, satisfies AC-2, AC-3, AC-6, AC-9
  - [x] Slice 1 components: install the component set, verify keyboard, focus, and target size, satisfies AC-4
  - [x] App shell: sidebar and top bar, typed nav config with disabled flag, mobile drawer, satisfies AC-5
  - [x] States and form: empty, loading, and error patterns, React Hook Form with Zod 4 demo form, satisfies AC-7, AC-8
  - [x] design.md and checks: generate token tables, automated axe check, contrast pass, lint, format, typecheck, satisfies AC-1, AC-9, AC-10
  - [x] Ember retune: warm tinted neutrals at hue 80 to 115, four step surface ladder per theme, interactive input and sidebar border held to 3 to 1 against the decorative hairline, terracotta accent with a lifted dark value on ink text, three distinct emphasis surfaces, shadows in light and ladder in dark, regenerate the design.md tables and rewrite its prose to match, satisfies AC-9, AC-11, AC-12, AC-13, AC-14
  - [x] Shell gaps from the retune: declare Newsreader as `--font-newsreader` in the layout, render the SidebarTrigger in the top bar so the mobile drawer opens, rerun axe across both themes and both viewports, satisfies AC-3, AC-5, AC-9
  - [x] UI design guidance: vendor the `frontend-design` skill into `.agents/skills/frontend-design/` with its license, list it in root `AGENTS.md` under `## Agent skills`, satisfies AC-15
- [x] Verify it: /check verify design system & UI foundation
- [x] Test it: /test design system & UI foundation
Spec [0003](../specs/0003-design-system-ui-foundation/index.md) · code in `client/`

## Slice 1: Walking skeleton

One thin real thread through every layer: sign in, put a meeting in the calendar, see today's agenda. Real data, real roles, real screen, nothing faked. (basis: walking skeleton practice)

### 4. Auth & roles · needs a decision
Sign in for real with two roles: the PA edits everything, the CEO reads and acts on approvals only.
**Done when:** the PA and the CEO can each sign in, every route enforces the right role, and the CEO cannot edit anything.
- [ ] Design it (spec): `/architect auth & roles`

### 5. Schedule & meetings · needs a decision
The heart of the product: the PA manages the CEO's calendar and daily agenda.
**Done when:** the PA can create, edit, move, and cancel meetings (date, time, attendees, notes), open any day's agenda, and see overlapping meetings flagged, with empty and error states rendering.
- [ ] Design it (spec): `/architect schedule & meetings`

## Slice 2: Daily work

### 6. Tasks & reminders · needs a decision
Tasks with owner, due date, and priority, plus the first delivery of reminders: in app and email. Later slices reuse this channel.
**Done when:** the PA can manage tasks end to end, a due or overdue task produces an in app notification and an email, and completed tasks leave the pending list.
- [ ] Design it (spec): `/architect tasks & reminders`

### 7. Contacts · needs a decision
The address book the PA works from every day.
**Done when:** the PA can add and edit contacts with details and notes, browse a sorted list, and open a contact to see its linked meetings, tasks, and follow ups.
- [ ] Design it (spec): `/architect contacts`

### 8. Follow ups · needs a decision
Commitments made in meetings and calls that must not slip.
**Done when:** the PA can log a follow up from a meeting or contact with a due date, and it nudges through the reminder channels until it is done or dismissed.
- [ ] Design it (spec): `/architect follow ups`

## Slice 3: Dashboard

### 9. Dashboard · needs a decision
One screen for the state of the CEO's day: priorities, pending decisions, upcoming commitments.
**Done when:** the PA sees today's agenda, top priorities, upcoming commitments, and pending decisions in one place, each item links to its source, the PA can log a pending decision, and sections with no data show a clear empty state.
- [ ] Design it (spec): `/architect dashboard`

## Slice 4: The CEO loop

### 10. Daily briefing · needs a decision
The briefing assembles itself from the system's own data, so nobody writes it twice.
**Done when:** one screen per day shows agenda, priorities, pending decisions, and commitments compiled automatically, and the PA can preview exactly what the CEO will see.
- [ ] Design it (spec): `/architect daily briefing`

### 11. CEO view & approvals · needs a decision
The CEO's side: read only everywhere, with the one action that matters, approving or declining pending decisions.
**Done when:** the CEO can open the briefing and dashboard read only, approve, comment, or decline a pending decision, and the PA sees the response on the dashboard.
- [ ] Design it (spec): `/architect CEO view & approvals`

## Slice 5: Integrations & utilities

### 12. Search · needs a decision
One box to find anything in the system.
**Done when:** one search box finds contacts, meetings, tasks, and follow ups by name and text, results are grouped by type, and a no results state renders.
- [ ] Design it (spec): `/architect search`

### 13. File attachments · needs a decision
Documents belong with what they concern: agendas, contracts, notes.
**Done when:** files attach to meetings and tasks, upload and download work, and size or type limits fail with a clear message.
- [ ] Design it (spec): `/architect file attachments`

### 14. Import from files · needs a decision
Bringing existing contacts and events in without retyping them.
**Done when:** the PA uploads a file of contacts or events, maps the columns, previews the rows, and nothing is saved until they confirm.
- [ ] Design it (spec): `/architect import from files`

### 15. External calendar sync · needs a decision
The schedule should reflect real appointments from the calendar the CEO already lives in. (basis: external calendar sync raises a service decision, so it waits for the core to be solid)
**Done when:** events from an outside calendar show up in the schedule, sync direction and refresh behavior are defined in the spec, and repeats do not pile up as duplicates.
- [ ] Design it (spec): `/architect external calendar sync`

## Slice 6: Data care

### 16. Trash, restore & export · needs a decision
Deletes should be recoverable, and the data should be theirs to take.
**Done when:** deleted items land in trash, can be restored, and the full data set can be exported as files.
- [ ] Design it (spec): `/architect trash, restore & export`

### 17. Usage & error tracking · needs a decision
Light eyes on the system: what breaks and what gets used.
**Done when:** errors land in one place with enough context to fix them, and basic usage counts show which parts of the system get used.
- [ ] Design it (spec): `/architect usage & error tracking`

## Deferred
Out of scope for the current build pass, kept so the plan stays honest.
- **SMS and push reminders**: reach people who are not logged in · needs a decision
- **Multi language support**: keep text translatable when a second language arrives · needs a decision
- **Retention rules and audit history**: the formal version of data care · needs a decision
- **Full product analytics**: funnels and goals once real usage justifies them · needs a decision

## Legend

**The decision box.** Every feature carries exactly one, the sub-task whose label ends with `(spec)`. Its wording varies (`Design it (spec)` normally, `Decide the stack (spec)` on Stack & architecture), so skills locate it by that `(spec)` suffix, never by an exact label. Every other box is an execution box and `/architect` never ticks one.

**Feature lifecycle**: the scope updates as a feature moves; each row is what it shows and who sets it:

| State | Set by | The feature shows |
|---|---|---|
| `planned` · needs a decision | `/scope` | one box: `Design it (spec): /architect <feature>` |
| `in-progress` (designed) | **`/architect` at spec capture** | `Design` ticked; spec linked; `Build it: /develop <feature>` + **2 to 5 milestones**; the tier's closing boxes (`Verify it` Alpha+, `Test it` Beta+, `Review it` + `Document it` GA); any surfaced follow-up enrolled |
| `in-progress` (building) | `/develop` | milestone sub-boxes tick one by one; code pointer filled |
| `in-progress` (verified) | `/check verify` | `Build it` + milestones ticked; `Verify it` ticked |
| `done` | **you, when you decide it is** (any skill sets it when you say so); `/sync` reconciles | boxes you ran ticked, skipped ones marked skipped; the tier's last stage (`Prototype` → after `/develop`; `Alpha` → after `/check verify`; `Beta`/`GA` → after `/test`) is the suggested point to call it done; `/sync` captures conventions |

- **Next step** = the first unticked box (always a command or a tracked milestone).
- **needs a decision** = run `/architect` first; otherwise straight to `/develop` (or `/audit` for standards & tooling). The tag drops once the spec is captured.
- **Atomic build tasks live in the spec's `## Build plan`, not here**: the scope carries only the milestone rollup.
- **Status** `planned` → `in-progress` → `done`, plus `existing` (pre-workflow) and `dropped` (de-scoped, kept for history).
- **Approach tag** beside a heading (e.g. `· Facade`) overrides the project default for that feature; no tag = inherits it.
- **Workflow tier tag** beside a heading (e.g. `· GA`, `· Prototype`) sets that one feature's rigor above or below the project default; no tag inherits the default. It decides the feature's check boxes and each skill's next suggestion.
- **Workflow** (header line) is the project default, what runs after `/develop`: **Prototype** = nothing (trust develop's own build time self check); **Alpha** = `/check verify`; **Beta** = `/check verify` then `/test`; **GA** = adds a fresh model `/check review` then `/document`. A feature built on an unratified decision (an `Assumed` spec) stays flagged, but that never blocks `done`.
- **Pointer line** (`spec <n> · code in <path>`): the spec link added by `/architect`, the code path by `/develop`.

## References

### Project sources
- Your answers in this planning session: audience (PA runs it, CEO views), MVP focus (schedule first), capabilities, and the Beta workflow choice.
- The existing scaffold: `client/` (Next.js, Tailwind, ESLint) and `backend/` (Express, TypeScript).

### Practices & standards
- Tracer Bullet development: build one thin working thread through every layer before thickening any part of it.
- Walking Skeleton: a tiny end to end implementation that links the main architectural components before breadth.
- Foundations before features: the data model and design system are cheaper to build first than to retrofit.
- WCAG 2.2: keyboard operability and text contrast minimums, used as the accessibility baseline.

### Links
- Tracer Bullets and Prototypes, Andy Hunt and Dave Thomas (Artima): https://www.artima.com/articles/tracer-bullets-and-prototypes
- Walking Skeleton, Alistair Cockburn (archived): https://web.archive.org/web/20140329201356/http://alistair.cockburn.us/Walking+skeleton
- Web Content Accessibility Guidelines (WCAG) 2.2, W3C: https://www.w3.org/TR/WCAG22/
