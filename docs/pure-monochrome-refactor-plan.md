# Pure Monochrome Refactor Plan: "Editorial Paper & Obsidian Ink"

> **For agentic workers:** REQUIRED SUB-SKILL: Use `superpowers:subagent-driven-development` or `superpowers:executing-plans` to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Transform Source.io across the entire product (Landing page, App Shell, Dashboard, Study Library, Notes Workspace, Flashcards, Quiz, Podcast, and Settings) into a 100% Pure Monochrome aesthetic ("Editorial Paper & Obsidian Ink"), inspired by high-end publishing tools (Vercel, Notion, Linear, Apple Books). Eliminate all residual chroma (`sky`, `cyan`, `emerald`, `purple`, `violet`, `amber`, `rose`) and replace hue contrast with rich tactile surface, border, and typographic contrast.

---

## Architecture & Palette System

### 1. The 4-Shade Monochrome Foundation
- **Canvas (`#FAF9F6`):** Warm editorial paper background for the workspace and landing page (`bg-tactile-canvas` / `bg-[#FAF9F6]` / `dark:bg-slate-950`).
- **Paper Cards (`#FFFFFF`):** Crisp elevated white surfaces (`bg-white` / `dark:bg-slate-900`) with structured hairlines (`border-slate-200/80` / `dark:border-slate-800`).
- **Muted Ink (`slate-500` / `slate-600`):** Secondary metadata, inactive states, helper text, and subtle icons.
- **Obsidian Ink (`slate-900` / `slate-950`):** Headlines, active pills, solid progress fills, primary action buttons, and grounded verification tags.

### 2. Specialized Pedagogical Feedback (Monochrome Without Chroma Confusion)
- **Flashcards:**
  - `Again [1]`: Secondary Ghost ink (`bg-white dark:bg-slate-900 hover:bg-slate-100 text-slate-800 dark:text-slate-200 border border-slate-300 dark:border-slate-700` + `↺` icon).
  - `Mastered [2]`: Primary Obsidian ink (`bg-slate-900 hover:bg-slate-800 text-white dark:bg-white dark:hover:bg-slate-100 dark:text-slate-900 border border-slate-900 shadow-xs` + `✓` icon).
- **Quiz Grading:**
  - `Correct Choice`: High-contrast obsidian ink border (`border-2 border-slate-900 bg-slate-100/90 dark:border-white dark:bg-slate-800/90 text-slate-900 dark:text-white`) with filled obsidian check badge `✓`.
  - `Incorrect Choice`: Subdued dashed hairline (`border border-dashed border-slate-300 dark:border-slate-700 bg-transparent opacity-50 line-through text-slate-500`) with `✕` mark.
  - `Grounded Proof`: Obsidian pill badge (`bg-slate-900 text-white dark:bg-white dark:text-slate-900 font-mono text-[10px] px-2 py-0.5 rounded-md`).
- **Inline Citations & Footnotes:**
  - Academic Footnote Pill: `bg-slate-100 hover:bg-slate-900 dark:bg-slate-800 dark:hover:bg-white text-slate-800 hover:text-white dark:text-slate-200 dark:hover:text-slate-900 border border-slate-300 dark:border-slate-700 font-mono text-[10px] px-1.5 py-0.5 rounded transition-colors`.

---

## File Structure & Touch Points

| Area | Key Files | Primary Modifications |
| :--- | :--- | :--- |
| **Global Theme & CSS** | `app/globals.css`<br>`src/index.css`<br>`tailwind.config.ts` | Align CSS variables to obsidian ink and neutral stone; strip purple/sky gradients; update `.citation-chip`, progress bars, and selection colors. |
| **Document Workspace** | `src/features/documents/pages/DocumentWorkspace.tsx`<br>`src/components/common/MarkdownView.tsx`<br>`src/features/documents/components/WorkspaceOutline.tsx` | Convert reading indicators, outline indicators, active tabs, PDF export headers, and audio players to obsidian ink. |
| **Pedagogical Practice** | `src/features/documents/components/FlashcardsDeck.tsx`<br>`src/features/documents/components/QuizPlayer.tsx` | Convert `Again`/`Mastered` to ghost vs obsidian; convert Quiz answers to obsidian check vs dashed strike-through. |
| **Copilot & Quota** | `src/features/documents/components/AskPanel.tsx`<br>`src/components/common/DailyQuotaPill.tsx` | Strip sparkle colors, convert citations and AI reply badges to obsidian/stone. |
| **Dashboard & Library** | `src/features/dashboard/components/TactileDashboard.tsx`<br>`src/features/dashboard/components/TactileSourceCards.tsx`<br>`src/features/dashboard/components/TactilePerformanceChart.tsx`<br>`src/features/documents/components/UploadDialog.tsx` | Replace colored format pills (`PDF`, `AUDIO`, `YOUTUBE`) with monochrome editorial tags; unify chart stroke and resume card. |
| **Landing Page** | `src/components/landing/*` (Hero, Workflow Demo, Pipeline, Credibility, Pricing) | Convert all cyan/emerald/purple badges, buttons, underlines, and pricing tags to editorial monochrome. |

---

## Implementation Tasks

### Phase 1: Global Theme & Base Typography Tokens
- [x] **Step 1.1: Refactor CSS variables in `app/globals.css`**
  - Set `--primary` and `--primary-glow` strictly to obsidian ink (`222.2 47.4% 11.2%` / `#0F172A`).
  - Standardize `--ring`, `--accent`, and `--border` to neutral stone and slate scales.
  - Replace text selection highlight with obsidian/stone (`::selection { background: #0F172A; color: #FFFFFF; }`).
- [x] **Step 1.2: Refactor `.citation-chip` in `app/globals.css`**
  - Light mode: `bg-slate-100 text-slate-800 border-slate-300 hover:bg-slate-900 hover:text-white`.
  - Dark mode: `dark:bg-slate-800 dark:text-slate-200 dark:border-slate-700 dark:hover:bg-white dark:hover:text-slate-900`.
- [x] **Step 1.3: Update `DailyQuotaPill.tsx` progress bar and quota indicator**
  - Change progress bar fill from sky/purple to solid obsidian `bg-slate-900 dark:bg-white`.
  - Standardize popover and quota badges to crisp monochrome.

---

### Phase 2: Document Workspace & Reading Experience
- [x] **Step 2.1: Update `MarkdownView.tsx` inline citation parser**
  - Ensure citation chips match the academic footnote pill styling (`bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border-slate-300 dark:border-slate-700`).
- [x] **Step 2.2: Update `WorkspaceOutline.tsx`**
  - Convert active section indicators, heading markers, and reading progress bars from sky/cyan to solid obsidian.
- [x] **Step 2.3: Update `DocumentWorkspace.tsx` Chrome & Audio Player**
  - Capsule tab bar: Active pill is solid obsidian (`bg-slate-900 text-white shadow-xs`).
  - Podcast player: Convert audio play/pause, waveform tracker, playback speed selector, and speaker badges (`Host A` / `Host B`) to obsidian and paper cards.
  - Floating triggers: Outline & Copilot buttons converted to neutral paper and obsidian icons.
- [x] **Step 2.4: Update `AskPanel.tsx` Copilot Drawer**
  - Assistant message avatar, citation jump chips, suggested prompts, and question inputs converted to monochrome.

---

### Phase 3: Flashcards & Quiz Pedagogical Monochrome Overhaul
- [x] **Step 3.1: Flashcards (`FlashcardsDeck.tsx`)**
  - `Again [1]`: Secondary Ghost ink (`bg-white dark:bg-slate-900 hover:bg-slate-100 text-slate-800 dark:text-slate-200 border border-slate-300 dark:border-slate-700` + `↺`).
  - `Mastered [2]`: Primary Obsidian ink (`bg-slate-900 hover:bg-slate-800 text-white dark:bg-white dark:hover:bg-slate-100 dark:text-slate-900 border border-slate-900 shadow-xs` + `✓`).
  - Card back summary, order tags, and hotkey badges converted to stone/obsidian.
- [x] **Step 3.2: Quiz Player (`QuizPlayer.tsx`)**
  - Option selection:
    - Default state: `bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200`.
    - Correct revealed state: `border-2 border-slate-900 dark:border-white bg-slate-100/90 dark:bg-slate-800/90 text-slate-950 dark:text-white font-semibold` with solid black/white `✓` badge.
    - Incorrect revealed state: `border border-dashed border-slate-300 dark:border-slate-700 bg-transparent opacity-50 line-through text-slate-500` with `✕` badge.
  - Grounded reference proof card: Solid obsidian badge `Verified from source: p. X, ¶Y` + `98% Grounded Proof`.
  - Progress tracker and score summary converted to monochrome.

---

### Phase 4: Dashboard, Study Library & Upload Modals
- [x] **Step 4.1: Source Cards (`TactileSourceCards.tsx`)**
  - Format badges (`PDF`, `AUDIO`, `YOUTUBE`, `TEXT`):
    - Replace color fills with monochrome editorial badges: `bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white border border-slate-300 dark:border-slate-700 font-mono text-[10px] uppercase font-bold`.
  - Grounded badge: Obsidian ink tag (`bg-slate-900 text-white dark:bg-white dark:text-slate-900 font-mono text-[10px]`).
- [x] **Step 4.2: Dashboard View (`TactileDashboard.tsx` & `TactilePerformanceChart.tsx`)**
  - "Continue Where You Left Off" card: Obsidian action buttons (`Resume Notes`, `Flashcards`, `Quiz`).
  - Performance spline chart: Stroke color converted to obsidian (`#0F172A` in light mode, `#F8FAFC` in dark mode) with monochrome tooltips and grids.
  - Weekly Goals: Progress circles and streak counts converted to obsidian.
- [x] **Step 4.3: Upload Dialog (`UploadDialog.tsx`)**
  - Drag-and-drop zone, file list items, and upload status spinners stripped of purple/cyan and converted to monochrome.

---

### Phase 5: Landing Page Monochromatic Polish
- [x] **Step 5.1: Hero & Workflow (`TactileHeroPrototype.tsx`, `InteractiveWorkflowDemo.tsx`)**
  - Headline underline: `underline decoration-slate-900 decoration-2 underline-offset-4`.
  - Eyebrows & pills: `bg-white text-slate-800 border border-slate-300 font-mono text-[11px] uppercase tracking-wider shadow-2xs`.
  - Demo interactive tabs & chat bubbles: Obsidian ink accents.
- [x] **Step 5.2: Pipeline & Credibility (`KnowledgePipeline.tsx`, `CredibilityAndComparison.tsx`)**
  - Comparison table: `Source.io` column gets `✓ Native` in `bg-slate-100 text-slate-950 font-semibold border border-slate-300/80`.
  - Pipeline stages: Solid black active indicators and stone connector lines.
- [x] **Step 5.3: Pricing (`PricingComparisonSection.tsx`)**
  - `FREE FOREVER` and `STUDENT PASS` badges: Crisp outlined ink badges (`bg-slate-100 text-slate-900 border border-slate-300 font-mono`).

---

### Phase 6: Verification, Visual QA & Build Check
- [x] **Step 6.1: Run TypeScript compiler check (`npx tsc --noEmit`) to verify 0 type errors.**
- [x] **Step 6.2: Search codebase for leftover color tokens (`emerald-`, `sky-`, `cyan-`, `purple-`, `amber-`, `rose-`).**
- [x] **Step 6.3: Run production build check (`npm run build`).**
- [x] **Step 6.4: Visual audit across light mode and dark mode for reading contrast and accessibility.**
