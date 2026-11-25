import { describe, it, expect } from "vitest";
import { CHARS_PER_PAGE, PLANS, maxCharsFor, planForTier } from "./plans";

describe("plans", () => {
  it("derives the character cap from the page cap", () => {
    expect(maxCharsFor("free")).toBe(PLANS.free.pagesPerDocument * CHARS_PER_PAGE);
    expect(maxCharsFor("byok")).toBe(300 * CHARS_PER_PAGE);
  });

  it("maps profile tiers to plans, defaulting to free", () => {
    expect(planForTier("pro")).toBe(PLANS.scholar);
    expect(planForTier("free")).toBe(PLANS.free);
    expect(planForTier(null)).toBe(PLANS.free);
    expect(planForTier(undefined)).toBe(PLANS.free);
    expect(planForTier("enterprise")).toBe(PLANS.free);
  });
});
