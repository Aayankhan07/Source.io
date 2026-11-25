import { describe, it, expect, vi } from "vitest";
import {
  AllProvidersFailedError,
  buildAttemptPlan,
  buildChatBody,
  choosePrimaryProvider,
  parseRetryAfterMs,
  PROVIDER_ENDPOINTS,
  readChatStream,
  sendChat,
  UserKeyRejectedError,
} from "./engine";
import type { ProviderKey } from "./byok";

const key = (provider: "groq" | "gemini" | "openai", userOwned = false): ProviderKey => ({
  provider,
  apiKey: `${provider}-key`,
  userOwned,
});

const ok = () => new Response('data: {"choices":[{"delta":{"content":"hi"}}]}\n\ndata: [DONE]\n\n', { status: 200 });
const status = (s: number, headers: Record<string, string> = {}) => new Response("{}", { status: s, headers });

describe("choosePrimaryProvider (engine routing)", () => {
  it("routes long sources to Gemini when a Gemini key exists", () => {
    expect(choosePrimaryProvider(20_001, ["groq", "gemini"])).toBe("gemini");
  });
  it("keeps short sources on Groq", () => {
    expect(choosePrimaryProvider(20_000, ["groq", "gemini"])).toBe("groq");
    expect(choosePrimaryProvider(5_000, ["groq", "gemini"])).toBe("groq");
  });
  it("uses Groq for long sources when Gemini is not configured", () => {
    expect(choosePrimaryProvider(150_000, ["groq"])).toBe("groq");
  });
  it("uses whatever the user has", () => {
    expect(choosePrimaryProvider(1_000, ["gemini"])).toBe("gemini");
    expect(choosePrimaryProvider(1_000, ["openai"])).toBe("openai");
    expect(choosePrimaryProvider(1_000, [])).toBeNull();
  });
});

describe("buildAttemptPlan", () => {
  it("switches provider before trying weaker same-provider models", () => {
    const plan = buildAttemptPlan("gemini", ["groq", "gemini"], "notes");
    expect(plan[0]).toEqual({ provider: "gemini", model: "gemini-2.5-flash-lite" });
    expect(plan[1]).toEqual({ provider: "groq", model: "openai/gpt-oss-120b" });
    expect(plan.slice(2).every((a) => a.provider === "groq")).toBe(true);
  });
});

describe("parseRetryAfterMs", () => {
  it("parses seconds, dates and Groq reset formats", () => {
    expect(parseRetryAfterMs(new Headers({ "retry-after": "7" }))).toBe(7000);
    const now = Date.parse("2026-11-26T00:00:00Z");
    expect(parseRetryAfterMs(new Headers({ "retry-after": "Thu, 26 Nov 2026 00:00:03 GMT" }), now)).toBe(3000);
    expect(parseRetryAfterMs(new Headers({ "x-ratelimit-reset-tokens": "1m2.5s" }))).toBe(62_500);
    expect(parseRetryAfterMs(new Headers({ "x-ratelimit-reset-requests": "450ms" }))).toBe(450);
    expect(parseRetryAfterMs(new Headers())).toBeNull();
  });
});

describe("buildChatBody", () => {
  it("omits response_format for Gemini and applies per-provider max tokens", () => {
    const req = { messages: [], maxTokens: 6000, maxTokensByProvider: { groq: 3500 }, temperature: 0.3, json: true };
    expect(buildChatBody("groq", "m", req)).toMatchObject({ max_tokens: 3500, response_format: { type: "json_object" } });
    const g = buildChatBody("gemini", "m", req);
    expect(g.max_tokens).toBe(6000);
    expect(g.response_format).toBeUndefined();
  });
});

describe("sendChat", () => {
  const base = { primary: "groq" as const, task: "notes" as const, timeoutMs: 1000, sleep: async () => {} };

  it("falls back to the other provider on 429 and never sends a key to another provider", async () => {
    const calls: Array<[string, string]> = [];
    const fetchImpl = vi.fn(async (url: string | URL, init: RequestInit = {}) => {
      const auth = (init.headers as Record<string, string>).Authorization;
      calls.push([String(url), auth]);
      return String(url) === PROVIDER_ENDPOINTS.groq ? status(429, { "retry-after": "2" }) : ok();
    });
    const res = await sendChat(
      { messages: [], maxTokens: 10, temperature: 0, stream: true },
      { ...base, keys: { groq: key("groq"), gemini: key("gemini") }, fetchImpl: fetchImpl as never },
    );
    expect(res.attempt.provider).toBe("gemini");
    for (const [url, auth] of calls) {
      const provider = url === PROVIDER_ENDPOINTS.groq ? "groq" : "gemini";
      expect(auth).toBe(`Bearer ${provider}-key`);
    }
  });

  it("waits for retry-after once when every provider is rate limited", async () => {
    let n = 0;
    const sleep = vi.fn(async () => {});
    const fetchImpl = vi.fn(async () => (n++ < 4 ? status(429, { "retry-after": "3" }) : ok()));
    const res = await sendChat(
      { messages: [], maxTokens: 10, temperature: 0 },
      { ...base, sleep, keys: { groq: key("groq") }, fetchImpl: fetchImpl as never },
    );
    expect(sleep).toHaveBeenCalledWith(3000);
    expect(res.response.ok).toBe(true);
  });

  it("throws AllProvidersFailedError(rateLimited) when 429 persists", async () => {
    const fetchImpl = vi.fn(async () => status(429));
    await expect(
      sendChat({ messages: [], maxTokens: 10, temperature: 0 }, { ...base, keys: { groq: key("groq") }, fetchImpl: fetchImpl as never }),
    ).rejects.toMatchObject({ name: "AllProvidersFailedError", rateLimited: true });
  });

  it("stops immediately when the user's own key is rejected", async () => {
    const fetchImpl = vi.fn(async () => status(401));
    await expect(
      sendChat(
        { messages: [], maxTokens: 10, temperature: 0 },
        { ...base, keys: { groq: key("groq", true), gemini: key("gemini", true) }, fetchImpl: fetchImpl as never },
      ),
    ).rejects.toBeInstanceOf(UserKeyRejectedError);
    expect(fetchImpl).toHaveBeenCalledTimes(1);
  });

  it("moves past a platform-key 500", async () => {
    let n = 0;
    const fetchImpl = vi.fn(async () => (n++ === 0 ? status(500) : ok()));
    const res = await sendChat(
      { messages: [], maxTokens: 10, temperature: 0 },
      { ...base, keys: { groq: key("groq") }, fetchImpl: fetchImpl as never },
    );
    expect(res.attempt.model).toBe("openai/gpt-oss-20b");
    expect(AllProvidersFailedError).toBeDefined();
  });
});

describe("readChatStream", () => {
  it("collects deltas across split reads and skips malformed lines", async () => {
    const enc = new TextEncoder();
    const chunks = [
      'data: {"choices":[{"delta":{"content":"Hel',
      'lo"}}]}\r\n\r\ndata: not-json\n\n',
      'data: {"choices":[{"delta":{"content":" world"}}]}\n\ndata: [DONE]\n\n',
    ];
    const body = new ReadableStream<Uint8Array>({
      start(c) {
        for (const ch of chunks) c.enqueue(enc.encode(ch));
        c.close();
      },
    });
    const seen: string[] = [];
    const full = await readChatStream(body, (d) => seen.push(d));
    expect(full).toBe("Hello world");
    expect(seen).toEqual(["Hello", " world"]);
  });
});
