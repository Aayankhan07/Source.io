# Mechanical Precision Motion Refactor Plan
**Theme:** "Editorial Paper & Obsidian Ink" Pure Monochrome  
**Objective:** Replace color-dependent cues with crisp, mechanical spring animations (`stiffness: 380-450, damping: 28-32`) to guide the user's eye and demonstrate core product mechanics while keeping all typography 100% solid and legible.

---

## 0. The Golden Rule (Non-Negotiable)
> **Never animate `opacity: 0` on section headings (`<h1>`, `<h2>`) or primary copy on scroll.**  
> Section titles and introductory paragraphs must remain at `opacity: 1` permanently to prevent washed-out or flickering text on scroll. Motion is strictly reserved for interactive controls, tabs, bounding boxes, state indicators, and product demonstrations.

---

## 1. Physics & Timing Constants

All spring transitions across components must import or share these standard physics parameters:

```ts
// src/components/landing/motion.ts
export const SPRING_TACTILE = {
  type: "spring",
  stiffness: 400,
  damping: 32,
  mass: 0.8,
};

export const SPRING_SNAPPY = {
  type: "spring",
  stiffness: 450,
  damping: 26,
};

export const SPRING_GENTLE = {
  type: "spring",
  stiffness: 280,
  damping: 24,
};
```

---

## 2. Section-by-Section Implementation Plan

### Phase 1: Floating Navbar (`LandingHeader.tsx`)
- [x] **1.1 Sliding Ghost Pill on Hover:**
  - Track `hoveredLink` in state (`null | string`).
  - Rendered an absolute backdrop `<motion.div layoutId="navHover" className="absolute inset-0 rounded-full bg-slate-100 -z-0" />` behind the currently hovered navigation link (`Study Modes`, `How it works`, `Pricing`, `Comparison`, `FAQ`).
- [x] **1.2 Scroll Compression Physics:**
  - Tracked `window.scrollY > 40` as `scrolled`.
  - Animates container padding smoothly from `py-2.5 sm:py-3` to `py-1.5 sm:py-2` and tightens shadow on scroll.
- [x] **1.3 Scroll Progress Hairline:**
  - Retained `scaleX` spring indicator at the bottom edge of the header pill, styled in pure slate-900 (`#0F172A`).

---

### Phase 2: Hero Section (`TactileHeroPrototype.tsx`)
- [x] **2.1 Drawn Ink-Stroke Underline:**
  - Animated the SVG curved path beneath `verified study materials.`:
    - `initial={{ pathLength: 0, opacity: 0 }}`
    - `animate={{ pathLength: 1, opacity: 1 }}`
    - `transition={{ duration: 0.65, ease: [0.16, 1, 0.3, 1], delay: 0.2 }}`
- [x] **2.2 4-Second Citation Grounding Loop:**
  - Added an interval cycle (`every 4.5s`) demonstrating the connection between source text and citation:
    1. Triggers `citationActive: true` for 2.2s.
    2. Dark floating `Citation Coordinate` card springs up with mechanical lift (`y: -3, scale: 1.02`, border transition).
    3. Resets smoothly on a spring return for the next cycle.
- [x] **2.3 Heading Solid State:**
  - Hero `<h1>` and subtitle paragraphs have `opacity: 1` explicitly with zero scroll fade.

---

### Phase 3: Format Bar Upgrade (`IngestionRibbon.tsx`)
- [x] **3.1 Replace Marquee Loop with Static Tactile Grid:**
  - Replaced infinite auto-scrolling marquee (`animate-marquee`) with a balanced, centered horizontal flex row of the 6 core formats: `PDF Documents`, `Lecture Videos`, `Audio Seminars`, `Word & Documents`, `Web Articles`, `Research Papers`.
- [x] **3.2 Tactile Lift & Icon Scale on Hover:**
  - Added hover micro-interactions:
    - `-translate-y-0.5`
    - `hover:border-slate-400`
    - `hover:shadow-md`
    - `group-hover:scale-110` on format icons.

---

### Phase 4: Auto-Stepping Pipeline (`KnowledgePipeline.tsx`)
- [x] **4.1 Auto-Cycling Timer (4.5s Interval):**
  - Implemented auto-advancement: `01 Ingestion` $\rightarrow$ `02 Structure` $\rightarrow$ `03 Synthesis` $\rightarrow$ `04 Verification`.
  - Automatically pauses interval when user hovers over the left-hand column or clicks on any step.
- [x] **4.2 Sliding Active Indicator (`layoutId="pipelineIndicator"`):**
  - Added a Framer Motion sliding indicator capsule moving down the left-hand step list (`type: "spring", stiffness: 420, damping: 30`).
- [x] **4.3 Synchronized OCR Page Animations on Right Card:**
  - **Step 01 (Ingestion):** Sweeping horizontal scanline over the Griffiths textbook excerpt with active bounding boxes.
  - **Step 02 (Structure):** Structured highlight around LaTeX equation `$$P(a \le x \le b)...$$`.
  - **Step 03 (Synthesis):** 4 output stubs lift off the page (`Note`, `Card`, `Quiz`, `Podcast`).
  - **Step 04 (Verification):** Pop target coordinate pin (`Page 14, ¶3`) with solid obsidian grounding pill.

---

### Phase 5: Five Coordinated Study Modes (`InteractiveWorkflowDemo.tsx`)
- [x] **5.1 Fixed Window Frame with Inner Cross-Dissolve:**
  - Outer macOS window frame (`rounded-3xl`, traffic lights, header bar) remains stationary.
  - Wrapped tab panel contents in `AnimatePresence mode="wait"` with mechanical cross-dissolve (`y: 10` $\rightarrow$ `0`, `filter: blur`).
- [x] **5.2 Active Tab Spring Pill:**
  - Active tab uses `layoutId="activeTabPill"` with snappy spring physics (`stiffness: 450, damping: 32`).
- [x] **5.3 Remove Residual Ambient Halo:**
  - Cleaned up residual cyan/amber radial glow to match pure paper theme.

---

### Phase 6: Use Cases & Discipline Switcher (`CredibilityAndComparison.tsx`)
- [x] **6.1 Sliding Obsidian Pill for Disciplines:**
  - Converted persona buttons (`Students`, `Researchers`, `Professionals`, `Teams`) to use `layoutId="activePersonaPill"`.
- [x] **6.2 Staggered Cascade for Derived Study Assets:**
  - Triggers a top-to-bottom stagger (`45ms` interval) across the 5 derived assets (`1. Structured Markdown Outline` $\rightarrow$ `5. Grounded Source Chat`) whenever the user switches disciplines.

---

### Phase 7: Comparison Table & CTA Spotlight (`CredibilityAndComparison.tsx`, `PricingComparisonSection.tsx`)
- [x] **7.1 Sequential Viewport Pop on `Native` Column:**
  - Stagger-animates the 6 solid black `Native` badges down the Source.io column on viewport entry (`delay: idx * 0.05, type: "spring", stiffness: 450, damping: 25`).
- [x] **7.2 Interactive Cursor Ink Spotlight on Dark CTA:**
  - Added pointer move tracking to the bottom `#0F172A` banner with mouse-tracking radial spotlight (`radial-gradient(550px circle at var(--cta-x) var(--cta-y), rgba(255,255,255,0.07), transparent 70%)`).
- [x] **7.3 Arrow Nudge on BYOK Link:**
  - Added `group-hover:translate-x-1` smooth arrow slide on the `Configure in Settings →` link.

---

## 3. Verification & Acceptance Criteria
1. **Zero Text Fades:** All section titles, badges, and body copy render at 100% opacity without scroll delay or blur.
2. **Smooth Tab Transitions:** Both the study modes bar and the discipline switcher glide pills smoothly with `layoutId` without layout jumps.
3. **Engine Demonstration:** The `How It Works` section cycles automatically every 4.5 seconds and demonstrates real OCR/parsing mechanics.
4. **Hero Citation Proof:** The hero preview text pulse directly triggers the citation coordinate elevation.
5. **Clean TypeScript Build:** `npx tsc --noEmit` passes with 0 errors.
