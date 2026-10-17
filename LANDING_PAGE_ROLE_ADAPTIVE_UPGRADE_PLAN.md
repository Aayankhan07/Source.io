# Source.io — Landing Page Role-Adaptive & Design Refinement Plan (v3.2.0)
*Document Status: Definitive Engineering Implementation Blueprint • Architecture: v3.2.0 • Aesthetic: Zain's Obsidian Paper & Ink Design System*

---

## 1. Executive Alignment & Design System Invariants

The Source.io workstation has transitioned from a collegiate-only study assistant into a **Role-Adaptive Active-Study Intelligence Platform** (Architecture v3.2.0). The landing page (`app/page.tsx` rendering `src/components/landing/LandingPage.tsx`) must faithfully present this reality while preserving the **exact 9-section vertical rhythm** and **100% Monochrome Editorial Paper & Obsidian Ink** design system.

### Core Design System Invariants (Derived Directly from Codebase)

1. **Color Token Hierarchy (`app/globals.css` & `tailwind.config.ts`):**
   - **Canvas Canvas Background:** `#FAF9F6` (Pure tactile paper) and `#FFFFFF` (Card surfaces).
   - **Primary Ink / Foreground:** `#0F172A` (Obsidian slate-950) and `#17151b` (Zain's ink token).
   - **Muted Surfaces / Recessed Panels:** `#F8FAFC` / `#F1F5F9` (`bg-muted`, `bg-slate-50`), with border `#E2E8F0` (`border-slate-200/90`).
   - **Zero Pastel / Rainbow Clutter:** No colored background pills (`bg-sky-100`, `bg-purple-100`, `bg-emerald-100`). All badges, pills, and toolbars adhere to high-craft ink pairs (`bg-white text-slate-900 border border-slate-300`, or `bg-slate-100 text-slate-800 border border-slate-200/80`).

2. **Typography Rules:**
   - **Display Headings (`font-display`):** `Plus Jakarta Sans`, `font-bold` / `font-extrabold`, `tracking-tight`, `text-slate-950`, `leading-[1.12]`.
   - **Body Text (`font-sans`):** `Inter`, `text-slate-600` / `text-slate-700`, `leading-relaxed`.
   - **Micro Eyebrows & Badges (`font-mono`):** `Fira Code`, `text-[11px] uppercase tracking-wider`, `font-semibold`.
   - **Academic Citations (`font-mono`):** Coordinate badges formatted identically to in-app `<cite>` pills (`text-xs font-mono font-semibold px-3 py-1 rounded-full bg-slate-100 border border-slate-200 text-slate-900`).

3. **Motion & Interaction Physics (`src/components/landing/motion.ts`):**
   - **`SPRING_TACTILE`:** `{ type: "spring", stiffness: 400, damping: 32, mass: 0.8 }` for interactive cards and gliders.
   - **`SPRING_SNAPPY`:** `{ type: "spring", stiffness: 450, damping: 26 }` for active tab transitions.
   - **Gliding Pill Indicator:** `layoutId="activePersonaPill"` on `motion.div` with zero wobble overshoot.
   - **Scroll Invariant:** Headings and text maintain strict `opacity: 1` readability without dizzying scroll-driven blur-ins.

4. **Surface Geometry & Tactile Shadows:**
   - **Primary Section Container:** `bg-white rounded-[32px] sm:rounded-[36px] border border-slate-200 p-7 sm:p-9 shadow-tactile-card`.
   - **Secondary Inset Panels:** `bg-slate-50 rounded-[24px] border border-slate-200 p-6 shadow-xs`.
   - **Interactive Switcher Capsule:** `bg-white/80 backdrop-blur-md border border-slate-200 p-1.5 rounded-full shadow-tactile-pill`.

---

## 2. Comprehensive Section-by-Section Refinement Matrix

| Section # | Component File | Current Landing Page State | v3.2.0 Refined Implementation |
| :--- | :--- | :--- | :--- |
| **01** | `LandingHeader.tsx` | Links: `Study Modes`, `How it works`, `Pricing`, `Comparison`, `FAQ`. | Add **`Personas` (`/#personas`)** link with dynamic spring scroll progress bar. All anchors canonical. |
| **02** | `TactileHeroPrototype.tsx` | Headline & subtext mention only student exam prep. | Update headline to **"verified study & teaching materials"**, update subcopy for **Grades 6–12, Undergrad, PhD & Educators**, and add tactile monochrome role-selector strip. |
| **03** | `IngestionRibbon.tsx` | Supported formats bar (PDF, Audio, Video, YouTube, LaTeX, Markdown). | Preserved with pristine typography and verified icon tokens. |
| **04** | `KnowledgePipeline.tsx` | Stage 03 is generic *"Generate study modes"*. | Upgrade Stage 03 to **`03. Calibrate role, blocks & rigor (1–5)`** with metric `7 Calibrated Personas`. |
| **05** | `InteractiveWorkflowDemo.tsx` | 5 static tabs (`notes`, `flashcards`, `quiz`, `podcast`, `chat`). | Add **"Modular & Toggleable"** callout badge demonstrating dynamic `TAB_LABELS` and one-click tab customization in `Settings → Customization`. |
| **06** | `PricingComparisonSection.tsx` | Targets students; generic bullets. | Update `$0` tier to highlight **5-step role onboarding & 7 personas**; update `$9` Scholar Pass badge to **`BUILT FOR SCHOLARS, RESEARCHERS & EDUCATORS`** with unlimited Level-5 IMRaD synthesis. |
| **07** | `CredibilityAndComparison.tsx` (Part 1) | 4 static subject tabs (`Students`, `Researchers`, `Professionals`, `Teams`). | **Centerpiece Upgrade:** Interactive **7-Persona & Rigor Switcher** (`School`, `High School`, `Bachelor's`, `Scholar`, `Researcher / PhD`, `Teacher`, `Custom`) with live preview of workspace tabs, note template, rigor meter (1–5), active blocks, and citations. |
| **08** | `CredibilityAndComparison.tsx` (Part 2 & 3) | Comparison table focused on "exam prep"; 5 basic FAQs. | Broaden heading to **"Why generic AI chat falls short for rigorous study, research, and teaching"**; add 7th table row for **Role-adaptive workspace & rigor**; append 2 high-converting customization FAQs. |
| **09** | `LandingFooter.tsx` | Modern tactile footer with branding, links, and system status. | Preserved with canonical `/pricing`, `/app/onboarding`, and documentation links. |

---

## 3. High-Fidelity Component Refinements & Code Blueprints

### 3.1 Floating Capsule Header (`src/components/landing/LandingHeader.tsx`)

#### Nav Link Data Structure
```typescript
const navLinks = [
  { href: "/#modes", label: "Study Modes" },
  { href: "/#how-it-works", label: "How it works" },
  { href: "/#personas", label: "Personas" },
  { href: "/#pricing", label: "Pricing" },
  { href: "/#comparison", label: "Comparison" },
  { href: "/#faq", label: "FAQ" },
];
```
- Includes the new `Personas` anchor jumping directly to `#personas` (`scroll-mt-24`).
- Keeps the interactive gliding pill on hover (`hoveredLink`) and spring scroll progress bar along the header base.

---

### 3.2 Hero Section Prototype (`src/components/landing/TactileHeroPrototype.tsx`)

#### 1. Solid High-Contrast Headline (`<h1>`)
```tsx
<h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold font-display tracking-tight text-slate-950 text-balance leading-[1.08] mb-6">
  Turn textbooks, lectures, and research papers into{" "}
  <span className="relative inline-block text-slate-950">
    verified study & teaching materials.
  </span>
</h1>
```

#### 2. Rigorous Multi-Tier Subheadline (`<p>`)
```tsx
<p className="text-base sm:text-lg md:text-xl text-slate-600 max-w-3xl mx-auto leading-relaxed mb-8 text-balance font-normal">
  One source engine calibrated to your exact academic tier. Source.io converts dense documents and recordings into grounded notes, flashcards, quizzes, audio recaps, lesson plans, and literature audits—with modular blocks, adjustable rigor (Level 1–5), and every claim linked to its exact coordinate.
</p>
```

#### 3. Tactile Monochrome Academic Role Strip (Under Hero CTAs)
Replacing static checkmarks with a refined, tactile chip cluster matching the app's `OnboardingWizard` role list:
```tsx
<div className="pt-2 flex flex-wrap items-center justify-center gap-2 text-xs font-mono text-slate-600">
  <span className="text-slate-400 font-semibold uppercase tracking-wider text-[11px] mr-1">
    Calibrated For:
  </span>
  {[
    { label: "School", badge: "Grades 6–8" },
    { label: "High School", badge: "AP / IB" },
    { label: "Undergrad", badge: "College" },
    { label: "Scholar", badge: "Grad / Med / Law" },
    { label: "Researcher / PhD", badge: "Faculty" },
    { label: "Teacher", badge: "Educator" },
  ].map((item) => (
    <span
      key={item.label}
      className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100/90 border border-slate-200/90 text-slate-800 text-[11px] font-medium shadow-2xs hover:bg-slate-200/80 transition-colors cursor-default"
    >
      <span>{item.label}</span>
      <span className="text-[10px] text-slate-400 font-mono">({item.badge})</span>
    </span>
  ))}
</div>
```

---

### 3.3 "How It Works" 4-Stage Pipeline (`src/components/landing/KnowledgePipeline.tsx`)

#### Stage 03 Calibration Refinement
```typescript
{
  id: "synthesis",
  step: "03",
  eyebrow: "CALIBRATION & SYNTHESIS",
  title: "Calibrate role, blocks & rigor (1–5)",
  desc: "Tailors output to your preset—ELI12, Cornell Notes, KaTeX Proofs, IMRaD Critique, or 60-Min Lesson Plans—with customizable rigor depth and modular blocks.",
  metric: "7 Calibrated Personas",
}
```
- Visually shows visitors that Source.io does not apply generic one-size-fits-all summarization, but dynamically configures prompt directives and note blocks before generation.

---

### 3.4 Five Study Modes Simulator Callout (`src/components/landing/InteractiveWorkflowDemo.tsx`)

Directly beneath the `5 Study Modes` section heading, add a tactile callout pill illustrating the dynamic nature of Source.io's mode architecture:
```tsx
<div className="flex items-center justify-center gap-2 mb-6 -mt-4">
  <span className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-100/90 border border-slate-200/90 text-[11px] font-mono text-slate-700 shadow-2xs">
    <span className="size-2 rounded-full bg-slate-900 animate-pulse" />
    <span><strong>Modular & Toggleable:</strong> Visible tabs rename dynamically (<code className="font-semibold text-slate-900">TAB_LABELS</code>) and unneeded modes can be hidden in Settings.</span>
  </span>
</div>
```

---

### 3.5 Centerpiece: Interactive 7-Persona Architecture Switcher (`CredibilityAndComparison.tsx`)

This replaces the existing 4-subject section in `CredibilityAndComparison.tsx` with an interactive **Role-Adaptive Architecture Showcase** that directly binds to the app's `src/types/customization.ts` constants.

#### 1. Section Header & Identifier
```tsx
<section id="personas" className="mx-auto text-left w-full scroll-mt-24">
  <SectionHeading
    badge="Role-Adaptive Architecture"
    badgeTone="amber"
    line1="One engine. Seven calibrated academic workspaces."
    description="Choose your persona during onboarding—or toggle any tab, note block, rigor level (1–5), and citation format anytime in Settings → Customization."
    align="left"
  />
```

#### 2. Persona Schema & Master Data Model
```typescript
interface PersonaConfig {
  id: UserRole;
  title: string;
  badge: string;
  icon: React.ElementType;
  sourceDoc: string;
  description: string;
  noteTemplate: string;
  rigorLevel: 1 | 2 | 3 | 4 | 5;
  rigorLabel: string;
  citationBadge: string;
  tabsShown: string[];
  activeBlocks: string[];
  signatureAction: {
    label: string;
    icon: React.ElementType;
    badge: string;
  };
  sampleExcerpt: string;
}

export const PERSONAS_DATA: Record<UserRole, PersonaConfig> = {
  school_student: {
    id: "school_student",
    title: "School Student",
    badge: "Grades 6–8",
    icon: Smile,
    sourceDoc: "Earth Science & Planetary Orbits (Middle School Core Science, 18 pp.)",
    description: "Visual, story-driven scaffolding with everyday analogies (ELI12), bold definitions, and zero dense jargon. Keeps young learners confident and engaged.",
    noteTemplate: "Visual & Story-Driven (ELI12)",
    rigorLevel: 1,
    rigorLabel: "Level 1: Intuitive & Accessible",
    citationBadge: "[Page 4]",
    tabsShown: ["Study Guide", "Word Cards", "Practice Check", "Ask Tutor"],
    activeBlocks: [
      "Executive Overview",
      "Real-World Analogies",
      "Bold Vocabulary Definitions",
      "Key Milestones Checklist",
    ],
    signatureAction: {
      label: "3-Choice Diagnostic Quizzes with Hints",
      icon: ListChecks,
      badge: "Cheerfully Grounded",
    },
    sampleExcerpt: "Electrons orbit the nucleus much like planets revolve around the sun, bound by electrical attraction rather than gravity.",
  },
  high_school: {
    id: "high_school",
    title: "High School",
    badge: "AP / IB / A-Level",
    icon: BookOpen,
    sourceDoc: "Campbell Biology: Cellular Respiration & ATP Synthase (Ch. 9, 32 pp.)",
    description: "Cornell study architecture with high-yield cue terms on the left, structured summaries on the right, worked step-by-step solutions, and exam traps.",
    noteTemplate: "Cornell Notes & Exam Syllabus",
    rigorLevel: 2,
    rigorLabel: "Level 2: Foundational & Exam-Oriented",
    citationBadge: "[p. 14, §1.2]",
    tabsShown: ["Cornell Notes", "Flashcards", "Exam Practice", "Audio Recap", "Ask Copilot"],
    activeBlocks: [
      "Cornell Cue Column",
      "Structured Chapter Summaries",
      "Step-by-Step Worked Problems",
      "Common Standardized Exam Traps",
    ],
    signatureAction: {
      label: "Board-Style MCQs with Marking Keys",
      icon: FileCheck,
      badge: "Syllabus Aligned",
    },
    sampleExcerpt: "Exam Trap: Glycolysis occurs in the cytoplasm and requires 2 ATP of activation energy, yielding a net gain of 2 ATP and 2 NADH.",
  },
  undergrad: {
    id: "undergrad",
    title: "Bachelor's / Undergrad",
    badge: "College Default",
    icon: GraduationCap,
    sourceDoc: "MIT 6.824: Distributed Systems & Raft Consensus Protocol (42 pp.)",
    description: "Collegiate synthesis with formal axiomatic definitions, step-by-step KaTeX math derivations ($$...$$), comparative evaluation tables, and Bloom's evaluative checks.",
    noteTemplate: "Executive Lecture Outline & Proofs",
    rigorLevel: 3,
    rigorLabel: "Level 3: Standard Collegiate Rigor",
    citationBadge: "[p. 14, ¶3]",
    tabsShown: ["Notes", "Flashcards", "Quiz", "Podcast", "Ask Copilot"],
    activeBlocks: [
      "Executive Summary & Thesis",
      "Step-by-Step KaTeX Math Proofs",
      "Comparative Evaluation Tables",
      "Critical Misconceptions & Edge Cases",
    ],
    signatureAction: {
      label: "Export to Anki Deck (.tsv)",
      icon: Download,
      badge: "5-Box Spaced Cadence",
    },
    sampleExcerpt: "State Safety Invariant: If a leader has applied an entry at log index i, no other server will ever apply a different log entry for index i.",
  },
  scholar: {
    id: "scholar",
    title: "Scholar / Postgrad",
    badge: "Grad / Med / Law",
    icon: Library,
    sourceDoc: "Robbins & Cotran: Glomerular Pathology & Nephrotic Differentials (68 pp.)",
    description: "High-density synthesis designed for medical, legal, and postgraduate scholarship. Focuses on theoretical paradigms, differential diagnoses, and statutory precedents.",
    noteTemplate: "High-Density Synthesis & Differentials",
    rigorLevel: 4,
    rigorLabel: "Level 4: Advanced Graduate Synthesis",
    citationBadge: "[p. 14, ¶3:L12]",
    tabsShown: ["Synthesis", "Leitner Deck", "Board Quiz", "Seminar Audio", "Ask Copilot"],
    activeBlocks: [
      "Core Theoretical Paradigms",
      "Clinical / Legal Differentials",
      "Axiomatic KaTeX Derivations",
      "Multi-Variable Boundary Limitations",
    ],
    signatureAction: {
      label: "USMLE / Bar Case Vignette Diagnostic",
      icon: Activity,
      badge: "High Density",
    },
    sampleExcerpt: "Minimal Change Disease presents with selective proteinuria and effacement of podocyte foot processes on electron microscopy without immune deposits.",
  },
  researcher: {
    id: "researcher",
    title: "Researcher / PhD",
    badge: "Faculty / PI",
    icon: Microscope,
    sourceDoc: "Vaswani et al.: Attention Is All You Need & Transformer Complexity (15 pp.)",
    description: "Literature review mode deconstructing papers using the IMRaD framework. Evaluates research questions, methodology, statistical validity, and explicit literature gaps. Flashcards & beginner quizzes hidden.",
    noteTemplate: "IMRaD Literature Critique & Methodology Audit",
    rigorLevel: 5,
    rigorLabel: "Level 5: Peer-Review Rigor",
    citationBadge: "(Vaswani et al., 2017, p. 4) / IEEE [1]",
    tabsShown: ["Lit Review", "Paper Colloquium", "Query Corpus"],
    activeBlocks: [
      "IMRaD Structural Deconstruction",
      "Methodology & Statistical Validity Audit",
      "Sample Size & Bias Critique",
      "Explicit Research Gaps & Citations",
    ],
    signatureAction: {
      label: "Export Formal BibTeX & APA 7th Tree",
      icon: FileText,
      badge: "Zotero / Mendeley Ready",
    },
    sampleExcerpt: "Self-attention computational complexity per layer scales as O(n² · d), creating a quadratic memory bottleneck with long context sequences.",
  },
  teacher: {
    id: "teacher",
    title: "Teacher / Educator",
    badge: "Curriculum Architect",
    icon: Presentation,
    sourceDoc: "AP Physics C: Electromagnetic Induction & Faraday's Law (24 pp.)",
    description: "Transforms dense source material into classroom-ready 45/60-minute lesson plans, lecture pacing schedules, chalkboard derivation notes, and student discussion prompts.",
    noteTemplate: "Instructional 60-Min Lesson Plan",
    rigorLevel: 3,
    rigorLabel: "Level 3: Master Curriculum Structure",
    citationBadge: "[Source p. 14]",
    tabsShown: ["Lesson Plan", "Handout Cards", "Exam Builder", "Curriculum Assistant"],
    activeBlocks: [
      "Bloom's Taxonomy Learning Objectives",
      "Timed 60-Minute Lecture Pacing Schedule",
      "Chalkboard KaTeX Derivations",
      "Socratic Classroom Discussion Prompts",
    ],
    signatureAction: {
      label: "Export Printable Exam & Rubric Key",
      icon: Printer,
      badge: "Student & Teacher Keys",
    },
    sampleExcerpt: "Pacing (Minutes 15-30): Board derivation of Lenz's law ε = -dΦB/dt. Prompt class: 'Why does the minus sign guarantee conservation of energy?'",
  },
  custom: {
    id: "custom",
    title: "Custom / Modular",
    badge: "Polymath",
    icon: Sliders,
    sourceDoc: "User-Defined Multidisciplinary Research Monograph",
    description: "Complete modular sovereignty. Choose your exact visible tabs, toggle individual note sections on or off, set explanation rigor (1–5), and inject custom system directives.",
    noteTemplate: "Modular Block Custom Builder",
    rigorLevel: 3,
    rigorLabel: "Level 1–5: Fully User-Adjustable",
    citationBadge: "User Choice (Pills, APA, IEEE, Coordinates)",
    tabsShown: ["Custom Workspace Selection"],
    activeBlocks: [
      "User-Toggled Note Sections",
      "Custom System Directives",
      "Flexible Citation Anchoring",
      "Per-Document Notes Overrides",
    ],
    signatureAction: {
      label: "In-Document ⚙ Notes Settings Overrides",
      icon: SlidersHorizontal,
      badge: "Full Sovereignty",
    },
    sampleExcerpt: "Custom Prompt Injection: 'Always format algorithms in Python pseudocode with Big-O time and space complexity annotations.'",
  },
};
```

#### 3. Interactive Persona Card Layout & Visual Anatomy
```tsx
{/* 7-Pill Selector with Framer Motion Glider */}
<div className="flex flex-wrap gap-2 mb-6">
  {Object.values(PERSONAS_DATA).map((item) => {
    const Icon = item.icon;
    const isSelected = activeRole === item.id;
    return (
      <button
        key={item.id}
        type="button"
        onClick={() => setActiveRole(item.id)}
        className={cn(
          "relative inline-flex items-center gap-2 px-3.5 sm:px-4 py-2 rounded-full text-xs font-semibold transition-all cursor-pointer shadow-xs select-none",
          isSelected
            ? "text-white"
            : "bg-white hover:bg-slate-50 text-slate-700 border border-slate-200"
        )}
      >
        {isSelected && (
          <motion.div
            layoutId="activePersonaPill"
            className="absolute inset-0 rounded-full bg-slate-900 -z-0 shadow-sm"
            transition={{ type: "spring", stiffness: 420, damping: 30 }}
          />
        )}
        <span className="relative z-10 flex items-center gap-2">
          <Icon className="size-3.5" />
          <span>{item.title}</span>
          <span className={cn(
            "text-[10px] font-mono px-1.5 py-0.2 rounded-md hidden md:inline-block",
            isSelected ? "bg-white/20 text-white" : "bg-slate-100 text-slate-500"
          )}>
            {item.badge}
          </span>
        </span>
      </button>
    );
  })}
</div>

{/* Morphing Role Card */}
<div className="bg-white rounded-[32px] sm:rounded-[36px] border border-slate-200 p-7 sm:p-9 shadow-tactile-card grid lg:grid-cols-12 gap-8 items-start relative overflow-hidden">
  {/* Left Column: Role Intelligence & Rigor (7 Cols) */}
  <div className="lg:col-span-7 space-y-4 relative z-10">
    <div className="flex items-center justify-between">
      <span className="text-xs font-mono text-slate-500 uppercase tracking-wider font-semibold">
        Exemplar Source Material
      </span>
      <span className="text-[11px] font-mono px-2.5 py-0.5 rounded-full bg-slate-100 border border-slate-200 text-slate-800 font-semibold">
        {persona.badge}
      </span>
    </div>

    <h3 className="text-xl sm:text-2xl font-bold font-display text-slate-900 tracking-tight">
      {persona.sourceDoc}
    </h3>

    <p className="text-[14px] leading-relaxed text-slate-600">
      {persona.description}
    </p>

    {/* Rigor Depth Meter (5-pip tactile gauge) */}
    <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
      <div className="flex items-center justify-between text-xs font-mono">
        <span className="text-slate-500 font-medium">Academic Rigor Level:</span>
        <span className="text-slate-900 font-bold">{persona.rigorLabel}</span>
      </div>
      <div className="grid grid-cols-5 gap-1.5 pt-1">
        {[1, 2, 3, 4, 5].map((lvl) => (
          <div
            key={lvl}
            className={cn(
              "h-2 rounded-full transition-colors",
              lvl <= persona.rigorLevel ? "bg-slate-900" : "bg-slate-200"
            )}
          />
        ))}
      </div>
    </div>

    {/* Citation & Sample Excerpt */}
    <div className="p-4 rounded-2xl bg-slate-50/70 border border-slate-200 text-xs space-y-2">
      <div className="flex items-center justify-between">
        <span className="font-mono text-slate-500 text-[11px] uppercase tracking-wider font-semibold">
          Citation Format Preview:
        </span>
        <span className="font-mono font-bold text-slate-900 px-2 py-0.5 rounded-md bg-white border border-slate-200 shadow-2xs">
          {persona.citationBadge}
        </span>
      </div>
      <blockquote className="italic text-slate-700 border-l-2 border-slate-300 pl-3 text-[13px] leading-relaxed">
        "{persona.sampleExcerpt}"
      </blockquote>
    </div>

    {/* Role Signature Action Button */}
    <div className="pt-2 flex flex-wrap items-center gap-3">
      <div className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-900 text-white text-xs font-semibold shadow-xs">
        <SignatureIcon className="size-3.5" />
        <span>{persona.signatureAction.label}</span>
      </div>
      <span className="text-xs text-slate-500 font-mono">
        • {persona.signatureAction.badge}
      </span>
    </div>
  </div>

  {/* Right Column: Morphing Workspace Header & Blocks (5 Cols) */}
  <div className="lg:col-span-5 bg-slate-50 rounded-[24px] border border-slate-200 p-6 space-y-4 text-xs relative z-10 shadow-xs">
    {/* Live TAB_LABELS Header Simulation */}
    <div>
      <div className="flex items-center justify-between pb-2 border-b border-slate-200 text-xs font-mono text-slate-500 mb-2.5">
        <span>Active Workspace Header</span>
        <span className="text-slate-900 font-bold font-mono">TAB_LABELS</span>
      </div>
      <div className="flex flex-wrap gap-1.5">
        {persona.tabsShown.map((tab, idx) => (
          <span
            key={tab}
            className={cn(
              "px-2.5 py-1 rounded-full font-medium text-[11px] border transition-colors",
              idx === 0
                ? "bg-slate-900 text-white border-transparent shadow-xs"
                : "bg-white text-slate-700 border-slate-200"
            )}
          >
            {tab}
          </span>
        ))}
      </div>
    </div>

    {/* Enabled Note Architecture Modules */}
    <div>
      <div className="flex items-center justify-between pb-2 border-b border-slate-200 text-xs font-mono text-slate-500 mb-2.5">
        <span>Included Synthesis Blocks</span>
        <span className="text-slate-900 font-semibold font-mono">Calibrated</span>
      </div>
      <div className="space-y-2 text-slate-700 font-medium">
        {persona.activeBlocks.map((block) => (
          <div key={block} className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <span className="size-1.5 rounded-full bg-slate-900" />
              <span>{block}</span>
            </span>
            <Check className="size-3.5 text-slate-900" />
          </div>
        ))}
      </div>
    </div>

    {/* Note Settings Override Notice */}
    <div className="pt-2 border-t border-slate-200 text-[11px] text-slate-500 leading-relaxed font-mono">
      <span>⚙ Override template, blocks, or rigor per-document in <strong className="text-slate-900">Notes Settings</strong>.</span>
    </div>
  </div>
</div>
```

---

### 3.6 Capability Comparison Table Upgrade (`CredibilityAndComparison.tsx`)

#### 1. Broadened Section Heading
```tsx
<SectionHeading
  badge="Comparison"
  badgeTone="blue"
  line1="Why generic AI chat falls short for rigorous study, research, and teaching."
  description="How Source.io compares with standard AI chat windows when analyzing dense, verifiable academic sources."
  align="left"
/>
```

#### 2. Added Role-Adaptive Capability Row
```typescript
{
  feature: "Role-adaptive workspace & rigor (1–5)",
  source: true,
  chatgpt: "Requires manual prompt engineering",
  notebooklm: "None (Fixed UI)",
  note: "Morphs tabs, note blocks & citations for School, Undergrad, PhD & Teachers",
}
```

---

### 3.7 Pricing Section Refinement (`PricingComparisonSection.tsx`)

#### 1. Free Forever ($0) Description Upgrade
```tsx
<p className="text-xs sm:text-sm text-slate-600 leading-relaxed min-h-[40px] mb-6">
  Includes 5-step role onboarding, all 7 academic personas, modular note customization, and 25 daily AI actions that reset every night at 00:00 UTC.
</p>
```

#### 2. Scholar Pass ($9/mo) Badge & New High-Rigor Bullet
```tsx
<span className="text-[11px] font-mono uppercase font-bold tracking-wider text-slate-900 bg-slate-100 border border-slate-300/80 px-2.5 py-0.5 rounded-full">
  BUILT FOR SCHOLARS, RESEARCHERS & EDUCATORS
</span>
```
Add bullet to the Scholar Pass card:
```tsx
<li className="flex items-start gap-2.5 text-xs sm:text-sm text-slate-800">
  <Check className="size-4 text-slate-900 shrink-0 mt-0.5" />
  <span>Unlimited Level-5 IMRaD critiques, printable teacher exam rubrics, and per-document rigor overrides</span>
</li>
```

---

### 3.8 FAQ Accordion Expansion (`CredibilityAndComparison.tsx`)

Append 2 new high-converting questions to the `faqs` list:
```typescript
{
  q: "Is Source.io only for university students, or can teachers and PhD researchers use it?",
  a: "Source.io adapts to 7 distinct profiles during your 60-second onboarding (School Student, High School, Bachelor's, Scholar, PhD Researcher, Teacher/Educator, and Custom). Researchers get IMRaD methodology critiques and APA/IEEE/BibTeX citations with flashcard clutter hidden; Teachers get 60-minute lesson plans and printable exam rubrics; students get Cornell notes, KaTeX proofs, and 5-box Leitner flashcards.",
},
{
  q: "Am I locked into the role I pick during sign-up?",
  a: "Never. You can switch personas, toggle workspace tabs (Notes, Flashcards, Quiz, Podcast, Copilot) on or off, check or uncheck individual note modules, and adjust your rigor slider (1–5) anytime in Settings → Customization—or override them for a single PDF using the in-document ⚙ Notes Settings popover.",
}
```

---

## 4. Implementation Phasing & Execution Order

1. **Phase 1: Header & Hero Enhancements (`LandingHeader.tsx`, `TactileHeroPrototype.tsx`)**
   - Add `#personas` anchor to `LandingHeader.tsx`.
   - Update `TactileHeroPrototype.tsx` headline, subcopy, and insert the monochrome role chip strip.
2. **Phase 2: Knowledge Pipeline & Modes Callout (`KnowledgePipeline.tsx`, `InteractiveWorkflowDemo.tsx`)**
   - Update Stage 03 in `KnowledgePipeline.tsx` to highlight role & rigor calibration.
   - Insert the "Modular & Toggleable" callout pill in `InteractiveWorkflowDemo.tsx`.
3. **Phase 3: The 7-Persona Architecture Engine (`CredibilityAndComparison.tsx`)**
   - Replace the 4 legacy personas with the 7 academic archetypes (`PERSONAS_DATA`).
   - Implement the tactile 5-pip rigor depth gauge, citation badge preview, live `TAB_LABELS` workspace simulation, and synthesis block checklist.
4. **Phase 4: Pricing, Comparison & FAQ Updates (`PricingComparisonSection.tsx`, `CredibilityAndComparison.tsx`)**
   - Broaden comparison table heading and insert the `Role-adaptive workspace & rigor` row.
   - Refine Free & Scholar Pass card copy in `PricingComparisonSection.tsx`.
   - Add the 2 new FAQs to `CredibilityAndComparison.tsx`.
5. **Phase 5: Verification & Quality Assurance**
   - Run `npx tsc --noEmit` to verify type compliance.
   - Run `npm run build` to confirm production build integrity and static route rendering.
   - Verify mobile responsiveness and smooth spring transitions.
