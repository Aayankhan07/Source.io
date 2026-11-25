// Upstream HTTP helpers. Every call to Groq, YouTube, TTS or any other third party must
// go through fetchWithTimeout so a hung provider cannot pin an edge worker until the
// platform wall-clock limit kills it.

/** Per-upstream timeouts in milliseconds. */
export const UPSTREAM_TIMEOUTS = {
  /** Groq chat completion, non-streaming (whole response). */
  groqChat: 60_000,
  /** Groq chat completion, streaming: time allowed until response headers arrive. */
  groqStreamStart: 60_000,
  /** Groq Whisper transcription (uploads up to 25 MB). */
  whisper: 120_000,
  /** YouTube timed-text endpoints. */
  youtube: 15_000,
  /** Google Translate TTS fallback, per chunk. */
  tts: 15_000,
} as const;

/** Thrown when an upstream call exceeds its timeout. `code` is stable for callers/tests. */
export class UpstreamTimeoutError extends Error {
  readonly code = "UPSTREAM_TIMEOUT";
  constructor(readonly target: string, readonly timeoutMs: number) {
    super(`UPSTREAM_TIMEOUT: ${target} did not respond within ${timeoutMs}ms`);
    this.name = "UpstreamTimeoutError";
  }
}

export interface FetchTimeoutOptions {
  /**
   * Only time the wait for response headers, then stop the timer. Use for streamed bodies
   * (SSE) where the body may legitimately keep flowing for longer than `ms`.
   */
  headersOnly?: boolean;
}

function targetOf(url: string | URL): string {
  try {
    const u = new URL(String(url));
    return `${u.host}${u.pathname}`;
  } catch {
    return String(url).slice(0, 80);
  }
}

function isTimeoutAbort(err: unknown, signal: AbortSignal): boolean {
  if (err instanceof UpstreamTimeoutError) return true;
  const name = (err as { name?: string } | null)?.name;
  if (name === "TimeoutError") return true;
  return signal.aborted && signal.reason instanceof UpstreamTimeoutError;
}

/**
 * fetch() with a hard timeout built on AbortSignal.timeout. A caller-provided `init.signal`
 * is still honoured (both signals are combined). Timeouts reject with UpstreamTimeoutError.
 */
export async function fetchWithTimeout(
  url: string | URL,
  init: RequestInit = {},
  ms: number,
  options: FetchTimeoutOptions = {},
): Promise<Response> {
  const target = targetOf(url);

  if (options.headersOnly) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(new UpstreamTimeoutError(target, ms)), ms);
    const signal = init.signal ? AbortSignal.any([init.signal, controller.signal]) : controller.signal;
    try {
      return await fetch(url, { ...init, signal });
    } catch (err) {
      if (isTimeoutAbort(err, controller.signal)) throw new UpstreamTimeoutError(target, ms);
      throw err;
    } finally {
      clearTimeout(timer);
    }
  }

  const timeoutSignal = AbortSignal.timeout(ms);
  const signal = init.signal ? AbortSignal.any([init.signal, timeoutSignal]) : timeoutSignal;
  try {
    return await fetch(url, { ...init, signal });
  } catch (err) {
    if (isTimeoutAbort(err, timeoutSignal)) throw new UpstreamTimeoutError(target, ms);
    throw err;
  }
}

export function isUpstreamTimeout(err: unknown): err is UpstreamTimeoutError {
  return err instanceof UpstreamTimeoutError ||
    (err as { code?: string } | null)?.code === "UPSTREAM_TIMEOUT";
}
