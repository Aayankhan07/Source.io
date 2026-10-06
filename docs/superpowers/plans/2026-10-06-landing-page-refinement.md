# Landing Page Refinement Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Realign the Source.io landing page into an intentional, high-contrast, 9-section hierarchy that explains the product in seconds, showcases an authentic source-to-output workflow, positions verifiable citations as the core differentiator, and unifies CTAs and copy.

**Architecture:** Refactor the modular landing page components (`LandingHeader`, `TactileHeroPrototype`, `IngestionRibbon`, `KnowledgePipeline`, `InteractiveWorkflowDemo`, `FeatureMotionCards`, `TactileDashboardShowcase`, `FreeTierTransparency`, `CredibilityAndComparison`, `LandingPage`) to follow a strict 9-section linear narrative. Replace abstract marketing jargon with concrete benefits, eliminate font-blurring scroll animations, optimize text contrast for WCAG AA compliance, and standardize on `Start free` as primary CTA and `See a live demo` as secondary CTA.

**Tech Stack:** Next.js 16 (App Router), React 18/19, TypeScript, Tailwind CSS, Motion (framer-motion), Radix UI Primitives, Lucide Icons.

**Spec:** User feedback specification detailing 12 focus areas, 9-section sequence, and top 5 priorities.

---

## Global Constraints
- Preserve existing theme switching functionality (`useTheme` light/dark) and tactile squircle visual identity.
- Do not introduce placeholder strings (no "Lorem ipsum", no generic "ChatGPT: None" claims).
- Primary CTA must consistently read `Start free` (or `Open workspace` when logged in); secondary CTA must consistently read `See a live demo`.
- Eliminate `filter: blur(4px)` during scroll reveals to ensure headings never look fuzzy or unrendered.
- Maintain mobile responsiveness: buttons >= 44px hit target, zero horizontal overflow, cards stack gracefully on small screens.
- All code must pass `npm run typecheck` (`tsc -b --noEmit`) and `npm run lint`.

---

## Review Focus
1. **Hero Clarity:** A first-time visitor must immediately grasp what Source.io does within 3 seconds: turns complex documents and recordings into 5 verified study modes with traceable citations.
2. **Readability & Contrast:** Secondary text and card borders must meet WCAG AA contrast against both light (`#ffffff`/`#f8fafc`) and dark (`#050505`/`#0d0d0d`) canvases.
3. **Realistic Product Workflow:** Interactive previews must demonstrate a coherent document journey (e.g., `quantum_computing_intro.pdf` → highlighted note → citation to Page 2 §1.1 → quiz generated from that passage).
4. **Benefit-Driven Mode Naming:** Replace technical tags like "derived modalities" and "tactile performance chart" with clear, benefit-oriented labels (Notes: Understand quickly, Cards: Retain over time, Quiz: Test comprehension, Audio: Review on the go, Chat: Ask with source proof).
5. **Trust & Free Plan Transparency:** Free tier must clearly communicate the 3 core benefits (25 free actions daily, 3 workspace slots, zero data retention) without overwhelming visitors with 8 competing technical metrics.

---

### Task 1: Motion & Typography Contrast Fixes

**Files:**
- Modify: `src/components/landing/motion.ts:28-42`
- Modify: `src/components/landing/SectionHeading.tsx:22-98`

**Interfaces:**
- Consumes: Motion variants (`reveal`, `revealStagger`, `VIEWPORT`), `BadgeTone` type.
- Produces: Crisp, non-blurry scroll animations and high-contrast section titles and descriptions across light and dark modes.

- [x] **Step 1: Write typecheck and lint verification test**
  Verify baseline compiles without errors:
  Run: `npm run typecheck`
  Expected: PASS with 0 errors.

- [x] **Step 2: Remove blur filter from `motion.ts`**
  Remove `filter: "blur(4px)"` from `reveal.hidden` and `filter: "none"` from `reveal.show`. Use pure opacity and subtle translateY (6px) to eliminate subpixel text blurring during scroll reveals.
  ```typescript
  export const reveal: Variants = {
    hidden: {
      opacity: 0,
      y: 8,
    },
    show: {
      opacity: 1,
      y: 0,
      transition: ENTER,
    },
  };
  ```

- [x] **Step 3: Enhance contrast and badge hierarchy in `SectionHeading.tsx`**
  - Update badge tone styles for higher contrast:
    - `blue`: `bg-sky-500/10 text-sky-900 dark:bg-sky-500/15 dark:text-sky-300 border-sky-500/25`
    - `slate`: `bg-slate-100 text-slate-800 dark:bg-white/10 dark:text-slate-100 border-slate-300 dark:border-white/15`
    - `amber`: `bg-amber-500/10 text-amber-900 dark:bg-amber-500/15 dark:text-amber-300 border-amber-500/25`
  - Update secondary headline (`line2`) color from `#6F7988` to `text-slate-600 dark:text-slate-300` for clear readability.
  - Update description color to `text-slate-700 dark:text-slate-300 font-normal`.

- [x] **Step 4: Verify typecheck passes**
  Run: `npm run typecheck`
  Expected: PASS with 0 errors.

- [x] **Step 5: Commit changes**
  ```bash
  git add src/components/landing/motion.ts src/components/landing/SectionHeading.tsx
  git commit -m "fix(landing): remove font-blurring scroll animation and boost typography contrast"
  ```

---

### Task 2: Streamline Header Navigation and Unify CTAs

**Files:**
- Modify: `src/components/landing/LandingHeader.tsx:50-130`

**Interfaces:**
- Consumes: `useAuth()`, `useTheme()`, `Tooltip`, `cn`.
- Produces: Clean, focused floating navigation pill with 5 links: Product, How it works, Verification, Free plan, FAQ, plus Sign in and consistent `Start free` CTA.

- [x] **Step 1: Update navigation link definitions in `LandingHeader.tsx`**
  Replace internal anchor links:
  - `#modes` -> `Product`
  - `#how-it-works` -> `How it works`
  - `#verification` -> `Verification`
  - `#pricing` -> `Free plan`
  - `#faq` -> `FAQ`
  Remove extra floating demo button from desktop navbar to eliminate competition with primary action.

- [x] **Step 2: Standardize action buttons and mobile sheet**
  - Sign in link: `/auth` (text: "Sign in", subtle hover).
  - Primary button:
    - Logged in: "Open workspace" -> `/app`
    - Guest: "Start free" -> `/auth`
    - Style: high-contrast dark slate (`bg-slate-900 text-white dark:bg-white dark:text-slate-950`), `rounded-full`, 40px height, font-semibold.
  - Ensure mobile drawer menu replicates the same 5 links plus "Sign in" and "Start free".

- [x] **Step 3: Verify TypeScript compilation**
  Run: `npm run typecheck`
  Expected: PASS with 0 errors.

- [x] **Step 4: Commit changes**
  ```bash
  git add src/components/landing/LandingHeader.tsx
  git commit -m "refactor(landing): streamline header navigation to 5 essential links and uniform Start free CTA"
  ```

---

### Task 3: Refine Hero Section with Clear Promise and Realistic Preview

**Files:**
- Modify: `src/components/landing/TactileHeroPrototype.tsx:70-220`

**Interfaces:**
- Consumes: `useAuth()`, `useTheme()`, `Lucide icons`, `Link`.
- Produces: Clear 3-second value proposition hero answering what, who, and why, with a readable, realistic quantum computing document-to-notes preview and consistent CTAs.

- [x] **Step 1: Rewrite Hero headline, copy, and CTAs**
  - Eyebrow: `AI study workspace for serious learning`
  - Main Headline:
    ```tsx
    <h1 className="text-[clamp(34px,4.5vw,56px)] font-extrabold tracking-tight leading-[1.08] text-slate-900 dark:text-white font-display text-balance">
      Turn textbooks, lectures, and research papers into{" "}
      <span className="text-primary relative inline-block">
        verified study materials.
        <svg className="absolute -bottom-1.5 left-0 w-full h-2 text-primary/40" viewBox="0 0 100 20" preserveAspectRatio="none">
          <path d="M0 15 Q 50 2 100 15" stroke="currentColor" strokeWidth="4" fill="none" strokeLinecap="round" />
        </svg>
      </span>
    </h1>
    ```
  - Supporting paragraph:
    `Source.io converts dense documents and recordings into structured notes, flashcards, practice quizzes, audio recaps, and citation-grounded chat—with every answer linked back to its source.`
  - Primary CTA: `Start free` (or `Open workspace` if logged in) -> `/auth` / `/app`.
  - Secondary CTA: `See a live demo` -> `/app/doc/demo-quantum`.
  - Trust guarantee line:
    `No credit card required · 25 free actions daily · Zero-data retention`

- [x] **Step 2: Polish the Hero Stage Preview**
  - Increase text legibility on the document card (larger text, clear contrast).
  - Prominently feature the exact source passage coordinate (`Page 2 • Paragraph 3 • Lines 14-19`) anchored to the highlighted equation.
  - Remove excessive metrics ("48 vector coordinates", etc.) and replace with clear document metadata (`Introduction to Quantum Computing · PDF · 38 pages`).

- [x] **Step 3: Verify typecheck passes**
  Run: `npm run typecheck`
  Expected: PASS with 0 errors.

- [x] **Step 4: Commit changes**
  ```bash
  git add src/components/landing/TactileHeroPrototype.tsx
  git commit -m "feat(hero): rewrite hero value proposition and polish realistic quantum demo stage"
  ```

---

### Task 4: Streamline Supported Source Formats Ribbon

**Files:**
- Modify: `src/components/landing/IngestionRibbon.tsx:1-40`

**Interfaces:**
- Consumes: Lucide icons (`FileText`, `Video`, `Mic`, `Database`, `FileCode`, `Globe`, `BookOpen`).
- Produces: Horizontal formats bar with explanatory subtitle and smooth mobile scroll.

- [x] **Step 1: Add section intro and format items**
  - Add clean section header label: `Upload PDFs, documents, web articles, lecture recordings, audio, or LaTeX files.`
  - Formats:
    - `PDF Documents` (PDF)
    - `Lecture Recordings` (MP3, MP4, WAV)
    - `Research Papers` (LaTeX, arXiv)
    - `Web Articles & Docs` (URLs, HTML)
    - `Markdown & Word` (MD, DOCX)
    - `EPUB Textbooks` (EPUB)
  - Ensure pills have `shrink-0` with horizontal scroll container on mobile (`overflow-x-auto no-scrollbar`).

- [x] **Step 2: Verify typecheck passes**
  Run: `npm run typecheck`
  Expected: PASS with 0 errors.

- [x] **Step 3: Commit changes**
  ```bash
  git add src/components/landing/IngestionRibbon.tsx
  git commit -m "feat(formats): enhance supported formats ribbon with clear upload scope and mobile scroll"
  ```

---

### Task 5: Rework "How It Works" 4-Step Workflow

**Files:**
- Modify: `src/components/landing/KnowledgePipeline.tsx:1-85`

**Interfaces:**
- Consumes: `SectionHeading`.
- Produces: Concrete 4-step workflow explaining the document lifecycle from raw input to verified study mastery.

- [x] **Step 1: Replace technical pipeline copy with 4 user outcome steps**
  - Section id: `id="how-it-works"`
  - Heading:
    - Badge: `How It Works`
    - Line 1: `From source material to active learning`
    - Line 2: `in four steps.`
    - Description: `Upload your material once. Source.io extracts structure, derives practice tools, and preserves exact citations.`
  - 4 Stages:
    1. **Upload your source** — Drop in PDFs, recorded lectures, research papers, or web links. Speech-to-text and OCR parse content into clean text.
    2. **Extract and structure** — Key concepts, core definitions, and mathematical equations are organized into clean, hierarchical outlines.
    3. **Generate study materials** — Derives structured notes, spaced repetition flashcard decks, practice quizzes, and 2-host audio recaps.
    4. **Review answers with citations** — Every note passage, flashcard answer, and quiz solution points back to the exact page, paragraph, or audio timestamp.

- [x] **Step 2: Enhance card visual hierarchy and numbers**
  Use bold step counters (`01`, `02`, `03`, `04`), crisp card borders, and clear outcome badges.

- [x] **Step 3: Verify typecheck passes**
  Run: `npm run typecheck`
  Expected: PASS with 0 errors.

- [x] **Step 4: Commit changes**
  ```bash
  git add src/components/landing/KnowledgePipeline.tsx
  git commit -m "feat(workflow): convert pipeline section into clear 4-step How It Works guide"
  ```

---

### Task 6: Clarify the 5 Study Modes in Interactive Demo

**Files:**
- Modify: `src/components/landing/InteractiveWorkflowDemo.tsx:185-265`

**Interfaces:**
- Consumes: `Tabs`, `TabsList`, `TabsTrigger`, `SectionHeading`, interactive mode state.
- Produces: "One source. Five ways to learn." section with 5 benefit-focused mode cards/tabs.

- [x] **Step 1: Update section heading and benefit-focused tabs**
  - Section id: `id="modes"`
  - Heading:
    - Badge: `5 Study Modes`
    - Line 1: `One source.`
    - Line 2: `Five ways to learn.`
    - Description: `Convert one source document into five coordinated study modes, each tailored to a different stage of learning.`
  - Tab labels and benefits:
    - **Structured notes**: Understand the main ideas quickly
    - **Flashcards**: Retain concepts over time
    - **Practice quizzes**: Test whether you actually understand
    - **Audio recap**: Review while walking or commuting
    - **Grounded chat**: Ask questions with source-backed answers

- [x] **Step 2: Make the demo font size readable and prominent**
  - Increase text size in the split-view notes and citation inspector (`text-sm sm:text-base` for note body, `text-xs sm:text-sm` for source passage).
  - Ensure citations visually connect the generated statement to the source coordinate pill (`Page 2 • Paragraph 3 • Lines 14-19`).
  - Add an action button in the notes tab: `Generate quiz from this passage` to showcase the unified workflow.

- [x] **Step 3: Verify typecheck passes**
  Run: `npm run typecheck`
  Expected: PASS with 0 errors.

- [x] **Step 4: Commit changes**
  ```bash
  git add src/components/landing/InteractiveWorkflowDemo.tsx
  git commit -m "feat(demo): clarify 5 study modes with benefit labels and connected citation workflow"
  ```

---

### Task 7: Rework Verification and Citations Engine

**Files:**
- Modify: `src/components/landing/FeatureMotionCards.tsx:45-120`

**Interfaces:**
- Consumes: `SectionHeading`, interactive coordinate simulation state.
- Produces: Dedicated verification section proving source-grounded answers and zero-data retention.

- [x] **Step 1: Update verification section copy and positioning**
  - Section id: `id="verification"`
  - Heading:
    - Badge: `Verifiable Grounding`
    - Line 1: `Every important answer`
    - Line 2: `points back to the source.`
    - Description: `Source.io transforms complex material into active-learning tools while preserving a traceable link to the original page, paragraph, or audio timestamp.`
  - Cards:
    - Card 1: **Page & Paragraph Citations** — Inspect exact coordinates with cosine similarity match scores.
    - Card 2: **Audio Timestamp Anchors** — Word-aligned ASR links spoken lecture moments to written summaries.
    - Card 3: **Strict Zero-Data Retention** — Research papers and personal notes are never used to train third-party AI models.

- [x] **Step 2: Replace obscure metrics with clear proof**
  Replace "16kHz 24-bit PCM" with readable timestamps ("Lecture audio @ 01:14 · Dr. Clara").

- [x] **Step 3: Verify typecheck passes**
  Run: `npm run typecheck`
  Expected: PASS with 0 errors.

- [x] **Step 4: Commit changes**
  ```bash
  git add src/components/landing/FeatureMotionCards.tsx
  git commit -m "feat(verification): emphasize traceable citations, audio timestamps, and privacy guarantee"
  ```

---

### Task 8: Combine Retention and Command Center

**Files:**
- Modify: `src/components/landing/TactileDashboardShowcase.tsx:80-140`

**Interfaces:**
- Consumes: `SectionHeading`, retention curve state, library cards.
- Produces: Combined retention and command center section focusing on long-term memory mastery.

- [x] **Step 1: Update retention section title and narrative**
  - Section id: `id="retention"`
  - Heading:
    - Badge: `Long-Term Retention`
    - Line 1: `Do not just read it.`
    - Line 2: `Remember it.`
    - Description: `Active recall and spaced repetition track your memory decay over time, recommending daily reviews before you forget.`
  - Left Card: Spaced repetition retention curves with clear labels ("See what you remember and what needs review").
  - Right Card: Personal study goals and source library with instant status.

- [x] **Step 2: Ensure dark and light contrast on chart axes and stats**
  Make day labels and percentage tooltips high-contrast (`text-slate-800 dark:text-slate-200`).

- [x] **Step 3: Verify typecheck passes**
  Run: `npm run typecheck`
  Expected: PASS with 0 errors.

- [x] **Step 4: Commit changes**
  ```bash
  git add src/components/landing/TactileDashboardShowcase.tsx
  git commit -m "feat(retention): combine command center with long-term spaced repetition retention"
  ```

---

### Task 9: Compact Use Cases Across Disciplines

**Files:**
- Modify: `src/components/landing/CredibilityAndComparison.tsx:10-75`

**Interfaces:**
- Consumes: `activeAudience` state, persona tabs.
- Produces: Clear, practical use cases for students, researchers, technical professionals, and teams.

- [x] **Step 1: Define the 4 target personas**
  Replace abstract disciplines with practical persona use cases:
  1. **Students preparing for exams** — Turn semester textbooks and lectures into high-yield flashcards and practice test questions.
  2. **Researchers reviewing papers** — Ingest 40-page papers, extract mathematical equations, and cite passages with pinpoint accuracy.
  3. **Professionals mastering technical skills** — Transform dense API documentation, legal statutes, and clinical guidelines into verified summaries.
  4. **Teams creating internal learning** — Turn recorded onboarding sessions and technical architecture documents into interactive knowledge bases.

- [x] **Step 2: Update section heading**
  - Heading:
    - Badge: `Use Cases`
    - Line 1: `Engineered for serious learning,`
    - Line 2: `across any discipline.`
    - Description: `From doctoral research papers to undergraduate exams, Source.io adapts to rigorous source material.`

- [x] **Step 3: Verify typecheck passes**
  Run: `npm run typecheck`
  Expected: PASS with 0 errors.

- [x] **Step 4: Commit changes**
  ```bash
  git add src/components/landing/CredibilityAndComparison.tsx
  git commit -m "feat(use-cases): refactor discipline section into practical learner personas"
  ```

---

### Task 10: Simplify Pricing and Free-Tier Message

**Files:**
- Modify: `src/components/landing/FreeTierTransparency.tsx:45-130`

**Interfaces:**
- Consumes: `SectionHeading`, countdown timer, BYOK toggle.
- Produces: Simple, trustworthy free plan presentation highlighting 3 core benefits with optional BYOK secondary details.

- [x] **Step 1: Simplify value message to 3 core benefits**
  - Section id: `id="pricing"`
  - Heading:
    - Badge: `Free Plan`
    - Line 1: `Start free.`
    - Line 2: `No credit card required.`
    - Description: `Everything you need to study your current courses, with a generous daily allowance that refreshes every 24 hours.`
  - The 3 clear cards:
    1. **25 free AI actions every day** — Ingest textbooks, generate complete notes, create flashcards, run practice quizzes, and chat with sources.
    2. **3 active source workspaces** — Keep up to 3 documents active at once with instant switching and persistent vector embeddings.
    3. **Zero data retention guarantee** — Your uploaded research documents and recordings are never retained to train commercial AI models.
  - Secondary collapsible/accordion: "Need unlimited actions? Bring your own free Groq API key in settings."

- [x] **Step 2: CTA consistency**
  Primary button: `Start free` -> `/auth` (matching header and hero).

- [x] **Step 3: Verify typecheck passes**
  Run: `npm run typecheck`
  Expected: PASS with 0 errors.

- [x] **Step 4: Commit changes**
  ```bash
  git add src/components/landing/FreeTierTransparency.tsx
  git commit -m "feat(pricing): simplify free plan to 3 core pillars and unified Start free CTA"
  ```

---

### Task 11: Capability Comparison, Objection-Killing FAQ, and Final CTA

**Files:**
- Modify: `src/components/landing/CredibilityAndComparison.tsx:250-425`

**Interfaces:**
- Consumes: Accordion primitives, comparison matrix, final CTA banner.
- Produces: Defensible comparison table ("Built for verifiable learning"), 5 essential purchase-hesitation FAQs, and high-converting final CTA banner.

- [x] **Step 1: Rework comparison table from aggressive claims to capability matrix**
  - Headline: `Built for verifiable learning`
  - Subtitle: `How Source.io compares with generic AI chat windows when studying dense sources.`
  - Compare 6 key capabilities:
    - Page-level citations
    - Audio timestamp citations
    - Active spaced repetition (Leitner)
    - Interactive practice quizzes with proofs
    - Multi-format ingestion (PDF, Audio, Video, LaTeX)
    - Strict zero-data retention policy

- [x] **Step 2: Streamline FAQ to 5 high-intent questions**
  1. **What file types are supported?** — PDFs up to 50MB, audio files (MP3, WAV, M4A), YouTube lecture links, Markdown, DOCX, and LaTeX documents.
  2. **How are citations generated?** — Documents are indexed with exact page, paragraph, and audio timestamps. Every answer, flashcard, and quiz question computes cosine similarity against these source chunks.
  3. **Are my documents used to train models?** — No. Your files are processed in ephemeral sessions with strict data isolation. Zero data is retained for training.
  4. **Is there really a free plan?** — Yes. You get 25 free AI actions every day with zero credit card required. Quotas refresh daily.
  5. **Can I export my notes and flashcards?** — Yes. You can export notes to Markdown, flashcards to Anki-compatible decks, or download summaries as PDFs.

- [x] **Step 3: Unify Final CTA banner**
  - Headline: `Stop skimming. Start mastering.`
  - Supporting text: `Upload your first document or lecture recording and see what Source.io can generate.`
  - Primary CTA: `Start free` -> `/auth`
  - Secondary CTA: `See a live demo` -> `/app/doc/demo-quantum`

- [x] **Step 4: Verify typecheck passes**
  Run: `npm run typecheck`
  Expected: PASS with 0 errors.

- [x] **Step 5: Commit changes**
  ```bash
  git add src/components/landing/CredibilityAndComparison.tsx
  git commit -m "feat(comparison-faq-cta): implement verifiable learning matrix, 5 core FAQs, and unified final CTA"
  ```

---

### Task 12: Assemble Refined 9-Section Landing Page and Test Responsiveness

**Files:**
- Modify: `src/components/landing/LandingPage.tsx:14-77`

**Interfaces:**
- Consumes: All 10 refined landing page section components.
- Produces: The final, cohesive, 9-section landing page with balanced spacing, ambient lighting, and full responsive support.

- [x] **Step 1: Update `LandingPage.tsx` structure and section order**
  Organize sections in exact recommended sequence:
  ```tsx
  <LandingHeader />
  <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16 sm:space-y-24 pb-16 pt-4">
    {/* 1. Hero */}
    <TactileHeroPrototype />
    {/* 2. Supported Formats */}
    <IngestionRibbon />
    {/* 3. How It Works (4 Steps) */}
    <KnowledgePipeline />
    {/* 4. Product Demo (Five Study Modes) */}
    <InteractiveWorkflowDemo />
    {/* 5. Verification & Citations */}
    <FeatureMotionCards />
    {/* 6. Retention & Command Center */}
    <TactileDashboardShowcase />
    {/* 7. Use Cases across Disciplines */}
    {/* 8. Pricing & Free Plan */}
    <FreeTierTransparency />
    {/* 9. Comparison, FAQ & Final CTA */}
    <CredibilityAndComparison />
    <LandingFooter />
  </main>
  ```

- [x] **Step 2: Clean up ambient halo positioning**
  Adjust the ambient radial gradients so they don't produce giant visual gaps or washed-out backgrounds.

- [x] **Step 3: Run comprehensive verification**
  Run: `npm run typecheck`
  Expected: PASS with 0 errors.
  Run: `npm run lint`
  Expected: PASS with 0 errors.

- [x] **Step 4: Commit changes**
  ```bash
  git add src/components/landing/LandingPage.tsx
  git commit -m "feat(landing): assemble refined 9-section landing page with unified spacing and lighting"
  ```

---

## Plan Self-Review Checklist

- [x] **Spec coverage:** All 12 critique points and the 5 top priorities are mapped directly to tasks.
  - 1. Improve first screen -> Task 2 & Task 3
  - 2. Reduce page length -> Task 12 (9-section linear flow)
  - 3. Realistic product screenshots/workflows -> Task 3 & Task 6
  - 4. Clarify five study modes -> Task 6
  - 5. Strengthen value proposition (verifiable learning) -> Task 3 & Task 7
  - 6. Fix visual hierarchy, contrast & motion blur -> Task 1 & Task 12
  - 7. Simplify pricing message -> Task 10
  - 8. Rework comparison section -> Task 11
  - 9. Add social proof and trust -> Task 3, Task 10, Task 11
  - 10. Improve copy / remove jargon -> Tasks 3, 5, 6, 7, 8
  - 11. Make CTA consistent (`Start free` / `See a live demo`) -> Tasks 2, 3, 10, 11
  - 12. Mobile responsiveness -> All tasks
- [x] **Placeholder scan:** No "TODO", "TBD", or vague instructions. Exact copy and component changes are explicitly specified.
- [x] **Type consistency:** Component props and interfaces match existing TypeScript types.
- [x] **Review focus addressed:** First screen clarity, contrast, realistic workflow, benefit-driven modes, and free plan transparency are directly targeted.
