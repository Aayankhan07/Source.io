/// <reference types="https://esm.sh/@supabase/functions-js@2.4.1/src/edge-runtime.d.ts" />
// Semantic embeddings with Supabase's built-in gte-small model (384 dims, runs inside the edge
// runtime: free, no API key, documents never leave Supabase). Shared by embed_chunks and chat
// so the index and the query always use the same model.
import type { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2.57.4";
import { chunkText, missingOrderIndexes, toVectorLiteral } from "./chunking.ts";

export const EMBED_MODEL = "gte-small";
export const EMBED_DIMS = 384;
/** Rows per upsert round-trip. */
export const UPSERT_BATCH = 16;
/** gte-small reads at most 512 tokens; longer input is pointless. */
const MAX_INPUT_CHARS = 2000;

let session: Supabase.Session | null = null;
function getSession(): Supabase.Session {
  if (!session) session = new Supabase.ai.Session(EMBED_MODEL);
  return session;
}

/** Embeds one text (mean-pooled, L2-normalized). Throws if the model output is malformed. */
export async function embedText(text: string): Promise<number[]> {
  const out = await getSession().run(text.slice(0, MAX_INPUT_CHARS), { mean_pool: true, normalize: true });
  const vec = Array.isArray(out) ? (out as number[]) : Array.from((out ?? []) as ArrayLike<number>);
  if (vec.length !== EMBED_DIMS || vec.some((x) => typeof x !== "number" || !Number.isFinite(x))) {
    throw new Error(`EMBEDDING_INVALID: expected ${EMBED_DIMS} dims, got ${vec.length}`);
  }
  return vec;
}

export interface ChunkRow {
  order_index: number;
  chunk_text: string;
}

/**
 * Embeds and UPSERTs chunks keyed by (document_id, order_index). Idempotent: concurrent or
 * repeated runs converge on the same rows, so no run ever deletes another run's work (B12).
 */
export async function upsertChunkEmbeddings(
  admin: SupabaseClient,
  opts: { userId: string; documentId: string; chunks: ChunkRow[] },
): Promise<number> {
  let written = 0;
  for (let i = 0; i < opts.chunks.length; i += UPSERT_BATCH) {
    const batch = opts.chunks.slice(i, i + UPSERT_BATCH);
    const rows = [];
    for (const c of batch) {
      rows.push({
        user_id: opts.userId,
        document_id: opts.documentId,
        chunk_text: c.chunk_text,
        order_index: c.order_index,
        embedding: toVectorLiteral(await embedText(c.chunk_text)),
      });
    }
    const { error } = await admin
      .from("document_chunks")
      .upsert(rows, { onConflict: "document_id,order_index" });
    if (error) throw new Error("CHUNK_UPSERT_FAILED: " + error.message);
    written += rows.length;
  }
  return written;
}

/** Removes chunks past the current chunk count (left over from an older chunking of the text). */
export async function pruneExtraChunks(admin: SupabaseClient, documentId: string, total: number): Promise<void> {
  const { error } = await admin
    .from("document_chunks")
    .delete()
    .eq("document_id", documentId)
    .gte("order_index", total);
  if (error) throw new Error("CHUNK_PRUNE_FAILED: " + error.message);
}

/** order_index values that already have an embedding. */
export async function embeddedOrderIndexes(admin: SupabaseClient, documentId: string): Promise<number[]> {
  const { data, error } = await admin
    .from("document_chunks")
    .select("order_index")
    .eq("document_id", documentId)
    .not("embedding", "is", null)
    .limit(5000);
  if (error) throw new Error("CHUNK_LOOKUP_FAILED: " + error.message);
  return (data ?? []).map((r: { order_index: number }) => r.order_index);
}

export interface IndexResult {
  total: number;
  /** Chunks embedded by this call. */
  written: number;
  /** All chunks now have an embedding. */
  complete: boolean;
}

/**
 * Brings a document's index up to date: embeds only the chunks that are missing an embedding
 * (resumable after a timeout), then prunes stale extra rows. Stops early once `deadline`
 * (epoch ms) has passed; the caller can resume later. The caller should hold the
 * (document, "embed_chunks") job lock.
 */
export async function indexDocument(
  admin: SupabaseClient,
  opts: {
    userId: string;
    documentId: string;
    rawText: string;
    deadline?: number;
    onProgress?: (done: number, total: number) => void | Promise<void>;
  },
): Promise<IndexResult> {
  const chunks = chunkText(opts.rawText);
  const total = chunks.length;
  if (total === 0) return { total: 0, written: 0, complete: true };

  const missing = missingOrderIndexes(total, await embeddedOrderIndexes(admin, opts.documentId));
  let written = 0;
  for (let i = 0; i < missing.length; i += UPSERT_BATCH) {
    if (opts.deadline && Date.now() > opts.deadline) break;
    const slice = missing.slice(i, i + UPSERT_BATCH).map((idx) => ({ order_index: idx, chunk_text: chunks[idx] }));
    written += await upsertChunkEmbeddings(admin, { userId: opts.userId, documentId: opts.documentId, chunks: slice });
    await opts.onProgress?.(total - missing.length + written, total);
  }

  const complete = written === missing.length;
  if (complete) await pruneExtraChunks(admin, opts.documentId, total);
  return { total, written, complete };
}
