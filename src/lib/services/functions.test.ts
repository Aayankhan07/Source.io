import { describe, it, expect, vi } from "vitest";

vi.mock("@/integrations/supabase/client", () => ({ supabase: {}, SUPABASE_URL: "", SUPABASE_PUBLISHABLE_KEY: "" }));
import { functionError, isNotesIncompleteError } from "./functions";

const resp = (status: number, body: unknown) => new Response(JSON.stringify(body), { status });

describe("functionError", () => {
  it("prefers machine-readable codes", async () => {
    expect((await functionError(resp(429, { error: "x", code: "QUOTA_EXCEEDED" }), "f")).message).toMatch(/AI actions/);
    expect((await functionError(resp(503, { error: "x", code: "QUOTA_UNAVAILABLE" }), "f")).message).toMatch(/Nothing was charged/);
    expect((await functionError(resp(409, { error: "x", code: "ACTIVE_JOB_RUNNING" }), "f")).message).toMatch(/already running/);
    expect((await functionError(resp(504, { error: "x", code: "UPSTREAM_TIMEOUT" }), "f")).message).toMatch(/too long/);
  });
  it("treats 401 as an expired session, not a bad API key", async () => {
    expect((await functionError(resp(401, { error: "Unauthorized" }), "f")).message).toMatch(/session/);
  });
  it("falls back for unknown long errors", async () => {
    expect((await functionError(resp(500, { error: "x".repeat(200) }), "fallback")).message).toBe("fallback");
  });
});

describe("isNotesIncompleteError", () => {
  it("recognises the paused / partly generated notes failures", async () => {
    const mapped = await functionError(resp(500, { error: "x", code: "NOTES_INCOMPLETE" }), "f");
    expect(isNotesIncompleteError(mapped)).toBe(true);
    expect(isNotesIncompleteError(new Error("Paused after 5 of 8 sections to stay within the time limit."))).toBe(true);
    expect(isNotesIncompleteError(new Error("Notes generation paused. Press Generate again to continue."))).toBe(true);
  });
  it("ignores other failures", () => {
    expect(isNotesIncompleteError(new Error("Notes generation failed"))).toBe(false);
    expect(isNotesIncompleteError(null)).toBe(false);
  });
});
