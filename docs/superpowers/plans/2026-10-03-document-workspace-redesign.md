# Document Workspace Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Redesign the Source.io Document Workspace according to the wireframe, with the search button removed, notes sections sidebar made retractable between full outline and a 48px mini-rail, clean tab bar, and "On this page" section summary banner.

**Architecture:** Refactor `DocumentWorkspace.tsx` and `WorkspaceOutline.tsx` to use a responsive, retractable 3-panel layout. `WorkspaceOutline` gains a smooth collapsible mode (expanded ~220px vs retracted 48px mini-rail with numbered section dots). The header drops the Search button and provides sidebar toggles, while a prominent horizontal tab bar sits right below the header.

**Tech Stack:** Next.js 16 (App Router), React 18, TypeScript, Tailwind CSS, Lucide React icons, Radix UI.

**Spec:** [docs/superpowers/specs/2026-10-03-document-workspace-redesign.md](file:///d:/PROJECT/REPOS/Source.io/docs/superpowers/specs/2026-10-03-document-workspace-redesign.md)

## Global Constraints

- No `Search ⌘K` button in document workspace header
- Retractable sidebar in Notes view: full outline with section names when expanded, 48px mini-rail with section indicators when retracted
- Horizontal tab bar directly beneath header: Notes, Cards (with count), Quiz, Podcast
- Center notes view starts with "On this page: ..." banner
- Ask panel on the right remains collapsible via header toggle
- Zero TypeScript errors (`npm run typecheck`), zero ESLint errors (`npm run lint`), build succeeds (`npm run build`)

## Review Focus

- Clicking section indicators in both expanded and retracted outline states smoothly scrolls to that section in the notes
- Retracting and expanding the sidebar maintains the active heading highlight
- All 4 tabs (Notes, Cards, Quiz, Podcast) switch views without breaking layout
- Notes with or without headings render cleanly without crashing

---

### Task 1: Enhance `WorkspaceOutline.tsx` with Retractable Dual-State Support

**Files:**
- Modify: `src/features/documents/components/WorkspaceOutline.tsx`

**Interfaces:**
- Produces: `WorkspaceOutline` with props `isRetracted?: boolean`, `onToggleRetract?: () => void`, `activeHeadingId?: string | null`, `onSelectHeading?: (id: string) => void`.

- [ ] **Step 1: Update WorkspaceOutline component props and view modes**

In `src/features/documents/components/WorkspaceOutline.tsx`:
Add `isRetracted?: boolean` and `onToggleRetract?: () => void` to `WorkspaceOutlineProps`.
When `isRetracted` is true:
- Render a 48px slim rail (`w-12`) with section indicators (1, 2, 3...) inside rounded pills with hover tooltips showing heading text.
- Render an expand button (`ChevronRight` / `PanelLeftOpen`) at the top so user can easily expand.
When `isRetracted` is false:
- Render the full outline (~220px) with "Document Outline" title, section count badge, collapse toggle button (`PanelLeftClose`), reading metrics (reading time & word count), and hierarchical list of heading titles with level indentation.

- [ ] **Step 2: Verify TypeScript types for WorkspaceOutline**

Run: `npm run typecheck`
Expected: 0 errors.

---

### Task 2: Refactor `DocumentWorkspace.tsx` Header and Tab Bar

**Files:**
- Modify: `src/features/documents/pages/DocumentWorkspace.tsx`

**Interfaces:**
- Consumes: `WorkspaceOutline`, `AskPanel`, document and asset queries.
- Produces: Clean wireframe layout with search option removed, sidebar retractable state, and prominent tabs.

- [ ] **Step 1: Update workspace header**

In `src/features/documents/pages/DocumentWorkspace.tsx`:
- Remove `Search ⌘K` trigger button completely from header.
- Add sidebar toggle button (`PanelLeftClose` when expanded, `PanelLeftOpen` when retracted) on the left next to title.
- Keep Document title, Source type badge (e.g. `Text`, `PDF`), and reading time badge.
- On the right: `Copy` button, `Regenerate` button, and `Ask` toggle button (`PanelRightClose` / `PanelRightOpen`).

- [ ] **Step 2: Implement Wireframe Tab Bar directly beneath header**

In `src/features/documents/pages/DocumentWorkspace.tsx`:
- Place a horizontal tab bar across the top below the header with:
  - `Notes`
  - `Cards` (showing count e.g. `Cards ${cards.length}`)
  - `Quiz`
  - `Podcast`
- Active tab has primary underline and font-semibold styling matching the wireframe.

- [ ] **Step 3: Verify TypeScript and Lint**

Run: `npm run typecheck && npm run lint`
Expected: 0 errors.

---

### Task 3: Refactor Notes Center Reading View & Section Banner

**Files:**
- Modify: `src/features/documents/pages/DocumentWorkspace.tsx`

- [ ] **Step 1: Add "On this page" summary banner**

In `src/features/documents/pages/DocumentWorkspace.tsx`:
At the top of the Notes reading area (above MarkdownView):
- Render an inline pill banner:
  - Circle badge "4" or section icon
  - "On this page: " + joined top-level section titles (e.g. "Linear transformations · Key properties")
- Clicking any heading in the banner or outline scrolls directly to the section anchor in the markdown.

- [ ] **Step 2: Update Resizable Panels for Retractable Outline**

In `src/features/documents/pages/DocumentWorkspace.tsx`:
- When `outlineRetracted` is false: Left panel size is ~18% (min 15%, max 25%).
- When `outlineRetracted` is true: Left panel size is ~48px (fixed minSize/maxSize ~4-5%).
- Main center reading area adjusts smoothly.

- [ ] **Step 3: Verify TypeScript and Lint**

Run: `npm run typecheck && npm run lint`
Expected: 0 errors.

---

### Task 4: Polish "Ask this lecture" Panel & Wireframe Consistency

**Files:**
- Modify: `src/features/documents/components/AskPanel.tsx`

- [ ] **Step 1: Align AskPanel headers and suggestion chips with wireframe**

In `src/features/documents/components/AskPanel.tsx`:
- Header shows: Badge "5" + "Ask this lecture".
- Contextual suggested question pills generated from headings (e.g. "Explain eigenvectors simply", "Quiz me on this section").
- Grounded answer badge: "Answer cites ↗ highlights passage in notes".
- Chat input container with send button (`Send` icon).

- [ ] **Step 2: Verify TypeScript and Lint**

Run: `npm run typecheck && npm run lint`
Expected: 0 errors.

---

### Task 5: End-to-End Verification & Build Validation

- [ ] **Step 1: Run typecheck**
Run: `npm run typecheck`
Expected: 0 errors.

- [ ] **Step 2: Run lint**
Run: `npm run lint`
Expected: 0 errors, 0 warnings.

- [ ] **Step 3: Run production build**
Run: `npm run build`
Expected: All routes compile cleanly with 0 errors.
