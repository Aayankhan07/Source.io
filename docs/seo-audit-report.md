# SEO Audit Report: Source.io

Comprehensive SEO audit executed using the `seo-audit` framework (`marketingskills/seo-audit`). Audited against technical indexing, on-page factors, title tags, heading hierarchies, content depth, structured data, internal linking, and competitor positioning.

---

## Executive Summary

Source.io has a solid technical baseline (Next.js 16 App Router, responsive layout, fast server-side generation, clean semantic HTML5, and valid `FAQPage` JSON-LD schema). However, several key search visibility blockers and low-hanging fruit exist:
1. **Missing Dynamic Sitemap (`sitemap.xml`) & Sitemap reference in `robots.txt`**: Crawlers are not directed to indexable URLs or lastmod timestamps.
2. **Title Tag Optimization**: The current title (`Source.io: AI study workspace for any content`, 46 chars) is branded-first and vague ("any content"). It lacks primary high-intent academic search terms like *"AI Study Notes, Flashcards & Practice Quizzes"*.
3. **Missing Canonical URL Tag**: No `<link rel="canonical">` or explicit `alternates: { canonical: ... }` configured in metadata to prevent parameter-based duplicate content splitting.
4. **Structured Data Expansion**: While `FAQPage` schema is implemented, `SoftwareApplication` / `WebApplication` schema is missing for rich software snippet indexing on Google SERPs.
5. **AI Writing Tells in Marketing Copy**: Minor em-dash and repetitive filler patterns in landing sections that can be tightened according to search evaluation guidelines.

---

## 1. Technical SEO Findings

| # | Issue | Impact | Evidence | Recommendation | Priority |
| :--- | :--- | :---: | :--- | :--- | :---: |
| **T-1** | **Missing `sitemap.xml`** | **High** | No `sitemap.xml` or `sitemap.ts` found in `app/` or `public/`. | Create `app/sitemap.ts` dynamically exporting root `/`, public demo `/app/doc/demo-quantum`, and `/auth`. | **High (P1)** |
| **T-2** | **`robots.txt` lacks Sitemap directive** | **Medium** | [`public/robots.txt`](file:///d:/PROJECT%20REPOS/Source.io/public/robots.txt) allows crawlers but does not declare `Sitemap: https://sourceio.app/sitemap.xml`. | Add `Sitemap: https://sourceio.app/sitemap.xml` to `robots.txt`. | **High (P1)** |
| **T-3** | **Missing Explicit Canonical URL Tag** | **High** | `app/layout.tsx` defines `metadataBase` but omits `alternates: { canonical: "/" }`. | Add `alternates: { canonical: "/" }` to metadata in `layout.tsx` to prevent duplicate indexing across URL parameters (`?tab=`, `?mode=`). | **High (P1)** |
| **T-4** | **Missing SoftwareApplication / WebApplication Schema** | **Medium** | Only `FAQPage` schema in `CredibilityAndComparison.tsx`. No software entity definition for Google knowledge panels. | Inject `SoftwareApplication` JSON-LD schema defining price (`$0.00`), operating system (`Web`), and application category (`EducationalApplication`). | **Medium (P2)** |

---

## 2. On-Page SEO & Content Quality Assessment

### Title Tag Audit (Evaluated against `references/title-tags.md`)

* **Current Title Tag:**
  `Source.io: AI study workspace for any content` *(46 chars)*
  * *Audit Finding:* Places brand first instead of high-intent search query. "Any content" is generic and has low query volume.
* **Recommended Title Tag Pattern (`[Primary Query] + [Payoff] | [Brand]`):**
  `AI Study Notes, Flashcards & Quizzes with Citations | Source.io` *(60 chars)*
  * *Why:* Front-loads high-volume target keywords ("AI Study Notes", "Flashcards & Quizzes") within the 50–60 character display limit, emphasizes the unique differentiator ("with Citations"), and finishes with the brand.

### Meta Description Audit

* **Current Meta Description:**
  `Turn PDFs, videos, audio, YouTube and notes into AI-generated study notes, flashcards, quizzes, podcasts and chat.` *(116 chars)*
  * *Audit Finding:* A bit short (116 chars vs recommended 150–160 chars), misses high-converting CTA, and lacks mention of the free plan.
* **Recommended Meta Description:**
  `Transform textbooks, lecture recordings, and research papers into verified study notes, 3D flashcards, quizzes, and podcasts with exact source citations. Start free.` *(161 chars)*

### Heading Hierarchy Audit
- **H1:** Single H1 detected in `TactileHeroPrototype.tsx`:
  `<h1>Turn textbooks, lectures, and research papers into verified study materials.</h1>` (Clean, natural, solid keyword relevance).
- **H2s:** Solid structure across sections (`How It Works`, `5 Study Modes`, `Pricing`, `Use Cases`, `Comparison`, `FAQ`). All render immediately in solid `text-slate-950` with no opacity delays.
- **H3s:** Well-distributed inside cards and accordion triggers.

### AI Writing Detection & Copy Hygiene (Evaluated against `references/ai-writing-detection.md`)
- **Em-dashes:** Replace any stray em-dash patterns (`—`) in landing body copy with colons, commas, or parentheses to keep copy authentic and human.
- **Overused Buzzwords:** Avoid filler words like *"delve"*, *"leverage"*, or *"streamline"* in favor of crisp verbs (*"extract"*, *"convert"*, *"verify"*, *"cite"*).

---

## 3. Structured Data (JSON-LD) Specification

### A. Current Status
- `FAQPage` schema is already embedded in [`CredibilityAndComparison.tsx`](file:///d:/PROJECT%20REPOS/Source.io/src/components/landing/CredibilityAndComparison.tsx#L326-L342) covering 5 top student questions.

### B. New Required Schema: `SoftwareApplication` / `WebApplication`
To be added into `app/page.tsx` or `app/layout.tsx`:
```json
{
  "@context": "https://schema.org",
  "@type": "WebApplication",
  "name": "Source.io",
  "url": "https://sourceio.app",
  "description": "AI-powered study workspace that converts textbooks, lecture recordings, and research papers into verified notes, flashcards, and quizzes with exact citations.",
  "applicationCategory": "EducationalApplication",
  "operatingSystem": "All modern web browsers",
  "offers": [
    {
      "@type": "Offer",
      "price": "0",
      "priceCurrency": "USD",
      "name": "Free Forever Plan"
    },
    {
      "@type": "Offer",
      "price": "9",
      "priceCurrency": "USD",
      "name": "Scholar Pass"
    }
  ]
}
```

---

## 4. Prioritized Action Plan

1. **Step 1 (Immediate / High Impact):**
   - Create `app/sitemap.ts` to generate dynamic sitemap XML.
   - Update `public/robots.txt` to point to `Sitemap: https://sourceio.app/sitemap.xml`.
2. **Step 2 (Title & Meta Tags):**
   - Update `app/layout.tsx` metadata:
     - New Title: `AI Study Notes, Flashcards & Quizzes with Citations | Source.io`
     - New Description: `Transform textbooks, lecture recordings, and research papers into verified study notes, 3D flashcards, quizzes, and podcasts with exact source citations. Start free.`
     - Add `alternates: { canonical: "/" }`.
3. **Step 3 (Rich Snippet Schema):**
   - Inject the `WebApplication` structured data script in `app/page.tsx`.
4. **Step 4 (Validation):**
   - Verify build with `npm run typecheck` and `npm run build`.
