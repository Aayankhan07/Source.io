# Design

<!-- impeccable:design-schema 1 -->

Recorded from the built result, not from intentions. Values here are what ships.

## The World: Luminous Studio & Obsidian Studio

Source.io is an intelligent study workspace engineered for deep focus, rapid absorption, and grounded retention. The visual system operates in two complementary, high-contrast modes:

1. **Luminous Light (Default Studio)** — Inspired by modern scientific research tools and clean Scandinavian editorial design. Crisp paper-white cards (`#ffffff`) floating over an ultra-subtle cool slate ground (`#f8fafc`), framed by hairline borders (`#e2e8f0`), deep slate typography (`#0f172a`), and luminous sky cyan accents (`#0284c7`).
2. **Obsidian Studio (Dark Theme)** — Designed for long night-reading sessions and intense cognitive work. A deep obsidian canvas (`#080d1a`), midnight slate elevated cards (`#0d1527`), hairline dark borders (`#17223b`), vivid electric sky accents (`#38bdf8`), and high-contrast stardust typography (`#f8fafc`).

---

## Palette & Design Tokens

Implemented via semantic HSL variables in `src/index.css` supporting dynamic `.dark` class switching and system preference auto-detection:

| Token | Light Theme ("Luminous") | Dark Theme ("Obsidian Studio") | Semantic Role |
|---|---|---|---|
| `--background` | `210 40% 98%` (`#f8fafc`) | `222 47% 6%` (`#080d1a`) | Primary application canvas |
| `--card` | `0 0% 100%` (`#ffffff`) | `222 44% 9%` (`#0d1527`) | Elevated cards, panels, and document containers |
| `--foreground` | `222 47% 11%` (`#0f172a`) | `210 40% 98%` (`#f8fafc`) | Primary high-contrast typography |
| `--muted-foreground` | `215 16% 47%` (`#64748b`) | `215 20% 65%` (`#94a3b8`) | Secondary metadata, labels, and helper text |
| `--primary` | `222 47% 11%` (`#0f172a`) | `199 89% 52%` (`#38bdf8`) | Primary call-to-action buttons |
| `--accent` | `210 40% 96%` | `217 33% 14%` | Hover states, tab wells, and item selections |
| `--border` | `214 32% 91%` (`#e2e8f0`) | `217 33% 16%` (`#17223b`) | Hairline containment rules |
| `--sidebar-background` | `210 40% 98%` | `224 50% 5%` (`#050811`) | Navigation drawer and library background |

---

## Typography

| Role | Font Family | Purpose |
|---|---|---|
| UI Sans | **Inter** / `system-ui` | Navigation, labels, buttons, badges, metadata |
| Display | **Inter Display** / `font-display` | Document titles, headers, modal headings |
| Reading & Notes | **Inter** / Prose Invert | Streamed notes, study passages, flashcard prompts |
| Numerical / Code | **Fira Code** / tabular numbers | Audio timestamps, citation similarity scores, coordinates |

`font-variant-numeric: tabular-nums` is used consistently across statistics, timestamps, score badges, and progress counters to prevent layout jitter.

---

## Geometry & Materials

- **Pill & Capsule Radii**: Capsule buttons (`rounded-full`), floating control bars, and tab navigators provide a tactile, approachable interface.
- **Card Radii**: Clean `rounded-2xl` and `rounded-3xl` for elevated panels, dialogs, and cards.
- **Hairline Borders**: `1px` subtle borders (`border-border`) isolate content layers without visual clutter.
- **Shadows**: Soft atmospheric drop shadows (`shadow-sm`, `shadow-md`, `shadow-2xs`) elevate interactive elements without heavy skeumorphism.

---

## The 5 Workspace Renderings

1. **Study Notes** (`MarkdownView`): Streamed structured markdown with headings, bold key concepts, and KaTeX mathematical formulas.
2. **Flashcards Deck** (`FlashcardsDeck`): 3D perspective flip cards with spaced repetition rating buttons (*Again*, *Hard*, *Good*, *Easy*) and a dynamic completion meter.
3. **Interactive Quiz** (`QuizPlayer`): Multi-question review with immediate feedback, rationale explanations, and score celebration card.
4. **Conversational Audio Recap** (`CustomAudioPlayer`): Two-host dialogue player with live audio waveform bars, speed toggle (1x / 1.25x / 1.5x / 2x), and timestamped transcript drawer.
5. **Grounded Document Chat** (`ChatPanel`): Question composer with cited passage tags, similarity score badges, and direct jump-to-source mechanics.

---

## Accessibility & Interaction

- Fully responsive across desktop, tablet, and mobile viewports.
- Keyboard accessible navigation and visible focus rings (`.focus-ring`).
- Accessible icon buttons with explicit `aria-label` tags.
- Verified WCAG AA contrast compliance across both light and dark themes.
- Zero Impeccable detector anti-pattern warnings.
