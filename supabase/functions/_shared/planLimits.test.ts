import { describe, it, expect } from "vitest";
import { CHARS_PER_PAGE as CLIENT_CHARS_PER_PAGE, PLANS } from "@/lib/plans";
import {
  ABSOLUTE_MAX_CHARS,
  BYOK_PAGES_PER_DOCUMENT,
  CHARS_PER_PAGE,
  documentAllowance,
  documentTooLongMessage,
  estimatePages,
  normalizeTier,
  TIER_LIMITS,
  uploadTooLargeMessage,
} from "./planLimits";

describe("server plan limits mirror src/lib/plans.ts", () => {
  it("free matches PLANS.free", () => {
    expect(CHARS_PER_PAGE).toBe(CLIENT_CHARS_PER_PAGE);
    expect(TIER_LIMITS.free).toEqual({
      dailyQuotaLimit: PLANS.free.dailyActions,
      dailyTtsQuotaLimit: PLANS.free.dailyAudioRenders,
      activeDocsLimit: PLANS.free.documents,
      pagesPerDocument: PLANS.free.pagesPerDocument,
      uploadMb: PLANS.free.uploadMb,
    });
  });

  it("pro matches PLANS.scholar", () => {
    expect(TIER_LIMITS.pro).toEqual({
      dailyQuotaLimit: PLANS.scholar.dailyActions,
      dailyTtsQuotaLimit: PLANS.scholar.dailyAudioRenders,
      activeDocsLimit: PLANS.scholar.documents,
      pagesPerDocument: PLANS.scholar.pagesPerDocument,
      uploadMb: PLANS.scholar.uploadMb,
    });
  });

  it("BYOK page allowance matches PLANS.byok", () => {
    expect(BYOK_PAGES_PER_DOCUMENT).toBe(PLANS.byok.pagesPerDocument);
    expect(ABSOLUTE_MAX_CHARS).toBe(PLANS.byok.pagesPerDocument * CLIENT_CHARS_PER_PAGE);
  });
});

describe("documentAllowance", () => {
  it("uses the tier page cap without BYOK", () => {
    expect(documentAllowance("free", false)).toEqual({ maxPages: 25, maxChars: 75_000, uploadBytes: 50 * 1024 * 1024 });
    expect(documentAllowance("pro", false)).toEqual({ maxPages: 50, maxChars: 150_000, uploadBytes: 100 * 1024 * 1024 });
  });

  it("BYOK raises only the page cap", () => {
    expect(documentAllowance("free", true)).toEqual({ maxPages: 300, maxChars: 900_000, uploadBytes: 50 * 1024 * 1024 });
    expect(documentAllowance("pro", true).uploadBytes).toBe(100 * 1024 * 1024);
  });

  it("unknown tiers are free", () => {
    expect(normalizeTier("enterprise")).toBe("free");
    expect(normalizeTier(null)).toBe("free");
    expect(documentAllowance(undefined, false).maxPages).toBe(25);
  });
});

describe("messages", () => {
  it("estimates pages by characters", () => {
    expect(estimatePages(0)).toBe(0);
    expect(estimatePages(1)).toBe(1);
    expect(estimatePages(3000)).toBe(1);
    expect(estimatePages(3001)).toBe(2);
  });

  it("formats DOCUMENT_TOO_LONG", () => {
    expect(documentTooLongMessage(90_000, 25)).toBe("This document is about 30 pages; your plan allows up to 25.");
  });

  it("formats UPLOAD_TOO_LARGE", () => {
    expect(uploadTooLargeMessage(60 * 1024 * 1024, 50 * 1024 * 1024))
      .toBe("This file is about 60 MB; your plan allows uploads up to 50 MB.");
  });
});
