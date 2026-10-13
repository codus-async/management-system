# 0003. Design system and UI foundation: reasoning

## Context

> ⚠️ Premise note: The first build followed this spec's AC-9 as written, which held the `--border`, `--input`, and `--ring` tokens to 3 to 1. That is a stricter bar than WCAG 2.2 criterion 1.4.11 actually sets. The standard constrains the visual information needed to identify an **interactive** component and its states. A card edge, a table divider, and a section separator are not interactive components, so they carry no contrast obligation at all. Holding them to 3 to 1 forced every surface in the app to be outlined in a mid grey, which is what made the shipped result look like a wireframe. The fix is to re-scope AC-9 to the interactive set only, not to abandon the accessibility bar.

> ⚠️ Premise note: AC-14 as first written required cool tinted neutrals at hue between 250 and 265 with a blue accent, and AC-3 named Inter alone. The engineer has since replaced that direction with a warm palette, so those two criteria described a design nobody was building. A standard that describes an abandoned design is worse than no standard: the gate fails for a reason nobody believes in, and the fix is always to weaken the gate rather than to look at the colours. The hue band therefore moves to the warm hues the palette actually uses and the font pairing follows the code. The bars in AC-9 do not move, and the tokens that no longer met them are retuned instead.

> ⚠️ Premise note: The `frontend-design` skill is written for a studio giving each client a distinct identity, and this product is an internal enterprise tool. Its mandate to take aesthetic risk is already spent at the art direction layer, because Ember was chosen deliberately and the skill's own rule is that a pinned brief wins. What it still earns is the other half of itself: grounding the work in the subject, reviewing a plan before coding, keeping the boldness in one place, and writing copy a user can follow. Adopting it for that is the useful reading. Adopting it as licence to redesign each screen would undo the consistency this feature exists to create.

The client app began as the bare create-next-app scaffold: a default home page, Tailwind 4 installed, Geist fonts wired, no component library, no shared layout. The scope calls this feature the foundation: "visual language, layout, and base components so every screen feels like one product and works from the keyboard." Every later feature (schedule, tasks, contacts, the dashboard, the CEO view) will render inside whatever frame and tokens this decision puts down. Foundations are cheaper to build first than to retrofit: choosing the color system after twelve screens exist means reworking twelve screens.

The stack already names shadcn/ui as the component approach (root AGENTS.md, spec 0001) and Tailwind 4 as the styling system. shadcn is not a dependency you import at runtime; its CLI copies component source into the repo, so the code is ours to own and edit. Tailwind 4 moves theme configuration into CSS: tokens (the low level values behind every color, size, and font utility) live as CSS variables wired through the `@theme` directive, which is also how shadcn themes work. The backend already uses Zod 4 for validation; the client will match that major version so schemas can later be shared.

Two constraints shape the design without needing a vote. The project baseline is WCAG AA (root AGENTS.md), and the scope's done criteria name WCAG 2.2 minimums for text contrast plus keyboard operable base components. Separately, the root rules say root pages stay server components; interactive pieces (theme toggle, sidebar collapse) will be small client components inside a server rendered shell, which is the normal Next.js App Router pattern.

A second gap sits alongside the token one. The repo carries49 installed community skills covering every framework in the stack, and not one of them says how a screen should be designed or what its words should say. Each agent that has built UI so far invented an aesthetic approach from whatever it had seen, which is how scaffolding and templated defaults get shipped. The tokens this spec fixes say what the values are. They do not say how to decide what to build with them, or how to write the copy that ends up on the page.

## Options considered

### Option 1: Tokens, components, and app shell (chosen)

Stand up the full foundation in one feature: design tokens, the Slice 1 component set, and the shared app frame, with design.md as the living reference.

**Pros**:
- One decision now; every later screen inherits the frame and the tokens.
- The shell decision (sidebar versus top navigation) is settled before seven sections exist.

**Cons**:
- The largest first pass of the three options; more to verify before anything product facing ships.
- The shell ships before auth exists, so the user menu is a placeholder until feature 4.

### Option 2: Tokens and components only, no shell

Ship the visual language and components; let each feature bring its own chrome.

**Pros**:
- Smaller first pass; the shell could be designed alongside the dashboard when more content exists.

**Cons**:
- The shell decision gets redone per feature or deferred to the dashboard, which is the wrong feature to own global navigation.
- High risk of inconsistent frames (padding, nav placement, content width drift between screens).

### Option 3: Tokens and design.md only

Document the look and feel; build components per feature.

**Pros**:
- Cheapest to write; no component code to maintain yet.

**Cons**:
- Every feature reimplements button, dialog, and form behavior, including the accessibility details that are easiest to get wrong.
- Directly contradicts the scope's done criteria, which require keyboard capable base components.

### Option 4: Cool tinted neutrals with a surface ladder (chosen on review)

Retune the shipped token layer: split the interactive border from the decorative divider, add a real surface ladder so cards separate by lightness, give hover and selection their own tinted values, and move the greys off pure neutral onto a slightly blue cast.

**Pros**:
- Reads as a product rather than as a scaffold. The surface ladder means a card is a card without a heavy outline doing the work.
- Hover and selection become visible, which they currently are not, since `--accent`, `--secondary`, and `--muted` share one value.

**Cons**:
- A visible departure from stock shadcn zinc, so a reviewer comparing against a default shadcn app will see the difference.
- The surface ladder has to hold in both themes, which means twice the values to keep coherent.

### Option 5: Pure zinc, refined in place

Keep the neutral zinc family at near zero chroma and fix only the surface ladder and border weight, leaving the temperature alone.

**Pros**:
- Least churn; the tokens stay close to shadcn's defaults, so future upstream components drop in with less friction.

**Cons**:
- Pure grey at near zero chroma is exactly what reads as scaffolding. Fixing the ladder helps, but the greys stay cold in the wrong way, closer to printer paper than to a product.

### Option 6: Ember, a warm palette (chosen by the engineer)

Drop the cool blue direction entirely and rebuild the token layer on warm ivory surfaces, ink text, a terracotta accent, warm tinted greys, and Newsreader serif headings over Inter interface text. The engineer picked this by eye against the running app after the cool build, so it is a preference on record rather than an inference drawn from a brief.

**Pros**:
- The product acquires a point of view. Serif headings and a terracotta accent do the work that tinted greys alone could not, and the shell stops reading as a neutral admin tool.
- The palette came from looking at the real thing, so it is calibrated to the surfaces as they actually render rather than to a swatch.

**Cons**:
- It discards a direction this spec had already recorded and measured, so every accent and neutral number in the decision record had to be recomputed and reverified.
- Warm greys carry less contrast margin against warm ivory than cool greys did against the old neutrals, so the token layer has less headroom before a value trips a bar.

### Option 7: Name a design skill and register it (chosen)

Vendor Anthropic's `frontend-design` skill into the repo, list it in root `AGENTS.md` so every agent loads it on UI work, and scope it to process and writing while this spec owns the palette.

**Pros**:
- One place for the art direction process, already written and maintained upstream, rather than rules retyped into `AGENTS.md` where they quietly drift.
- The interface writing guidance is the part an enterprise tool most needs, and nothing else in the stack covers it.

**Cons**:
- An external skill can change under us. The vendored copy freezes a moment in time and needs an occasional resync against upstream.
- Its calibration section names our own palette family as a tell, so agents are handed a reason to second guess a direction this spec has already settled.

### Option 8: Copy the useful rules into AGENTS.md

Inline the relevant rules into the root `AGENTS.md` rules section and skip the skill file.

**Pros**:
- Self contained, nothing external to keep in sync, and the exact text is under our control.

**Cons**:
- Duplicates about9 KB of prose into the file that loads on every single task, and it goes stale the moment upstream improves the skill.

### Option 9: Record it in the spec only

Note the decision here and let agents find it by reading the spec.

**Pros**:
- No new files at all.

**Cons**:
- An agent building a screen has no reason to open a design system spec, so nothing would change in practice. A decision no agent reads is documentation, not a convention.

## Rationale

Option 1 matches the forces that actually shaped this decision. The scope lists this feature as a Foundation phase item with explicit done criteria (design.md covering type, color, spacing, and components; keyboard capable base components; WCAG 2.2 contrast minimums), and the project rule of thumb is foundations before features: retrofitting tokens after twelve screens exist costs more than building them first. Option 2 defers the shell to the dashboard, which would make the dashboard feature secretly own global navigation, a responsibility skew that is hard to unwind. Option 3 fails the scope's own bar and multiplies accessibility risk across every later feature.

The specific picks follow from the stack already on record. shadcn is named in root AGENTS.md and spec 0001, and its model of copying component source into the repo means the team owns the code rather than depending on a package's release cadence. Tailwind 4's `@theme` and CSS variables are the mechanism shadcn themes use natively, so tokens and components share one source of truth; the tailwind-v4-shadcn skill documents the `@theme inline` pattern this build should follow. Inter for interface text and Newsreader for headings is the engineer's preference and is a reasonable one for a data heavy internal tool: Inter's tabular figures and x height hold up in dense tables and small UI text, and a serif heading is the cheapest way to give a dense tool a voice. The terracotta accent keeps interactive elements findable without turning the product into a branded marketing surface, which would fight the "quiet professional" direction the engineer chose. Sidebar as a component rather than a custom layout is the accessibility argument more than the convenience one: focus management, escape to close, and the mobile drawer behavior are already tested in the component, and WCAG AA is non negotiable here.

Zod 4 on the client is about the horizon where meeting and task forms validate the same shapes the API validates. One Zod major version across the repo means one schema can live in a shared place later without a dual version maintenance tax.

The revision exists because the shipped result looked worse than the decision intended, and the reason was in this spec rather than in the build. AC-9 named `--border` alongside `--input` and `--ring` as needing 3 to 1. The build did exactly that. But 3 to 1 under criterion 1.4.11 is about identifying an interactive component, and a card edge is not one. Reading the standard more strictly than it is written cost the product its only source of depth in light mode, because with `--card` and `--background` both at pure white the border was the only thing making a card read as a card, and that border was now a heavy grey. The two failures compound: no surface ladder, and a heavy outline standing in for one.

Option 4 fixes both at once and fixes the third thing nobody had named yet, which is that `--accent`, `--secondary`, and `--muted` were the identical value, so hover and selection were invisible. Cool tinted greys over pure zinc is the call with the most leverage per unit of change: it touches no component API, no layout, and no behavior, and it is the difference between the interface reading as a product and reading as a scaffold. The contrast numbers in this revision were computed against the worst case surface in each theme rather than against white, which is how the first pass shipped a dark input border that only reached 1.97 to 1 on its own card.

Option 6 then replaced the palette underneath all of that, which is why this revision exists. The engineer looked at the running app and chose a warm direction instead of the cool one, and that is a legitimate input: the art direction had not been settled by anyone outside the two of us, and looking at the real thing beats looking at a swatch. What it did not change is the accessibility bar. The tokens that stopped clearing it were retuned, not waived: the light input went from 1.26 to 1 against the page to 3.32 to 1, the dark accent went from 3.52 to 1 as text to 5.03 to 1, and secondary and muted were separated again after the new palette collapsed them. The one criterion that had to move was AC-14, because "hue between 250 and 265" is not a property of contrast or of legibility, it is a property of the previous palette, and holding a design to a hue band it has abandoned is how a gate loses its meaning.

Option 7 because the repo already works this way: it vendors skills by copying them in and listing them in root `AGENTS.md`, so this is the existing pattern rather than a new one. Option 8's version of it, retyping the useful rules into `AGENTS.md`, is exactly how a convention rots, because nobody resyncs prose by hand. Option 9 fails on reach, since an agent with a screen to build opens a component file, not a design system spec. The skill is Apache 2.0 and is copied unmodified with its licence file, which satisfies the redistribution conditions. It is scoped to process and writing rather than to palette because Ember is a deliberate choice already on record, and the skill itself says a pinned brief wins; letting it reopen the art direction would undo the consistency this feature exists to create. The one honest cost is worth stating plainly: its calibration section names a warm cream ground, a serif display, and a terracotta accent as the top tell of AI generated design, which is close to what shipped here, so every agent that reads it will be told to question this direction. That is recorded in the spec rather than left to be discovered on a screen six features from now.

## References

**Project sources** (verifiable, in this repo):
- Root `AGENTS.md`: stack (Next.js 16, React 19, Tailwind CSS 4, shadcn/ui), server component rule, WCAG AA accessibility baseline, Zod already in the backend
- Scope feature 3, "Design system and UI foundation": intent and done criteria (design.md covering type, color, spacing, components; keyboard capable base components; WCAG 2.2 contrast minimums)
- Spec [0001 stack and architecture](../0001-stack-and-architecture/index.md): shadcn and Tailwind already on record as the client approach
- Spec [0002 domain data model](../0002-domain-data-model/index.md): confirms this feature needs no schema of its own
- Installed community skills: `frontend-design`, `shadcn`, `tailwind-v4-shadcn`, `tailwind-design-system`, `react-hook-form`, `zod`
- The `frontend-design` skill itself (`.agents/skills/frontend-design/SKILL.md`, from `anthropics/skills`, Apache 2.0): its process guidance and its calibration list of design tells
- `skills-lock.json`: the record of which skills are installed, and the evidence that its `computedHash` is not a plain sha256 of the file

**Practices & standards**:
- WCAG 2.2 AA minimums this feature owns: 4.5 to 1 for normal text and 3 to 1 for large text and **interactive** component boundaries (criteria 1.4.3 and 1.4.11), visible focus not obscured (2.4.7, 2.4.11), and 24 by 24 CSS pixel target size (2.5.8). Criterion 1.4.11 constrains the visual information needed to identify an interactive component and its states; it does not constrain decorative or structural borders.
- Semantic design tokens: colors and spacing named by role (background, primary, muted) rather than by literal value, so one change restyles consistently
- Surface ladder over outline: separation between planes carried by a lightness step and a shadow rather than by a border weight (basis: the diagnosis of the first build, where card and page shared one value and the border stood in for depth)
- Contrast measured against the worst case surface, not against white (basis: the first build shipped a dark input border that reached 3 to 1 against white and only 1.97 to 1 against its own card)
- Tracer Bullet development: one thin working thread through every layer before thickening (basis: the project's recorded build approach)
- Component source copied into the repo (the shadcn model): the CLI copies component files in; they are owned by the team, not imported from a package at runtime
