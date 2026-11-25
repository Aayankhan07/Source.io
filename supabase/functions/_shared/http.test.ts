import { describe, it, expect, vi, afterEach } from "vitest";
import { fetchWithTimeout, isUpstreamTimeout, UpstreamTimeoutError } from "./http";

/** A fetch that never resolves until its signal aborts. */
function hangingFetch() {
  return vi.fn((_url: unknown, init?: RequestInit) =>
    new Promise<Response>((_resolve, reject) => {
      init?.signal?.addEventListener("abort", () => reject(init.signal!.reason ?? new Error("aborted")));
    })
  );
}

describe("fetchWithTimeout", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("passes a signal to fetch and returns the response", async () => {
    const fetchMock = vi.fn(async (_url: unknown, init?: RequestInit) => {
      expect(init?.signal).toBeDefined();
      expect(init?.method).toBe("POST");
      return new Response("ok", { status: 200 });
    });
    vi.stubGlobal("fetch", fetchMock);
    const r = await fetchWithTimeout("https://api.example.com/x", { method: "POST" }, 1000);
    expect(r.status).toBe(200);
    expect(fetchMock).toHaveBeenCalledOnce();
  });

  it("rejects with UpstreamTimeoutError when the upstream hangs", async () => {
    vi.stubGlobal("fetch", hangingFetch());
    const err = await fetchWithTimeout("https://api.example.com/slow", {}, 20).catch((e) => e);
    expect(err).toBeInstanceOf(UpstreamTimeoutError);
    expect(isUpstreamTimeout(err)).toBe(true);
    expect(String(err.message)).toContain("api.example.com/slow");
  });

  it("headersOnly mode times out the wait for headers", async () => {
    vi.stubGlobal("fetch", hangingFetch());
    const err = await fetchWithTimeout("https://api.example.com/stream", {}, 20, { headersOnly: true }).catch((e) => e);
    expect(isUpstreamTimeout(err)).toBe(true);
  });

  it("headersOnly mode stops the timer once headers arrive", async () => {
    let captured: AbortSignal | undefined;
    vi.stubGlobal(
      "fetch",
      vi.fn(async (_url: unknown, init?: RequestInit) => {
        captured = init?.signal ?? undefined;
        return new Response("streaming");
      }),
    );
    await fetchWithTimeout("https://api.example.com/stream", {}, 20, { headersOnly: true });
    await new Promise((r) => setTimeout(r, 50));
    expect(captured?.aborted).toBe(false);
  });

  it("propagates non-timeout errors unchanged", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => {
      throw new TypeError("dns failure");
    }));
    const err = await fetchWithTimeout("https://api.example.com/x", {}, 1000).catch((e) => e);
    expect(err).toBeInstanceOf(TypeError);
    expect(isUpstreamTimeout(err)).toBe(false);
  });

  it("still honours a caller abort signal", async () => {
    vi.stubGlobal("fetch", hangingFetch());
    const ctrl = new AbortController();
    const p = fetchWithTimeout("https://api.example.com/x", { signal: ctrl.signal }, 5000).catch((e) => e);
    ctrl.abort(new Error("client went away"));
    const err = await p;
    expect(isUpstreamTimeout(err)).toBe(false);
    expect(String(err?.message ?? err)).toContain("client went away");
  });
});
