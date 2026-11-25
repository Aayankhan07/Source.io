// LLM engine routing for notes / derivatives (roadmap task 2.13, §6.0).
// All three providers expose OpenAI-compatible chat completions, so an adapter is just a
// base URL plus model names. Keys are bound to their provider: a key is only ever sent to
// the endpoint of the provider it belongs to.
import type { ByokProvider, ProviderKey } from "./byok.ts";
import { fetchWithTimeout, isUpstreamTimeout } from "./http.ts";

/** Sources longer than this prefer Gemini (large context, higher per-minute limits). */
export const LONG_SOURCE_CHARS = 20_000;

export const PROVIDER_ENDPOINTS: Record<ByokProvider, string> = {
  groq: "https://api.groq.com/openai/v1/chat/completions",
  gemini: "https://generativelanguage.googleapis.com/v1beta/openai/chat/completions",
  openai: "https://api.openai.com/v1/chat/completions",
};

/** Endpoints used to validate a key cheaply (lists models, costs no tokens). */
export const PROVIDER_MODELS_URL: Record<ByokProvider, string> = {
  groq: "https://api.groq.com/openai/v1/models",
  gemini: "https://generativelanguage.googleapis.com/v1beta/openai/models",
  openai: "https://api.openai.com/v1/models",
};

export type EngineTask = "notes" | "derivatives" | "overview";

/** Models per provider, best first. Later models are fallbacks inside the same provider. */
export const PROVIDER_MODELS: Record<ByokProvider, Record<EngineTask, string[]>> = {
  groq: {
    notes: ["openai/gpt-oss-120b", "openai/gpt-oss-20b", "llama-3.1-8b-instant"],
    derivatives: ["openai/gpt-oss-20b", "openai/gpt-oss-120b", "llama-3.1-8b-instant"],
    overview: ["openai/gpt-oss-20b", "llama-3.1-8b-instant"],
  },
  gemini: {
    notes: ["gemini-2.5-flash-lite"],
    derivatives: ["gemini-2.5-flash-lite"],
    overview: ["gemini-2.5-flash-lite"],
  },
  openai: {
    notes: ["gpt-4o-mini"],
    derivatives: ["gpt-4o-mini"],
    overview: ["gpt-4o-mini"],
  },
};

/**
 * Primary provider for a source of `sourceChars` characters given the available keys.
 * Long sources (> 20k chars) go to Gemini when a Gemini key is available; short ones stay
 * on Groq. Falls back to whatever provider is available.
 */
export function choosePrimaryProvider(
  sourceChars: number,
  available: ByokProvider[],
): ByokProvider | null {
  const has = (p: ByokProvider) => available.includes(p);
  if (sourceChars > LONG_SOURCE_CHARS && has("gemini")) return "gemini";
  if (has("groq")) return "groq";
  if (has("gemini")) return "gemini";
  if (has("openai")) return "openai";
  return null;
}

export interface Attempt {
  provider: ByokProvider;
  model: string;
}

/**
 * Order of (provider, model) attempts for one call: the primary provider's best model, then
 * the other providers' best models (so a 429 switches provider for that section), then the
 * remaining same-provider fallback models.
 */
export function buildAttemptPlan(
  primary: ByokProvider,
  available: ByokProvider[],
  task: EngineTask,
): Attempt[] {
  const order: ByokProvider[] = [primary, ...available.filter((p) => p !== primary)];
  const plan: Attempt[] = [];
  for (const p of order) plan.push({ provider: p, model: PROVIDER_MODELS[p][task][0] });
  for (const p of order) {
    for (const m of PROVIDER_MODELS[p][task].slice(1)) plan.push({ provider: p, model: m });
  }
  return plan;
}

/**
 * Parses retry-after (seconds or HTTP date) or Groq's x-ratelimit-reset-* ("1m2.5s", "450ms").
 * Returns milliseconds, or null when absent.
 */
export function parseRetryAfterMs(headers: Headers, now: number = Date.now()): number | null {
  const ra = headers.get("retry-after");
  if (ra) {
    const secs = Number(ra);
    if (Number.isFinite(secs)) return Math.max(0, Math.round(secs * 1000));
    const at = Date.parse(ra);
    if (Number.isFinite(at)) return Math.max(0, at - now);
  }
  const reset = headers.get("x-ratelimit-reset-tokens") || headers.get("x-ratelimit-reset-requests");
  if (reset) {
    const m = reset.match(/^(?:(\d+(?:\.\d+)?)m(?!s))?(?:(\d+(?:\.\d+)?)s)?(?:(\d+(?:\.\d+)?)ms)?$/);
    if (m && (m[1] || m[2] || m[3])) {
      return Math.round((Number(m[1] ?? 0) * 60 + Number(m[2] ?? 0)) * 1000 + Number(m[3] ?? 0));
    }
  }
  return null;
}

export type ChatMessage = { role: "system" | "user" | "assistant"; content: string };

export interface ChatRequest {
  messages: ChatMessage[];
  maxTokens: number;
  /** Optional per-provider override of maxTokens (Groq's free tier counts max_tokens against TPM). */
  maxTokensByProvider?: Partial<Record<ByokProvider, number>>;
  temperature: number;
  json?: boolean;
  stream?: boolean;
}

/** Builds the provider-specific request body. Gemini's compat layer gets no response_format. */
export function buildChatBody(provider: ByokProvider, model: string, req: ChatRequest): Record<string, unknown> {
  const body: Record<string, unknown> = {
    model,
    messages: req.messages,
    temperature: req.temperature,
    max_tokens: req.maxTokensByProvider?.[provider] ?? req.maxTokens,
  };
  if (req.stream) body.stream = true;
  if (req.json && provider !== "gemini") body.response_format = { type: "json_object" };
  return body;
}

/** Thrown when a user's own key is rejected (401/403). Never retried with another key. */
export class UserKeyRejectedError extends Error {
  readonly code = "BYOK_KEY_INVALID";
  constructor(readonly provider: ByokProvider, readonly status: number) {
    super(`Your saved ${provider} API key was rejected (invalid API key or no access). Update it in Settings.`);
    this.name = "UserKeyRejectedError";
  }
}

/** Every attempt failed. `rateLimited` is true when the last failures were 429s. */
export class AllProvidersFailedError extends Error {
  readonly code = "UPSTREAM_UNAVAILABLE";
  constructor(message: string, readonly rateLimited: boolean, readonly lastStatus: number) {
    super(message);
    this.name = "AllProvidersFailedError";
  }
}

export interface EngineOptions {
  keys: Partial<Record<ByokProvider, ProviderKey>>;
  primary: ByokProvider;
  task: EngineTask;
  /** Per-attempt timeout (whole response, or headers only when streaming). */
  timeoutMs: number;
  /** Longest single wait for a retry-after before the second round (default 20s). */
  maxRetryWaitMs?: number;
  /** Called on each upstream response (for provider usage telemetry). */
  onResponse?: (attempt: Attempt, resp: Response) => void;
  onWarn?: (msg: string, extra: Record<string, unknown>) => void;
  /** Injectable for tests. */
  sleep?: (ms: number) => Promise<void>;
  fetchImpl?: typeof fetchWithTimeout;
}

export interface EngineSuccess {
  attempt: Attempt;
  response: Response;
  userOwned: boolean;
}

const defaultSleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

/**
 * Sends one chat completion, walking the attempt plan. 429 / 5xx / timeouts move on to the
 * next attempt (the other provider first). When every attempt was rate-limited, waits for the
 * shortest retry-after (capped) and runs the plan once more. A 401/403 on a user's own key
 * throws UserKeyRejectedError immediately. Returns the first OK response (body unread).
 */
export async function sendChat(req: ChatRequest, opts: EngineOptions): Promise<EngineSuccess> {
  const available = (Object.keys(opts.keys) as ByokProvider[]).filter((p) => opts.keys[p]);
  if (!available.includes(opts.primary)) throw new Error(`primary provider ${opts.primary} has no key`);
  const plan = buildAttemptPlan(opts.primary, available, opts.task);
  const sleep = opts.sleep ?? defaultSleep;
  const doFetch = opts.fetchImpl ?? fetchWithTimeout;
  const maxWait = opts.maxRetryWaitMs ?? 20_000;

  let lastStatus = 0;
  let lastDetail = "";
  for (let round = 0; round < 2; round++) {
    let allRateLimited = true;
    let minRetryMs: number | null = null;
    for (const attempt of plan) {
      const pk = opts.keys[attempt.provider]!;
      let resp: Response;
      try {
        resp = await doFetch(
          PROVIDER_ENDPOINTS[attempt.provider],
          {
            method: "POST",
            headers: { Authorization: `Bearer ${pk.apiKey}`, "Content-Type": "application/json" },
            body: JSON.stringify(buildChatBody(attempt.provider, attempt.model, req)),
          },
          opts.timeoutMs,
          { headersOnly: !!req.stream },
        );
      } catch (e) {
        if (!isUpstreamTimeout(e)) throw e;
        opts.onWarn?.("upstream timeout", { ...attempt });
        allRateLimited = false;
        lastStatus = 504;
        lastDetail = "UPSTREAM_TIMEOUT";
        continue;
      }
      opts.onResponse?.(attempt, resp);
      if (resp.ok && resp.body) return { attempt, response: resp, userOwned: pk.userOwned };

      lastStatus = resp.status;
      lastDetail = (await resp.text().catch(() => "")).slice(0, 300);
      if ((resp.status === 401 || resp.status === 403) && pk.userOwned) {
        throw new UserKeyRejectedError(attempt.provider, resp.status);
      }
      if (resp.status === 429) {
        const wait = parseRetryAfterMs(resp.headers);
        if (wait !== null) minRetryMs = minRetryMs === null ? wait : Math.min(minRetryMs, wait);
      } else {
        allRateLimited = false;
      }
      opts.onWarn?.("upstream attempt failed", { ...attempt, status: resp.status, detail: lastDetail });
    }
    if (round === 0 && allRateLimited) {
      await sleep(Math.min(maxWait, Math.max(1000, minRetryMs ?? 5000)));
      continue;
    }
    break;
  }
  throw new AllProvidersFailedError(
    `All AI providers failed (last status ${lastStatus}): ${lastDetail}`,
    lastStatus === 429,
    lastStatus,
  );
}

/**
 * Reads an OpenAI-style SSE body and calls onDelta for each content token.
 * Returns the full text. Throws on a broken stream.
 */
export async function readChatStream(
  body: ReadableStream<Uint8Array>,
  onDelta: (text: string) => void,
): Promise<string> {
  const reader = body.getReader();
  const decoder = new TextDecoder();
  let buf = "";
  let full = "";
  const handle = (raw: string): boolean => {
    const line = raw.endsWith("\r") ? raw.slice(0, -1) : raw;
    if (!line.startsWith("data:")) return false;
    const payload = line.slice(5).trim();
    if (payload === "[DONE]") return true;
    const parsed = JSON.parse(payload);
    const delta = parsed?.choices?.[0]?.delta?.content;
    if (typeof delta === "string" && delta) {
      full += delta;
      onDelta(delta);
    }
    return false;
  };
  outer: while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buf += decoder.decode(value, { stream: true });
    let idx: number;
    while ((idx = buf.indexOf("\n")) !== -1) {
      const line = buf.slice(0, idx);
      buf = buf.slice(idx + 1);
      try {
        if (handle(line)) break outer;
      } catch (e) {
        // Lines are only handled once complete (newline seen), so bad JSON here is a
        // malformed event (keep-alive noise etc.): skip it.
        if (!(e instanceof SyntaxError)) throw e;
      }
    }
  }
  if (buf.trim()) {
    try { handle(buf.trim()); } catch { /* trailing partial payload */ }
  }
  try { await reader.cancel(); } catch { /* already closed */ }
  return full;
}
