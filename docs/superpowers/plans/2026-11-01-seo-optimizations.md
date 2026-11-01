# SEO Optimizations Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Resolve critical root canonical inheritance, optimize SERP CTR on high-intent pages, add crawler-accessible H1 context, noindex private/auth surfaces, and enrich structured data with breadcrumbs and static sitemap timestamps.

**Architecture:** 
- Convert `app/page.tsx` into a Server Component to host homepage-specific metadata and canonical tag, allowing removal of global `canonical: "/"` from `app/layout.tsx`.
- Configure route-level `robots: { index: false, follow: false }` metadata on private/auth route segments (`/auth` and `/app/*`) and clean up `app/sitemap.ts`.
- Enhance on-page heading signals in `TactileHeroPrototype.tsx` using accessible hidden text (`sr-only`) to avoid altering the visual design.
- Inject `BreadcrumbList` JSON-LD schema into `app/vs-notebooklm/page.tsx` and truncate its `<title>` to 54 characters for Google SERP display limits.

**Tech Stack:** Next.js 15+ (App Router), TypeScript, Schema.org (JSON-LD), Tailwind CSS.

---

### File Structure Map

| File | Change | Responsibility |
| :--- | :--- | :--- |
| `app/layout.tsx` | Modify | Remove global `alternates: { canonical: "/" }` and unify `metadataBase` |
| `app/page.tsx` | Refactor to Server Component | Export homepage-specific `metadata` with self-referencing `canonical: "/"` and JSON-LD |
| `app/vs-notebooklm/page.tsx` | Modify | Shorten title to 54 characters and add `BreadcrumbList` JSON-LD schema |
| `src/components/landing/TactileHeroPrototype.tsx` | Modify | Add `.sr-only` descriptive keyword prefix to `<h1>` |
| `app/auth/page.tsx` | Modify | Add `noindex, follow` robots metadata |
| `app/app/layout.tsx` | Modify | Add `noindex, nofollow` robots metadata for authenticated workspace |
| `app/sitemap.ts` | Modify | Remove `/auth` and replace dynamic `new Date()` with static release dates |

---

## Tasks

### Task 1: Resolve Root Canonical Inheritance & Convert `app/page.tsx` to Server Component

**Context:** Currently, `app/layout.tsx` defines `alternates: { canonical: "/" }`. In Next.js App Router, this cascades to all sub-routes unless overridden. Because `app/page.tsx` was marked `"use client"`, it could not export metadata. Making `app/page.tsx` a Server Component lets it own its metadata and canonical URL cleanly.

- [ ] **Step 1:** Modify `app/layout.tsx` to remove `alternates: { canonical: "/" }`. Ensure `metadataBase` points to `process.env.NEXT_PUBLIC_SITE_URL || "https://sourceio.app"`.
- [ ] **Step 2:** Refactor `app/page.tsx`:
  - Remove `"use client";`.
  - Export `metadata: Metadata = { alternates: { canonical: "/" } };`.
  - Keep the JSON-LD `<script>` tag.
  - Render `<LandingPage />` (which is already a client component).
- [ ] **Step 3:** Run `npx tsc --noEmit` to verify type safety.
- [ ] **Step 4:** Commit changes with message `fix(seo): remove root canonical inheritance and server-render homepage metadata`.

---

### Task 2: Optimize `/vs-notebooklm` Title and Add Breadcrumb Schema

**Context:** `/vs-notebooklm` has a 74-character title (`Source.io vs Google NotebookLM: Feature Comparison & Alternatives (2026)`), which is truncated in Google SERPs (limit is ~55–60 characters). It also displays visual breadcrumbs (`Home / Comparisons`) without structured `BreadcrumbList` schema.

- [ ] **Step 1:** Update `metadata.title` in `app/vs-notebooklm/page.tsx` to:
  `"Source.io vs NotebookLM: Feature & Citation Comparison"` (54 chars).
- [ ] **Step 2:** Add `BreadcrumbList` JSON-LD schema alongside the existing `WebPage` schema in `app/vs-notebooklm/page.tsx`:
  ```json
  {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      {
        "@type": "ListItem",
        "position": 1,
        "name": "Home",
        "item": "https://sourceio.app"
      },
      {
        "@type": "ListItem",
        "position": 2,
        "name": "Comparisons",
        "item": "https://sourceio.app/vs-notebooklm"
      }
    ]
  }
  ```
- [ ] **Step 3:** Run `npx tsc --noEmit` to verify syntax.
- [ ] **Step 4:** Commit changes with message `feat(seo): optimize vs-notebooklm title and inject breadcrumb schema`.

---

### Task 3: Anchor Homepage H1 with Crawler Context

**Context:** The visual H1 in `TactileHeroPrototype.tsx` contains *"Master the Text. Skip the Grind."*, which is a strong emotional hook but lacks the topical keywords ("AI Study Workspace", "Study Notes") that Google uses for primary query matching.

- [ ] **Step 1:** In `src/components/landing/TactileHeroPrototype.tsx`, update the `<h1>` element:
  ```tsx
  <motion.h1
    initial={{ opacity: 0, y: shouldReduceMotion ? 0 : 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: shouldReduceMotion ? 0.3 : 0.7, delay: 0.08, ease: [0.16, 1, 0.3, 1] }}
    className="text-4xl xs:text-5xl sm:text-6xl md:text-7xl font-extrabold tracking-[-0.035em] leading-[1.05] sm:leading-[1.04] text-slate-900 font-display text-balance max-w-4xl mx-auto"
  >
    <span className="sr-only">AI Study Notes & Workspace — </span>
    <span className="block text-slate-900">Master the Text.</span>
    <span className="block text-slate-900 mt-1">Skip the Grind.</span>
  </motion.h1>
  ```
- [ ] **Step 2:** Verify that `.sr-only` is rendered accessibly in the DOM without changing visual layout.
- [ ] **Step 3:** Commit changes with message `feat(seo): anchor homepage h1 with accessible study workspace context`.

---

### Task 4: Noindex Private Routes & Clean Sitemap

**Context:** Googlebot should not index authentication forms (`/auth`) or the private user dashboard (`/app/*`). Crawling these causes redirect warnings and wasted crawl budget.

- [ ] **Step 1:** In `app/auth/page.tsx`, export `metadata`:
  ```ts
  import type { Metadata } from "next";

  export const metadata: Metadata = {
    title: "Sign In or Create Account | Source.io",
    robots: {
      index: false,
      follow: false,
    },
  };
  ```
- [ ] **Step 2:** In `app/app/layout.tsx`, export `metadata`:
  ```ts
  import type { Metadata } from "next";

  export const metadata: Metadata = {
    robots: {
      index: false,
      follow: false,
    },
  };
  ```
- [ ] **Step 3:** In `app/sitemap.ts`, remove the `${siteUrl}/auth` URL entry.
- [ ] **Step 4:** Run `npx tsc --noEmit` to verify type validity.
- [ ] **Step 5:** Commit changes with message `fix(seo): noindex auth and app routes, remove auth from sitemap`.

---

### Task 5: Static Sitemap `lastModified` Dates

**Context:** Returning `new Date()` dynamically for all URLs in `app/sitemap.ts` leads Googlebot to disregard `lastmod` signals. Setting stable dates accurately reflects content updates.

- [ ] **Step 1:** In `app/sitemap.ts`, replace dynamic `new Date()` calls with static ISO dates representing recent content milestones:
  - Homepage (`/`): `new Date("2026-11-01")`
  - `/vs-notebooklm`: `new Date("2026-10-22")`
  - `/pricing`: `new Date("2026-10-18")`
  - Interactive demos: `new Date("2026-10-19")`
  - Markdown/docs (`/pricing.md`, `/llms.txt`, `/llms-full.txt`): `new Date("2026-10-15")`
- [ ] **Step 2:** Run `npm run build` or `npx tsc --noEmit` to verify build passes.
- [ ] **Step 3:** Commit changes with message `feat(seo): stabilize sitemap lastModified timestamps`.

---

## Verification Plan

### Automated Checks
- `npx tsc --noEmit`: Ensure zero TypeScript errors across modified files.
- `npm run build` (or Next.js route check): Verify that `app/page.tsx` builds cleanly as a Server Component and routes render properly.

### Manual / DOM Verification
1. **Canonical Check**:
   - Inspect `/` HTML head: Verify `<link rel="canonical" href="https://sourceio.app/" />` is present.
   - Inspect `/vs-notebooklm` HTML head: Verify `<link rel="canonical" href="https://sourceio.app/vs-notebooklm" />` is preserved.
2. **Title Check**:
   - Inspect `/vs-notebooklm`: Verify `<title>` equals `"Source.io vs NotebookLM: Feature & Citation Comparison"`.
3. **Noindex Check**:
   - Inspect `/auth`: Verify `<meta name="robots" content="noindex, nofollow" />` is present.
4. **Structured Data Check**:
   - Run JavaScript evaluation on `/vs-notebooklm` to confirm both `WebPage` and `BreadcrumbList` schema objects appear inside `<script type="application/ld+json">`.
5. **Sitemap Check**:
   - Inspect `app/sitemap.ts` output: Verify `/auth` is absent and `lastModified` dates are ISO date strings.

