# Academic Paper & Deep Ink (90% Light / 10% Ink) Conversion Plan

This document establishes the architecture, surface hierarchy, typographic standards, semantic color rules, and section-by-section implementation roadmap for converting **Source.io** to the **"Academic Paper & Deep Ink"** aesthetic.

---

## Executive Summary

The landing page transitions from a generic grey backdrop to a refined **Academic Paper & Deep Ink** design language:
- **90% Light & Paper Base:** Warm tactile paper canvas (`#FAF9F6`), clean elevated white cards (`#FFFFFF`), subtle hairlines, and crisp dark ink typography (`text-slate-950`).
- **10% Deep Ink Anchors:** High-contrast `slate-900` elements reserved strictly for primary calls-to-action, the floating Citation Coordinate card, active mode pills, and the bottom conversion banner.
- **Strict Semantic Color Jobs:** 
  - **Academic Sky (`sky`):** Structure, eyebrows, active navigation indicators, and bounding boxes.
  - **Grounded Emerald (`emerald`):** Verifiable truth, citation confidence badges, and trust guarantees.

---

## Phase 1: Lock the Landing Page to Light Mode & Remove Stray Chrome

The marketing page must consistently render in crisp light mode so that PDF snippets, LaTeX equations, and elevation shadows never suffer from dark mode inversion or low-contrast subpixel clipping.

1. **Remove Stray Floating Viewport Toggles:**
   - Ensure the global floating quota/action pill (`DailyQuotaPill`) strictly mounts inside authenticated `/app/*` routes and is completely hidden on `/`.
   - The top viewport header retains only the centered floating capsule navbar pill.

2. **Force Light Mode on Marketing Routes:**
   - Guarantee `LandingPage` mounts with `setTheme("light")` and removes the `.dark` class from `document.documentElement`.
   - Scope any dark/sepia styling so it only attaches when `pathname.startsWith("/app")`.

3. **Retain Dark Theme Inside Document Workspace:**
   - Keep the dark mode and appearance options (`#18181B` / `#121214`) active inside the study workspace (`/app/doc/*` and `/app/settings`) for late-night study sessions.

---

## Phase 2: "Paper & Ink" Surface Hierarchy

Eliminate flat white-on-white by introducing a warm paper-tinted canvas where white feature cards and workspace previews pop through tactile contrast:

| Layer Role | Target Tailwind Classes | Surface Application |
| :--- | :--- | :--- |
| **Page Canvas (90% Base)** | `bg-[#FAF9F6] text-slate-950 antialiased selection:bg-sky-100 selection:text-sky-900` | Root landing page wrapper (`LandingPage.tsx`). |
| **Elevated Paper Cards** | `bg-white border border-slate-200/80 shadow-[0_1px_3px_rgba(15,23,42,0.03),0_8px_24px_rgba(15,23,42,0.04)] rounded-2xl` | OCR preview card, Study Modes frame, Pricing cards, Use Cases container, Comparison table wrapper, and FAQ accordions. |
| **Secondary / Muted Surface** | `bg-slate-50/80 border border-slate-200/60` | Inactive step cards in *How It Works*, table headers, and the BYOK banner below pricing. |
| **10% Deep Ink Anchors** | `bg-slate-900 text-white border border-slate-800 shadow-lg` | Restrict **only** to: Navbar `Start free` CTA, Hero primary CTA, Hero floating `Verified Citation` card, Active tab pills, `$9` Scholar Pass CTA, and the bottom `Stop skimming. Start mastering.` banner. |

---

## Phase 3: Eliminate Faded & Invisible Section Headings

Fix washed-out grey headings (*How It Works*, *Use Cases*, and *FAQ*) caused by scroll-reveal opacity delays or text transparency:

1. **Strip Opacity-Based Scroll Delays on Headings:**
   - Remove Framer Motion `initial={{ opacity: 0 }}` or Tailwind `opacity-0` / `text-slate-300` / `bg-clip-text text-transparent` triggers on `<h2>` elements.
2. **Apply Unified Standardized Heading Utilities:**
   - **All Section `<h2>` Tags:** `font-jakarta text-3xl sm:text-4xl font-bold tracking-tight text-slate-950 text-balance`
   - **All Section Subtitles (`<p>`):** `mt-3 text-base sm:text-lg text-slate-600 max-w-2xl leading-relaxed text-balance`
3. **Verify FAQ Header Contrast:**
   - Ensure the FAQ section `<h2>` renders in solid `text-slate-950` immediately below the badge icon with zero opacity lag.

---

## Phase 4: Enforce Strict Semantic Accent Colors

Standardize all accent colors so they communicate clear pedagogical roles rather than aesthetic variation:

1. **Academic Sky (`sky`) → Structure, Eyebrows & Interactive States:**
   - Standardize every section eyebrow badge on the page to:
     ```tsx
     <span className="inline-flex items-center rounded-full bg-sky-50 px-3 py-1 text-xs font-semibold tracking-wide text-sky-700 ring-1 ring-inset ring-sky-600/20 uppercase">
       Section Label
     </span>
     ```
   - Use `text-sky-600` and `bg-sky-50/60 border-sky-200` for active step indicators in *How It Works* and formula bounding boxes in the OCR inspection card.

2. **Grounded Emerald (`emerald`) → Verification & Truth Only:**
   - Reserve emerald strictly for accuracy proof and free-tier trust:
     - Hero floating card badge (`Citation Coordinate` / `96% match`).
     - OCR confidence tags (`[conf: 99.8%]`, `Vector coordinates mapped`).
     - Study Modes header pill (`Grounded`).
     - Pricing `$0` card badge (`FREE FOREVER`).
     - Comparison table `Native` badges (`bg-emerald-50 text-emerald-700 border border-emerald-200/80`).

---

## Phase 5: Section-by-Section Execution Checklist

| Section | Target State & Exact UI Action | Status |
| :--- | :--- | :---: |
| **1. Top Navbar** | Centered floating capsule pill (`bg-white/85 backdrop-blur-md border border-slate-200/80`). No stray external viewport buttons. | Completed |
| **2. Hero Section** | High-contrast workspace frame with floating dark `Citation Coordinate` card. Underlined phrase `verified study materials.` with crisp sky underline (`text-primary` with inline SVG wave / sky accent). | Completed |
| **3. How It Works** | `<h2>` in solid `text-slate-950`. Active step highlighted with `bg-slate-50/80 border-sky-600`. Right-hand document sheet vertically centered (`items-center`). | Completed |
| **4. 5 Study Modes** | Clean light console frame (`bg-white border-slate-200/90 shadow-tactile-card`). Inactive tabs styled as `text-slate-600 hover:text-slate-900`. Active pill in deep ink `bg-slate-950 text-white`. | Completed |
| **5. Pricing (`$0` vs `$9`)** | Eyebrow badge unified to `bg-sky-50 text-sky-700 ring-sky-600/20`. Redundant countdown pill dropped. Dark ink pill (`bg-slate-900 text-white`) reserved for `$9` card. | Completed |
| **6. Use Cases** | Eyebrow badge unified to sky style. Headline rendered in solid `text-slate-950`. | Completed |
| **7. Comparison Table** | Headline: *"Why general AI chatbots fall short for exam prep"*. Solid `text-slate-900` for Source.io column, muted `text-slate-500` for competitors, crisp emerald `Native` badges. | Completed |
| **8. FAQ Accordion** | Headline rendered in solid `text-slate-950` with immediate paint (no scroll-fade opacity delay). Clean elevated white cards (`bg-white border-slate-200/90`). | Completed |
| **9. Bottom CTA & Footer** | Deep ink conversion banner (`bg-slate-950 text-white`) with solid white headline (*"Stop skimming. Start mastering."*). Light 4-column footer on `#FAF9F6` base. | Completed |

---

## Verification & Build Standards

- **TypeScript Typecheck:** `npm run typecheck` (`tsc -b --noEmit`) must exit with 0 errors.
- **Production Build:** `npm run build` (`next build`) must successfully generate all static and dynamic routes.
- **Contrast Ratios:** All body copy, headlines, and card borders must meet or exceed WCAG AA contrast against `#FAF9F6` and `#FFFFFF`.
