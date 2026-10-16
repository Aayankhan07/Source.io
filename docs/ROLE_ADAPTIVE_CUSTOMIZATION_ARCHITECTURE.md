# Source.io — Role-Adaptive & Customization Architecture Specification
*Document Status: Master Engineering Blueprint • Version 3.0.0 (Definitive Specification) • Target: Source.io Workstation*

---

## 1. Executive Summary & Core Product Mission

**Source.io** transforms unstructured, dense learning materials (textbooks, monographs, research papers, lecture recordings, and YouTube transcripts) into grounded active-study intelligence primitives. 

While its initial release targeted collegiate study, academic engagement across different educational tiers is fundamentally heterogeneous:
- **Middle School Students (Grades 6–8):** Need conversational scaffolding, intuitive physical analogies (ELI12), bold vocabulary callouts, simplified page badges, and 3-choice diagnostic quizzes with cheerful hints.
- **Exam-Focused High Schoolers (AP/IB/GCSE/A-Levels):** Need the Cornell Study Architecture (cue questions on the left, structured summaries on the right), formula recall, worked step-by-step examples, and exam-board distractor rationales.
- **Undergraduate / Bachelor's Scholars:** Require formal axiomatic proofs, step-by-step KaTeX mathematical derivations, comparative contrast tables, and Bloom's taxonomy evaluative assessments.
- **Postgraduate / Medical & Law Scholars:** Demand high-density synthesis, differential diagnoses, clinical/legal vignettes, and 5-box Leitner spaced repetition.
- **Researchers / PhD Candidates / Faculty:** Reject basic flashcards and beginner quizzes in favor of an IMRaD Literature Audit, methodology critiques, statistical validity analysis, open research gaps, and APA 7th / IEEE / BibTeX citation trees.
- **Teachers / University Lecturers:** Require curriculum-ready 45/60-minute lesson plans, lecture pacing schedules, chalkboard derivation notes, printable exam rubrics with distractor keys, and student handout cards.
- **Custom / Self-Directed Learners:** Require complete modular control over every single block, rigor slider, and citation format.

This specification details the **definitive, zero-defect engineering blueprint** to make Source.io completely role-adaptive while retaining instant user customizability.

```
                                 ┌────────────────────────────────────────┐
                                 │     User Profile & Role Selection      │
                                 │  (Onboarding or Settings Customization)│
                                 └───────────────────┬────────────────────┘
                                                     │
                   ┌─────────────────────────────────┼────────────────────────────────┐
                   ▼                                 ▼                                ▼
       ┌───────────────────────┐         ┌───────────────────────┐        ┌───────────────────────┐
       │   Workspace Shell     │         │ Dynamic Prompt Engine │        │ State Synchronization │
       │  - Filter Enabled Tabs│         │ - Role Persona Inject │        │ - SettingsContext     │
       │  - TAB_LABELS Mapping │         │ - Modular Note Blocks │        │ - Supabase profiles   │
       │  - Active Tab Fallback│         │ - Rigor Depth (1-5)   │        │ - LocalStorage Fallback│
       │  - Role Primitives    │         │ - Citation Formats    │        │ - Command Palette (K) │
       │  - Per-Doc Overrides  │         │ - Grounding Citations │        │ - Tactile Left Dock   │
       └───────────────────────┘         └───────────────────────┘        └───────────────────────┘
```

---

## 2. The 7 Academic Personas & Feature Configuration Matrix

When a persona is chosen, Source.io immediately hydrates `workspace_preferences` with tailored defaults. **Users are never locked into presets**; any tab, block, or rigor setting can be independently customized in Settings or overridden per document.

| # | Persona | Target User | Default Enabled Modes | Default Note Architecture & Tone | Evaluative Adaptation (Cards, Quiz, Audio) | Citation Style |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **1** | **School Student**<br>`school_student` | Grades 6–8; young learners | `notes`, `flashcards`, `quiz`, `ask`<br>*(Podcast hidden by default)* | **Visual & Story-Driven (ELI12)**<br>Plain language, bold keywords, short bullets, intuitive analogies. Zero dense jargon. | **Cards:** Term $\leftrightarrow$ Simple Definition.<br>**Quiz:** 3-option MCQs with cheerful hints.<br>**Audio:** Storyteller explainer. | Simple Page Badge<br>`[Page 4]` |
| **2** | **High School**<br>`high_school` | Grades 9–12 / AP / IB / O & A-Levels | `notes`, `flashcards`, `quiz`, `podcast`, `ask` | **Cornell & Exam Syllabus**<br>Cue terms on left, structured summaries on right, step-by-step worked solutions, exam traps. | **Cards:** Formula & definition recall.<br>**Quiz:** Board-style MCQs with marking scheme rationale.<br>**Audio:** High-yield exam recap. | Page & Section<br>`[p. 14, §1.2]` |
| **3** | **Undergrad**<br>`undergrad` *(Default)* | College & university bachelor's | `notes`, `flashcards`, `quiz`, `podcast`, `ask` | **Executive Lecture & Proofs**<br>High-level abstract, KaTeX derivations, comparative tables, misconceptions. | **Cards:** Conceptual synthesis.<br>**Quiz:** Bloom's Taxonomy application items.<br>**Audio:** Dual-host collegiate debate. | Coordinate Pills<br>`[p. 14, ¶3]` |
| **4** | **Scholar / Postgrad**<br>`scholar` | Master's, Med School, Law School | `notes`, `flashcards`, `quiz`, `podcast`, `ask` | **High-Density Synthesis**<br>Thesis extraction, theoretical paradigms, clinical/legal differentials, KaTeX proofs. | **Cards:** 5-Box Leitner spaced cadence.<br>**Quiz:** Case-vignettes & multi-select diagnostics.<br>**Audio:** Research colloquium. | Exact Coordinates + Popover<br>`[p. 14, ¶3:L12]` |
| **5** | **Researcher / PhD**<br>`researcher` | Academics, PIs, PhD candidates | `notes`, `podcast`, `ask`<br>*(Flashcards & Quiz hidden by default)* | **IMRaD & Critical Literature Review**<br>Methodology audit, statistical validity, sample bias, limitations, research gaps. | **Quiz/Cards:** Replaced by Claim Verification Matrix & BibTeX / APA / IEEE export.<br>**Audio:** Peer-review seminar. | Formal Academic<br>`(Smith et al., 2024)` / `[1]` / BibTeX |
| **6** | **Teacher / Educator**<br>`teacher` | School teachers, professors, TAs | `notes`, `flashcards`, `quiz`, `ask`<br>*(Podcast hidden by default)* | **Instructional Lesson Plan**<br>Learning objectives, 45/60-min pacing guide, board examples, discussion questions. | **Quiz:** Exam & rubric generator (with distractor analysis & printable export).<br>**Cards:** Classroom handout cards. | Instructor Source Key<br>`[Source p. 14]` |
| **7** | **Custom / Self-Learner**<br>`custom` | Independent learners, polymaths | Full user discretion | **Modular Custom Builder**<br>User selects exact sections, code block formats, and tone directives. | Fully configurable difficulty and spacing cadence. | User-Selected |

---

## 3. Database Schema Migration (`public.profiles`)

In full alignment with **Section 9** of `docs/MASTER_SYSTEM_ARCHITECTURE.md`, `public.profiles` receives structured JSONB preferences, user role enumeration, and onboarding state. This schema allows forward-compatible feature flags without table locking.

```sql
-- Migration: 20261017_role_customization_schema.sql
-- Description: Adds user_role, onboarding_completed, and workspace_preferences JSONB to public.profiles

DO $$ 
BEGIN
  -- 1. Create User Academic Role Enum Type if not exists
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_academic_role') THEN
    CREATE TYPE public.user_academic_role AS ENUM (
      'school_student',
      'high_school',
      'undergrad',
      'scholar',
      'researcher',
      'teacher',
      'custom'
    );
  END IF;
END $$;

-- 2. Upgrade public.profiles table
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS user_role public.user_academic_role DEFAULT 'undergrad',
  ADD COLUMN IF NOT EXISTS onboarding_completed BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS workspace_preferences JSONB NOT NULL DEFAULT '{
    "enabledModes": ["notes", "flashcards", "quiz", "podcast", "ask"],
    "defaultMode": "notes",
    "noteFormat": "executive_proofs",
    "noteSections": {
      "executiveOverview": true,
      "mathProofs": true,
      "contrastTables": true,
      "misconceptions": true,
      "analogies": false,
      "discussionPrompts": false,
      "actionItems": false
    },
    "rigorLevel": 3,
    "citationStyle": "coordinate_pills",
    "quizStyle": "diagnostic_mcq",
    "flashcardAlgorithm": "leitner_5_box",
    "podcastStyle": "socratic_debate",
    "customSystemInstruction": ""
  }'::jsonb;

-- 3. Create GIN index for rapid JSONB query filtering on preferences
CREATE INDEX IF NOT EXISTS idx_profiles_workspace_preferences 
ON public.profiles USING gin (workspace_preferences);

-- 4. Enable RLS policy allowing authenticated users to update their own profile and preferences
DROP POLICY IF EXISTS "Users can update their own profile and preferences" ON public.profiles;
CREATE POLICY "Users can update their own profile and preferences"
ON public.profiles FOR UPDATE
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);
```

---

## 4. TypeScript Contracts (`src/types/customization.ts`)

Strict compile-time contracts shared across client components, Zustand/React Query state, and Edge Function handlers:

```typescript
// src/types/customization.ts

export type UserRole =
  | 'school_student'
  | 'high_school'
  | 'undergrad'
  | 'scholar'
  | 'researcher'
  | 'teacher'
  | 'custom';

export type StudyModeId = 'notes' | 'flashcards' | 'quiz' | 'podcast' | 'ask';

export type NoteFormatStyle =
  | 'simplified_eli12'     // School Student
  | 'cornell_exam'         // High School
  | 'executive_proofs'     // Undergrad / Scholar
  | 'literature_critique'  // Researcher
  | 'lesson_plan'          // Teacher
  | 'custom_modular';      // Custom

export type CitationStyle =
  | 'simple_page'          // [Page 14]
  | 'coordinate_pills'     // [p. 14, ¶3]
  | 'apa_7'                // (Author et al., 2024, p. 14)
  | 'ieee'                 // [1, p. 14]
  | 'exact_coordinate';    // [p. 14, ¶3:L12]

export type QuizStyle =
  | 'simple_check'
  | 'diagnostic_mcq'
  | 'case_vignettes'
  | 'exam_rubric_builder';

export type FlashcardAlgorithm = 'simple_flip' | 'leitner_5_box';

export type PodcastStyle =
  | 'storyteller_explainer'
  | 'socratic_debate'
  | 'methodology_review'
  | 'lecture_monologue';

export interface NoteSectionToggles {
  executiveOverview: boolean;
  mathProofs: boolean;
  contrastTables: boolean;
  misconceptions: boolean;
  analogies: boolean;
  discussionPrompts: boolean;
  actionItems: boolean;
}

export interface WorkspacePreferences {
  enabledModes: StudyModeId[];
  defaultMode: StudyModeId;
  noteFormat: NoteFormatStyle;
  noteSections: NoteSectionToggles;
  rigorLevel: 1 | 2 | 3 | 4 | 5;
  citationStyle: CitationStyle;
  quizStyle: QuizStyle;
  flashcardAlgorithm: FlashcardAlgorithm;
  podcastStyle: PodcastStyle;
  customSystemInstruction?: string;
}

export interface UserProfileCustomization {
  user_role: UserRole;
  onboarding_completed: boolean;
  workspace_preferences: WorkspacePreferences;
}

/** Pre-configured role defaults applied during onboarding or preset resets */
export const ROLE_PRESETS: Record<UserRole, WorkspacePreferences> = {
  school_student: {
    enabledModes: ['notes', 'flashcards', 'quiz', 'ask'],
    defaultMode: 'notes',
    noteFormat: 'simplified_eli12',
    noteSections: {
      executiveOverview: true,
      mathProofs: false,
      contrastTables: true,
      misconceptions: true,
      analogies: true,
      discussionPrompts: false,
      actionItems: true,
    },
    rigorLevel: 1,
    citationStyle: 'simple_page',
    quizStyle: 'simple_check',
    flashcardAlgorithm: 'simple_flip',
    podcastStyle: 'storyteller_explainer',
  },
  high_school: {
    enabledModes: ['notes', 'flashcards', 'quiz', 'podcast', 'ask'],
    defaultMode: 'notes',
    noteFormat: 'cornell_exam',
    noteSections: {
      executiveOverview: true,
      mathProofs: true,
      contrastTables: true,
      misconceptions: true,
      analogies: true,
      discussionPrompts: true,
      actionItems: false,
    },
    rigorLevel: 2,
    citationStyle: 'coordinate_pills',
    quizStyle: 'diagnostic_mcq',
    flashcardAlgorithm: 'leitner_5_box',
    podcastStyle: 'socratic_debate',
  },
  undergrad: {
    enabledModes: ['notes', 'flashcards', 'quiz', 'podcast', 'ask'],
    defaultMode: 'notes',
    noteFormat: 'executive_proofs',
    noteSections: {
      executiveOverview: true,
      mathProofs: true,
      contrastTables: true,
      misconceptions: true,
      analogies: false,
      discussionPrompts: false,
      actionItems: false,
    },
    rigorLevel: 3,
    citationStyle: 'coordinate_pills',
    quizStyle: 'diagnostic_mcq',
    flashcardAlgorithm: 'leitner_5_box',
    podcastStyle: 'socratic_debate',
  },
  scholar: {
    enabledModes: ['notes', 'flashcards', 'quiz', 'podcast', 'ask'],
    defaultMode: 'notes',
    noteFormat: 'executive_proofs',
    noteSections: {
      executiveOverview: true,
      mathProofs: true,
      contrastTables: true,
      misconceptions: true,
      analogies: false,
      discussionPrompts: false,
      actionItems: false,
    },
    rigorLevel: 4,
    citationStyle: 'exact_coordinate',
    quizStyle: 'case_vignettes',
    flashcardAlgorithm: 'leitner_5_box',
    podcastStyle: 'socratic_debate',
  },
  researcher: {
    enabledModes: ['notes', 'podcast', 'ask'],
    defaultMode: 'notes',
    noteFormat: 'literature_critique',
    noteSections: {
      executiveOverview: true,
      mathProofs: true,
      contrastTables: true,
      misconceptions: true,
      analogies: false,
      discussionPrompts: false,
      actionItems: false,
    },
    rigorLevel: 5,
    citationStyle: 'apa_7',
    quizStyle: 'case_vignettes',
    flashcardAlgorithm: 'leitner_5_box',
    podcastStyle: 'methodology_review',
  },
  teacher: {
    enabledModes: ['notes', 'flashcards', 'quiz', 'ask'],
    defaultMode: 'notes',
    noteFormat: 'lesson_plan',
    noteSections: {
      executiveOverview: true,
      mathProofs: true,
      contrastTables: true,
      misconceptions: true,
      analogies: true,
      discussionPrompts: true,
      actionItems: true,
    },
    rigorLevel: 3,
    citationStyle: 'coordinate_pills',
    quizStyle: 'exam_rubric_builder',
    flashcardAlgorithm: 'simple_flip',
    podcastStyle: 'lecture_monologue',
  },
  custom: {
    enabledModes: ['notes', 'flashcards', 'quiz', 'podcast', 'ask'],
    defaultMode: 'notes',
    noteFormat: 'custom_modular',
    noteSections: {
      executiveOverview: true,
      mathProofs: true,
      contrastTables: true,
      misconceptions: true,
      analogies: false,
      discussionPrompts: false,
      actionItems: false,
    },
    rigorLevel: 3,
    citationStyle: 'coordinate_pills',
    quizStyle: 'diagnostic_mcq',
    flashcardAlgorithm: 'leitner_5_box',
    podcastStyle: 'socratic_debate',
  },
};
```

---

## 5. UI Architecture & Tactile Visual Wireframes

Following the **Obsidian Paper & Ink** design system (`#FAF9F6`, `#0F172A`, `#E2E8F0`, Outfit typography, mechanical spring transitions):

### 5.1 First-Login Onboarding Wizard (`/app/onboarding`)

Rendered fullscreen in a focused, modal-like container with progressive micro-steps:

```
┌────────────────────────────────────────────────────────────────────────────┐
│  Source.io                               Step 1 of 4 • [Skip with Defaults]│
│  ────────────────────────────────────────░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░ │
│                                                                            │
│  01 / ACADEMIC PROFILE                                                     │
│  How will you be using Source.io?                                          │
│  We’ll configure your visible tabs, note structure, and AI rigor.          │
│                                                                            │
│  ┌────────────────────────┐  ┌────────────────────────┐  ┌───────────────┐ │
│  │ [●] Bachelor's / UG    │  │ [ ] High School        │  │ [ ] School    │ │
│  │ Lectures, proofs &     │  │ Board exams, Cornell   │  │ Analogies &   │ │
│  │ exam synthesis         │  │ notes & worked steps   │  │ simple terms  │ │
│  └────────────────────────┘  └────────────────────────┘  └───────────────┘ │
│  ┌────────────────────────┐  ┌────────────────────────┐  ┌───────────────┐ │
│  │ [ ] Scholar / Grad     │  │ [ ] Researcher / PhD   │  │ [ ] Teacher   │ │
│  │ Dense monographs, law  │  │ Lit critique, methods, │  │ Lesson plans, │ │
│  │ & medical differentials│  │ limitations & APA/IEEE │  │ rubrics, tests│ │
│  └────────────────────────┘  └────────────────────────┘  └───────────────┘ │
│                                                                            │
│                                              [ Continue to Tools (Enter) →]│
└────────────────────────────────────────────────────────────────────────────┘
```

**Steps Walkthrough:**
1. **Step 1: Role Selection:** Auto-populates Steps 2, 3, and 4 with optimal defaults from `ROLE_PRESETS`.
2. **Step 2: Workspace Tools Switcher:** Tactile interactive toggle cards for each study mode (`Notes`, `Flashcards`, `Quiz`, `Podcast`, `Copilot Ask`).
3. **Step 3: Note Architecture & Blocks:** Selection of note template and multi-select checkboxes for included note components (Executive Overview, KaTeX Proofs, Comparative Tables, Misconceptions, Analogies, Discussion Prompts).
4. **Step 4: Citation Format & Rigor Slider:**
   - Rigor Slider: `1 (Intuitive & Accessible)` $\longleftrightarrow$ `5 (Formal Academic Rigor)`.
   - Citation Style: `Inline Coordinate Pills` | `Formal APA 7th / IEEE` | `Simple Page Index`.
   - Finish Action: Writes to Supabase `profiles` with `onboarding_completed: true` and navigates smoothly to `/app`.

### 5.2 Dynamic Workspace Header Switcher (`DocumentWorkspace.tsx`)

Instead of hardcoded static tabs, the central capsule switcher renders only the user's enabled modes and renames them contextually:

```typescript
export const TAB_LABELS: Record<UserRole, Record<StudyModeId, string>> = {
  school_student: { notes: 'Study Guide', flashcards: 'Word Cards', quiz: 'Practice Check', podcast: 'Audio Story', ask: 'Ask Tutor' },
  high_school:    { notes: 'Cornell Notes', flashcards: 'Flashcards', quiz: 'Exam Practice', podcast: 'Audio Recap', ask: 'Ask Copilot' },
  undergrad:      { notes: 'Notes', flashcards: 'Flashcards', quiz: 'Quiz', podcast: 'Podcast', ask: 'Ask Copilot' },
  scholar:        { notes: 'Synthesis', flashcards: 'Leitner Deck', quiz: 'Board Quiz', podcast: 'Seminar Audio', ask: 'Ask Copilot' },
  researcher:     { notes: 'Lit Review', flashcards: 'Key Claims', quiz: 'Method Audit', podcast: 'Paper Colloquium', ask: 'Query Corpus' },
  teacher:        { notes: 'Lesson Plan', flashcards: 'Handout Cards', quiz: 'Exam Builder', podcast: 'Lecture Audio', ask: 'Curriculum Assistant' },
  custom:         { notes: 'Notes', flashcards: 'Flashcards', quiz: 'Quiz', podcast: 'Podcast', ask: 'Ask Copilot' },
};
```

**Visual comparison:**
- **Teacher View:** `[ Lesson Plan ] [ Handout Cards ] [ Exam Builder ] [ Curriculum Assistant ]`
- **Researcher View:** `[ Lit Review ] [ Paper Colloquium ] [ Query Corpus ]` *(clean 3-pill interface with zero card/quiz clutter)*
- **Undergrad View:** `[ Notes ] [ Flashcards (24) ] [ Quiz ] [ Podcast ] [ Ask Copilot ]`

### 5.3 Settings Console Architecture (`src/features/settings/`)

The Settings view is upgraded to feature a prominent **Customization** tab alongside **AI & Models**, **Audio**, and **Appearance**:

```
┌────────────────────────────────────────────────────────────────────────────┐
│  Settings                                                                  │
│  [● Customization ]  [ AI & Models (BYOK) ]  [ Audio ]  [ Appearance ]     │
├────────────────────────────────────────────────────────────────────────────┤
│                                                                            │
│  1. ACTIVE PERSONA PRESET                                   [Reset Preset] │
│  Switching presets updates defaults below, or tweak any setting manually.  │
│  [ School ] [ High School ] [● Bachelor's ] [ Scholar ] [ PhD ] [ Teacher ]│
│                                                                            │
│  ────────────────────────────────────────────────────────────────────────  │
│  2. WORKSPACE STUDY MODES (VISIBLE TABS)                                   │
│  Toggle which tools appear in your document workspace header.              │
│  [✓] Notes          [✓] Flashcards       [✓] Diagnostic Quiz               │
│  [✓] Audio Podcast  [✓] Grounded Copilot                                   │
│                                                                            │
│  ────────────────────────────────────────────────────────────────────────  │
│  3. NOTE ARCHITECTURE & INCLUDED BLOCKS                                    │
│  Template Style: [ Executive Outline & Proofs          ▼ ]                 │
│  Included Sections:                                                        │
│  [✓] Executive Summary         [✓] KaTeX Math Derivations                  │
│  [✓] Comparative Tables        [✓] Misconceptions & Edge Cases             │
│  [ ] Real-World Analogies      [ ] Classroom Discussion Prompts            │
│                                                                            │
│  ────────────────────────────────────────────────────────────────────────  │
│  4. RIGOR, CITATIONS & ASSESSMENT BEHAVIOR                                 │
│  Explanation Depth:   [1]───────[2]───────[● 3]───────[4]───────[5]        │
│                       Simple             Balanced            Rigorous      │
│  Citation Badge Style: [ Inline Coordinates [p. 14, ¶2] ▼ ]                │
│  Quiz Mode:            [ Diagnostic MCQ with Rationale  ▼ ]                │
│  Custom AI Directive:  [ e.g., "Always include Python pseudocode..."     ] │
│                                                                            │
│                                              [ Save Customization Changes ]│
└────────────────────────────────────────────────────────────────────────────┘
```

### 5.4 Document-Level Overrides (`NotesSettingsPopover.tsx`)

The existing `NotesSettingsPopover` in the document workspace is enhanced to allow **per-document overrides**:
- An undergraduate reading a dense legal contract or peer-reviewed medical trial can click `⚙ Notes Settings` in the top right of the note view.
- They can switch the note format to **Literature Critique** or change rigor to **Level 5** specifically for this document.
- Clicking **Regenerate Notes** sends the document-level override payload to the Edge Function without altering their global profile defaults.

---

## 6. Edge Prompt Engine (`supabase/functions/_shared/promptCompiler.ts`)

Instead of static system prompts, all generation functions (`generate_notes`, `generate_derivatives`, `generate_podcast`, `chat`) call a centralized, typed prompt compiler:

```typescript
// supabase/functions/_shared/promptCompiler.ts
import { UserRole, WorkspacePreferences } from "./types.ts";

export function buildNotesSystemPrompt(role: UserRole, prefs: WorkspacePreferences): string {
  const roleDirectives: Record<UserRole, string> = {
    school_student: `You are an exceptionally engaging middle-school educator.
Use simple everyday words, relatable analogies, short active sentences, and bold key vocabulary definitions.
Never use dense academic jargon without immediately defining it.
Format your notes with clear visual milestones and encourage the student with friendly tone.`,

    high_school: `You are an AP / IB / A-Level exam preparation specialist.
Structure your notes with high-yield concepts, clear definitions, step-by-step worked solutions, and common exam traps.
Highlight marking scheme priorities and formulas that frequently appear on standardized tests.`,

    undergrad: `You are an accomplished university professor.
Deliver a rigorous, high-level synthesis of the material.
Provide axiomatic definitions, formal KaTeX derivations ($$...$$), comparative evaluation tables, and theoretical foundations.`,

    scholar: `You are a postgraduate thesis supervisor and academic specialist.
Produce high-density analytical synthesis focusing on theoretical paradigms, clinical differentials, case law precedence, and axiomatic proofs.
Prioritize nuance, edge-case limitations, and multi-variable dynamics.`,

    researcher: `You are a peer-review referee for a top-tier academic journal.
Deconstruct this source using the IMRaD framework.
Critically evaluate the research question, methodology, sample validity, statistical power, assumptions, and explicit research gaps.
Do not provide beginner tutorials or oversimplified overviews.`,

    teacher: `You are a Master Curriculum Architect.
Transform this source text into an actionable 45/60-minute Lesson Plan.
Include explicit Learning Objectives (Bloom's Taxonomy), a timed Lecture Pacing Schedule, board-ready derivation notes, and socratic classroom discussion prompts.`,

    custom: `Follow strictly the modular structure, rigor constraints, and custom directives specified below.`
  };

  const activeBlocks = [
    prefs.noteSections.executiveOverview && "1. Executive Summary: High-level thesis and core arguments.",
    prefs.noteSections.mathProofs && "2. Formal Mathematics: Step-by-step KaTeX ($$...$$) derivations, symbol definitions, and boundary conditions.",
    prefs.noteSections.contrastTables && "3. Comparative Tables: Markdown tables contrasting competing methods, paradigms, or theories.",
    prefs.noteSections.misconceptions && "4. Critical Misconceptions: Common pitfalls, erroneous assumptions, and edge cases.",
    prefs.noteSections.analogies && "5. Intuitive Analogies: Real-world physical models that clarify abstract concepts.",
    prefs.noteSections.discussionPrompts && "6. Socratic Discussion Prompts: Deep analytical questions for seminars or exam mastery.",
    prefs.noteSections.actionItems && "7. Actionable Key Takeaways: Clear procedural steps or study roadmap.",
  ].filter(Boolean).join("\n");

  const citationFormatInstructions: Record<string, string> = {
    simple_page: `Format citations as simple page badges: <cite page="X">[Page X]</cite>`,
    coordinate_pills: `Format citations with page and paragraph pills: <cite page="X" para="Y">[p. X, ¶Y]</cite>`,
    apa_7: `Format citations using APA 7th style: (Author, Year, p. X)`,
    ieee: `Format citations using IEEE bracketed numbering: [1, p. X]`,
    exact_coordinate: `Format citations with exact coordinates: <cite page="X" para="Y" line="Z">[p. X, ¶Y:L Z]</cite>`
  };

  return `
You are the active intelligence engine of "Source.io".

## ROLE & PEDAGOGICAL PERSONA
${roleDirectives[role] || roleDirectives.undergrad}

## ACADEMIC RIGOR LEVEL
Level ${prefs.rigorLevel} out of 5 (${
    prefs.rigorLevel === 1 ? "Intuitive & Accessible" :
    prefs.rigorLevel === 2 ? "Foundational & Exam-Oriented" :
    prefs.rigorLevel === 3 ? "Standard Collegiate Rigor" :
    prefs.rigorLevel === 4 ? "Advanced Graduate Synthesis" :
    "Peer-Review / Theoretical Maximality"
}).

## REQUIRED STRUCTURAL MODULES
Include only the following requested sections:
${activeBlocks}

## CITATION MANDATE
${citationFormatInstructions[prefs.citationStyle] || citationFormatInstructions.coordinate_pills}
Every factual claim, equation origin, and assertion MUST be grounded with an inline source citation tag.

${prefs.customSystemInstruction ? `## USER CUSTOM DIRECTIVE\n${prefs.customSystemInstruction}` : ""}
`.trim();
}
```

---

## 7. Crucial Architectural Upgrades & System Integration

*The following upgrades address gaps between the initial idea and Source.io's production codebase:*

### Upgrade 1: Tab Safety & Active Mode Fallbacks
In `DocumentWorkspace.tsx`, if a user's `currentTab` is disabled by their role preferences (e.g. they switch to `researcher` which disables `flashcards` and `quiz`, but their URL specifies `?tab=quiz`), the workspace must safely fallback to `notes` or the first item in `preferences.enabledModes`. Without this fallback, the user would see a blank state or throw a render exception.

```typescript
const visibleTabs = useMemo(() => {
  return tabs.filter((t) => preferences.enabledModes.includes(t.id));
}, [tabs, preferences.enabledModes]);

// Auto-fallback if active tab is disabled in preferences
useEffect(() => {
  if (visibleTabs.length > 0 && !visibleTabs.some((t) => t.id === currentTab)) {
    setCurrentTab(visibleTabs[0].id);
  }
}, [visibleTabs, currentTab]);
```

### Upgrade 2: Dual-Tab Architecture in `NotesSettingsPopover`
Instead of cluttering the existing typography controls (Font Size, Serif/Mono, Line Height, KaTeX), `NotesSettingsPopover.tsx` is structured into two clean tabs:
1. **Typography & Layout:** Font size, typeface, line height, KaTeX, and outline sync.
2. **Rigor & Persona Override:** Note Architecture selector, Rigor Slider (1–5), Block Checkboxes, and a direct "Regenerate with Overrides" trigger.

### Upgrade 3: Role-Specific Action Bar Primitives
- **For Teachers:** Adds an **"Export Exam & Rubric"** action in `QuizPlayer.tsx` that outputs a printable student test sheet and teacher answer key.
- **For Researchers:** Adds an **"Export BibTeX / APA Citations"** modal and Claim Verification Matrix in the Lit Review view.
- **For Students:** Adds an **"Export to Anki (.tsv)"** button in `FlashcardsDeck.tsx`.

### Upgrade 4: Command Palette (`GlobalCommandPalette.tsx`) Quick Role Switcher
Allows power users to type `Cmd+K` / `Ctrl+K` and switch personas on the fly:
- `Switch Persona: Researcher`
- `Switch Persona: Teacher`
- `Switch Persona: Undergrad`

---

## 8. High-Fidelity Tactile UI Wireframes

```
┌────────────────────────────────────────────────────────────────────────────┐
│  Source.io                             Step 1 of 4 • [Skip with Defaults]  │
│  ─────────────────────────────────────░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░  │
│                                                                            │
│  01 / ACADEMIC PROFILE                                                     │
│  How will you be using Source.io?                                          │
│  We’ll tailor your note structures, AI rigor, and workspace tools.         │
│  You can change these anytime in Settings → Customization.                 │
│                                                                            │
│  ┌──────────────────────┐ ┌──────────────────────┐ ┌─────────────────────┐ │
│  │ [●] Bachelor's / UG  │ │ [ ] High School      │ │ [ ] School Student  │ │
│  │ Lectures, proofs &   │ │ Board exams, Cornell │ │ Simple analogies &  │ │
│  │ exam mastery         │ │ notes & practice     │ │ step-by-step guides │ │
│  └──────────────────────┘ └──────────────────────┘ └─────────────────────┘ │
│  ┌──────────────────────┐ ┌──────────────────────┐ ┌─────────────────────┐ │
│  │ [ ] Scholar / Grad   │ │ [ ] Researcher / PhD │ │ [ ] Teacher / Prof  │ │
│  │ Dense monographs &   │ │ Literature critique, │ │ Lesson plans, rubrics│ │
│  │ board vignettes      │ │ methods & citations  │ │ & exam generation   │ │
│  └──────────────────────┘ └──────────────────────┘ └─────────────────────┘ │
│                                                                            │
│                                                       [ Continue (Enter) →]│
└────────────────────────────────────────────────────────────────────────────┘
```

```
┌────────────────────────────────────────────────────────────────────────────┐
│  Source.io                               Step 2 of 4 • [Skip with Defaults]│
│  ────────────────────────────────────────████████░░░░░░░░░░░░░░░░░░░░░░░░ │
│                                                                            │
│  02 / WORKSPACE STUDY TOOLS                                                │
│  Select which tools appear in your workspace header.                       │
│  You can always enable or disable these later in Settings.                 │
│                                                                            │
│  ┌──────────────────────────────────────────────────────────────────────┐  │
│  │ [✓] Structured Notes & Synthesis                                     │  │
│  │     Deep chapter outlines, LaTeX mathematics, and verified citations.│  │
│  └──────────────────────────────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────────────────────────────┐  │
│  │ [✓] Spaced Repetition Flashcards                                     │  │
│  │     5-box Leitner memory system and Anki export.                     │  │
│  └──────────────────────────────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────────────────────────────┐  │
│  │ [✓] Diagnostic Evaluative Quizzes                                    │  │
│  │     Distractor rationale, difficulty scoring, and exam questions.    │  │
│  └──────────────────────────────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────────────────────────────┐  │
│  │ [✓] Dual-Host Conversational Audio Podcast                            │  │
│  │     Analytical debater duo with interactive scrubber and transcripts.│  │
│  └──────────────────────────────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────────────────────────────┐  │
│  │ [✓] Grounded Source Copilot (RAG Chat)                               │  │
│  │     Sub-second answers with exact page, paragraph, and line citation.│  │
│  └──────────────────────────────────────────────────────────────────────┘  │
│                                                                            │
│  [← Back]                                             [ Continue (Enter) →]│
└────────────────────────────────────────────────────────────────────────────┘
```

```
┌────────────────────────────────────────────────────────────────────────────┐
│  Settings                                                                  │
│  [● Customization ]  [ AI & Models (BYOK) ]  [ Audio ]  [ Appearance ]     │
├────────────────────────────────────────────────────────────────────────────┤
│                                                                            │
│  1. ACTIVE PERSONA PRESET                                   [Reset Preset] │
│  Switching presets updates defaults below, or tweak any setting manually.  │
│  [ School ] [ High School ] [● Bachelor's ] [ Scholar ] [ PhD ] [ Teacher ]│
│                                                                            │
│  ────────────────────────────────────────────────────────────────────────  │
│  2. WORKSPACE STUDY MODES (VISIBLE TABS)                                   │
│  Toggle which tools appear in your document workspace header.              │
│  [✓] Notes          [✓] Flashcards       [✓] Diagnostic Quiz               │
│  [✓] Audio Podcast  [✓] Grounded Copilot                                   │
│                                                                            │
│  ────────────────────────────────────────────────────────────────────────  │
│  3. NOTE ARCHITECTURE & INCLUDED BLOCKS                                    │
│  Template Style: [ Executive Outline & Proofs          ▼ ]                 │
│  Included Sections:                                                        │
│  [✓] Executive Summary         [✓] KaTeX Math Derivations                  │
│  [✓] Comparative Tables        [✓] Misconceptions & Edge Cases             │
│  [ ] Real-World Analogies      [ ] Classroom Discussion Prompts            │
│                                                                            │
│  ────────────────────────────────────────────────────────────────────────  │
│  4. RIGOR, CITATIONS & ASSESSMENT BEHAVIOR                                 │
│  Explanation Depth:   [1]───────[2]───────[● 3]───────[4]───────[5]        │
│                       Simple             Balanced            Rigorous      │
│  Citation Badge Style: [ Inline Coordinates [p. 14, ¶2] ▼ ]                │
│  Quiz Mode:            [ Diagnostic MCQ with Rationale  ▼ ]                │
│  Custom AI Directive:  [ e.g., "Always include Python pseudocode..."     ] │
│                                                                            │
│                                              [ Save Customization Changes ]│
└────────────────────────────────────────────────────────────────────────────┘
```

---

## 9. Comprehensive Implementation Roadmap & Execution Checklist

### Phase 1: Database Migration & Type Foundation
- [ ] Run migration `20261017_role_customization_schema.sql` on Supabase to add `user_role`, `onboarding_completed`, and `workspace_preferences`.
- [ ] Create `src/types/customization.ts` with strict TypeScript types, preset maps, and validation schemas.
- [ ] Extend `SettingsContext` (`src/features/settings/context/SettingsContext.tsx`) to store, load, and mutate `workspace_preferences` and sync with Supabase `profiles`.

### Phase 2: First-Login Onboarding Experience
- [ ] Create `src/features/onboarding/OnboardingWizard.tsx` with 4 tactile steps and keyboard navigation (`Enter` to advance).
- [ ] Add route `/app/onboarding` under the App Router.
- [ ] Update `RequireAuth.tsx`: If authenticated user has `onboarding_completed === false`, automatically redirect to `/app/onboarding`.
- [ ] Add prominent "Skip with Defaults" action that instantly defaults to the Undergraduate preset and sets `onboarding_completed = true`.

### Phase 3: Settings Console Customization Tab
- [ ] Create `src/features/settings/components/CustomizationSettings.tsx`.
- [ ] Add the "Customization" tab as the premier tab in `src/features/settings/pages/SettingsPage.tsx`.
- [ ] Include preset selector cards, study mode switcher toggles, note section checkboxes, rigor depth slider, citation style dropdown, and custom system directive text area.
- [ ] Wire save handler with optimistic state updates and Sonner notification toast.

### Phase 4: Dynamic Document Workspace & Overrides
- [ ] In `DocumentWorkspace.tsx`, filter visible tabs by `preferences.enabledModes`.
- [ ] Map tab label names using `TAB_LABELS[user_role]`.
- [ ] Add active tab fallback safety when a tab is disabled by a persona change.
- [ ] Upgrade `NotesSettingsPopover.tsx` to support document-level overrides for note format, rigor level, and active blocks with a quick "Regenerate Notes" trigger.

### Phase 5: Edge Function Integration
- [ ] Implement `supabase/functions/_shared/promptCompiler.ts`.
- [ ] Update `generate_notes/index.ts` to fetch user preferences from `profiles` (or request payload override) and compile dynamic system prompt.
- [ ] Update `generate_derivatives/index.ts` and `generate_podcast/index.ts` to respect `quizStyle`, `flashcardAlgorithm`, and `podcastStyle`.

---

## 10. Architectural Guardrails & Quality Assurance

1. **Typographic Invariant Rule:** In accordance with Section 8.3 of `MASTER_SYSTEM_ARCHITECTURE.md`, headings (`<h1>`, `<h2>`, `<h3>`) and note copy never animate `opacity: 0` on scroll. Motion is reserved for capsule buttons, modal transitions, and interactive sliders.
2. **Deterministic Data Migrations:** The database migration utilizes `ADD COLUMN IF NOT EXISTS` and non-null defaults to prevent locking tables or breaking active client sessions.
3. **Guest Session Resilience:** Guests and offline users load and persist preferences to `localStorage` key `source_io_workspace_customization_v1` without throwing Supabase RPC exceptions.
4. **Performance & Lightweight Footprint:** Fully leverage existing Radix UI, Framer Motion, and Tailwind CSS tokens (`#FAF9F6`, `#0F172A`, `#E2E8F0`). No extraneous CSS libraries or redundant state dependencies.
