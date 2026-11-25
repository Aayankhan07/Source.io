import { describe, it, expect, vi, beforeEach, afterAll } from "vitest";
import type { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2.57.4";

// embeddings.ts runs gte-small through the edge runtime's global `Supabase.ai.Session`.
// Stub that global so the batching / resume / prune logic can run under Vitest.
const run = vi.fn(async (_text: string, _opts?: unknown): Promise<unknown> => new Array(384).fill(0.1));
vi.stubGlobal("Supabase", {
  ai: {
    Session: class {
      run = run;
    },
  },
});
afterAll(() => vi.unstubAllGlobals());

const {
  embedText,
  upsertChunkEmbeddings,
  pruneExtraChunks,
  embeddedOrderIndexes,
  indexDocument,
  EMBED_DIMS,
  UPSERT_BATCH,
} = await import("./embeddings");

type Res = { data?: unknown; error?: { message: string } | null };

/** PostgREST-like fake: each awaited query (or upsert) consumes the next scripted result. */
function fakeAdmin(results: Res[]) {
  const ops: Array<{ op: string; payload?: unknown }> = [];
  const next = async () => {
    const r = results.shift() ?? {};
    return { data: r.data ?? null, error: r.error ?? null };
  };
  const b: Record<string, unknown> = {};
  for (const m of ["select", "eq", "gte", "not", "limit"]) b[m] = () => b;
  b.delete = () => {
    ops.push({ op: "delete" });
    return b;
  };
  b.upsert = (payload: unknown) => {
    ops.push({ op: "upsert", payload });
    return next();
  };
  b.then = (res: (v: unknown) => unknown, rej: (e: unknown) => unknown) => next().then(res, rej);
  return { admin: { from: () => b } as unknown as SupabaseClient, ops };
}

beforeEach(() => run.mockClear());

describe("embedText", () => {
  it("returns a 384-dim vector and truncates long input", async () => {
    const vec = await embedText("x".repeat(5000));
    expect(vec).toHaveLength(EMBED_DIMS);
    expect(run.mock.calls[0][0]).toHaveLength(2000);
  });

  it("accepts typed arrays and rejects malformed output", async () => {
    run.mockResolvedValueOnce(new Float32Array(384));
    expect(await embedText("a")).toHaveLength(384);
    run.mockResolvedValueOnce([1, 2]);
    await expect(embedText("a")).rejects.toThrow(/EMBEDDING_INVALID/);
    run.mockResolvedValueOnce(null);
    await expect(embedText("a")).rejects.toThrow(/EMBEDDING_INVALID/);
    run.mockResolvedValueOnce(new Array(384).fill(Number.NaN));
    await expect(embedText("a")).rejects.toThrow(/EMBEDDING_INVALID/);
  });
});

describe("chunk storage helpers", () => {
  it("upserts in batches and surfaces errors", async () => {
    const chunks = Array.from({ length: UPSERT_BATCH + 1 }, (_, i) => ({ order_index: i, chunk_text: `c${i}` }));
    const { admin, ops } = fakeAdmin([{}, {}]);
    expect(await upsertChunkEmbeddings(admin, { userId: "u", documentId: "d", chunks })).toBe(UPSERT_BATCH + 1);
    expect(ops.filter((o) => o.op === "upsert")).toHaveLength(2);

    const failing = fakeAdmin([{ error: { message: "bad" } }]);
    await expect(
      upsertChunkEmbeddings(failing.admin, { userId: "u", documentId: "d", chunks: chunks.slice(0, 1) }),
    ).rejects.toThrow("CHUNK_UPSERT_FAILED: bad");
  });

  it("prunes and looks up embedded rows", async () => {
    await expect(pruneExtraChunks(fakeAdmin([{}]).admin, "d", 3)).resolves.toBeUndefined();
    await expect(pruneExtraChunks(fakeAdmin([{ error: { message: "x" } }]).admin, "d", 3)).rejects.toThrow(
      "CHUNK_PRUNE_FAILED",
    );
    expect(await embeddedOrderIndexes(fakeAdmin([{ data: [{ order_index: 0 }, { order_index: 2 }] }]).admin, "d")).toEqual([
      0, 2,
    ]);
    expect(await embeddedOrderIndexes(fakeAdmin([{ data: null }]).admin, "d")).toEqual([]);
    await expect(embeddedOrderIndexes(fakeAdmin([{ error: { message: "x" } }]).admin, "d")).rejects.toThrow(
      "CHUNK_LOOKUP_FAILED",
    );
  });
});

describe("indexDocument", () => {
  it("is complete immediately for empty text", async () => {
    expect(await indexDocument(fakeAdmin([]).admin, { userId: "u", documentId: "d", rawText: "" })).toEqual({
      total: 0,
      written: 0,
      complete: true,
    });
  });

  it("embeds only missing chunks, reports progress and prunes", async () => {
    const text = Array.from({ length: 80 }, (_, i) => `Sentence number ${i} about photosynthesis and light.`).join(" ");
    const { admin, ops } = fakeAdmin([{ data: [{ order_index: 0 }] }]);
    const progress: Array<[number, number]> = [];
    const res = await indexDocument(admin, {
      userId: "u",
      documentId: "d",
      rawText: text,
      onProgress: (d, t) => {
        progress.push([d, t]);
      },
    });
    expect(res.total).toBeGreaterThan(1);
    expect(res.complete).toBe(true);
    expect(res.written).toBe(res.total - 1);
    expect(progress.at(-1)).toEqual([res.total, res.total]);
    expect(ops.at(-1)?.op).toBe("delete");
  });

  it("stops at the deadline without pruning", async () => {
    const { admin, ops } = fakeAdmin([{ data: [] }]);
    const res = await indexDocument(admin, {
      userId: "u",
      documentId: "d",
      rawText: "Some text to index.",
      deadline: Date.now() - 1,
    });
    expect(res).toMatchObject({ written: 0, complete: false });
    expect(ops).toHaveLength(0);
  });
});
