# CEO PA design system

The visual language for the client app. This is an internal tool for a chief
executive and the assistant who runs the day, so the look is quiet and
professional: warm ivory surfaces, ink text, a terracotta accent, and
Newsreader serif headings over Inter for the interface. A left sidebar with a
top bar sits on every screen.

Token values live in `app/globals.css`. The tables between the markers below
are generated from that file by `npm run design:tokens`, so they cannot drift.
`npm run design:check` fails the build if a table is stale, a contrast pair
falls short, the surface ladder stops ascending, or the emphasis surfaces
collapse onto one value.

## Character

Restraint first. Most of the screen is neutral, so the terracotta accent stays
findable. The greys are warm tinted rather than pure grey: every one carries a
little chroma in the warm band, which is what stops the interface reading as
scaffolding, because a pure grey at zero chroma reads as printer paper. Density
is welcome: rows, tables, and side panels should feel close together without
feeling cramped. Motion is short and functional, never decorative.

Surfaces form a ladder, in ascending order: page background, sidebar, card,
then popover for anything floating. Each step is a real change in lightness, so
a card is a card because of its own surface, not because of a line drawn around
it. In light mode the steps are small ivory values that run up to white, and
the soft shadow under a card does the rest of the work. In dark mode the steps
run the other way, progressively lighter.

## Elevation

Depth is carried by shadows in light mode and by the surface ladder in dark
mode. A dark shadow on a dark surface reads as a smudge, so dark mode drops
shadows to none and lets the ladder do the work.

Cards take `shadow-sm`. Dialogs and dropdowns take `shadow-lg` or `shadow-md`.
Every floating surface also keeps a hairline `ring-border` so it still reads as
separated in dark mode, where the shadow is gone. All floating surfaces use
`bg-popover`, the top of the ladder.

## Type

Inter is the interface typeface, loaded with `next/font/google` and exposed as
`--font-sans`. Newsreader is loaded the same way and exposed as
`--font-newsreader`, which `globals.css` resolves through `--font-heading`, so
h1 to h3 render in the serif at medium weight. h4 and everything below stay in
Inter. Geist Mono is loaded for code and reference identifiers such as
`FU-104`, exposed as `--font-mono`. Use `font-mono` only for those strings, not
for running text.

The type scale below is the complete set of font sizes. Shell and demo screens
use these tokens and nothing else, so a screen cannot invent a size that no
other screen has. Prefer `text-sm` for dense UI, `text-base` for body copy,
and `text-2xl` for a page title.

## Numeric columns

Any column of numbers a person compares down the page gets `tabular-nums`, so
the digits line up. Dates, amounts, counts, durations, and reference numbers
all qualify. Apply it to the cell, not the table:

```tsx
<TableCell className="tabular-nums">2 days</TableCell>
```

## Shell

Every screen sits inside one frame: a left sidebar and a top bar. The sidebar
carries the brand, the section navigation from `lib/nav.ts`, and a footer note
while sections are still unbuilt. On a small screen it becomes a drawer opened
from the panel button in the bar.

The bar holds, on the left, that panel button and a borderless search slot: a
muted pill with a search icon and the word Search, shown at every width, where
it shrinks and truncates rather than hiding. On the right sits an inert bell,
then a user menu opened from an avatar beside the name.

Three slots are placeholders on purpose. Each belongs to the feature that will
replace it, and none of them pretends to work today:

| Slot | Now | Replaced by |
|---|---|---|
| Search | Muted pill, tip `Search is not available yet`, not focusable | Feature 12, Search |
| Bell | Icon with the tip `Notifications arrive with reminders`, announced to nobody | Feature 6, Tasks and reminders |
| Name | `Not signed in` beside the avatar, with Profile and Logout disabled in the menu | Feature 4, Auth and roles |

The theme control lives inside that menu under an Appearance label: light,
dark, and system as three options. System hands control back to the operating
system preference, so the choice can always come back.

<!-- tokens:start -->

## Color tokens

Values live in `app/globals.css` under `:root` (light) and `.dark`. Hex columns are derived from the `oklch` values.

| Token | Role | Light | Dark |
|---|---|---|---|
| `--background` | Page background | `oklch(0.9729 0.0013 106.4)` (#f6f6f5) | `oklch(0.1916 0.0043 84.6)` (#151412) |
| `--foreground` | Body text | `oklch(0.2603 0.004 106.4)` (#242422) | `oklch(0.9702 0.004 84.6)` (#f6f5f2) |
| `--card` | Card surface | `oklch(0.9938 0.0013 106.4)` (#fdfdfc) | `oklch(0.2268 0.0041 84.6)` (#1d1c1a) |
| `--card-foreground` | Card text | `oklch(0.2603 0.004 106.4)` (#242422) | `oklch(0.9702 0.004 84.6)` (#f6f5f2) |
| `--popover` | Popover surface | `oklch(1 0 89.9)` (#ffffff) | `oklch(0.252 0 89.9)` (#222222) |
| `--popover-foreground` | Popover text | `oklch(0.2603 0.004 106.4)` (#242422) | `oklch(0.9702 0.004 84.6)` (#f6f5f2) |
| `--primary` | Accent, primary action, link text | `oklch(0.5442 0.1197 39.3)` (#a95437) | `oklch(0.6683 0.1447 51)` (#d97736) |
| `--primary-foreground` | Text on accent | `oklch(1 0 89.9)` (#ffffff) | `oklch(0.185 0.004 84.6)` (#131311) |
| `--secondary` | Lower emphasis surface | `oklch(0.9609 0.0013 106.4)` (#f2f2f1) | `oklch(0.2934 0.0039 84.6)` (#2d2c2a) |
| `--secondary-foreground` | Text on secondary | `oklch(0.2603 0.004 106.4)` (#242422) | `oklch(0.9702 0.004 84.6)` (#f6f5f2) |
| `--muted` | Subtle surface | `oklch(0.9699 0.0013 106.4)` (#f5f5f4) | `oklch(0.2523 0.004 84.6)` (#232220) |
| `--muted-foreground` | Secondary text, placeholder | `oklch(0.5375 0.004 106.4)` (#6e6e6b) | `oklch(0.7252 0.004 84.6)` (#a7a6a3) |
| `--accent` | Hover and highlight surface | `oklch(0.9554 0.0093 62.6)` (#f5efea) | `oklch(0.3353 0.0181 45.9)` (#3f342f) |
| `--accent-foreground` | Text on accent surface | `oklch(0.2603 0.004 106.4)` (#242422) | `oklch(0.9702 0.004 84.6)` (#f6f5f2) |
| `--destructive` | Error emphasis, destructive action fill | `oklch(0.5 0.182 29.5)` (#b42318) | `oklch(0.7449 0.1269 25.8)` (#f28b82) |
| `--destructive-foreground` | Text on destructive fill | `oklch(1 0 0)` (#ffffff) | `oklch(0.1913 0 89.9)` (#141414) |
| `--border` | Decorative dividers and card edges (not an interactive boundary) | `oklch(0.8752 0.0041 106.5)` (#d6d6d3) | `oklch(0.3485 0.0043 84.6)` (#3b3a38) |
| `--input` | Form control boundary (interactive, held to 3 to 1) | `oklch(0.6228 0.003 106.5)` (#878785) | `oklch(0.5546 0.0046 84.6)` (#747370) |
| `--ring` | Focus ring | `oklch(0.5442 0.1197 39.3)` (#a95437) | `oklch(0.6683 0.1447 51)` (#d97736) |
| `--sidebar` | Sidebar surface | `oklch(0.9848 0.0013 106.4)` (#fafaf9) | `oklch(0.205 0.0042 84.6)` (#181715) |
| `--sidebar-foreground` | Sidebar text | `oklch(0.2603 0.004 106.4)` (#242422) | `oklch(0.9702 0.004 84.6)` (#f6f5f2) |
| `--sidebar-primary` | Sidebar accent | `oklch(0.5442 0.1197 39.3)` (#a95437) | `oklch(0.6683 0.1447 51)` (#d97736) |
| `--sidebar-primary-foreground` | Text on sidebar accent | `oklch(1 0 89.9)` (#ffffff) | `oklch(0.185 0.004 84.6)` (#131311) |
| `--sidebar-accent` | Sidebar hover and selected | `oklch(0.9554 0.0093 62.6)` (#f5efea) | `oklch(0.3353 0.0181 45.9)` (#3f342f) |
| `--sidebar-accent-foreground` | Text on sidebar hover | `oklch(0.2603 0.004 106.4)` (#242422) | `oklch(0.9702 0.004 84.6)` (#f6f5f2) |
| `--sidebar-border` | Sidebar boundary | `oklch(0.6524 0.0044 106.5)` (#90908d) | `oklch(0.5992 0.003 84.6)` (#81807e) |
| `--sidebar-ring` | Sidebar focus ring | `oklch(0.5442 0.1197 39.3)` (#a95437) | `oklch(0.6683 0.1447 51)` (#d97736) |

## Type scale

Defined in `app/globals.css` under `@theme inline`. These are the only font sizes used in the shell and demo screens.

| Token | Size | Line height |
|---|---|---|
| `--text-xs` | 0.75rem | 1.4 |
| `--text-sm` | 0.875rem | 1.5 |
| `--text-base` | 1rem | 1.6 |
| `--text-lg` | 1.125rem | 1.6 |
| `--text-xl` | 1.25rem | 1.3 |
| `--text-2xl` | 1.5rem | 1.25 |
| `--text-3xl` | 2rem | 1.2 |
| `--text-4xl` | 2.5rem | 1.15 |

## Radius

`--radius` is the base step; the rest are derived from it. Components use `sm` (controls), `md` (compact surfaces), and `lg` (cards, panels).

| Token | Value |
|---|---|
| `--radius` | 0.625rem |
| `--radius-sm` | calc(var(--radius) * 0.6) |
| `--radius-md` | calc(var(--radius) * 0.8) |
| `--radius-lg` | var(--radius) |
| `--radius-xl` | calc(var(--radius) * 1.4) |

## Spacing and fonts

Spacing base unit: `0.25rem` (Tailwind 4 default; the app does not override it). Every gap, pad, and margin is a multiple of it, so gaps land on an 8px rhythm.

Sans: `var(--font-inter)` (Inter, loaded with `next/font/google`). Headings h1 to h3: `var(--font-newsreader)` (Newsreader, resolved from `--font-newsreader`). Mono: `var(--font-geist-mono)` (Geist Mono, code only).

<!-- tokens:end -->

## Component inventory

Components live in `components/ui` and are copied from the shadcn registry, so
the code is ours to edit. Reach for these before writing new markup.

| Component | Use it for | Notes |
|---|---|---|
| `Button` | Every action | `variant="outline"` for a secondary action, `ghost` for a quiet one, `destructive` only for something that removes or errors. Icon only buttons use `size="icon-sm"` or smaller and need an `aria-label`. |
| `Input`, `Textarea` | Text entry | Pair with `FieldLabel`. Mark invalid controls `aria-invalid` and point `aria-describedby` at the error. |
| `Select` | Choosing one option | Prefer a `Select` over a radio row when there are more than three options. |
| `Checkbox` | Independent yes or no | Wrap in a horizontal `Field` so the label sits beside it. A `role="checkbox"` element is not a labelable element, so point `aria-labelledby` at the label as well as setting `htmlFor`. |
| `Card` | Grouping a block of related content | `CardHeader` carries the title and description, `CardContent` carries the body. |
| `Table` | Comparable rows | Numeric columns get `tabular-nums`. Keep headers short. |
| `Badge` | A short status | `secondary` is the default, `destructive` marks something overdue or failed. |
| `Tabs` | Switching between peer views | One `TabsList` per screen region, with an `aria-label`. |
| `Dialog` | A task that must finish or be dismissed | Trap focus, close on Escape, return focus to the trigger. |
| `DropdownMenu` | Secondary actions on an object | Keep destructive items last. |
| `Toast` | Confirming something already happened | Call `toast.add({ title, description, type })`. Toasts never carry information a person must act on. |
| `Skeleton` | Loading | Match the shape of the content that replaces it. |
| `Empty` | A list with nothing in it | Say what is missing and offer the one action that fills it. |
| `Field`, `FieldLabel`, `FieldError` | Form rows | `FieldError` already renders `role="alert"`. |
| `Sidebar` | Section navigation | Driven by `lib/nav.ts`. |

## State patterns

Three treatments, used everywhere, never reinvented per screen.

**Loading** shows `Skeleton` rows shaped like the content that is coming, with
`aria-busy="true"` on the region. Do not show a spinner where a shape will do.

**Empty** uses `Empty` with a title, one sentence of description, and the
single action that fills the list. An empty state is not an error.

**Error** uses `components/error-state.tsx`. It states what failed, says what
did and did not happen, and offers a retry when retrying could work. It renders
`role="alert"` so it is announced without stealing focus.

## Accessibility rules

These are the bars this project holds itself to. They are checked in
`scripts/a11y-check.mjs` and in the contrast gate.

**Contrast.** Body text and secondary text meet 4.5:1 against their surface in
both themes, measured against the worst case surface in that theme rather than
against white. The 3:1 non text bar applies to interactive component boundaries
only: the `--input`, `--ring`, and `--sidebar-border` tokens. Decorative and
structural borders (`--border`: card edges, table dividers, section rules) are
not interactive components, so WCAG 1.4.11 does not constrain them. They are set
to a hairline and the gate holds them to a visibility floor instead of to 3:1.
Every pair is checked by `npm run design:check`, which also asserts the surface
ladder ascends and the emphasis surfaces stay distinct.

**Focus.** Every element reachable by Tab shows a solid 2px outline in the ring
color, offset by 2px. It is never drawn at reduced opacity. The rule lives in
`globals.css` and is deliberately important, because the copied shadcn
components ship an `outline-none` utility that would otherwise delete it.

**Keyboard.** Every action works from the keyboard alone. Dialogs and the
mobile sidebar trap focus while open, close on Escape, and give focus back to
the control that opened them. The theme toggle is a group, so arrow keys move
between its options.

**Target size.** Interactive controls are at least 24 by 24 CSS pixels
including icon only buttons. Where a control is visually smaller, its hit area
is expanded.

**Focus not obscured.** The top bar is sticky but does not overlay content, so
focused controls are never hidden underneath it.

**Errors.** Each invalid control is marked `aria-invalid`, and its message is
linked with `aria-describedby`. A failed submit moves focus to the first field
with an error. Messages say what to do, not what went wrong.

## Departures from stock shadcn

The shadcn `base-nova` zinc preset is the starting point, not the destination.
These are the changes from it. They are deliberate and they are visible.

**Neutrals are warm tinted, not zinc.** Every neutral token in the surface
ladder and the emphasis set carries chroma above zero at a hue between 80 and
115, the warm band the Ember palette sits in: light neutrals near hue 106, dark
ones near hue 85. Stock zinc sits at near zero chroma, which is what made the
first build read as scaffolding rather than as a product.

**The surface ladder is four steps, and light mode no longer uses pure white for
both the page and the card.** Stock zinc sets `--card` and `--background` to the
same white in light mode, so a card has no surface of its own and depends
entirely on its border to read as a card. Here the page is the darkest step,
the sidebar sits just above it, the card is near white, and the popover is
white. The steps are small on purpose, because the palette wants every surface
near white, so the ladder does the separating and the shadow does the rest.

**`--border` and `--input` are split.** They are the same token in stock shadcn,
which is the single change that most affected the first build. `--input` and
`--sidebar-border` stay at 3 to 1 as interactive component boundaries. `--border`
drops to a decorative hairline, 1.35 to 1 in light and 1.62 to 1 in dark,
because a card edge or a table divider is not an interactive component and the
standard does not ask it to clear 3 to 1. Holding both to 3 to 1 outlines every
surface in the app in a heavy grey.

**`--secondary`, `--muted`, and `--accent` are three different values.** Stock
zinc gives all three the same value, so a hover state is invisible. `--accent`
now carries a tint of the primary hue, so a hovered dropdown row or a selected
navigation item reads as hovered or selected.

**Depth is shadows in light mode and the ladder in dark mode.** Floating
surfaces carry a shadow that resolves to `none` in dark, plus a hairline
`ring-border`. Stock components drew their boundary with
`ring-1 ring-foreground/10`, which double defines a card once a shadow is
present; that ring is now the hairline token instead.

**The accent is terracotta, and it diverges by theme on purpose.** Light keeps
`#A95437` with white text on it, 5.24 to 1. Dark lifts to `#D97736` with ink
text on it, 5.90 to 1, and used as link text that lifted value clears 5.03 to 1
against the lightest dark surface. The light value cannot simply be reused in
dark: as text on a dark surface it reaches only 3.52 to 1, and it cannot be
lightened far enough to fix that while still carrying white text. `--ring` and
`--link` are the same terracotta rather than a light zinc, since a grey ring
does not clear 3 to 1 in light mode.

**`--destructive` is a deeper red in light mode and carries its own
`--destructive-foreground`.** Tinted destructive buttons, the shadcn default,
cannot reach 4.5:1 in dark mode, so destructive fills are solid.

**Every copied component with a partial opacity focus ring has been set to full
opacity**, including the ones inside `sidebar`, `field`, and `button`.

## Changing a token

1. Edit the value in `app/globals.css` under `:root` and under `.dark`.
2. Run `npm run design:tokens` to refresh the tables here.
3. Run `npm run design:check`. It fails if any pair drops below the bar or if
   these tables are out of date.
4. Run `npm run a11y` with the dev server running to re check the pages.
