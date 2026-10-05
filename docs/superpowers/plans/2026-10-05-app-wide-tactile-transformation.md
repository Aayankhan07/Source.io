# App-Wide Tactile Design Transformation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Completely eliminate the legacy sidebar (`AppSidebar`) and old UI layouts across all pages (`/app/settings`, `/app/doc/[docId]`), establishing a unified, premium Tactile design system with `TactileLeftDock`, porcelain canvas surfaces, tactile cards, and floating capsule pills everywhere.

**Architecture:** 
1. Unify the app shell in `AppHome.tsx` so `TactileLeftDock` is the single source of truth for navigation across `/app`, `/app/settings`, and `/app/doc/[docId]`, eliminating the obsolete split-personality branch that rendered `AppSidebar`.
2. Redesign `/app/settings` (`SettingsPage.tsx` and its 4 preference panels) with tactile porcelain cards, capsule pill tab switchers, and dark/light mode tokens.
3. Polish the document workspace (`DocumentWorkspace.tsx`, `WorkspaceOutline.tsx`, and `AskPanel.tsx`) so that inside `/app/doc/[docId]`, the workspace is a clean, modern tactile canvas with the 5 study lenses, tactile outline drawer, and AI copilot panel.

**Tech Stack:** Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS, Framer Motion, TanStack Query, Lucide Icons, Supabase Client.

**Spec:** [`docs/superpowers/specs/2026-10-05-dashboard-redesign-spec.md`](file:///d:/PROJECT%20REPOS/Source.io/docs/superpowers/specs/2026-10-05-dashboard-redesign-spec.md)

## Global Constraints
- Preserve existing working functionalities (BYOK key saving, audio voices, theme switching, reading speed, document notes streaming, flashcards, quizzes, podcast generation, Ask AI copilot).
- Use tactile design tokens: `bg-tactile-canvas`, `shadow-tactile-card`, `shadow-tactile-dock`, `shadow-tactile-pill`, `rounded-[28px]`, `rounded-[32px]`, `rounded-full`.
- Maintain strict type safety: zero errors on `npm run typecheck` and `npm run build`.
- Support seamless dark and light mode rendering on all screens.

## Review Focus
- Navigating to `/app/settings` must display `TactileLeftDock` with "Settings" highlighted, not the old sidebar.
- Navigating to `/app/doc/[docId]` must display a clean workspace with `TactileLeftDock` and no legacy `AppSidebar`.
- Toggling theme or switching tabs in Settings must update preferences reactively without layout shifts.
- Outline and Ask AI toggles inside Document Workspace must open and close smoothly without breaking reading width.
- Upload dialog trigger from the Left Dock must work across all pages.

---

### Task 1: Unify Global App Shell in `AppHome.tsx`

**Files:**
- Modify: `src/features/documents/pages/AppHome.tsx`
- Modify: `src/features/dashboard/components/TactileLeftDock.tsx`

**Interfaces:**
- Consumes: `pathname` from `next/navigation`, `useTheme()`, `AppShellProvider`.
- Produces: Persistent `TactileLeftDock` across all routes (`/app`, `/app/settings`, `/app/doc/[docId]`), dynamic active tab highlighting, and consistent `main` content padding.

- [x] **Step 1: Update `AppHome.tsx` navigation shell**
  - Remove `isDashboard = pathname === "/app"` condition and the fallback that rendered `<AppSidebar />`.
  - Calculate `currentDockTab`:
    ```tsx
    const currentDockTab = pathname.startsWith("/app/settings")
      ? "settings"
      : pathname.startsWith("/app/doc/")
      ? "library"
      : activeView;
    ```
  - Handle dock tab navigation:
    - `"dashboard"`: `router.push("/app")` and `setActiveView("dashboard")`.
    - `"library"`: `router.push("/app")` and `setActiveView("library")`.
    - `"settings"`: `router.push("/app/settings")`.
  - Render `TactileLeftDock` for all `/app` subroutes with proper `isExpanded` responsive padding on `<main className={cn("flex-1 overflow-hidden bg-tactile-canvas ...", sidebarExpanded ? "md:pl-[270px]" : "md:pl-24")}>`.

- [x] **Step 2: Update `TactileLeftDock.tsx` route handling**
  - Ensure clicking "Dashboard" navigates to `/app` and resets view to overview.
  - Ensure clicking "Library" navigates to `/app` with library view enabled.
  - Ensure clicking "Settings" navigates to `/app/settings`.

- [x] **Step 3: Verify TypeScript correctness**
  Run: `npm run typecheck`
  Expected: PASS with 0 errors.

- [x] **Step 4: Commit Task 1**
  ```bash
  git add src/features/documents/pages/AppHome.tsx src/features/dashboard/components/TactileLeftDock.tsx
  git commit -m "feat(shell): unify app shell to TactileLeftDock across all /app routes"
  ```

---

### Task 2: Redesign Settings Page to Tactile System

**Files:**
- Modify: `src/features/settings/pages/SettingsPage.tsx`
- Modify: `src/features/settings/components/AIModelSettings.tsx`
- Modify: `src/features/settings/components/AppearanceSettings.tsx`
- Modify: `src/features/settings/components/AudioSettings.tsx`
- Modify: `src/features/settings/components/DataStorageSettings.tsx`

**Interfaces:**
- Consumes: `useSettings()`, `useTheme()`, `useToast()`.
- Produces: Tactile porcelain settings interface with capsule pill tab switcher and rounded tactile cards.

- [x] **Step 1: Refactor `SettingsPage.tsx` layout and header**
  - Page container: `w-full max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8`.
  - Header: Tactile typography matching dashboard:
    - Title: "Platform Settings" (3xl/4xl bold font-display).
    - Subtitle: "Configure AI reasoning engines, custom provider API keys, audio recap voices, and reading ergonomics."
    - Breadcrumb / back pill: `← Back to Dashboard`.
  - Top tab switcher: Horizontal floating capsule pills with icons:
    - `[ Bot AI & Models ]` `[ Headphones Podcast & Audio ]` `[ Palette Appearance ]` `[ Database Data & Storage ]`
    - Styled with `bg-white dark:bg-slate-900 border border-black/[0.04] dark:border-white/10 shadow-tactile-card rounded-[24px] p-1.5`.

- [x] **Step 2: Upgrade settings panel cards to tactile tokens**
  - Replace flat `Card` components with tactile containers:
    `rounded-[28px] bg-white dark:bg-slate-900/90 border border-black/[0.04] dark:border-white/10 shadow-tactile-card p-6 sm:p-7`.
  - Style inputs with `rounded-[16px] bg-slate-50 dark:bg-white/[0.04] border-slate-200 dark:border-white/10`.
  - Style depth & model selection option buttons with tactile pill states (`active: bg-slate-950 text-white dark:bg-white dark:text-slate-950`).
  - Upgrade theme toggle preview buttons and WPM reading speed selectors with tactile interactive cards.

- [x] **Step 3: Verify TypeScript correctness**
  Run: `npm run typecheck`
  Expected: PASS with 0 errors.

- [x] **Step 4: Commit Task 2**
  ```bash
  git add src/features/settings/pages/SettingsPage.tsx src/features/settings/components/
  git commit -m "feat(settings): redesign settings page and components into tactile UI system"
  ```

---

### Task 3: Redesign Document Workspace to Tactile Layout

**Files:**
- Modify: `src/features/documents/pages/DocumentWorkspace.tsx`
- Modify: `src/features/documents/components/WorkspaceOutline.tsx`
- Modify: `src/features/documents/components/AskPanel.tsx`

**Interfaces:**
- Consumes: `docId`, `docQuery`, `assetsQuery`, `useSettings()`, `useAppShell()`.
- Produces: Unified document study workspace with tactile header, tactile floating study lenses, floating outline drawer, and tactile AI copilot panel.

- [x] **Step 1: Refactor `DocumentWorkspace.tsx` header and background**
  - Background: clean porcelain tactile surface (`bg-tactile-canvas`).
  - Header bar:
    - Remove clutter. Left side has sleek back link `← Dashboard`, document title, format badge, and reading time.
    - Right side has copy notes, regenerate, settings popover, and delete action.
  - Floating study lens pill bar:
    - Floating tactile capsule pills: **Notes**, **Flashcards (count)**, **Quiz**, **Podcast 🎧**, and **Ask AI Chat**.
    - Smooth transitions and active tactile fill.

- [x] **Step 2: Upgrade `WorkspaceOutline.tsx` to tactile drawer card**
  - Container: `rounded-[28px] bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border border-black/[0.04] dark:border-white/10 shadow-tactile-card m-2.5 overflow-hidden flex flex-col`.
  - Outline search, headings tree, and progress pill styled with tactile tokens.

- [x] **Step 3: Upgrade Notes center stage and `AskPanel.tsx`**
  - Notes reader: `rounded-[32px] bg-white dark:bg-slate-900 border border-black/[0.04] dark:border-white/10 shadow-tactile-card p-6 sm:p-12`.
  - Summary banner: tactile floating pill banner.
  - Ask AI Copilot: `rounded-[28px] bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border border-black/[0.04] dark:border-white/10 shadow-tactile-card m-2.5 overflow-hidden flex flex-col`.

- [x] **Step 4: Verify TypeScript correctness**
  Run: `npm run typecheck`
  Expected: PASS with 0 errors.

- [x] **Step 5: Commit Task 3**
  ```bash
  git add src/features/documents/pages/DocumentWorkspace.tsx src/features/documents/components/WorkspaceOutline.tsx src/features/documents/components/AskPanel.tsx
  git commit -m "feat(workspace): modernize document workspace, outline, and ask panel into tactile system"
  ```

---

### Task 4: Deprecate Legacy `AppSidebar.tsx` and Clean Up

**Files:**
- Deprecate/Remove: `src/features/documents/components/AppSidebar.tsx`

**Interfaces:**
- Check for any lingering imports of `AppSidebar` and ensure full migration to `TactileLeftDock`.

- [x] **Step 1: Check references and safely remove `AppSidebar.tsx`**
  - Confirm `AppSidebar` is no longer imported anywhere.
  - Remove file or replace with deprecated placeholder if required by legacy paths.

- [x] **Step 2: Verify TypeScript correctness**
  Run: `npm run typecheck`
  Expected: PASS with 0 errors.

- [x] **Step 3: Commit Task 4**
  ```bash
  git commit -am "chore: retire legacy AppSidebar in favor of unified TactileLeftDock"
  ```

---

### Task 5: End-to-End Build and Verification

**Files:**
- All modified files.

- [ ] **Step 1: Run comprehensive type check**
  Run: `npm run typecheck`
  Expected: 0 errors.

- [ ] **Step 2: Run production Next.js build**
  Run: `npm run build`
  Expected: All routes compile and generate cleanly with exit code 0.

- [ ] **Step 3: Final verification commit**
  ```bash
  git commit --allow-empty -m "chore: complete app-wide tactile design transformation verification"
  ```
