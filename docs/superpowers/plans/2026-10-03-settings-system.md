# Settings System (General Settings Page & In-Context Notes Popover) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a comprehensive two-tier settings system for Source.io: a dedicated full `/app/settings` page for general platform preferences (AI models/BYOK, audio/podcast voices, appearance, data export) and an in-context `NotesSettingsPopover` in the document workspace for live reading typography, KaTeX math rendering, and document layout controls.

**Architecture:** A centralized typed `SettingsContext` stores and persists general and notes-specific preferences in `localStorage` with reactive updates across all components. The dedicated `/app/settings` page provides categorized tabbed management with sidebar navigation integration, while `NotesSettingsPopover` mounts directly in the document workspace header and dynamically modulates `MarkdownView` typography and workspace flags in real time.

**Tech Stack:** Next.js 16 (App Router), React 18/19, TypeScript, Tailwind CSS, Radix UI / shadcn/ui (Popover, Tabs, Dialog, Slider, Switch, Select, Button, Input), Lucide React.

**Spec:** [docs/superpowers/specs/2026-10-03-document-workspace-redesign.md](file:///d:/PROJECT%20REPOS/Source.io/docs/superpowers/specs/2026-10-03-document-workspace-redesign.md) & User Request conversation 2026-10-03.

## Global Constraints

- Must run seamlessly in Next.js Turbopack client components with `"use client"`.
- Zero broken builds or type errors (`npm run typecheck` and `npm run lint` must pass on every task).
- All preferences must persist in `localStorage` with fallback defaults when keys are unset or corrupted.
- In-context notes typography changes must immediately update the document reading pane without page reload.
- API keys in BYOK must never be logged or sent outside user-initiated API calls.

## Review Focus

1. **LocalStorage Corruption**: If `localStorage` contains invalid JSON or outdated schema, the app must gracefully recover with default settings rather than crashing with unhandled JSON parse exceptions.
2. **Immediate Reactive Reading Adjustments**: Adjusting font size (Compact/Standard/Large) or font family (Sans/Serif) in the notes popover must immediately reflect in `MarkdownView` without triggering unwanted page jumps or scrolling resets.
3. **KaTeX Render Toggle**: Disabling KaTeX in notes settings must safely render raw LaTeX code without throwing syntax exceptions.
4. **Active Route in Sidebar**: When navigating to `/app/settings`, the sidebar must highlight the Settings button as active, and clicking any document must navigate back to `/app/doc/[id]`.
5. **Mobile Responsiveness**: The `/app/settings` page and the notes settings popover must be fully usable on mobile screens (< 768px) with touch-friendly controls.

---

### Task 1: Typed Settings Store & Provider (`SettingsContext.tsx`)

**Files:**
- Create: `src/features/settings/types.ts`
- Create: `src/features/settings/context/SettingsContext.tsx`
- Modify: `app/providers.tsx`

**Interfaces:**
- Produces:
  ```ts
  export interface GeneralSettings {
    displayName: string;
    notesDepth: "comprehensive" | "concise" | "feynman";
    flashcardBatchSize: number;
    quizDifficulty: "easy" | "moderate" | "challenging";
    preferredModel: "llama-3.3-70b" | "llama-3.1-8b" | "gemini-2.0-flash" | "gpt-4o-mini";
    apiKeys: { groq?: string; gemini?: string; openai?: string };
    podcastVoiceDuo: "chen-marcus" | "rachel-alex" | "emma-daniel";
    playbackSpeed: number;
    autoGeneratePodcast: boolean;
    theme: "light" | "dark" | "system";
    accentColor: "slate" | "sky" | "emerald" | "violet";
    readingTargetWpm: number;
  }

  export interface NotesViewSettings {
    fontSize: "compact" | "regular" | "large";
    fontFamily: "sans" | "serif" | "mono";
    lineHeight: "tight" | "normal" | "relaxed";
    renderKaTeX: boolean;
    showCodeLineNumbers: boolean;
    showPageSummaryBanner: boolean;
    autoScrollOutline: boolean;
    outlineDefaultState: "expanded" | "retracted";
    regenerationTone: "academic" | "simplified" | "exam-prep";
  }

  export interface SettingsContextType {
    settings: GeneralSettings;
    updateSettings: (partial: Partial<GeneralSettings>) => void;
    notesSettings: NotesViewSettings;
    updateNotesSettings: (partial: Partial<NotesViewSettings>) => void;
    resetSettings: () => void;
  }
  ```

- [ ] **Step 1: Create `src/features/settings/types.ts`**
  Define `GeneralSettings`, `NotesViewSettings`, default values constant `DEFAULT_GENERAL_SETTINGS` and `DEFAULT_NOTES_SETTINGS`.

- [ ] **Step 2: Create `src/features/settings/context/SettingsContext.tsx`**
  Implement `SettingsProvider` reading from and synchronizing to `localStorage` with safe JSON parsing and error recovery. Provide `useSettings()` hook.

- [ ] **Step 3: Wrap `SettingsProvider` in `app/providers.tsx`**
  Import and mount `SettingsProvider` within root providers so both `/app` and `/app/doc/[id]` have immediate access.

- [ ] **Step 4: Verify typecheck**
  Run `npm run typecheck` to confirm 0 compilation errors.

---

### Task 2: In-Context Notes Settings Popover (`NotesSettingsPopover.tsx`)

**Files:**
- Create: `src/features/documents/components/NotesSettingsPopover.tsx`
- Modify: `src/features/documents/pages/DocumentWorkspace.tsx`
- Modify: `src/components/common/MarkdownView.tsx`

**Interfaces:**
- Consumes: `useSettings()` from `SettingsContext.tsx`.
- Produces: `<NotesSettingsPopover />` rendered in the document workspace header bar.

- [ ] **Step 1: Implement `src/features/documents/components/NotesSettingsPopover.tsx`**
  - Radix/shadcn Popover trigger with `SlidersHorizontal` icon and tooltip "Notes & Reading Preferences".
  - Sections:
    - **Typography**: Segmented buttons for Font Size (`Compact 14px`, `Standard 16px`, `Large 18px`), Font Family (`Geist Sans`, `Editorial Serif`, `Mono`), Line Height (`Tight`, `Normal`, `Relaxed`).
    - **Math & Code**: Toggle switch for KaTeX formula rendering (`renderKaTeX`), toggle for code line numbers.
    - **Layout Toggles**: Switch for `"On this page: ..."` summary banner (`showPageSummaryBanner`), switch for auto-scroll outline (`autoScrollOutline`).
    - **Document Tone**: Dropdown select for regeneration style (`Academic`, `Simplified`, `Exam-Prep`).

- [ ] **Step 2: Update `MarkdownView.tsx` with dynamic typography classes**
  Accept optional `fontSize`, `fontFamily`, `lineHeight`, and `renderKaTeX` props (or consume from `useSettings()`). Apply dynamic Tailwind classes (`prose-sm`, `prose-base`, `prose-lg`, `font-sans`, `font-serif`, etc.).

- [ ] **Step 3: Mount `NotesSettingsPopover` in `DocumentWorkspace.tsx`**
  Add the popover button in the right actions section of the document header (next to Copy, Regenerate, and Focus Mode). Connect `showPageSummaryBanner` to conditionally render the top banner.

- [ ] **Step 4: Verify typecheck and lint**
  Run `npm run typecheck && npm run lint`.

---

### Task 3: Dedicated General Settings Page (`/app/settings`)

**Files:**
- Create: `app/app/settings/page.tsx`
- Create: `src/features/settings/pages/SettingsPage.tsx`
- Create: `src/features/settings/components/AIModelSettings.tsx`
- Create: `src/features/settings/components/AudioSettings.tsx`
- Create: `src/features/settings/components/AppearanceSettings.tsx`
- Create: `src/features/settings/components/DataStorageSettings.tsx`

**Interfaces:**
- Consumes: `useSettings()` from `SettingsContext.tsx`, `useAuth()` from `AuthContext.tsx`.
- Produces: Complete tabbed settings dashboard under `/app/settings`.

- [ ] **Step 1: Create sub-component `AIModelSettings.tsx`**
  - Notes Depth selector (Comprehensive, Concise, Feynman/ELI5).
  - Derivative counts (Flashcard count slider/select: 10, 15, 20; Quiz difficulty select).
  - Preferred Model selector (Llama 3.3 70B, Llama 3.1 8B, Gemini 2.0 Flash).
  - BYOK (Bring Your Own Key) inputs for Groq, Gemini, and OpenAI with secure password masking and visibility toggles.

- [ ] **Step 2: Create sub-component `AudioSettings.tsx`**
  - Podcast host voice pair selector with audio style descriptions (Dr. Sarah Chen & Marcus, Rachel & Alex, Emma & Daniel).
  - Default playback speed buttons (`1.0x`, `1.25x`, `1.5x`, `2.0x`).
  - Auto-generate podcast on document ingest toggle.

- [ ] **Step 3: Create sub-component `AppearanceSettings.tsx`**
  - Theme mode cards (Light, Dark, System Auto).
  - Reading speed WPM calibrator (180, 200, 250 WPM) with dynamic preview of calculate read time.
  - Accent tint selector.

- [ ] **Step 4: Create sub-component `DataStorageSettings.tsx`**
  - "Export All Library Notes" button (downloads JSON/Markdown package).
  - "Clear Cached Drafts & Local State" button with confirmation.
  - "Reset Settings to Default" button.

- [ ] **Step 5: Assemble `SettingsPage.tsx` and create route `app/app/settings/page.tsx`**
  - Clean two-column layout on desktop: Left navigation tab list (`AI & Models`, `Podcast & Audio`, `Appearance`, `Data & Storage`), Right content card pane.
  - Title and description with subtle breadcrumbs.

- [ ] **Step 6: Verify route build & typecheck**
  Run `npm run typecheck`.

---

### Task 4: Sidebar Navigation Integration (`AppSidebar.tsx`)

**Files:**
- Modify: `src/features/documents/components/AppSidebar.tsx`

**Interfaces:**
- Consumes: Next.js `usePathname()`.
- Produces: Navigation link to `/app/settings` with active highlight styling and icon.

- [ ] **Step 1: Add Settings link in `AppSidebar.tsx`**
  Insert a Settings navigation item above the footer user profile card:
  ```tsx
  <Link
    href="/app/settings"
    className={cn(
      "flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium transition-colors",
      pathname === "/app/settings"
        ? "bg-muted text-foreground font-semibold"
        : "text-muted-foreground hover:text-foreground hover:bg-muted/60"
    )}
  >
    <Settings className="h-4 w-4" />
    <span>Settings</span>
  </Link>
  ```

- [ ] **Step 2: Add quick Settings gear icon in user profile dropdown/card**
  Allow clicking the gear icon directly on the user profile to jump to `/app/settings`.

- [ ] **Step 3: Verify build and lint**
  Run `npm run typecheck && npm run lint`.

---

### Task 5: End-to-End Verification & Polish

**Files:**
- Test across: `/app`, `/app/settings`, `/app/doc/demo-networking`

- [ ] **Step 1: Test settings persistence**
  Verify changing a setting (e.g. font size to Large, or KaTeX toggle off) persists upon refreshing the browser.

- [ ] **Step 2: Test live Notes popover**
  Open `/app/doc/demo-networking`, click Notes Settings in the header, change font to Serif and size to Compact, verify notes reading pane updates immediately.

- [ ] **Step 3: Run full production build verification**
  Run `npm run build` and ensure all routes (`/app`, `/app/settings`, `/app/doc/[docId]`) compile with 0 errors.
