import { readFileSync, readdirSync, statSync } from "node:fs";
import path from "node:path";
import { describe, it, expect } from "vitest";
import sitemap from "../../app/sitemap";
import { USE_CASES } from "@/features/seo/useCases";
import { ALTERNATIVES, ALTERNATIVE_PAGES } from "@/features/seo/alternatives";
import { CHANGELOG } from "@/features/seo/changelog";
import { PLANS } from "@/lib/plans";

const root = path.resolve(__dirname, "../..");
const SITE = "https://sourceio.app";
const urls = sitemap().map((e) => e.url);

// Claims the product does not make (PRODUCT.md, roadmap §3.5), plus testimonial-style marketing.
const BANNED = [
  /unlimited/i,
  /priority (gpu|queue)/i,
  /zero[- ]?(data )?retention/i,
  /coordinates?\b/i,
  /bounding box/i,
  /students love/i,
  /trusted by/i,
  /#1\b/,
  /best[- ]in[- ]class/i,
  /\d+% (higher|better|faster|more)/i,
  /\banthropic\b/i,
  /testimonial/i,
  /loved by/i,
];

function filesUnder(dir: string): string[] {
  const abs = path.join(root, dir);
  return readdirSync(abs).flatMap((name) => {
    const full = path.join(abs, name);
    const rel = path.join(dir, name);
    if (statSync(full).isDirectory()) return filesUnder(rel);
    return /\.(ts|tsx)$/.test(name) && !/\.test\./.test(name) ? [rel] : [];
  });
}

const CONTENT_FILES = [
  ...filesUnder("src/features/seo"),
  ...filesUnder("app/use-cases"),
  ...filesUnder("app/alternatives"),
  ...filesUnder("app/changelog"),
];

describe("programmatic SEO pages", () => {
  it("has about a dozen use cases with unique slugs and H1s", () => {
    expect(USE_CASES.length).toBeGreaterThanOrEqual(12);
    expect(new Set(USE_CASES.map((u) => u.slug)).size).toBe(USE_CASES.length);
    expect(new Set(USE_CASES.map((u) => u.h1)).size).toBe(USE_CASES.length);
    expect(new Set(USE_CASES.map((u) => u.metaTitle)).size).toBe(USE_CASES.length);
  });

  it("every use case and alternative page is in the sitemap", () => {
    expect(urls).toContain(`${SITE}/use-cases`);
    expect(urls).toContain(`${SITE}/alternatives`);
    expect(urls).toContain(`${SITE}/changelog`);
    for (const u of USE_CASES) expect(urls).toContain(`${SITE}/use-cases/${u.slug}`);
    for (const a of ALTERNATIVES) expect(urls).toContain(`${SITE}${a.path}`);
  });

  it("keeps the existing sitemap entries", () => {
    for (const p of ["/", "/pricing", "/vs-notebooklm", "/demo", "/privacy", "/terms", "/refunds"]) {
      expect(urls).toContain(`${SITE}${p}`);
    }
  });

  it("does not list redirecting URLs in the sitemap", () => {
    expect(urls).not.toContain(`${SITE}/alternatives/notebooklm`);
  });

  it("metadata titles are <= 60 chars and descriptions <= 155 chars", () => {
    for (const item of [...USE_CASES, ...ALTERNATIVE_PAGES]) {
      expect(item.metaTitle.length, item.metaTitle).toBeLessThanOrEqual(60);
      expect(item.metaDescription.length, item.metaDescription).toBeLessThanOrEqual(155);
    }
  });

  it("use cases have 3-5 FAQs and three valid related links that aren't themselves", () => {
    const slugs = new Set(USE_CASES.map((u) => u.slug));
    for (const u of USE_CASES) {
      expect(u.faqs.length, u.slug).toBeGreaterThanOrEqual(3);
      expect(u.faqs.length, u.slug).toBeLessThanOrEqual(5);
      expect(u.related).toHaveLength(3);
      for (const r of u.related) {
        expect(slugs.has(r), `${u.slug} -> ${r}`).toBe(true);
        expect(r).not.toBe(u.slug);
      }
    }
  });

  it("alternative pages have choose-them and choose-Source.io sections", () => {
    for (const a of ALTERNATIVE_PAGES) {
      expect(a.chooseThem.length, a.slug).toBeGreaterThan(0);
      expect(a.chooseSourceio.length, a.slug).toBeGreaterThan(0);
      expect(a.differences.length, a.slug).toBeGreaterThan(0);
      expect(a.faqs.length, a.slug).toBeGreaterThanOrEqual(3);
    }
    expect(ALTERNATIVES.find((a) => a.slug === "notebooklm")?.path).toBe("/vs-notebooklm");
  });

  it("states plan limits from src/lib/plans.ts", () => {
    const text = JSON.stringify(USE_CASES);
    expect(text).toContain(`${PLANS.free.pagesPerDocument} pages on ${PLANS.free.name}`);
    expect(text).toContain(`${PLANS.scholar.pagesPerDocument} pages on ${PLANS.scholar.name}`);
    expect(text).toContain(`${PLANS.free.dailyActions} AI actions per day`);
  });

  it("marks YouTube as beta wherever YouTube pages exist", () => {
    const yt = USE_CASES.find((u) => u.slug === "youtube-lectures")!;
    expect(yt.limits.join(" ")).toMatch(/beta/i);
    expect(yt.limits.join(" ")).toMatch(/paste the transcript/i);
  });

  it("changelog entries are dated and newest first", () => {
    const dates = CHANGELOG.map((e) => e.date);
    for (const d of dates) expect(d).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect([...dates].sort().reverse()).toEqual(dates);
  });

  for (const file of CONTENT_FILES) {
    it(`${file} makes no banned claims`, () => {
      const text = readFileSync(path.join(root, file), "utf8");
      for (const re of BANNED) expect(text, `${file} matches ${re}`).not.toMatch(re);
    });
  }

  it("rendered content contains no banned claims", () => {
    const text = JSON.stringify([USE_CASES, ALTERNATIVES, CHANGELOG]);
    for (const re of BANNED) expect(text, `content matches ${re}`).not.toMatch(re);
  });
});
