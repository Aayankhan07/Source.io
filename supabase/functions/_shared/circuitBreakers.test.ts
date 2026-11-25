import { describe, it, expect, vi } from "vitest";
import type { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2.57.4";
import { checkCircuitBreaker } from "./circuitBreakers";

function admin(result: { data?: unknown } | Error) {
  const b: Record<string, unknown> = {};
  for (const m of ["from", "select", "eq"]) b[m] = vi.fn(() => b);
  b.maybeSingle = vi.fn(async () => {
    if (result instanceof Error) throw result;
    return { data: result.data ?? null, error: null };
  });
  return b as unknown as SupabaseClient;
}

describe("checkCircuitBreaker", () => {
  it("allows when the breaker row is missing or enabled", async () => {
    expect(await checkCircuitBreaker(admin({ data: null }), "ai_requests_enabled")).toEqual({ allowed: true });
    expect(await checkCircuitBreaker(admin({ data: { enabled: true } }), "uploads_enabled")).toEqual({ allowed: true });
  });

  it("blocks with a feature-specific message when disabled", async () => {
    const off = { data: { enabled: false } };
    const podcasts = await checkCircuitBreaker(admin(off), "podcasts_enabled");
    expect(podcasts.allowed).toBe(false);
    expect(podcasts.message).toMatch(/Podcast generation/);
    expect((await checkCircuitBreaker(admin(off), "uploads_enabled")).message).toMatch(/uploads/);
    expect((await checkCircuitBreaker(admin(off), "ai_requests_enabled")).message).toMatch(/AI processing/);
  });

  it("fails open on unexpected database errors", async () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    expect(await checkCircuitBreaker(admin(new Error("db down")), "ai_requests_enabled")).toEqual({ allowed: true });
    expect(warn).toHaveBeenCalled();
    warn.mockRestore();
  });
});
