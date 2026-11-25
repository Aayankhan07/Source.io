import { describe, it, expect, vi, afterEach } from "vitest";
import type { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2.57.4";
import { logAiUsage, captureProviderUsage, type UsageRecord } from "./telemetry";

type Insert = (row: Record<string, unknown>) => Promise<{ error: { message: string } | null }>;

function admin(insert: Insert) {
  const from = vi.fn(() => ({ insert: vi.fn(insert) }));
  return { client: { from } as unknown as SupabaseClient, from };
}

function recorder() {
  const rows: Record<string, unknown>[] = [];
  const a = admin(async (row) => {
    rows.push(row);
    return { error: null };
  });
  return { ...a, rows };
}

const base: UsageRecord = {
  userId: "u",
  documentId: "d",
  requestId: "r",
  feature: "notes",
  provider: "groq",
  model: "m",
  status: "succeeded",
};

afterEach(() => {
  vi.restoreAllMocks();
  vi.useRealTimers();
});

describe("logAiUsage", () => {
  it("writes defaults for missing numbers and truncates error messages", async () => {
    const { client, from, rows } = recorder();
    await logAiUsage(client, { ...base, errorMessage: "e".repeat(2000) });
    expect(from).toHaveBeenCalledWith("ai_usage_logs");
    expect(rows[0]).toMatchObject({
      user_id: "u",
      idempotency_key: null,
      input_tokens: 0,
      output_tokens: 0,
      cached_input_tokens: 0,
      estimated_cost_usd: 0,
      duration_ms: 0,
    });
    expect((rows[0].error_message as string).length).toBe(1000);
  });

  it("keeps provided values and a null error message", async () => {
    const { client, rows } = recorder();
    await logAiUsage(client, {
      ...base,
      idempotencyKey: "k",
      inputTokens: 3,
      outputTokens: 4,
      cachedInputTokens: 1,
      estimatedCostUsd: 0.5,
      durationMs: 9,
    });
    expect(rows[0]).toMatchObject({
      idempotency_key: "k",
      input_tokens: 3,
      output_tokens: 4,
      cached_input_tokens: 1,
      estimated_cost_usd: 0.5,
      duration_ms: 9,
      error_message: null,
    });
  });

  it("never throws on insert errors or exceptions", async () => {
    const err = vi.spyOn(console, "error").mockImplementation(() => {});
    await logAiUsage(admin(async () => ({ error: { message: "nope" } })).client, base);
    await logAiUsage(
      admin(async () => {
        throw new Error("boom");
      }).client,
      base,
    );
    expect(err).toHaveBeenCalledTimes(2);
  });
});

describe("captureProviderUsage", () => {
  it("skips responses without quota headers", async () => {
    const { client, from } = recorder();
    await captureProviderUsage(client, "groq", "m", new Headers());
    expect(from).not.toHaveBeenCalled();
  });

  it("parses limits and reset durations", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-01-01T00:00:00.000Z"));
    const { client, rows } = recorder();
    await captureProviderUsage(
      client,
      "groq",
      "m",
      new Headers({
        "x-ratelimit-remaining-requests": "10",
        "x-ratelimit-limit-requests": "100",
        "x-ratelimit-remaining-tokens": "500",
        "x-ratelimit-limit-tokens": "1000",
        "x-ratelimit-reset-requests": "1m30s",
        "x-ratelimit-reset-tokens": "0.5s",
      }),
      "byok",
    );
    expect(rows[0]).toMatchObject({
      provider: "groq",
      scope: "byok",
      remaining_requests: 10,
      request_limit: 100,
      remaining_tokens: 500,
      token_limit: 1000,
      reset_requests_at: "2026-01-01T00:01:30.000Z",
      reset_tokens_at: "2026-01-01T00:00:00.500Z",
      raw_reset_requests: "1m30s",
    });
  });

  it("handles bare-number, zero and missing resets", async () => {
    const { client, rows } = recorder();
    await captureProviderUsage(
      client,
      "openai",
      "m",
      new Headers({ "x-ratelimit-remaining-tokens": "5", "x-ratelimit-reset-requests": "7" }),
    );
    expect(rows[0]).toMatchObject({
      scope: "organization",
      remaining_requests: null,
      request_limit: null,
      token_limit: null,
      reset_tokens_at: null,
    });
    expect(typeof rows[0].reset_requests_at).toBe("string");

    await captureProviderUsage(
      client,
      "openai",
      "m",
      new Headers({ "x-ratelimit-limit-requests": "5", "x-ratelimit-reset-requests": "0s" }),
    );
    expect(rows[1].reset_requests_at).toBeNull();
  });

  it("never throws when the insert fails", async () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    const { client } = admin(async () => {
      throw new Error("boom");
    });
    await captureProviderUsage(client, "gemini", "m", new Headers({ "x-ratelimit-remaining-requests": "1" }));
    expect(warn).toHaveBeenCalled();
  });
});
