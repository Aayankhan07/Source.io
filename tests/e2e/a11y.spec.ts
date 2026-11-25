import { test, expect, type Page } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

/**
 * Accessibility gate for public (signed-out) pages:
 * 1. axe-core WCAG 2.0 A/AA + 2.1 AA scan — fails on any serious or critical violation.
 * 2. 12px floor — every visible text node renders at >= 12px (KaTeX internals and
 *    <sup>/<sub> are allowed to be smaller).
 */
const PAGES: Array<{ name: string; path: string }> = [
  { name: "home", path: "/" },
  { name: "pricing", path: "/pricing" },
  { name: "vs-notebooklm", path: "/vs-notebooklm" },
  { name: "privacy", path: "/privacy" },
  { name: "terms", path: "/terms" },
  { name: "refunds", path: "/refunds" },
  { name: "demo index", path: "/demo" },
  ...["notes", "flashcards", "quiz", "audio", "chat"].map((tab) => ({
    name: `demo quantum (${tab})`,
    path: tab === "notes" ? "/demo/quantum" : `/demo/quantum?tab=${tab}`,
  })),
  { name: "use-cases", path: "/use-cases" },
  { name: "use-case detail", path: "/use-cases/pdf-textbooks" },
  { name: "alternatives", path: "/alternatives" },
  { name: "alternative detail", path: "/alternatives/quizlet" },
  { name: "changelog", path: "/changelog" },
  { name: "auth", path: "/auth" },
  { name: "404", path: "/this-page-does-not-exist" },
];

const BLOCKING = new Set(["serious", "critical"]);
const MIN_FONT_PX = 12;

// Settle entrance animations so axe measures final colours, not mid-fade opacity.
test.use({ reducedMotion: "reduce", colorScheme: "light" });

async function open(page: Page, path: string) {
  const res = await page.goto(path, { waitUntil: "load" });
  expect(res, `no response for ${path}`).not.toBeNull();
  await page.waitForLoadState("networkidle").catch(() => {});
  // Scroll through once so whileInView / lazy sections render, then back to the top.
  await page.evaluate(async () => {
    const step = window.innerHeight;
    for (let y = 0; y < document.body.scrollHeight; y += step) {
      window.scrollTo(0, y);
      await new Promise((r) => setTimeout(r, 50));
    }
    window.scrollTo(0, 0);
  });
  await page.waitForTimeout(300);
}

/** Visible text smaller than the floor, outside KaTeX and <sup>/<sub>. */
async function smallText(page: Page, minPx: number) {
  return await page.evaluate((min) => {
    const out: Array<{ text: string; px: number; el: string }> = [];
    const seen = new Set<Element>();
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
    for (let n = walker.nextNode(); n; n = walker.nextNode()) {
      const text = (n.textContent ?? "").trim();
      const el = n.parentElement;
      if (!text || !el || seen.has(el)) continue;
      seen.add(el);
      if (el.closest(".katex, sup, sub, script, style, noscript, template, [aria-hidden='true']")) continue;
      const style = getComputedStyle(el);
      if (style.visibility !== "visible" || style.display === "none") continue;
      const range = document.createRange();
      range.selectNodeContents(n);
      const rect = range.getBoundingClientRect();
      // Skip clipped / visually-hidden text (sr-only) and zero-size nodes.
      if (rect.width < 2 || rect.height < 2) continue;
      const px = parseFloat(style.fontSize);
      if (px < min) {
        const cls = typeof el.className === "string" ? el.className.split(/\s+/).slice(0, 4).join(".") : "";
        out.push({ text: text.slice(0, 60), px, el: `${el.tagName.toLowerCase()}${cls ? "." + cls : ""}` });
      }
    }
    return out;
  }, minPx);
}

for (const { name, path } of PAGES) {
  test.describe(`a11y: ${name} (${path})`, () => {
    test("has no serious or critical axe violations", async ({ page }) => {
      await open(page, path);
      const results = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21aa"]).analyze();
      const blocking = results.violations.filter((v) => BLOCKING.has(v.impact ?? ""));
      const summary = blocking.map(
        (v) =>
          `${v.impact} ${v.id}: ${v.help}\n` +
          v.nodes
            .map(
              (n) =>
                `    ${n.target.join(" ")}\n      html: ${n.html.slice(0, 160)}\n      why: ${n.failureSummary
                  ?.split("\n")
                  .slice(1)
                  .join(" ")
                  .trim()}`,
            )
            .join("\n"),
      );
      expect(blocking.length, `axe violations on ${path}:\n${summary.join("\n")}`).toBe(0);
    });

    test(`renders no visible text below ${MIN_FONT_PX}px`, async ({ page }) => {
      await open(page, path);
      const offenders = await smallText(page, MIN_FONT_PX);
      expect(offenders.length, `text below ${MIN_FONT_PX}px on ${path}:
${JSON.stringify(offenders, null, 2)}`).toBe(0);
    });
  });
}
