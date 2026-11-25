import { describe, it, expect } from "vitest";
import sitemap from "../../app/sitemap";
import robots from "../../app/robots";
import fs from "node:fs";
import path from "node:path";

describe("SEO & Crawl Assets", () => {
  describe("sitemap.ts", () => {
    it("returns indexable URLs and excludes private auth routes", () => {
      const urls = sitemap();
      expect(Array.isArray(urls)).toBe(true);

      const paths = urls.map((entry) => entry.url);
      expect(paths).toContain("https://sourceio.app/");
      expect(paths).toContain("https://sourceio.app/vs-notebooklm");
      expect(paths).toContain("https://sourceio.app/pricing");

      // /auth must NOT be in the sitemap
      const authEntry = urls.find((entry) => entry.url.includes("/auth"));
      expect(authEntry).toBeUndefined();
    });

    it("uses stable, valid Date timestamps for lastModified", () => {
      const urls = sitemap();
      urls.forEach((entry) => {
        const date = entry.lastModified instanceof Date ? entry.lastModified : new Date(entry.lastModified!);
        expect(isNaN(date.getTime())).toBe(false);
      });
    });
  });

  describe("robots (app/robots.ts)", () => {
    it("configures search bot permissions and sitemap URL correctly", () => {
      const r = robots();
      const rules = Array.isArray(r.rules) ? r.rules : [r.rules];
      const byAgent = (ua: string) => rules.find((rule) => rule.userAgent === ua);
      const asList = (v: string | string[] | undefined) => (v === undefined ? [] : Array.isArray(v) ? v : [v]);

      expect(r.sitemap).toBe("https://sourceio.app/sitemap.xml");
      for (const ua of ["Googlebot", "OAI-SearchBot", "PerplexityBot"]) {
        expect(byAgent(ua), ua).toBeDefined();
        expect(asList(byAgent(ua)!.disallow)).toContain("/auth");
      }
      expect(asList(byAgent("*")!.disallow)).toEqual(expect.arrayContaining(["/auth", "/app/settings", "/api/", "/app"]));
      expect(asList(byAgent("GPTBot")!.disallow)).toEqual(["/"]);
      expect(fs.existsSync(path.resolve(__dirname, "../../public/robots.txt"))).toBe(false);
    });
  });
  describe("app/layout.tsx AI discovery link", () => {
    it("declares alternate markdown link for /llms.txt in head", () => {
      const layoutPath = path.resolve(__dirname, "../../app/layout.tsx");
      const content = fs.readFileSync(layoutPath, "utf-8");

      expect(content).toMatch(/<link\s+[^>]*rel="alternate"[^>]*type="text\/markdown"[^>]*href="\/llms\.txt"/);
    });
  });

  describe("app/vs-notebooklm/page.tsx AEO FAQ and Schema", () => {
    it("defines FAQPage schema and visible conversational Q&A section", () => {
      const vsPagePath = path.resolve(__dirname, "../../app/vs-notebooklm/page.tsx");
      const content = fs.readFileSync(vsPagePath, "utf-8");

      // Verify FAQPage Schema presence
      expect(content).toContain('"@type": "FAQPage"');
      expect(content).toContain("What is the difference between Source.io and Google NotebookLM?");
      expect(content).toContain("Does Source.io render LaTeX and maths formulas?");
      expect(content).toContain("Can I make flashcards and quizzes from a PDF textbook chapter?");

      // Verify visual FAQ section exists
      expect(content).toContain('id="faq"');
      expect(content).toContain("Frequently Asked Questions");
    });
  });
});
