// Server-side mirror of src/lib/plans.ts (roadmap §6.1). Pure: no Deno/Supabase globals, so
// vitest can check it against the client source of truth (planLimits.test.ts).

/** Pages are measured by extracted characters so pasted text and transcripts follow one rule. */
export const CHARS_PER_PAGE = 3000;

export type ServerTier = "free" | "pro";

export interface TierLimits {
  dailyQuotaLimit: number;
  dailyTtsQuotaLimit: number;
  activeDocsLimit: number;
  pagesPerDocument: number;
  uploadMb: number;
}

export const TIER_LIMITS: Record<ServerTier, TierLimits> = {
  free: { dailyQuotaLimit: 25, dailyTtsQuotaLimit: 2, activeDocsLimit: 3, pagesPerDocument: 25, uploadMb: 50 },
  pro: { dailyQuotaLimit: 200, dailyTtsQuotaLimit: 50, activeDocsLimit: 100, pagesPerDocument: 50, uploadMb: 100 },
};

/** Long-document allowance when the request is served with the user's own (BYOK) key. */
export const BYOK_PAGES_PER_DOCUMENT = 300;

/** Hard ceiling for any document the server will index, whatever the plan. */
export const ABSOLUTE_MAX_CHARS = BYOK_PAGES_PER_DOCUMENT * CHARS_PER_PAGE;

/** Maps a profiles.tier value to a server tier. Unknown values fall back to free. */
export function normalizeTier(tier: string | null | undefined): ServerTier {
  return tier === "pro" ? "pro" : "free";
}

export interface DocumentAllowance {
  maxPages: number;
  maxChars: number;
  uploadBytes: number;
}

/** Page/character/upload allowance for one document. BYOK only raises the page cap. */
export function documentAllowance(tier: string | null | undefined, isByok: boolean): DocumentAllowance {
  const limits = TIER_LIMITS[normalizeTier(tier)];
  const maxPages = isByok ? Math.max(limits.pagesPerDocument, BYOK_PAGES_PER_DOCUMENT) : limits.pagesPerDocument;
  return {
    maxPages,
    maxChars: maxPages * CHARS_PER_PAGE,
    uploadBytes: limits.uploadMb * 1024 * 1024,
  };
}

/** Approximate page count of extracted text (at least 1 for non-empty text). */
export function estimatePages(chars: number): number {
  if (chars <= 0) return 0;
  return Math.max(1, Math.ceil(chars / CHARS_PER_PAGE));
}

export function documentTooLongMessage(chars: number, maxPages: number): string {
  return `This document is about ${estimatePages(chars)} pages; your plan allows up to ${maxPages}.`;
}

export function uploadTooLargeMessage(bytes: number, uploadBytes: number): string {
  const mb = (n: number) => Math.ceil(n / (1024 * 1024));
  return `This file is about ${mb(bytes)} MB; your plan allows uploads up to ${mb(uploadBytes)} MB.`;
}
