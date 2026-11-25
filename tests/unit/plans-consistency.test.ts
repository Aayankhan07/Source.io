import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, it, expect } from "vitest";
import { PLANS } from "@/lib/plans";

const root = path.resolve(__dirname, "../..");
const read = (p: string) => readFileSync(path.join(root, p), "utf8");

const PUBLIC_SURFACES = [
  "public/pricing.md",
  "public/llms.txt",
  "public/llms-full.txt",
  "src/components/landing/PricingComparisonSection.tsx",
  "src/features/settings/components/PlanBillingSettings.tsx",
  "app/pricing/page.tsx",
  "app/vs-notebooklm/page.tsx",
];

// Claims the product does not implement (roadmap §3.5). They must not come back.
const BANNED = [
  /unlimited (priority )?(ai )?generations/i,
  /unlimited (active )?document (storage )?slots/i,
  /unlimited concurrent documents/i,
  /priority (gpu|queue)/i,
  /custom (leitner|memory) (interval|decay|review) curves/i,
  /zero data retention/i,
  /anthropic/i,
  /300 pages per file/i,
  /100 pages per file/i,
  /up to 250 pages/i,
];

describe("plan claims match src/lib/plans.ts", () => {
  for (const file of PUBLIC_SURFACES) {
    it(`${file} makes no unimplemented claims`, () => {
      const text = read(file);
      for (const re of BANNED) expect(text, `${file} matches ${re}`).not.toMatch(re);
    });
  }

  it("pricing.md and llms-full.txt state the configured limits", () => {
    for (const file of ["public/pricing.md", "public/llms-full.txt"]) {
      const text = read(file);
      expect(text).toContain(`${PLANS.free.dailyActions} AI actions`);
      expect(text).toContain(`${PLANS.scholar.dailyActions} AI actions`);
      expect(text).toContain(`${PLANS.free.pagesPerDocument} pages`);
      expect(text).toContain(`${PLANS.scholar.pagesPerDocument} pages`);
      expect(text).toContain(`${PLANS.scholar.documents} documents`);
      expect(text).toContain(`$${PLANS.scholar.priceMonthlyUsd}`);
    }
  });
});
