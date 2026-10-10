# Charcoal Grey Dark Theme Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Transform the application's dark theme from pitch black (`#000000`) and legacy dark blues (`#0F172A`/`#0B0F19`) into a cohesive, modern **Charcoal Grey / Neutral Zinc** aesthetic (`#121214` canvas, `#18181B` cards, `#27272A` borders) with strict semantic token hygiene, WCAG 2.4.11-compliant focus rings, and luminance-based elevation stacking.

**Architecture:** 
1. Centralize all zinc/charcoal color definitions in `app/globals.css` via `.dark` and `.luminous-app.dark` CSS custom properties.
2. Rely strictly on semantic tokens (`bg-card`, `bg-muted`, `bg-popover`, `text-foreground`, `border-border`) in JSX, avoiding hardcoded Tailwind color utility classes.
3. Solve low-gamut display contrast via subtle inner hairline highlights (`inset 0 1px 0 0 rgba(255, 255, 255, 0.06)`) on `.dark .shadow-tactile-card`.
4. Establish true depth through luminance stacking rather than unnoticeable black drop shadows on a dark canvas.

**Tech Stack:** Next.js (App Router), Tailwind CSS v3, Radix UI primitives.

---

## Global Constraints
- Do NOT re-introduce dark mode classes into landing page components (`src/components/landing/*`), which remain clean light mode.
- Strict token hygiene: zero hardcoded `dark:bg-zinc-*` or `dark:bg-slate-*` classes in components; use semantic classes (`bg-card`, `bg-popover`, `bg-muted`, `border-border`).
- Ensure WCAG AA focus contrast (`--ring: 240 5% 65%`).
- Display contrast guarantee: Pair background lightness with visible border/inner highlight to prevent cards bleeding into the canvas on low-contrast screens.

---

## Elevation Lightness Stack

| Layer | Semantic Token | HSL Value | Hex Equivalent | Role |
| :--- | :--- | :--- | :--- | :--- |
| **Recessed / Sunken** | `--surface-sunken` | `240 6% 5.5%` | `#0E0E10` | Code blocks, inputs, sunken tab tracks |
| **Base Canvas** | `--background` | `240 6% 7%` | `#121214` | Page body, workspace canvas |
| **Sidebar / Chrome** | `--sidebar-background` | `240 6% 6.5%` | `#101012` | Navigation dock foundation |
| **Default Surface** | `--card` / `--surface-raised` | `240 5% 10%` | `#18181B` | Dashboard widgets, cards, docks |
| **Floating / Menus** | `--popover` | `240 5% 12%` | `#1E1E22` | Context menus, autocomplete, tooltips |
| **Interactive States**| `--secondary` / `--muted` | `240 5% 13.5%`| `#222225` | Ghost buttons, secondary buttons |
| **Elevated / Dialogs**| `--surface-elevated` | `240 5% 14.5%`| `#242428` | Modals, sheets, floating dialogs |
| **Hover Accents** | `--accent` | `240 5% 15%` | `#252529` | List hovers, dropdown active items |
| **Borders & Insets** | `--border` / `--input` | `240 5% 16.5%`| `#27272A` | 1px hairline boundary |

---

### Task 1: Update Global CSS Custom Properties to Charcoal Grey Ramp

**Files:**
- Modify: `app/globals.css:106-198` (`.dark` layer)
- Modify: `app/globals.css:250-302` (`.luminous-app.dark` layer)
- Modify: `app/globals.css:739-813` (`.dark .bg-tactile-canvas` & tactile utilities)

- [ ] **Step 1: Update `.dark` root tokens with full core set**
  ```css
  .dark {
    /* Canvas & Text */
    --background: 240 6% 7%;          /* #121214 */
    --foreground: 240 5% 96%;         /* #F4F4F5 */

    /* Surfaces */
    --card: 240 5% 10%;               /* #18181B */
    --card-foreground: 240 5% 96%;    /* #F4F4F5 */
    --popover: 240 5% 12%;            /* #1E1E22 */
    --popover-foreground: 240 5% 96%; /* #F4F4F5 */

    /* Interactive & States */
    --secondary: 240 5% 13.5%;        /* #222225 */
    --secondary-foreground: 240 5% 96%;
    --muted: 240 5% 13.5%;            /* #222225 */
    --muted-foreground: 240 5% 65%;   /* #A1A1AA */
    --accent: 240 5% 15%;             /* #252529 */
    --accent-foreground: 240 5% 96%;

    /* Lines & Focus */
    --border: 240 5% 16.5%;           /* #27272A */
    --input: 240 5% 16.5%;            /* #27272A */
    --ring: 240 5% 65%;               /* #A1A1AA visible focus */

    /* Elevation Surfaces */
    --surface-sunken: 240 6% 5.5%;    /* #0E0E10 */
    --surface-raised: 240 5% 10%;     /* #18181B */
    --surface-elevated: 240 5% 14.5%; /* #242428 */
    --sidebar-background: 240 6% 6.5%;/* #101012 */
  }
  ```

- [ ] **Step 2: Update `.luminous-app.dark` and tactile utilities**
  - Set `.dark .bg-tactile-canvas { background-color: #121214; }`.
  - Update `.dark .shadow-tactile-card`:
    ```css
    .dark .shadow-tactile-card {
      box-shadow: 0 16px 40px -10px rgba(0, 0, 0, 0.5),
                  inset 0 1px 0 0 rgba(255, 255, 255, 0.06),
                  0 0 0 1px rgba(255, 255, 255, 0.05);
    }
    ```
  - Update `.dark .glass-tactile-pill` backdrop tint to `rgba(24, 24, 27, 0.75)`.

- [ ] **Step 3: Verify TypeScript and CSS parsing**
  Run: `npx tsc --noEmit`

---

### Task 2: Refactor App Shell & Navigation to Strict Semantic Tokens

**Files:**
- Modify: `src/features/dashboard/components/TactileLeftDock.tsx`
- Modify: `src/features/dashboard/components/TactileTopBar.tsx`
- Modify: `src/features/documents/pages/AppHome.tsx`

- [ ] **Step 1: Replace hardcoded classes in `TactileLeftDock.tsx`**
  - Replace `dark:bg-slate-900`, `dark:bg-slate-950`, and `bg-[#1E232A]` with semantic classes: `bg-card`, `border-border`, `hover:bg-accent`, `text-foreground`, `text-muted-foreground`.
  - Ensure active navigation pill uses high-contrast active state: `bg-primary text-primary-foreground`.

- [ ] **Step 2: Replace hardcoded classes in `TactileTopBar.tsx`**
  - Ensure notification flyout and profile popover use `bg-popover border-border text-popover-foreground`.
  - Search trigger capsule uses `bg-card border-border text-muted-foreground`.

- [ ] **Step 3: Run TypeScript verification**
  Run: `npx tsc --noEmit`

---

### Task 3: Refactor Dashboard & Widgets to Strict Semantic Tokens

**Files:**
- Modify: `src/features/dashboard/components/TactileSourceCards.tsx`
- Modify: `src/features/dashboard/components/TactileWeeklyGoals.tsx`
- Modify: `src/features/dashboard/components/TactilePerformanceChart.tsx`

- [x] **Step 1: Clean up widget cards in `TactileSourceCards.tsx`**
  - Replace `dark:bg-slate-900/90` with `bg-card border-border text-card-foreground`.
  - Search bar input in library uses `bg-surface-sunken border-input text-foreground`.

- [x] **Step 2: Clean up goal metrics and performance chart**
  - In `TactileWeeklyGoals.tsx`, replace modal overlay and action buttons with `bg-card` and `bg-surface-elevated`.
  - In `TactilePerformanceChart.tsx`, ensure tooltip and chart container use `bg-card border-border`.

- [x] **Step 3: Run TypeScript verification**
  Run: `npx tsc --noEmit`

---

### Task 4: Refactor Document Workspace, Ask Panel & Settings

**Files:**
- Modify: `src/features/documents/pages/DocumentWorkspace.tsx`
- Modify: `src/features/documents/components/AskPanel.tsx`
- Modify: `src/features/documents/components/WorkspaceOutline.tsx`
- Modify: `src/features/settings/components/AppearanceSettings.tsx`
- Modify: `src/features/settings/pages/SettingsPage.tsx`

- [x] **Step 1: Refactor Workspace capsule bar and chat panels**
  - In `DocumentWorkspace.tsx`, replace `dark:bg-slate-900/95` on the capsule tab bar with `bg-card/95 border-border`.
  - In `AskPanel.tsx`, ensure chat input textarea and message bubbles use `bg-surface-sunken border-input` and `bg-muted`.

- [x] **Step 2: Update Appearance Settings**
  - In `AppearanceSettings.tsx`, update dark mode description to `"Refined charcoal grey reading contrast"`.
  - Ensure theme selector cards use `bg-card` and `border-border`.

- [x] **Step 3: Final validation**
  Run: `npx tsc --noEmit`
