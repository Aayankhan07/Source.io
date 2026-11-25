import { describe, it, expect } from "vitest";
import { resolveGroqKey } from "./byok";

describe("resolveGroqKey", () => {
  it("is BYOK only when the user's key is actually used", () => {
    expect(resolveGroqKey("gsk_user", "gsk_platform")).toEqual({ apiKey: "gsk_user", isByok: true });
  });

  it("falls back to platform key and charges quota", () => {
    expect(resolveGroqKey(undefined, "gsk_platform")).toEqual({ apiKey: "gsk_platform", isByok: false });
    expect(resolveGroqKey("   ", "gsk_platform")).toEqual({ apiKey: "gsk_platform", isByok: false });
  });

  it("rejects non-Groq keys instead of forwarding them to Groq", () => {
    expect(resolveGroqKey("AIzaSyGeminiKey", "gsk_platform")).toEqual({ apiKey: "gsk_platform", isByok: false });
  });

  it("returns undefined when nothing configured", () => {
    expect(resolveGroqKey(undefined, undefined)).toEqual({ apiKey: undefined, isByok: false });
  });
});
