# Inner App Workspace Refactor Plan: "Academic Paper & Deep Ink"

> **For agentic workers:** REQUIRED SUB-SKILL: Use `superpowers:subagent-driven-development` (recommended) or `superpowers:executing-plans` to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Refactor the inner `/app` workspace across all six screens (Dashboard, Library, Notes, Flashcards, Quiz, Podcast) to align with the "Academic Paper & Deep Ink" design language, fix KaTeX/content bugs, unify read-time and shortcut indicators, integrate a global document breadcrumb, refine Copilot styling exclusively inside Notes, add a "Continue Where You Left Off" card alongside study analytics, and fulfill core landing page promises (grounded citations, proof explanations, audio player controls).

**Architecture:**
- Surface system: Warm `#FAF9F6` canvas, elevated `bg-white` paper cards, `slate-900` ink, `sky-600` structure & AI actions, and `emerald-600` grounded verification badges.
- Cross-mode chrome: Universal top breadcrumb (`← Library / [Doc Title]` + `Grounded` badge) with center floating capsule switcher (`Notes`, `Cards`, `Quiz`, `Podcast`).
- Scope rule for Copilot: `AskPanel` Copilot remains strictly scoped to the `Notes` tab. It will not render or drawer-toggle in Flashcards, Quiz, or Podcast.
- Dashboard architecture: "Continue Where You Left Off" hero card is added **alongside** the Performance Analytics chart and Weekly Goals, keeping telemetry visible while adding immediate resume capabilities.
- Bug resolution: Correct LaTeX Dirac kets (`$|\psi\rangle$`), unify reading speed calculation (`Math.ceil(words / 200)`), and replace ambiguous `Again (1)` with distinct `<kbd>` keycaps.
- Study enhancements: Quiz grounded citations and interactive footer; Podcast playback speed toggle (`1.0x` - `2.0x`) and MP3 download.

**Tech Stack:** Next.js 15 (App Router), React 19, TypeScript, Tailwind CSS, Framer Motion, KaTeX, Lucide React, TanStack Query, Supabase.

**Spec / Source Critique:** Argon Inner App Workspace UI/UX Audit & Consistency Review with user constraints applied.

---

## Global Constraints

- **Copilot Boundary:** `AskPanel` and its toggle button strictly belong to the `Notes` tab. Do not mount or show Copilot triggers in `Flashcards`, `Quiz`, or `Podcast`.
- **Dashboard Telemetry Preservation:** Do NOT remove the Performance Analytics chart. The "Continue Where You Left Off" section must live alongside existing analytics.
- **Palette Rules:** No leftover `purple-*` or `violet-*` AI slop. Use `sky-600` / `sky-50` for AI/structure accents, `slate-900` for deep ink anchors, and `emerald-600` / `emerald-50` exclusively for verification, citations, and grounded confidence.
- **Dark Mode Support:** Retain workspace dark mode support (`dark:bg-slate-900`, `dark:border-white/10`) for late-night study sessions; do not hardcode light-only classes that break in dark mode.
- **Terminology:** Replace "5 AI study lenses" with "5 study modes" everywhere to strictly mirror the landing page.

---

## Review Focus (Edge Cases & Failure Modes)

1. **LaTeX Escaping in KaTeX:** Double backslashes in template literals must resolve to single backslashes in KaTeX parsing without triggering raw string breaks or norm bars (`||0\rangle`).
2. **Read-Time Parity:** Ensure both `DocumentWorkspace` header and `WorkspaceOutline` rail render the exact same integer minute read-time regardless of word count.
3. **Copilot Scoping:** Ensure `setCopilotOpen` and `AskPanel` mounting are only active when `currentTab === "notes"`, preventing layout shifts or collision on other tabs.
4. **Keyboard Shortcut Clarity:** Ensure `<kbd>` tags on flashcards do not look like item tallies, while preserving the key listeners for `1`, `2`, and `Space`.
5. **Dashboard Layout Responsiveness:** Ensure the combination of "Continue Where You Left Off" + "Performance Analytics" + "Weekly Goals" stacks gracefully on mobile and tablets.

---

## File Structure & Touch Points

| File Path | Responsibility | Changes |
| :--- | :--- | :--- |
| `src/features/documents/data/mockDocuments.ts` | Demo datasets for quantum, linear algebra, biology, networking | Fix LaTeX Dirac kets, table syntax, and add inline citation chips. |
| `src/lib/utils.ts` | Shared mathematical and string helpers | Add unified `calculateReadTime(text, wpm)` helper. |
| `src/features/documents/pages/DocumentWorkspace.tsx` | Main study workspace orchestration | Add persistent top breadcrumb + Grounded badge; hide redundant `On this page` banner when outline is open; keep Copilot strictly in Notes; strip purple classes. |
| `src/features/documents/components/WorkspaceOutline.tsx` | Left outline TOC rail | Use unified read-time helper; clean typography. |
| `src/features/documents/components/FlashcardsDeck.tsx` | 3D spaced repetition deck | Replace `(1)` / `(2)` with styled `<kbd>` keycaps; strip purple accents. |
| `src/features/documents/components/QuizPlayer.tsx` | Interactive quiz interface | Complete footer action CTA; reveal grounded citation proof with emerald badge on answer. |
| `src/features/documents/components/AskPanel.tsx` | RAG Copilot drawer (Notes tab only) | Strip purple styling; update icons and suggested prompt pills to paper & ink. |
| `src/components/common/DailyQuotaPill.tsx` | Global quota pill & popover | Standardize progress bar to `sky-600` and `slate-900`; remove purple gradients. |
| `src/features/dashboard/components/TactileSourceCards.tsx` | Source document cards grid | Convert pastel fills (`lavender`, `sky`, `mint`) to crisp white paper cards with semantic format badges; clean duplicate Library headers. |
| `src/features/dashboard/components/TactileDashboard.tsx` | Dashboard overview & Library views | Add "Continue Where You Left Off" card alongside Performance Analytics and Weekly Goals; add `Sample Workspace Data` badge; update "5 study modes" copy. |
| `app/globals.css` | Global styling and scrollbars | Add lightweight `.custom-scrollbar` utility for smooth document scrolling. |

---

## Tasks

### Task 1: Fix Content, LaTeX Dirac Kets & Unify Read-Time Calculation (P0)

**Files:**
- Modify: `src/lib/utils.ts`
- Modify: `src/features/documents/data/mockDocuments.ts`
- Modify: `src/features/documents/pages/DocumentWorkspace.tsx:235-241`
- Modify: `src/features/documents/components/WorkspaceOutline.tsx:153-159`

- [x] **Step 1.1: Add unified read-time helper in `src/lib/utils.ts`**
```ts
export function calculateReadTime(text: string | null | undefined, wpm = 200): { words: number; readMinutes: number } {
  if (!text) return { words: 0, readMinutes: 1 };
  const words = text.trim().split(/\s+/).filter(Boolean).length;
  const readMinutes = Math.max(1, Math.ceil(words / Math.max(1, wpm)));
  return { words, readMinutes };
}
```

- [x] **Step 1.2: Update `WorkspaceOutline.tsx` and `DocumentWorkspace.tsx` to use `calculateReadTime`**
Import `calculateReadTime` and replace conflicting `Math.round` / `Math.ceil` usages so both display the exact same number.

- [x] **Step 1.3: Fix Dirac Kets & Table Formatting in `mockDocuments.ts`**
Replace double-bar kets:
- Change `\\|\\psi\\rangle = \\alpha\\|0\\rangle + \\beta\\|1\\rangle` $\rightarrow$ `$|\\psi\\rangle = \\alpha|0\\rangle + \\beta|1\\rangle$`
- Change `\\|\\Phi^+\\rangle = \\frac{1}{\\sqrt{2}}(\\|00\\rangle + \\|11\\rangle)` $\rightarrow$ `$|\\Phi^+\\rangle = \\frac{1}{\\sqrt{2}}(|00\\rangle + |11\\rangle)$`
- Ensure table row in `2. Quantum vs. Classical State Comparison` closes LaTeX properly:
`Qubits (coherent $|0\\rangle$, $|1\\rangle$, or linear superposition)`
- Add grounded citation chip in quantum note:
`*   **Decoherence**: Environmental noise causing qubits to lose their quantum state. This is the biggest engineering hurdle in contemporary quantum architectures. <span className="citation-chip">[p. 14, §1.2]</span>`

- [x] **Step 1.4: Verify KaTeX renders properly without console syntax warnings**

---

### Task 2: Disambiguate Flashcard Keyboard Shortcuts & Clean Card Accents

**Files:**
- Modify: `src/features/documents/components/FlashcardsDeck.tsx:365-440`

- [x] **Step 2.1: Disambiguate hotkeys from card counters**
In `FlashcardsDeck.tsx`, replace:
```tsx
<span>Again (<kbd className="font-mono text-[10px]">1</kbd>)</span>
...
<span>Mastered (<kbd className="font-mono text-[10px]">2</kbd>)</span>
```
with:
```tsx
<span className="flex items-center gap-1.5 font-medium">
  Again
  <kbd className="rounded bg-amber-100 dark:bg-amber-950/60 px-1.5 py-0.5 font-mono text-[10px] font-bold text-amber-800 dark:text-amber-300 border border-amber-300/60 dark:border-amber-700/50">
    1
  </kbd>
</span>
...
<span className="flex items-center gap-1.5 font-medium">
  Mastered
  <kbd className="rounded bg-emerald-700 dark:bg-emerald-800 px-1.5 py-0.5 font-mono text-[10px] font-bold text-emerald-100 border border-emerald-600/50">
    2
  </kbd>
</span>
```

- [x] **Step 2.2: Strip purple accents on card back**
Replace `bg-purple-500/10 text-purple-600 border-purple-500/20` with `bg-sky-50 dark:bg-sky-950/40 text-sky-700 dark:text-sky-300 border-sky-200/80 dark:border-sky-800/50`. Replace purple sparkle icons with sky icons.

- [x] **Step 2.3: Verify hotkeys `1`, `2`, and `Space` still trigger correctly**

---

### Task 3: Global Workspace Chrome — Persistent Breadcrumb & Notes-Only Copilot Refactor

**Files:**
- Modify: `src/features/documents/pages/DocumentWorkspace.tsx`
- Modify: `src/features/documents/components/AskPanel.tsx`
- Modify: `src/components/common/DailyQuotaPill.tsx`
- Modify: `app/globals.css`

- [x] **Step 3.1: Add Persistent Top Workspace Bar with Breadcrumb & Grounded Badge**
In `DocumentWorkspace.tsx`, upgrade the top bar header so that across all tabs:
- Left: Back to library button (`← Library`), a clean separator (`/`), the document title (with ellipsis on small screens), and a verified emerald badge (`Grounded` with check icon).
- Center: The 4-pill mode switcher (`Notes`, `Flashcards`, `Quiz`, `Podcast`).
- Right: In `Notes` only: the `Ask Copilot` trigger button (`bg-card hover:bg-muted border border-border text-xs font-semibold px-3 py-1.5 rounded-full`). In other tabs: clean layout reserved for the floating quota pill.

- [x] **Step 3.2: Keep Copilot Exclusively Scoped to Notes**
Ensure `AskPanel` and its trigger button are strictly mounted in `currentTab === "notes"`. Do not render Copilot or its toggle on `cards`, `quiz`, or `podcast`.

- [x] **Step 3.3: Conditionally hide redundant `On this page` bar in Notes**
In `DocumentWorkspace.tsx`:
Only render `<div ...>On this page:...</div>` when `!outlineOpen || outlineRetracted || focusMode`. When the left TOC outline is open and active, hide the top bar to give 48px of vertical breathing room.

- [x] **Step 3.4: Strip purple/violet from DailyQuotaPill & AskPanel**
In `DailyQuotaPill.tsx`, change progress bar from purple gradient to `bg-sky-600 dark:bg-sky-500`, change sparkle icon to `text-sky-600 dark:text-sky-400`, and replace purple BYOK badges with `slate-900` / `sky-600`.
In `AskPanel.tsx`, change purple bot icon and badges to `bg-sky-50 text-sky-700 border-sky-200`.

- [x] **Step 3.5: Add `.custom-scrollbar` utility in `app/globals.css`**
```css
.custom-scrollbar::-webkit-scrollbar {
  width: 6px;
  height: 6px;
}
.custom-scrollbar::-webkit-scrollbar-track {
  background: transparent;
}
.custom-scrollbar::-webkit-scrollbar-thumb {
  background: rgba(148, 163, 184, 0.3);
  border-radius: 9999px;
}
.custom-scrollbar::-webkit-scrollbar-thumb:hover {
  background: rgba(148, 163, 184, 0.5);
}
```

---

### Task 4: Enhance Quiz & Podcast with Landing Page Promises

**Files:**
- Modify: `src/features/documents/components/QuizPlayer.tsx`
- Modify: `src/features/documents/pages/DocumentWorkspace.tsx:1030-1135` (Podcast component)

- [x] **Step 4.1: Quiz View — Complete Footer Action Bar & Grounded Proof**
In `QuizPlayer.tsx`:
- When unanswered: Display a helpful prompt on the bottom-right ("Select an answer above to verify") or an active disabled state.
- When answered: Display `Next Question →` / `Finish Quiz` in primary `bg-slate-900 text-white rounded-full px-5 py-2`.
- In the explanation card: Add an emerald badge `Verified from source` with citation reference (e.g. `Verified from p. 4, ¶2 of source · 98% grounded confidence`).

- [x] **Step 4.2: Podcast View — Paper & Ink Theme, Playback Speed & MP3 Export**
In `DocumentWorkspace.tsx` (`PodcastPlayer` / audio section):
- Replace purple headphone badge with `bg-sky-50 text-sky-700 border border-sky-200/80`.
- Style **Host A (Dr. Sarah Chen)** with crisp paper styling (`bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs`) with a `text-slate-900 dark:text-white` speaker tag.
- Style **Host B (Marcus)** with subtle slate styling (`bg-slate-50/80 dark:bg-slate-900/40 border border-slate-200/60 dark:border-slate-800/60`) with a `text-sky-700 dark:text-sky-400` speaker tag.
- Add playback speed selector button (`1.0x` $\rightarrow$ `1.25x` $\rightarrow$ `1.5x` $\rightarrow$ `2.0x`).
- Add `Export MP3` button (`Download` icon with tooltip) that triggers an audio download or simulated synthesis export with toast notification.

---

### Task 5: Refactor Dashboard & Library (Crisp Paper Cards & "Continue Where You Left Off" + Analytics)

**Files:**
- Modify: `src/features/dashboard/components/TactileSourceCards.tsx`
- Modify: `src/features/dashboard/components/TactileDashboard.tsx`

- [x] **Step 5.1: Convert Source Cards to Elevated Paper Cards**
In `TactileSourceCards.tsx`:
- Replace pastel fills (`#EEECFC`, `#E6F8FB`, `#E7F7ED`) with clean, elevated paper cards:
  `bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 shadow-xs hover:shadow-md transition-all rounded-[24px] p-5`
- Keep semantic colors isolated strictly to format badges:
  - `PDF`: `bg-sky-50 text-sky-700 border-sky-200/80`
  - `TEXT`: `bg-slate-100 text-slate-700 border-slate-200`
  - `AUDIO`: `bg-amber-50 text-amber-700 border-amber-200/80`
  - `YOUTUBE`: `bg-rose-50 text-rose-700 border-rose-200/80`
  - Grounded badge: `bg-emerald-50 text-emerald-700 border-emerald-200/80` with emerald dot.

- [x] **Step 5.2: Streamline Library View Toolbar**
In `TactileDashboard.tsx` (when `activeView === "library"`):
- Remove the redundant nested header and subtitle inside `TactileSourceCards`.
- Align format pills (`All Formats`, `PDF Documents`, `Audio Lectures`, `YouTube`, `Text / Markdown`), search input, and `+ Upload` button on a single, high-efficiency toolbar.

- [x] **Step 5.3: Add "Continue Where You Left Off" Hero Card ALONGSIDE Performance Analytics**
In `TactileDashboard.tsx` (when `activeView === "dashboard"`):
- Add a prominent **"Continue Where You Left Off"** card:
  - Displays the last opened source (e.g. `Introduction to Quantum Computing` or first user document).
  - Shows current study progress (`68% completed · 4 cards mastered`).
  - Provides instant one-click resume buttons: `Resume Notes`, `Flashcards`, `Quiz`.
- Keep the **Performance Analytics** spline chart and **Weekly Goals** cards intact alongside or directly below the resume card.
- Add a transparent badge on the analytics card when in guest mode: `<span className="text-[10px] font-mono text-slate-500 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-full">Sample Workspace Data</span>`.
- Update all occurrences of `"5 AI study lenses"` to `"5 study modes"` across dashboard and library empty states.

---

### Task 6: Verification, Typechecks & Visual QA

**Files:**
- Run: `npx tsc --noEmit`
- Run: `npm run build` or dev preview checks

- [x] **Step 6.1: Run TypeScript compiler check (`npx tsc --noEmit`) to ensure zero type errors**
- [x] **Step 6.2: Test navigation across all routes (`/app`, `/app/doc/demo-quantum`, `/app/settings`)**
- [x] **Step 6.3: Confirm no remaining `purple-*` classes exist in inner workspace components**
- [x] **Step 6.4: Confirm KaTeX renders single-bar Dirac kets properly**
- [x] **Step 6.5: Verify flashcard hotkeys (`1`, `2`, `Space`) and quiz answer flow**
- [x] **Step 6.6: Confirm Copilot is visible ONLY on the Notes tab and hidden on Cards, Quiz, and Podcast**
- [x] **Step 6.7: Confirm Dashboard shows BOTH the "Continue Where You Left Off" card AND the Analytics chart**
