# Verify: Design system & UI foundation · spec 0003 · updated 2026-10-13

_Steps derived from spec 0003 acceptance criteria and its Value sourcing table. `/check verify` runs these; `/test` locks the durable ones._

Acceptance criteria, taken from the spec's Requirements:

- AC-1 `client/design.md` documents type scale, color tokens for both themes including the per theme accent, spacing scale, and the component inventory, with tables generated from `globals.css`
- AC-2 every theme value lives as a CSS variable through Tailwind 4 `@theme`, and application code uses semantic token utilities only
- AC-3 Inter is the UI sans, Newsreader is exposed as `--font-newsreader` and resolves through `--font-heading` for h1 to h3, Geist Sans is gone, Geist Mono stays for code
- AC-4 the Slice 1 component set is installed, keyboard operable, with a full opacity focus ring, a 24 by 24 pixel target size, and nothing obscured by the sticky top bar
- AC-5 the shell has a sidebar and a top bar, nav comes from one typed config with a `disabled` flag, and small screens get an accessible drawer
- AC-6 light, dark, and system themes all work through a three way toggle that persists and avoids a hydration mismatch
- AC-7 the demo form uses React Hook Form with Zod 4 and shows labels, inline errors, and focus moving to the first error
- AC-8 loading, empty, and error patterns ship, and a demo view exercises all three
- AC-9 text and interactive boundary contrast meets WCAG 2.2 AA in both themes, with the 3 to 1 bar scoped to `--input`, `--ring`, and `--sidebar-border` only
- AC-10 `client/` passes lint, format, and typecheck
- AC-11 each theme carries four distinct ascending surface values: `--background`, `--sidebar`, `--card`, `--popover`
- AC-12 hover and selection surfaces are visibly distinct, and `--secondary` differs from `--muted`
- AC-13 elevation differs by theme: shadows in light, the ladder in dark
- AC-14 every neutral in the ladder and emphasis set carries chroma above zero at a hue between 80 and 115
- AC-15 the `frontend-design` skill is vendored at `.agents/skills/frontend-design/` with its `LICENSE.txt`, root `AGENTS.md` lists it under `## Agent skills` by that relative path, and the path resolves to a real `SKILL.md`

## UI / manual

- [x] Open `/` and look at the h1 plus the two card titles → they render in Newsreader serif while labels and body copy stay Inter → AC-3
- [x] Set the theme to light, then dark, then system, reloading after each → the choice persists, and system follows the operating system preference → AC-6
- [x] In each theme compare the page, the sidebar, a card, and a popover → four visibly different lightness steps in ascending order, and the card still reads as a card with its border hidden → AC-11
- [x] In light mode look at a card and open a dialog → the card carries a soft shadow and the dialog a stronger one; switch to dark and both go flat while the ladder does the work → AC-13
- [x] Hover a navigation item and open a dropdown menu → both change to a tinted surface clearly different from the resting one, and a secondary button does not look like a muted panel → AC-12 · 2026-10-13: every row is disabled while unbuilt, so the `disabled` flag was lifted in the live DOM only to observe the hover surface; secondary and muted measured distinct without it
- [x] In each theme look at an input outline, the sidebar edge, and a card edge → the input and sidebar edge read as firm boundaries, the card edge stays a light hairline → AC-9
- [x] Tab through the whole shell → every stop shows a solid full opacity ring, focus never lands under the sticky top bar, and each icon only control is at least 24 by 24 pixels → AC-4
- [x] At a 390 pixel viewport click the panel icon at the left of the top bar → the navigation drawer opens, Escape closes it, and focus returns to the trigger → AC-5
- [x] Submit the demo form empty → errors render inline, focus moves to the first field with an error, and each message comes from the Zod schema beside the form → AC-7
- [x] Step the state tabs through loading, empty, error, and ready → each shows the shared pattern rather than a one off → AC-8
- [x] Search the changed files for a raw color utility such as `bg-zinc-100` → the only matches are inside `app/globals.css` → AC-2

## Commands

- [x] `cd client && npm run design:check` → all contrast pairs pass, the ladder ascends, the emphasis surfaces stay distinct, the neutrals sit in the warm band, and `design.md` matches `globals.css` → AC-1, AC-9, AC-11, AC-12, AC-14
- [x] `cd client && npm run design:tokens && git diff --exit-code design.md` → the tables regenerate to the same bytes, so the doc has not drifted → AC-1
- [x] `cd client && npm run a11y` with the dev server running → four page states checked, zero serious or critical violations → AC-4, AC-5, AC-9
- [x] `cd client && npm run typecheck && npm run lint` → both exit clean → AC-10
- [x] `npm run format:check` at the repo root → clean → AC-10
- [x] `cd client && npm run build` → the production build finishes with the Newsreader and Inter variables present → AC-3, AC-10
- [x] `test -f .agents/skills/frontend-design/SKILL.md && test -f .agents/skills/frontend-design/LICENSE.txt` → both files exist → AC-15
- [x] `grep -n "frontend-design" AGENTS.md` → one line under `## Agent skills` pointing at `.agents/skills/frontend-design/`, matching the convention of the other entries → AC-15
- [x] `diff -r /home/bello/.agents/skills/frontend-design .agents/skills/frontend-design` → no differences, so the vendored copy is unmodified and the Apache 2.0 redistribution conditions hold → AC-15

## Acceptance-criteria coverage

- AC-1 covered by the `design:check` and `design:tokens` steps, plus the heading inspection
- AC-2 covered by the raw color utility search
- AC-3 covered by the heading inspection and the production build
- AC-4 covered by the tab through the shell and the `a11y` run
- AC-5 covered by the drawer step at 390 pixels and the `a11y` run
- AC-6 covered by the theme toggle and reload step
- AC-7 covered by the empty submit step
- AC-8 covered by the state tab step
- AC-9 covered by the boundary inspection, the `design:check` run, and the `a11y` run
- AC-10 covered by typecheck, lint, and format check
- AC-11 covered by the surface ladder step and the structure assertion in `design:check`
- AC-12 covered by the hover and selection step and the structure assertion in `design:check`
- AC-13 covered by the elevation step per theme
- AC-14 covered by the neutral chroma assertion in `design:check`
- AC-15 covered by the three file and registration commands

## Value sourcing rows worth varying

- Render any screen: swap the theme and confirm no screen carries a hard coded color, size, or radius → the token layer in `globals.css` is the only source
- Render a heading: check an h1, an h2, and an h3, then check an h4 → the serif stops at h3 and h4 stays on Inter, so `--font-heading` is what decides
- Render a card or panel: hide the card border and compare it with the page → the surface token, not the outline, is what separates them
- Render a hovered or selected row: hover a dropdown row, then a navigation item → both come from `--accent`, and a secondary surface still differs from a muted one
- Render a control boundary: compare an input outline with a table divider in each theme → the first comes from `--input` and clears 3 to 1, the second comes from `--border` and does not have to
- Render the sidebar nav: confirm unbuilt sections are disabled rows rather than links → `client/lib/nav.ts` is the only source
- Toggle theme: pick system, then change the operating system preference → the page follows without a reload, since next-themes owns the state
- Demo form validation messages: change a message in the Zod schema and resubmit → the text on screen changes with it
- Contrast verification: change one token in `globals.css` to a value below its bar and run `design:check` → the run fails, which proves the gate reads the code rather than a copy

## Shell contents (sidebar and top bar rebuild) · added 2026-10-13

Steps for the sidebar and top bar rework, under the same acceptance criteria.

### UI / manual

- [x] Open `/` at a desktop width → the sidebar shows the brand lockup (mark, `CEO PA` wordmark, `Office of the CEO`), the `Today` and `Office` groups, every section as a disabled row, and the note "Sections open here as they're built." on a hairline → AC-5 · 2026-10-13
- [x] Collapse the sidebar with the panel button → the mark shrinks onto the icon column, group labels and the note disappear, and no label spills outside the rail → AC-5 · 2026-10-13: rail 47px, labels at opacity 0 with a -32px margin, note and wordmark hidden, no text outside the rail
- [ ] Set the viewport to 390 by 844 → the top bar shows the trigger, the brand, the theme toggle, and the account button with nothing cut off, and the trigger opens the drawer → AC-4, AC-5 · superseded by the Top bar revision section below
- [ ] Hover the search slot, then open the account menu and press Escape → the search tip reads "Search is not available yet", the menu opens on "Not signed in" with `Sign in` first, and focus returns to the trigger → AC-5 · superseded by the Top bar revision section below
- [ ] Tab across the shell → order is trigger, theme options, account, then page content, disabled rows are skipped, and every stop shows a full opacity ring → AC-4 · superseded by the Top bar revision section below
- [x] Switch light to dark → the lockup, the groups, the note, and the top bar all recolour from tokens, with no raw colour in the changed files → AC-2, AC-9 · 2026-10-13

### Commands

- [x] `cd client && npx vitest run` → the suite passes, including the nav group label and nav helper tests → AC-5 · 2026-10-13: 6 files, 34 tests
- [x] `cd client && npm run a11y` with the dev server running → four page states, zero violations → AC-4, AC-5, AC-9 · 2026-10-13
- [x] `npm run verify` at the repo root → format, lint, and typecheck clean → AC-10 · 2026-10-13
- [x] `cd client && npm run build` → the production build finishes → AC-10 · 2026-10-13

### Acceptance-criteria coverage

- AC-2 covered by the raw colour search over the changed files
- AC-4 covered by the tab through the shell and the `a11y` run
- AC-5 covered by the desktop, collapsed, and 390 pixel steps, the nav config tests, and the `a11y` run
- AC-9 covered by the theme switch and the `design:check` and `a11y` runs
- AC-10 covered by the root `verify` and the client build
- AC-12 covered by the selected row step below, once a section is built

### Value sourcing rows worth varying

- Render the sidebar nav: flip one item's `disabled` to `false` in `client/lib/nav.ts` → the row becomes a link and the footer note disappears once no item is disabled, since the config is the only source → AC-5
- Render a hovered or selected row: with a built section live, open its route → the row takes the accent surface from `--accent`, and the note stays hidden → AC-12
- Toggle theme: pick system and change the operating system preference → the sidebar and the top bar follow without a reload, since next-themes owns the state

## Top bar revision (build plan step 9) · added 2026-10-13

Steps for the reworked bar, under the same acceptance criteria. These supersede the three bar steps in the Shell contents section above, which describe the old bar (account button, theme toggle in the bar, brand lockup at 390 pixels); the sidebar steps there still stand.

### UI / manual

- [x] Open `/` at 1280 by 800 → the left end holds the panel button then a borderless muted pill reading Search, and the right end holds the bell then the avatar beside `Not signed in` → AC-5 · 2026-10-13
- [x] Hover the search slot, then the bell → the tips read `Search is not available yet` and `Notifications arrive with reminders`; click both → nothing opens and neither takes focus → AC-5 · 2026-10-13
- [x] Look at the whole bar → no account button, no brand lockup, and no theme control standing alone in it → AC-5 · 2026-10-13
- [x] Open the menu from the avatar and the name → Profile and Logout are disabled rows, and an Appearance label sits above three theme options → AC-5, AC-6 · 2026-10-13
- [x] Pick dark, then reload → the choice persists; pick system and change the operating system preference → the app follows → AC-6 · 2026-10-13
- [x] Keyboard only: Enter on the menu trigger, reach a theme option, press Enter → the theme changes and the focus ring stays solid at full opacity → AC-4, AC-6 · 2026-10-13: Enter opens the menu with focus on the first theme option, ArrowRight reaches the dark option, Enter flips the theme, and the ring stays 2px solid
- [x] Set the viewport to 390 by 844 → the search slot is still visible and truncating, the avatar is visible, there is no brand lockup in the bar, and the panel button opens the drawer → AC-5 · 2026-10-13
- [x] Tab through the bar → every stop shows a full opacity ring and none lands under the sticky bar → AC-4, AC-5 · 2026-10-13

### Commands

- [x] `cd client && npx vitest run` → the suite passes, including the four `top-bar.test.tsx` tests → AC-5, AC-6 · 2026-10-13: 6 files, 34 tests
- [x] `cd client && npm run a11y` with the dev server running → four page states, zero violations → AC-4, AC-5, AC-9 · 2026-10-13
- [x] `cd client && npm run design:check` → all pairs pass and the doc still matches `globals.css` → AC-1 · 2026-10-13: also re-run against a copy with a broken dark `--input`, which failed with 3 pairs below the bar, so the gate reads the code
- [x] `npm run verify` at the repo root → format, lint, and typecheck clean → AC-10 · 2026-10-13
- [x] `cd client && npm run build` → the production build finishes → AC-10 · 2026-10-13

### Acceptance-criteria coverage

- AC-4 covered by the keyboard step and the `a11y` run
- AC-5 covered by the desktop, 390 pixel, and placeholder steps, the top bar tests, and the `a11y` run
- AC-6 covered by the theme pick and reload step, the system preference step, and the top bar test
- AC-9 covered by the `design:check` and `a11y` runs
- AC-10 covered by the root `verify` and the client build

### Value sourcing rows worth varying

- Render the user menu trigger: edit `SESSION_NAME` in `client/components/top-bar.tsx` → the name beside the avatar changes with it, and it never becomes a personal name until feature 4 → AC-5
- Render the user menu contents: edit `Profile`, `Logout`, or `Appearance` in that file → the menu copy changes with them, and both rows stay disabled → AC-5
- Render the notifications bell: edit `BELL_TIP` → the hover tip changes with it, and the slot stays inert → AC-5
- Render the search slot: edit `SEARCH_LABEL` and `SEARCH_TIP` → the pill text and the tip change together, and the slot stays borderless and unfocusable → AC-5
- Toggle theme: pick system inside the menu and change the operating system preference → next-themes owns the state, so the page follows without a reload → AC-6
