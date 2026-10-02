# Source.io Document View Redesign — Implementation Plan

Based on wireframe analysis and user decisions.

---

## Decisions Summary

| Aspect | Decision |
|--------|----------|
| Left sidebar | **Keep existing AppSidebar unchanged** |
| Document outline | **Both**: inline chips in Notes tab + collapsible panel |
| Right panel | **Replace WorkspaceCompanion** with "Ask" panel (chat moves here) |
| Tabs | **Notes, Podcast, Cards, Quiz** (4 tabs, no Chat, no Recap) |
| Search | **Remove global ⌘K** from document view |
| Icons | **Keep Lucide React** — map wireframe icons to Lucide equivalents |

---

## File Changes Required

### 1. DocumentWorkspace.tsx (Main orchestrator)
- Remove `WorkspaceCompanion` import/usage
- Add new `AskPanel` component
- Update tab state: `["notes", "podcast", "cards", "quiz"]`
- Remove `companionTab`, `companionOpen`, `companionExpanded` state
- Add outline chips rendering in Notes tab
- Add collapsible outline panel (reusing `WorkspaceOutline` logic)
- Remove global CommandDialog (`cmdOpen`, `setCmdOpen`, keyboard listener)
- Update layout: 3-column → 2-column (outline chips inline, Ask panel right)

### 2. New Component: AskPanel.tsx
- Replaces `WorkspaceCompanion`
- "Ask this lecture" header
- Suggested questions chips (click to send)
- Chat message history (streaming)
- Input field with send button
- Citations highlight passages in notes (scroll to heading)

### 3. WorkspaceOutline.tsx (Enhance)
- Add `inlineChips` mode prop
- Render as horizontal scrollable chips when `inlineChips=true`
- Keep full tree mode for collapsible panel

### 4. AppSidebar.tsx — NO CHANGES
- Keep as-is per user decision

### 5. WorkspaceCommandMenu.tsx — REMOVE from DocumentWorkspace
- Global ⌘K removed from document view
- Keep component for potential landing page use

---

## Tab Mapping

| Wireframe Tab | Current Tab | Action |
|---------------|-------------|--------|
| Notes | (new) | New tab — main reading view |
| Podcast | Podcast | Keep, rename label if needed |
| Cards 2 | Cards | Keep |
| Quiz | Quiz | Keep |
| Chat | Chat | **Remove tab** → moves to Ask panel |
| Recap | — | Not needed (Podcast = Recap) |

---

## Layout Structure (New)

```
DocumentWorkspace
├── Top Header (title, badges, actions: Copy, Regenerate)
├── Tab Bar [Notes | Podcast | Cards | Quiz]
├── Main Grid (2-column on desktop)
│   ├── Left: Notes Content
│   │   ├── Inline Outline Chips (horizontal scroll)
│   │   ├── Collapsible Outline Panel (toggle)
│   │   └── Notes Markdown Content
│   └── Right: Ask Panel (slide-in/fixed)
│       ├── "Ask this lecture" header
│       ├── Suggested Questions
│       ├── Chat History
│       └── Input + Send
└── Mobile: Tab-based navigation, Ask panel as sheet
```

---

## Implementation Order

1. **Create AskPanel.tsx** — new chat panel
2. **Update WorkspaceOutline.tsx** — add inline chips mode
3. **Refactor DocumentWorkspace.tsx** — new layout, tabs, remove Companion/CommandDialog
4. **Update types** — remove unused CompanionTab type
5. **Test build & dev**

---

## Lucide Icon Mapping (Wireframe → Lucide)

| Wireframe (Tabler) | Lucide Equivalent |
|--------------------|-------------------|
| ti ti-layout-sidebar | `LayoutDashboard` or `PanelLeft` |
| ti ti-plus | `Plus` |
| ti ti-books | `BookOpen` |
| ti ti-file-text | `FileText` |
| ti ti-search | `Search` |
| ti ti-chevron-down | `ChevronDown` |
| ti ti-send | `Send` |
| ti ti-books (recap) | `BookOpen` / `Headphones` |

---

## Ruling: Outline Chips Behavior

- Click chip → scroll to heading in notes (existing `activeHeadingId` logic)
- Chips show top-level headings only (H1/H2)
- Collapsible panel shows full hierarchy (H1-H4)
- Panel toggle button in Notes toolbar