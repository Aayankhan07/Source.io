# Dashboard Realignment Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Realign the Source.io dashboard into a clean, functional 2-section layout (Performance Chart + Weekly Goals on top, full-width Study Sources below), streamline the Left Dock to core destinations (Dashboard, Library, Settings), and show study lens pills exclusively when a document is active.

**Architecture:** Refactor the tactile dashboard components to consume real Supabase document records, replace placeholder cards ("Homework", "Friends Score", "Select a course") with feature-aligned study modules (Study Sources, Weekly Goals Progress), and contextually isolate the 5 study lenses to the document workspace.

**Tech Stack:** Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS, Framer Motion, TanStack Query, Lucide Icons, Supabase Client.

**Spec:** [`docs/superpowers/specs/2026-10-05-dashboard-redesign-spec.md`](file:///d:/PROJECT%20REPOS/Source.io/docs/superpowers/specs/2026-10-05-dashboard-redesign-spec.md)

## Global Constraints
- Preserve existing dark/light mode CSS tokens and styling without breaking tactile aesthetics.
- Do not remove the working `UploadDialog` wiring.
- Every route (`/app`, `/app/settings`, `/app/doc/[docId]`) must pass `npm run typecheck` and `npm run build`.
- Maintain concise, clean component boundaries.

## Review Focus
- Document click routing must pass correct `docId` to `/app/doc/[docId]`.
- Empty state in Study Sources when user has no uploaded documents must provide an actionable upload CTA.
- Left Dock Library button must seamlessly switch between Dashboard Overview and full-width Library mode.
- Top bar must never render dead or disconnected lens pills when on the main Dashboard.
- Goals completion toggles must update state without throwing errors when toggling between Day, Week, and Month filters.

---

### Task 1: Minimal Top Bar for Main Dashboard

**Files:**
- Modify: `src/features/dashboard/components/TactileTopBar.tsx:40-120`

**Interfaces:**
- Consumes: `user`, `signOut` from `useAuth()`, `onOpenSearch` prop.
- Produces: Clean top bar with search, notification dropdown, and profile menu without center pills on the dashboard.

- [ ] **Step 1: Update TactileTopBar props and rendering**
  - Add optional `showPills?: boolean` prop (default `false`).
  - Render center pill navigation only when `showPills === true`.
  - Maintain the global search trigger, notifications dropdown, and user profile avatar with Sign Out and Settings links.

- [ ] **Step 2: Verify TypeScript correctness**
  Run: `npm run typecheck`
  Expected: PASS with 0 errors.

- [ ] **Step 3: Commit Task 1**
  ```bash
  git add src/features/dashboard/components/TactileTopBar.tsx
  git commit -m "feat(dashboard): streamline top bar to minimal search and profile layout"
  ```

---

### Task 2: Streamline Left Capsule Dock

**Files:**
- Modify: `src/features/dashboard/components/TactileLeftDock.tsx:40-110`

**Interfaces:**
- Consumes: `onSelectTab` callback, `isExpanded`, `onToggleExpand`.
- Produces: Navigation dock restricted to Dashboard (`/app`), Library (`library`), and Settings (`/app/settings`), plus theme toggle and collapse arrow.

- [ ] **Step 1: Prune placeholder items from `navItems`**
  - Remove "Speaking", "Schedule", "Courses", "Messages".
  - Define `navItems = [{ id: "dashboard", label: "Dashboard", icon: Home, href: "/app" }, { id: "library", label: "Library", icon: Folder, href: "#library" }, { id: "settings", label: "Settings", icon: Settings, href: "/app/settings" }]`.
  - When clicking "library", call `onSelectTab("library")` to toggle library view.

- [ ] **Step 2: Verify TypeScript correctness**
  Run: `npm run typecheck`
  Expected: PASS with 0 errors.

- [ ] **Step 3: Commit Task 2**
  ```bash
  git add src/features/dashboard/components/TactileLeftDock.tsx
  git commit -m "feat(dock): streamline Left Dock to Dashboard, Library, and Settings"
  ```

---

### Task 3: Build Weekly Goals Progress Component

**Files:**
- Create: `src/features/dashboard/components/TactileWeeklyGoals.tsx`
- Remove/Deprecate: references to `TactileLeaderboard.tsx` and old `TactileDailyGoals.tsx`

**Interfaces:**
- Consumes: None (local state + reactive toast notification).
- Produces: `<TactileWeeklyGoals />` card displaying target hours, completed documents, and retention targets.

- [ ] **Step 1: Implement `TactileWeeklyGoals.tsx`**
  - Header: "Weekly Goals Progress" with subtitle "Track target hours, document mastery, and retention".
  - Timeframe filter: Day / Week / Month.
  - Interactive goal metrics:
    - Target Study Hours (e.g. 8.5h / 12h target — 71% progress bar)
    - Target Sources Synthesized (e.g. 4 / 5 sources — 80% progress bar)
    - Active Recall Retention (e.g. 88% benchmark — 92% progress bar)
  - Actionable checklist with completion checkboxes and celebratory toast triggers.

- [ ] **Step 2: Verify TypeScript compilation**
  Run: `npm run typecheck`
  Expected: PASS with 0 errors.

- [ ] **Step 3: Commit Task 3**
  ```bash
  git add src/features/dashboard/components/TactileWeeklyGoals.tsx
  git commit -m "feat(dashboard): create TactileWeeklyGoals progress card"
  ```

---

### Task 4: Upgrade Study Sources Grid with Search & Upload

**Files:**
- Modify: `src/features/dashboard/components/TactileSourceCards.tsx`

**Interfaces:**
- Consumes: `documents: DocumentRow[]`, `isLoading: boolean`, `onNewSource: () => void`.
- Produces: Full-width responsive grid of source cards with format filters, live search, and click-through navigation to `/app/doc/[id]`.

- [ ] **Step 1: Refactor `TactileSourceCards.tsx` for full-width layout**
  - Title: "Study Sources" with subtitle "Click any source to enter its 5 AI study lenses".
  - Responsive layout: multi-column grid (`grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4`).
  - Active format pills: "All Formats", "PDF", "AUDIO", "YOUTUBE", "TEXT".
  - Search input with clear button.
  - "+ Upload" button connected directly to `onNewSource`.
  - Empty state with a clean card prompting the user to upload their first source.

- [ ] **Step 2: Test type safety and linting**
  Run: `npm run typecheck`
  Expected: PASS.

- [ ] **Step 3: Commit Task 4**
  ```bash
  git add src/features/dashboard/components/TactileSourceCards.tsx
  git commit -m "feat(dashboard): expand Study Sources into full-width responsive grid"
  ```

---

### Task 5: Assemble 2-Section Dashboard in `TactileDashboard.tsx`

**Files:**
- Modify: `src/features/dashboard/components/TactileDashboard.tsx`

**Interfaces:**
- Consumes: `documents` query, `openUpload` from `useAppShell()`, `TactileTopBar`, `TactilePerformanceChart`, `TactileWeeklyGoals`, `TactileSourceCards`.
- Produces: Cohesive 2-section dashboard page and full-screen library view toggle.

- [ ] **Step 1: Refactor `TactileDashboard.tsx` layout**
  - Manage `activeView` state: `"overview" | "library"`.
  - Pass `showPills={false}` to `TactileTopBar`.
  - In `"overview"` view:
    - Section 1 (Top Grid): `TactilePerformanceChart` (left 7 cols on lg) + `TactileWeeklyGoals` (right 5 cols on lg).
    - Section 2 (Bottom): `TactileSourceCards` (full width).
  - In `"library"` view:
    - Full-screen `TactileSourceCards` with expanded filters.
  - Purge dead mock flashcard and quiz tab views from the dashboard page.

- [ ] **Step 2: Connect Left Dock tab switching**
  - Pass `activeTab={activeView}` and `onSelectTab={(tab) => setActiveView(tab === "library" ? "library" : "overview")}` to `TactileLeftDock` in `AppHome.tsx`.

- [ ] **Step 3: Verify TypeScript correctness**
  Run: `npm run typecheck`
  Expected: PASS with 0 errors.

- [ ] **Step 4: Commit Task 5**
  ```bash
  git add src/features/dashboard/components/TactileDashboard.tsx src/features/documents/pages/AppHome.tsx
  git commit -m "feat(dashboard): assemble 2-section layout with Performance Chart and Sources grid"
  ```

---

### Task 6: Contextual In-Document Study Lenses Top Bar

**Files:**
- Modify: `src/features/documents/pages/DocumentWorkspace.tsx:440-580`

**Interfaces:**
- Consumes: `doc`, `cards`, `qz`, `pod`, `currentTab`, `setCurrentTab`.
- Produces: Clean tactile floating lens pills in the document header for Notes, Flashcards, Quiz, and Podcast.

- [ ] **Step 1: Align document header tab pills**
  - Ensure the floating pill tab bar (`Notes`, `Cards (N)`, `Quiz`, `Podcast 🎧`) uses the same tactile styling (`rounded-full`, `shadow-xs`, active state highlight) as the dashboard design language.
  - Add clear `← Dashboard` back navigation returning to `/app`.

- [ ] **Step 2: Verify document workspace rendering**
  Run: `npm run typecheck`
  Expected: PASS.

- [ ] **Step 3: Commit Task 6**
  ```bash
  git add src/features/documents/pages/DocumentWorkspace.tsx
  git commit -m "feat(workspace): align document study lens pill bar with tactile design system"
  ```

---

### Task 7: Full System Verification

**Files:**
- All touched files across dashboard and workspace.

- [ ] **Step 1: Run comprehensive type check**
  Run: `npm run typecheck`
  Expected: 0 errors.

- [ ] **Step 2: Run production Next.js build**
  Run: `npm run build`
  Expected: All routes prerender and compile cleanly with exit code 0.

- [ ] **Step 3: Commit Final Verification**
  ```bash
  git commit --allow-empty -m "chore: complete dashboard realignment verification"
  ```
