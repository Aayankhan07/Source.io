/// <reference types="https://esm.sh/@supabase/functions-js@2.4.1/src/edge-runtime.d.ts" />
// Chunk a document's raw_text and embed it with Supabase's built-in gte-small model (384 dims).
// Rows are upserted by (document_id, order_index), so concurrent or repeated runs are safe.
import { authenticateRequest } from "../_shared/auth.ts";
import { acquireJobLock, completeJob, startJobHeartbeat } from "../_shared/jobLock.ts";
import { logAiUsage } from "../_shared/telemetry.ts";
import { createLogger } from "../_shared/log.ts";
import { corsHeadersFor } from "../_shared/cors.ts";
import { chunkText, missingOrderIndexes } from "../_shared/chunking.ts";
import {
  EMBED_MODEL,
  embeddedOrderIndexes,
  indexDocument,
  pruneExtraChunks,
  upsertChunkEmbeddings,
} from "../_shared/embeddings.ts";
import { ABSOLUTE_MAX_CHARS, documentTooLongMessage, BYOK_PAGES_PER_DOCUMENT } from "../_shared/planLimits.ts";

// gte-small runs inside the Supabase edge runtime (no external provider call).
const EMBED_PROVIDER = "local" as const;

Deno.serve(async (req) => {
  const corsHeaders = corsHeadersFor(req);
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  const json = (data: unknown, status = 200) =>
    new Response(JSON.stringify(data), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });

  const log = createLogger("embed_chunks");
  const startTime = Date.now();
  const auth = await authenticateRequest(req, corsHeaders);
  if (auth.errorResponse) return auth.errorResponse;
  const { admin, userId } = auth;
  log.userId = userId;

  let body: { document_id?: string; batch_index?: number; batch_size?: number };
  try { body = await req.json(); } catch {
    return json({ error: "Invalid JSON", code: "INVALID_JSON" }, 400);
  }
  const documentId = body.document_id;
  if (!documentId) return json({ error: "document_id required", code: "BAD_REQUEST" }, 400);

  const { data: doc } = await admin
    .from("documents")
    .select("id,user_id,raw_text,status")
    .eq("id", documentId)
    .maybeSingle();
  if (!doc || doc.user_id !== userId) return json({ error: "Document not found", code: "NOT_FOUND" }, 404);
  if (!doc.raw_text || doc.raw_text.trim().length < 40) {
    return json({ error: "Document has no text yet", code: "NO_TEXT" }, 400);
  }
  // Hard ceiling for any plan (per-plan caps are enforced by ingest).
  if (doc.raw_text.length > ABSOLUTE_MAX_CHARS) {
    return json({
      error: documentTooLongMessage(doc.raw_text.length, BYOK_PAGES_PER_DOCUMENT),
      code: "DOCUMENT_TOO_LONG",
    }, 413);
  }

  const allChunks = chunkText(doc.raw_text);
  const totalChunks = allChunks.length;
  if (totalChunks === 0) return json({ ok: true, chunks: 0, completed: true });

  const logUsage = (status: "succeeded" | "failed", errorMessage?: string) =>
    logAiUsage(admin, {
      userId, documentId, requestId: log.requestId, feature: "embed", provider: EMBED_PROVIDER,
      model: EMBED_MODEL, status, durationMs: Date.now() - startTime,
      inputTokens: status === "succeeded" ? allChunks.reduce((n, c) => n + Math.round(c.length / 4), 0) : 0,
      errorMessage: errorMessage ?? null,
    });

  // --- Progressive batched branch (client calls batch 0, 1, 2, ...) ---
  if (body.batch_index !== undefined) {
    const batchIndex = Math.max(0, Math.floor(body.batch_index));
    const batchSize = Math.max(10, Math.min(100, body.batch_size ?? 50));
    const start = batchIndex * batchSize;
    const end = Math.min(totalChunks, start + batchSize);

    try {
      const embedded = await embeddedOrderIndexes(admin, documentId);
      if (batchIndex === 0 && missingOrderIndexes(totalChunks, embedded).length === 0) {
        await pruneExtraChunks(admin, documentId, totalChunks);
        return json({ ok: true, chunks: totalChunks, total_chunks: totalChunks, cached: true, completed: true });
      }
      if (start >= totalChunks) {
        await pruneExtraChunks(admin, documentId, totalChunks);
        return json({ ok: true, batch_index: batchIndex, completed: true, total_chunks: totalChunks });
      }

      // Only the chunks of this range that still lack an embedding (resumable, idempotent).
      const have = new Set(embedded);
      const todo = [];
      for (let i = start; i < end; i++) if (!have.has(i)) todo.push({ order_index: i, chunk_text: allChunks[i] });
      const inserted = await upsertChunkEmbeddings(admin, { userId, documentId, chunks: todo });

      const completed = end >= totalChunks;
      if (completed) {
        await pruneExtraChunks(admin, documentId, totalChunks);
        await logUsage("succeeded"); // one usage row per fully embedded document
      }
      return json({ ok: true, batch_index: batchIndex, inserted, total_chunks: totalChunks, completed });
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      log.error("batch embed failed", { err: e, documentId, batchIndex });
      await logUsage("failed", msg);
      return json({ error: "Failed to index document chunks", code: "EMBED_FAILED", retryable: true }, 500);
    }
  }

  // --- Monolithic branch: whole document under the job lock ---
  const lock = await acquireJobLock(admin, { userId, documentId, kind: "embed_chunks" });
  if (!lock.acquired) {
    return json({
      error: lock.message,
      code: lock.unavailable ? "JOB_LOCK_UNAVAILABLE" : "ACTIVE_JOB_RUNNING",
      retryable: true,
    }, lock.unavailable ? 503 : 409);
  }
  const jobId = lock.jobId;
  const stopHeartbeat = startJobHeartbeat(admin, jobId);

  try {
    const result = await indexDocument(admin, {
      userId,
      documentId,
      rawText: doc.raw_text,
      onProgress: async (done, total) => {
        if (jobId) {
          await admin.from("jobs").update({ progress: Math.min(95, Math.round((done / total) * 95)) }).eq("id", jobId);
        }
      },
    });
    await completeJob(admin, jobId, true);
    if (result.written > 0) await logUsage("succeeded");
    return json({ ok: true, chunks: result.total, cached: result.written === 0 });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    log.error("embed_chunks failed", { err: e, documentId });
    await completeJob(admin, jobId, false, msg.slice(0, 200));
    await logUsage("failed", msg);
    return json({ error: "Failed to index document chunks", code: "EMBED_FAILED", retryable: true }, 500);
  } finally {
    stopHeartbeat();
  }
});
