# AI SEO & Generative Engine Optimization (GEO) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement AI search engine discovery links, atomic conversational Q&A answer blocks (40–60 words for AEO), and JSON-LD `FAQPage` schema to maximize citation potential by ChatGPT, Perplexity, Claude, and Google AI Overviews.

**Architecture:** 
1. Expose machine-readable markdown discovery directly in the HTML `<head>` of `app/layout.tsx` pointing to `/llms.txt`.
2. Enhance `app/vs-notebooklm/page.tsx` with high-intent conversational Q&A blocks styled cleanly with Tailwind and backed by standard Schema.org `FAQPage` JSON-LD in `@graph`.
3. Verify changes with unit tests in `tests/unit/seo-metadata.test.ts` and E2E assertions in `tests/e2e/smoke.spec.ts`.

**Tech Stack:** Next.js 16 (App Router), React 19, TypeScript, Schema.org JSON-LD, Vitest, Playwright.

**Spec:** Recommendations from `marketingskills:ai-seo` audit (Princeton GEO study & AgentReady.org standards).

## Global Constraints

- No external runtime dependencies to install (standard HTML and schema structures only).
- Keep answer blocks within 40–60 words each (the optimal information density for LLM direct extraction).
- Ensure existing schema (`WebPage`, `BreadcrumbList`) remains valid alongside the new `FAQPage` in `@graph`.
- Maintain 100% passing status across Vitest (`npm run test`) and Playwright (`npm run test:e2e`).
- Maintain zero TypeScript diagnostic errors (`npm run typecheck`).

## Review Focus

1. **HTML `<head>` Injection**: The `<link rel="alternate" type="text/markdown" ... />` must render in `<head>` without hydration mismatch warnings.
2. **Atomic AEO Length**: Each FAQ answer must be 40–60 words, self-contained, fact-dense, and directly answer the question without conversational fluff ("Sure!", "Here is...").
3. **Structured Data Syntax**: The JSON-LD in `app/vs-notebooklm/page.tsx` must have valid `@type: "FAQPage"` and `mainEntity` with `Question` and `acceptedAnswer`.
4. **Visual Consistency**: The new FAQ section on `/vs-notebooklm` must seamlessly blend with the existing clean warm-paper aesthetic (`#FBFBFA`, slate palette, amber accents).
5. **E2E Stability**: Playwright tests must cleanly locate the new FAQ elements without ambiguity or flakiness.

---

### Task 1: Add Machine-Readable `/llms.txt` Discovery Link to `<head>`

**Files:**
- Modify: `app/layout.tsx`
- Modify: `tests/unit/seo-metadata.test.ts`

- [x] **Step 1: Write failing unit test in `tests/unit/seo-metadata.test.ts`**
  Add a test verifying `app/layout.tsx` source code or HTML renders `<link rel="alternate" type="text/markdown" href="/llms.txt" ... />`.
- [x] **Step 2: Run unit test to verify failure**
  Run: `npm run test -- tests/unit/seo-metadata.test.ts`
  Verify the test fails because the link is missing.
- [x] **Step 3: Add `<link>` to `app/layout.tsx`**
  In `app/layout.tsx`, inside `<head>`:
  ```tsx
  <link
    rel="alternate"
    type="text/markdown"
    href="/llms.txt"
    title="AI Context Specification"
  />
  ```
- [x] **Step 4: Run unit test to verify pass**
  Run: `npm run test -- tests/unit/seo-metadata.test.ts`
  Confirm all tests pass.
- [x] **Step 5: Commit changes**
  Commit message: `feat(seo): add machine-readable /llms.txt discovery link to layout head`

---

### Task 2: Implement Conversational Q&A Blocks and `FAQPage` Schema on `/vs-notebooklm`

**Files:**
- Modify: `app/vs-notebooklm/page.tsx`
- Modify: `tests/unit/seo-metadata.test.ts`

- [x] **Step 1: Add schema & structure unit test in `tests/unit/seo-metadata.test.ts`**
  Write a test reading `app/vs-notebooklm/page.tsx` content and verifying:
  - Inclusion of `@type": "FAQPage"`
  - Questions for "What is the difference between Source.io and Google NotebookLM?", "Does Source.io render LaTeX and complex math formulas?", and "Can I generate Leitner flashcards and quizzes from PDF textbooks?"
  - Answer text presence in the code.
- [x] **Step 2: Run unit test to verify failure**
  Run: `npm run test -- tests/unit/seo-metadata.test.ts`
  Verify test fails as expected.
- [x] **Step 3: Update `comparisonSchema` and add FAQ Section in `app/vs-notebooklm/page.tsx`**
  1. Add `FAQPage` object into `comparisonSchema["@graph"]` with the 3 questions and 40–60 word answers.
  2. Add an `<section id="faq" className="mt-20 pt-12 border-t border-slate-200 max-w-3xl space-y-8">` before the Bottom CTA box containing:
     - Section heading: `Frequently Asked Questions`
     - 3 cleanly styled card/accordion answer blocks with `<h3>` questions and `<p>` 40–60 word answers.
- [x] **Step 4: Run unit tests to verify pass**
  Run: `npm run test -- tests/unit/seo-metadata.test.ts`
  Confirm tests pass.
- [x] **Step 5: Commit changes**
  Commit message: `feat(geo): add AEO conversational Q&A blocks and FAQPage schema to /vs-notebooklm`

---

### Task 3: Update Playwright E2E Suite & Full Verification

**Files:**
- Modify: `tests/e2e/smoke.spec.ts`

- [x] **Step 1: Update E2E test in `tests/e2e/smoke.spec.ts`**
  In the `/vs-notebooklm` test, add assertions checking:
  - The FAQ section is visible (`page.locator("#faq")`).
  - The FAQ questions and answers are present and visible on screen.
- [x] **Step 2: Run full unit test suite**
  Run: `npm run test`
  Confirm all unit/component tests pass.
- [x] **Step 3: Run TypeScript typecheck**
  Run: `npm run typecheck`
  Confirm 0 errors.
- [x] **Step 4: Run Playwright E2E test suite**
  Run: `npm run test:e2e`
  Confirm all E2E tests pass.
- [x] **Step 5: Commit changes**
  Commit message: `test(e2e): verify FAQ and AI SEO elements on comparison page`
