# Document Workspace Redesign Specification

## 1. Overview & Goals

This specification defines the visual and structural redesign of the Source.io Document Workspace (`/app/doc/[docId]`), based on the provided wireframe design (`source_io_redesign_wireframe.html`) and user requirements:

1. **Remove the search option**: The `Search ⌘K` button in the document header is removed.
2. **Notes Sections Sidebar (Retractable)**:
   - When **expanded**: displays the full document outline with section titles (e.g. "Linear transformations", "Key properties"), reading time, and section count.
   - When **retracted**: collapses into a slim 48px mini-rail with numbered section indicators that can be clicked to jump directly to a section or expand the full sidebar.
   - Retractable via a sidebar toggle button in the header and on the rail itself.
3. **Tab Bar**: Clean horizontal tab navigation immediately below the header with `Notes`, `Cards` (with count badge e.g. "Cards 12"), `Quiz`, and `Podcast`, styled to match the wireframe.
4. **Notes Reading Area**:
   - Header summary banner: "On this page: [Section 1] · [Section 2] · [Section 3]" (matching Badge 4 in the wireframe).
   - Content: full rich Markdown notes with LaTeX equations and callouts.
   - Top action buttons: Copy notes and Regenerate notes.
5. **Right Panel ("Ask this lecture")**:
   - Collapsible/resizable right panel with "Ask this lecture" header, quick question pills, grounded citations preview ("Answer cites ↗ highlights passage in notes"), and question input with send button.

---

## 2. Layout & Component Architecture

### Grid / Panel Breakdown (Desktop $\ge$ 1024px)

```
┌────────────────────────────────────────────────────────────────────────┐
│ Header: [Sidebar Toggle] [Title] [Type Badge] [Read Time]  [Copy] [Regen] [Ask Toggle] │
├────────────────────────────────────────────────────────────────────────┤
│ Tabs:   [Notes] [Cards N] [Quiz] [Podcast]                             │
├───────────────┬────────────────────────────────────────┬───────────────┤
│ Left Sidebar: │ Center Stage:                          │ Right Panel:  │
│ (Retractable) │                                        │               │
│ • Expanded:   │ • "On this page: ..." banner           │ • Ask title   │
│   Full titles │ • Teaching notes content               │ • Quick pills │
│   & stats     │ • Formulas & Callouts                  │ • Citations   │
│ • Retracted:  │ • Section accordions                   │ • Chat input  │
│   48px rail   │                                        │               │
└───────────────┴────────────────────────────────────────┴───────────────┘
```

---

## 3. Detailed Component Specifications

### 3.1 Document Header (`DocumentWorkspace.tsx`)
- **Left**:
  - `SidebarToggle`: Toggles the left Notes Sections sidebar between expanded and retracted (slim rail). Uses `PanelLeftClose` / `PanelLeftOpen` icon.
  - `Title`: Document title with font styling matching wireframe.
  - `Source Badge`: e.g. "Text", "PDF", "Audio" in a subtle pill badge.
  - `Read Time`: e.g. "4 min read" based on calculated word count.
- **Right**:
  - `Copy`: Copies formatted markdown notes to clipboard with visual checkmark feedback.
  - `Regenerate`: Triggers regeneration of notes when notes exist.
  - `Ask Toggle`: Toggles the right "Ask this lecture" panel visibility (`PanelRightClose` / `PanelRightOpen`).
  - **No Search button** (`Search ⌘K` removed per request).

### 3.2 Wireframe Tab Navigation (`DocumentWorkspace.tsx`)
- Displayed immediately under the header across desktop and mobile.
- Tabs:
  - `Notes`
  - `Cards` (with dynamic badge e.g. `cards.length`)
  - `Quiz`
  - `Podcast`
- Active state: bold text, border-bottom indicator matching wireframe styling.

### 3.3 Retractable Notes Outline Sidebar (`WorkspaceOutline.tsx`)
- State: `outlineState: "expanded" | "retracted"` (persisted in component state, default: `"expanded"` on wide screens).
- **Expanded View (~220px)**:
  - Outline header: "Document Outline" with total section count badge and collapse toggle icon (`«` or `PanelLeftClose`).
  - Reading metadata: clock icon + reading time, file icon + word count.
  - Hierarchical tree: H1, H2, H3 headings with indentation, active highlight tracking, and click-to-scroll.
- **Retracted View (48px mini-rail)**:
  - Vertical slim strip.
  - Numbered / dot indicators for each section (1, 2, 3...) with tooltip showing the heading name.
  - Clicking any section indicator scrolls to that section.
  - Expand button at the top/bottom to quickly restore full outline.

### 3.4 Notes Reading View (`DocumentWorkspace.tsx`)
- **Top Banner**:
  - Badge with index number / icon + "On this page: [H1/H2 headings joined by ' · ']"
- **Notes Body**:
  - Clean card container with `MarkdownView` rendering formatted notes, math formulas, and code blocks.
  - Bottom padding for comfortable reading.

### 3.5 "Ask this lecture" Right Panel (`AskPanel.tsx`)
- Styled to match the wireframe:
  - Header: Badge "5" + "Ask this lecture"
  - Contextual suggested question pills generated from current document headings.
  - Grounded answer badge: "Answer cites ↗ highlights passage in notes".
  - Clean input container with send button (`ti-send` / `Send` icon).

---

## 4. Testing & Verification Plan

1. **Retractable Sidebar**:
   - Verify clicking the sidebar toggle switches smoothly between 220px full outline and 48px mini-rail.
   - Verify clicking section items in both expanded and retracted states scrolls to the corresponding section.
2. **Search Removal**:
   - Verify no search button or search shortcut prompt appears in the header.
3. **Tab Switching**:
   - Verify switching between `Notes`, `Cards`, `Quiz`, and `Podcast` renders the respective views with correct counts.
4. **Ask Panel**:
   - Verify Ask panel toggles open/closed and questions submit properly with citations.
5. **Quality Gates**:
   - `npm run typecheck` passes with 0 errors.
   - `npm run lint` passes with 0 errors and 0 warnings.
   - `npm run build` compiles with 0 errors.
