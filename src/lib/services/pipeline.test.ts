import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

const { callFunction } = vi.hoisted(() => ({ callFunction: vi.fn() }));
vi.mock("@/lib/services/functions", async () => {
  const actual = await vi.importActual<typeof import("./functions")>("./functions");
  return { ...actual, callFunction };
});
vi.mock("@/integrations/supabase/client", () => ({ supabase: {}, SUPABASE_URL: "", SUPABASE_PUBLISHABLE_KEY: "" }));

import { triggerIngest, embedChunks, streamChat, generateDerivatives, streamNotes } from "./pipeline";

const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status });
const enc = new TextEncoder();

/** An SSE response whose body arrives in the given raw pieces (may split lines / payloads). */
function sse(pieces: string[], headers: Record<string, string> = {}) {
  const body = new ReadableStream<Uint8Array>({
    start(c) {
      for (const p of pieces) c.enqueue(enc.encode(p));
      c.close();
    },
  });
  return new Response(body, { status: 200, headers });
}
const delta = (content: string) => `data: ${JSON.stringify({ choices: [{ delta: { content } }] })}\n`;
const event = (name: string, data: unknown) => `event: ${name}\ndata: ${JSON.stringify(data)}\n\n`;

beforeEach(() => {
  callFunction.mockReset();
  // Retry / resume back-off waits resolve immediately.
  vi.stubGlobal("setTimeout", (fn: () => void) => {
    fn();
    return 0;
  });
});
afterEach(() => vi.unstubAllGlobals());

describe("triggerIngest", () => {
  it("resolves on success and throws a friendly error on failure", async () => {
    callFunction.mockResolvedValueOnce(json({ ok: true }));
    await expect(triggerIngest("d")).resolves.toBeUndefined();
    callFunction.mockResolvedValueOnce(json({ error: "x", code: "DOCUMENT_TOO_LONG" }, 413));
    await expect(triggerIngest("d")).rejects.toThrow("x");
  });
});

describe("embedChunks", () => {
  it("returns cached results immediately", async () => {
    callFunction.mockResolvedValueOnce(json({ cached: true, chunks: 7 }));
    expect(await embedChunks("d")).toEqual({ ok: true, chunks: 7, cached: true });
    callFunction.mockResolvedValueOnce(json({ cached: true }));
    expect(await embedChunks("d")).toEqual({ ok: true, chunks: 0, cached: true });
  });

  it("walks batches until all chunks are embedded", async () => {
    callFunction
      .mockResolvedValueOnce(json({ total_chunks: 120 }))
      .mockResolvedValueOnce(json({ total_chunks: 120 }))
      .mockResolvedValueOnce(json({ total_chunks: 120, completed: true }));
    expect(await embedChunks("d")).toEqual({ ok: true, chunks: 120 });
    expect(callFunction.mock.calls.map((c) => c[1].batch_index)).toEqual([0, 1, 2]);
  });

  it("stops for empty documents and surfaces batch failures", async () => {
    callFunction.mockResolvedValueOnce(json({}));
    expect(await embedChunks("d")).toEqual({ ok: true, chunks: 0 });
    callFunction.mockResolvedValueOnce(json({ error: "boom" }, 500));
    await expect(embedChunks("d")).rejects.toThrow("boom");
  });
});

describe("streamChat", () => {
  it("emits citations then deltas, tolerating CRLF, comments and split payloads", async () => {
    const d = delta("Hello ");
    callFunction.mockResolvedValueOnce(
      sse([
        ": keep-alive\r\n",
        event("citations", { citations: [{ n: 1, order_index: 0, similarity: 0.9, text: "t" }] }),
        d.slice(0, 15),
        d.slice(15),
        "id: 1\n",
        delta("world").replace("\n", "\r\n"),
        `data: ${JSON.stringify({ choices: [] })}\n`,
        "data: [DONE]\n",
        delta("ignored"),
      ]),
    );
    const cites = vi.fn();
    const chunks: string[] = [];
    const full = await streamChat({ documentId: "d", message: "q", onCitations: cites, onDelta: (c) => chunks.push(c) });
    expect(full).toBe("Hello world");
    expect(chunks).toEqual(["Hello ", "world"]);
    expect(cites).toHaveBeenCalledWith([{ n: 1, order_index: 0, similarity: 0.9, text: "t" }]);
  });

  it("flushes a trailing line without a newline and drops a truncated one", async () => {
    callFunction.mockResolvedValueOnce(sse([delta("a"), delta("b").trimEnd()]));
    expect(await streamChat({ documentId: "d", message: "q", onCitations: vi.fn(), onDelta: vi.fn() })).toBe("ab");
    callFunction.mockResolvedValueOnce(sse([delta("a"), 'data: {"choices":']));
    expect(await streamChat({ documentId: "d", message: "q", onCitations: vi.fn(), onDelta: vi.fn() })).toBe("a");
    callFunction.mockResolvedValueOnce(sse([delta("a"), "data: [DONE]"]));
    expect(await streamChat({ documentId: "d", message: "q", onCitations: vi.fn(), onDelta: vi.fn() })).toBe("a");
  });

  it("propagates errors thrown by handlers", async () => {
    callFunction.mockResolvedValueOnce(sse([delta("a")]));
    const onDelta = () => {
      throw new Error("handler failed");
    };
    await expect(streamChat({ documentId: "d", message: "q", onCitations: vi.fn(), onDelta })).rejects.toThrow("handler failed");
    callFunction.mockResolvedValueOnce(sse([delta("a").trimEnd()]));
    await expect(streamChat({ documentId: "d", message: "q", onCitations: vi.fn(), onDelta })).rejects.toThrow("handler failed");
  });

  it("throws on failed responses", async () => {
    callFunction.mockResolvedValueOnce(json({ error: "x", code: "DOCUMENT_INDEXING" }, 409));
    await expect(streamChat({ documentId: "d", message: "q", onCitations: vi.fn(), onDelta: vi.fn() })).rejects.toThrow(
      /still being indexed/,
    );
  });
});

describe("generateDerivatives", () => {
  it("retries on 429/409 then returns counts", async () => {
    callFunction
      .mockResolvedValueOnce(json({}, 429))
      .mockResolvedValueOnce(json({ flashcards_count: 10, questions_count: 5, quiz_id: "q" }));
    expect(await generateDerivatives("d", { flashcardCount: 10, idempotencyKey: "k" })).toEqual({
      flashcards_count: 10,
      questions_count: 5,
      quiz_id: "q",
    });
    expect(callFunction.mock.calls[0][1]).toMatchObject({ idempotency_key: "k", flashcard_count: 10 });
  });

  it("explains a persistent lock and other failures", async () => {
    callFunction.mockResolvedValue(json({}, 409));
    await expect(generateDerivatives("d")).rejects.toThrow(/currently in progress/);
    expect(callFunction).toHaveBeenCalledTimes(4);
    callFunction.mockReset();
    callFunction.mockResolvedValueOnce(json({ error: "bad" }, 500));
    await expect(generateDerivatives("d")).rejects.toThrow("bad");
  });
});

describe("streamNotes", () => {
  it("streams deltas with progress and prefers the final markdown", async () => {
    callFunction.mockResolvedValueOnce(
      sse([
        event("progress", { section: 1, total: 2, cached: true }),
        delta("A"),
        event("custom", { x: 1 }),
        event("final", { markdown: "# Full" }),
      ]),
    );
    const progress = vi.fn();
    const onResponse = vi.fn(() => {
      throw new Error("ignored");
    });
    const out = await streamNotes({ documentId: "d", onDelta: vi.fn(), onProgress: progress, onResponse, force: true });
    expect(out).toBe("# Full");
    expect(progress).toHaveBeenCalledWith({ section: 1, total: 2, cached: true });
    expect(callFunction.mock.calls[0][1]).toMatchObject({ force_regenerate: true });
  });

  it("returns streamed text when no final event arrives", async () => {
    callFunction.mockResolvedValueOnce(sse([delta("x"), delta("y")]));
    expect(await streamNotes({ documentId: "d", onDelta: vi.fn() })).toBe("xy");
  });

  it("resumes after a pause without re-sending delivered sections", async () => {
    callFunction
      .mockResolvedValueOnce(
        sse([event("progress", { section: 1, total: 2 }), delta("one"), event("incomplete", { error: "paused" })]),
      )
      .mockResolvedValueOnce(
        sse([
          event("progress", { section: 1, total: 2, cached: true }),
          delta("one"),
          event("progress", { section: 2, total: 2 }),
          delta("two"),
        ]),
      );
    const chunks: string[] = [];
    expect(await streamNotes({ documentId: "d", onDelta: (c) => chunks.push(c), force: true })).toBe("onetwo");
    expect(chunks).toEqual(["one", "two"]);
    expect(callFunction.mock.calls[1][1].force_regenerate).toBe(false);
  });

  it("treats a cache hit on resume as the complete note", async () => {
    callFunction
      .mockResolvedValueOnce(sse([delta("part"), event("incomplete", {})]))
      .mockResolvedValueOnce(sse([delta("whole note")], { "X-Cache": "HIT" }));
    expect(await streamNotes({ documentId: "d", onDelta: vi.fn() })).toBe("whole note");
  });

  it("throws on stream errors and after too many pauses", async () => {
    callFunction.mockResolvedValueOnce(sse([event("error", { error: "model failed" })]));
    await expect(streamNotes({ documentId: "d", onDelta: vi.fn() })).rejects.toThrow("model failed");
    callFunction.mockResolvedValueOnce(sse([event("error", {})]));
    await expect(streamNotes({ documentId: "d", onDelta: vi.fn() })).rejects.toThrow("Notes generation failed");

    callFunction.mockReset();
    callFunction.mockImplementation(async () => sse([event("incomplete", {})]));
    await expect(streamNotes({ documentId: "d", onDelta: vi.fn() })).rejects.toThrow(/paused/);
    expect(callFunction).toHaveBeenCalledTimes(13);
  });

  it("maps request failures", async () => {
    callFunction.mockResolvedValue(json({ error: "slow down" }, 429));
    await expect(streamNotes({ documentId: "d", onDelta: vi.fn() })).rejects.toThrow(/Too many requests/);
    expect(callFunction).toHaveBeenCalledTimes(5);

    callFunction.mockReset();
    callFunction.mockResolvedValue(json({}, 409));
    await expect(streamNotes({ documentId: "d", onDelta: vi.fn() })).rejects.toThrow(/already in progress/);

    callFunction.mockReset();
    callFunction.mockResolvedValueOnce(json({ error: "bad" }, 500));
    await expect(streamNotes({ documentId: "d", onDelta: vi.fn() })).rejects.toThrow("bad");
  });
});
