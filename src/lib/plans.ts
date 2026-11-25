/**
 * Single source of truth for plan limits (roadmap §6.1).
 *
 * Every surface that states a limit must agree with this file:
 * - UI: pricing page, landing pricing section, settings billing panel, upload dialog
 * - Static: public/pricing.md, public/llms.txt, public/llms-full.txt (checked by tests/unit/plans-consistency.test.ts)
 * - Server: profiles defaults + billing-webhook (daily limits, docs limit), ingest (page cap)
 *
 * Pages are measured by extracted characters so pasted text and transcripts follow the same rule.
 */
export const CHARS_PER_PAGE = 3000;

export type PlanId = "free" | "scholar" | "byok";

export interface PlanLimits {
  id: PlanId;
  name: string;
  priceMonthlyUsd: number;
  dailyActions: number | null; // null = no platform cap (user's own key)
  dailyAudioRenders: number;
  documents: number;
  pagesPerDocument: number;
  uploadMb: number;
}

export const PLANS: Record<PlanId, PlanLimits> = {
  free: {
    id: "free",
    name: "Free",
    priceMonthlyUsd: 0,
    dailyActions: 25,
    dailyAudioRenders: 2,
    documents: 3,
    pagesPerDocument: 25,
    uploadMb: 50,
  },
  scholar: {
    id: "scholar",
    name: "Scholar Pass",
    priceMonthlyUsd: 9,
    dailyActions: 200,
    dailyAudioRenders: 50,
    documents: 100,
    pagesPerDocument: 50,
    uploadMb: 100,
  },
  byok: {
    id: "byok",
    name: "Your own API key",
    priceMonthlyUsd: 0,
    dailyActions: null,
    dailyAudioRenders: 2,
    documents: 3,
    pagesPerDocument: 300,
    uploadMb: 50,
  },
};

export function maxCharsFor(plan: PlanId): number {
  return PLANS[plan].pagesPerDocument * CHARS_PER_PAGE;
}

/** Maps a profiles.tier value to a plan. Unknown tiers fall back to free. */
export function planForTier(tier: string | null | undefined): PlanLimits {
  return tier === "pro" ? PLANS.scholar : PLANS.free;
}
