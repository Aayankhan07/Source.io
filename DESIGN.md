# Design

<!-- impeccable:design-schema 1 -->

Recorded from the built result, not from intentions. Values here are what ships.

## The world: The Plate

Source.io is an engraved chart, not a dark app. The governing metaphor is the
**celestial star atlas as a notation system** — magnitude ramps, coordinate
rules, hairline plate borders, tabular figures, and a single annotation accent
used the way a red flashlight marks a paper chart without destroying night
vision.

It fuses with the product rather than decorating it:

| Atlas grammar | Source.io mechanism |
|---|---|
| Plates with matched edges; an index points into each | Document library → five renderings of one source |
| Magnitude = dot diameter on a fixed ramp | Citation similarity score |
| Coordinates locate every object | Passage citations locate every claim |
| Annotation red marks what is under the eye | Primary action, active plate, live citation |

**This is a notation system, not a space theme.** No constellation figures, no
starfields, no space imagery. If it ever reads as astronomy, it has failed.

## Palette

All values are HSL triplets on the `.dark` layer in `src/index.css`. The app is
dark-only (`<html class="dark">` is static); the `:root` block exists because
shadcn primitives assume those variables, not because a light theme ships.

| Token | Value | Role |
|---|---|---|
| `--background` | `222 52% 8%` | Plate navy — the chart ground |
| `--foreground` | `40 30% 94%` | Stardust — warm chalk, never pure white |
| `--card` | `218 40% 13%` | Chart blue — a plate laid on the ground |
| `--primary` | `14 90% 58%` | Annotation amber |
| `--primary-glow` | `30 95% 66%` | Amber hover |
| `--muted-foreground` | `215 18% 66%` | Fog veil — tinted from the ground, never gray |
| `--border` | `216 28% 22%` | Hairline rule |
| `--surface-sunken` | `224 56% 6%` | Input wells, code, the sidebar field |
| `--surface-raised` | `218 38% 16%` | Hover, secondary fills |
| `--surface-elevated` | `216 34% 21%` | Top tier |
| `--sidebar-background` | `224 50% 7%` | The index sits deeper than the plate |

**Colour strategy: Restrained.** Neutrals plus one accent. The amber is reserved
for the object currently under the eye — one primary control per view. Using it
decoratively breaks the system.

Verified contrast on the built render: h1 16.8:1, body and nav 7.68:1, amber on
plate 5.96:1. All pass WCAG AA for body text.

## Typography

| Role | Face | Where |
|---|---|---|
| Display | **Spectral** | Plate titles, headings, `.font-display` |
| UI | **Inter** | Chrome, labels, controls |
| Reading | **Literata** | Generated study material (`.prose-invert-tight`) |
| Measurement | **Fira Code** | Coordinates, plate IDs, figures |

`font-variant-numeric: tabular-nums` is global — figures are chart data and
align in columns everywhere.

Inter is retained deliberately as the UI sans and is the one standing detector
finding. The display voice is Spectral and the reading voice is Literata; Inter
does only the small-size chrome work it is good at, so the chrome recedes and
the plate lettering leads.

## Hierarchy: the magnitude ramp

Importance is **diameter on a fixed scale**, never a louder colour. Declared in
`src/index.css` as `--mag-1` (0.75rem) through `--mag-5` (0.25rem), with opacity
falling from 1.0 to 0.42 so fainter objects sit further back.

`src/components/common/Magnitude.tsx` maps a 0..1 similarity onto the ramp.
Currently rendered by the chat citation chips; any future strength, confidence,
or relevance indicator should read off the same ramp rather than inventing one.

## Materials

Defined in the `@layer utilities` block of `src/index.css`:

- **`.plate`** (aliased by the legacy name `.glass-panel`) — opaque `--card`
  ground, hairline border, soft offset shadow. **Not glass**; the blur was
  removed in this redesign.
- **`.plate-registered`** — corner registration ticks in amber at 50%.
- **`.plate-field`** — 4rem coordinate rules; the page's atmosphere.
- **`.magnitude`** — the sized dot.
- **`.focus-ring`** — keyboard focus for hand-rolled interactive elements.

Radius is `0.25rem` throughout. A plate is ruled, not cushioned.

Browser surfaces are themed rather than left to defaults: selection, caret,
`accent-color`, scrollbar (2px radius, ruled), and underline offset.

## Motion

One authored moment, not scattered hovers:

- **`.plate-settle`** — content resolves from 6px below over 420ms on
  `cubic-bezier(0.16, 1, 0.3, 1)`, from an already-visible default.
- **`.plate-surveying`** — an amber rule sweeping across a plate while a source
  is being ingested.

Hover behaviour is a rule brightening, never a lift. Everything is disabled
under `prefers-reduced-motion: reduce`.

## Components

shadcn/ui primitives in `src/components/ui/` are rebuilt in the chart
vocabulary — square shoulders, hairline rules, amber reserved for primary:

- **Button** — `outline` is the workhorse (a chart control is a line, not a
  fill); `default` carries the amber.
- **Input / Textarea** — sunken well, border resolves to amber on focus.
- **Tabs** — a plate index: names on a ruled baseline with a 2px amber marker
  under the active plate. Not pills.
- **Badge** — squared, tabular, gapped for a leading magnitude dot.
- **Card / Dialog / AlertDialog** — plates.

## Refused

Category defaults this world does not use, and why:

- Glass and blur as decoration — replaced by opaque ruled plates
- Gradient text — emphasis comes from weight, size, and the amber
- Eyebrow/kicker labels above headings — the heading carries itself
- Section numbers (01/02/03) — the icons already name the steps
- Hover lift on cards — plates do not levitate; their rule brightens
- Radial blur orbs — the chart is fielded by coordinate rules
- macOS traffic-light dots on app previews — replaced by plate identification

## Accessibility

Carried forward from the prior remediation pass and not to be regressed:
keyboard operability on every interactive element, visible focus rings,
accessible names on icon-only controls, and a 12px minimum type size.

## Coverage

Built and visually verified: landing page (desktop + 375px), auth in all three
states, 404.

**Not yet visually verified:** the workspace and its five tabs, the sidebar, the
empty state, and the upload dialog. These inherit the token layer and primitives
so they render in the world, but their composition has not been reviewed against
this system. The project requires email confirmation, which blocked reaching a
signed-in session during the build.
