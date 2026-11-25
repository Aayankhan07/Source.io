import { callFunction, functionError } from "@/lib/services/functions";

/** Trigger ingest pipeline (PDF/DOCX/YouTube/text). */
export async function triggerIngest(documentId: string): Promise<void> {
  const resp = await callFunction("ingest", { document_id: documentId });
  if (!resp.ok) throw await functionError(resp, "Ingest failed");
}

/**
 * Progressive embedding for large documents (300+ pages / 500+ chunks).
 * Calls embed_chunks in batches of 50 to avoid edge memory limits and timeouts.
 */
async function embedChunksProgressive(
  documentId: string,
  onProgress?: (progressPct: number, currentBatch: number, totalBatches: number) => void
): Promise<{ ok: boolean; chunks: number; cached?: boolean }> {
  const BATCH_SIZE = 50;
  let batchIndex = 0;
  let isDone = false;
  let totalChunks = 0;

  while (!isDone) {
    const resp = await callFunction("embed_chunks", {
      document_id: documentId,
      batch_index: batchIndex,
      batch_size: BATCH_SIZE,
    });
    if (!resp.ok) {
      throw await functionError(resp, `Embedding batch ${batchIndex + 1} failed`);
    }
    const data = await resp.json();
    if (data.cached) {
      onProgress?.(100, 1, 1);
      return { ok: true, chunks: data.chunks ?? 0, cached: true };
    }
    totalChunks = data.total_chunks ?? 0;
    const totalBatches = Math.max(1, Math.ceil(totalChunks / BATCH_SIZE));
    const pct = totalChunks > 0 ? Math.min(100, Math.round(((batchIndex + 1) / totalBatches) * 100)) : 100;
    onProgress?.(pct, batchIndex + 1, totalBatches);

    if (data.completed || totalChunks <= (batchIndex + 1) * BATCH_SIZE) {
      isDone = true;
    } else {
      batchIndex++;
    }
  }

  return { ok: true, chunks: totalChunks };
}

/** Trigger embedding + chunking for RAG chat. Uses progressive batching for resilience. */
export async function embedChunks(documentId: string): Promise<{ ok: boolean; chunks?: number; cached?: boolean }> {
  return await embedChunksProgressive(documentId);
}

/** A source passage used for a chat answer. `n` matches the [n] markers in the answer text. */
export type Citation = { n: number; order_index: number; similarity: number; text: string };

type SseHandlers = {
  /** Called for each `data:` payload, with the name of the preceding `event:` line if any. */
  onData: (parsed: Record<string, unknown>, event: string | null) => void;
};

/**
 * Consume an SSE stream of OpenAI-style chat completion chunks.
 * Tolerates \r\n line endings and payloads split across reads.
 */
async function consumeSse(body: ReadableStream<Uint8Array>, { onData }: SseHandlers): Promise<void> {
  const reader = body.getReader();
  const decoder = new TextDecoder();
  let buf = "";
  let currentEvent: string | null = null;
  let done = false;

  const handleLine = (raw: string): "continue" | "done" => {
    let line = raw;
    if (line.endsWith("\r")) line = line.slice(0, -1);
    if (line === "") { currentEvent = null; return "continue"; }
    if (line.startsWith(":")) return "continue";
    if (line.startsWith("event: ")) { currentEvent = line.slice(7).trim(); return "continue"; }
    if (!line.startsWith("data: ")) return "continue";
    const json = line.slice(6).trim();
    if (json === "[DONE]") return "done";
    onData(JSON.parse(json), currentEvent);
    return "continue";
  };

  while (!done) {
    const { done: readDone, value } = await reader.read();
    if (readDone) break;
    buf += decoder.decode(value, { stream: true });

    let idx: number;
    while ((idx = buf.indexOf("\n")) !== -1) {
      const line = buf.slice(0, idx);
      const rest = buf.slice(idx + 1);
      buf = rest;
      try {
        if (handleLine(line) === "done") { done = true; break; }
      } catch (e: unknown) {
        // Only a truncated JSON payload is recoverable — put it back and wait for
        // the next read. Anything else is a real error thrown by `onData` and must
        // propagate, or the stream stalls silently with no feedback to the user.
        if (!(e instanceof SyntaxError)) throw e;
        buf = line + "\n" + rest;
        break;
      }
    }
  }

  // Flush a trailing line that arrived without a final newline.
  if (!done && buf.trim()) {
    for (const line of buf.split("\n")) {
      try {
        if (handleLine(line) === "done") break;
      } catch (e: unknown) {
        // A trailing payload really can be incomplete — nothing more is coming,
        // so drop it. Errors from `onData` still propagate.
        if (!(e instanceof SyntaxError)) throw e;
      }
    }
  }
}

/** Extract the streamed token from an OpenAI-style delta chunk. */
function deltaContent(parsed: Record<string, unknown>): string | undefined {
  const choices = parsed.choices as Array<{ delta?: { content?: string } }> | undefined;
  return choices?.[0]?.delta?.content;
}

/** Stream a RAG chat reply. Calls onCitations once with sources, then onDelta for each token. */
export async function streamChat({
  documentId, message, onCitations, onDelta, signal,
}: {
  documentId: string;
  message: string;
  onCitations: (cites: Citation[]) => void;
  onDelta: (chunk: string) => void;
  signal?: AbortSignal;
}): Promise<string> {
  const resp = await callFunction("chat", { document_id: documentId, message }, { signal });
  if (!resp.ok || !resp.body) throw await functionError(resp, "Chat failed");

  let full = "";
  await consumeSse(resp.body, {
    onData: (parsed, event) => {
      if (event === "citations" && Array.isArray(parsed.citations)) {
        onCitations(parsed.citations as Citation[]);
        return;
      }
      const content = deltaContent(parsed);
      if (content) { full += content; onDelta(content); }
    },
  });
  return full;
}

/** Trigger flashcards + quiz generation. Returns counts. */
export async function generateDerivatives(
  documentId: string,
  options?: {
    flashcardCount?: number;
    quizDifficulty?: string;
    apiKey?: string;
    idempotencyKey?: string;
    force?: boolean;
    userRole?: string;
    workspacePreferences?: Record<string, unknown> | unknown;
  }
): Promise<{
  flashcards_count: number; questions_count: number; quiz_id: string | null;
}> {
  const idempotencyKey =
    options?.idempotencyKey ||
    `${documentId}:derivatives:${Date.now()}:${Math.random().toString(36).slice(2, 8)}`;
  let resp: Response | null = null;
  for (let attempt = 0; attempt < 4; attempt++) {
    resp = await callFunction("generate_derivatives", {
      document_id: documentId,
      flashcard_count: options?.flashcardCount,
      quiz_difficulty: options?.quizDifficulty,
      api_key: options?.apiKey,
      idempotency_key: idempotencyKey,
      force_regenerate: options?.force,
      user_role: options?.userRole,
      workspace_preferences: options?.workspacePreferences,
    });
    if (resp.status !== 429 && resp.status !== 409) break;
    const waitMs = 1500 * Math.pow(1.5, attempt);
    await new Promise((r) => setTimeout(r, waitMs));
  }
  if (!resp || !resp.ok) {
    if (resp?.status === 409) {
      throw new Error("Flashcards and quiz generation is currently in progress. Please wait a moment.");
    }
    if (!resp) throw new Error("Generation failed (no response)");
    throw await functionError(resp, "Generation failed");
  }
  return await resp.json();
}

/** Section progress for long documents ("Section 3 of 8"). `cached` = reused from an earlier run. */
export type NotesProgress = { section: number; total: number; cached: boolean };

/** How many times streamNotes resumes a long document that paused at the server time limit. */
const MAX_NOTES_CONTINUATIONS = 12;

/**
 * Stream notes for a document. Calls onDelta for each token chunk.
 * Retries while the function reports a 429 or 409 (concurrency lock in-flight).
 *
 * Long documents are generated section by section: `onProgress` receives
 * `event: progress` updates, and when the server pauses (`event: incomplete`) this call
 * resumes automatically without re-sending tokens already delivered. Returns the saved
 * markdown from `event: final` (overview + contents + every section) when present,
 * otherwise the streamed text.
 */
export async function streamNotes({
  documentId,
  tone,
  notesDepth,
  model,
  apiKey,
  idempotencyKey,
  onDelta,
  onProgress,
  onResponse,
  signal,
  force,
  userRole,
  workspacePreferences,
}: {
  documentId: string;
  tone?: string;
  notesDepth?: string;
  model?: string;
  /** @deprecated Keys are stored server-side (Settings → API keys). Kept for old clients. */
  apiKey?: string;
  idempotencyKey?: string;
  force?: boolean;
  onDelta: (chunk: string) => void;
  onProgress?: (progress: NotesProgress) => void;
  onResponse?: (resp: Response) => void;
  signal?: AbortSignal;
  userRole?: string;
  workspacePreferences?: Record<string, unknown> | unknown;
}): Promise<string> {
  const reqIdempotencyKey =
    idempotencyKey ||
    `${documentId}:notes:${Date.now()}:${Math.random().toString(36).slice(2, 8)}`;

  const request = async (forceRun: boolean): Promise<Response> => {
    let resp: Response | null = null;
    for (let attempt = 0; attempt < 5; attempt++) {
      resp = await callFunction(
        "generate_notes",
        {
          document_id: documentId,
          tone,
          notes_depth: notesDepth,
          model,
          api_key: apiKey,
          idempotency_key: reqIdempotencyKey,
          force_regenerate: forceRun,
          user_role: userRole,
          workspace_preferences: workspacePreferences,
        },
        { signal }
      );
      if (resp.status !== 429 && resp.status !== 409) break;
      const waitMs = 1500 * Math.pow(1.5, attempt);
      await new Promise((r) => setTimeout(r, waitMs));
    }

    if (!resp || !resp.ok || !resp.body) {
      if (resp?.status === 429) {
        throw await functionError(resp, "The AI rate limit was reached. Please wait ~30 seconds and try again.");
      }
      if (resp?.status === 409) {
        throw new Error("Note generation is already in progress for this document. Please wait a moment.");
      }
      if (!resp) throw new Error("Notes generation failed (no response)");
      throw await functionError(resp, "Notes generation failed");
    }
    return resp;
  };

  let full = "";
  let finalMarkdown: string | null = null;
  // Sections whose tokens the caller has already received (from an earlier, paused run).
  const delivered = new Set<number>();

  for (let run = 0; run <= MAX_NOTES_CONTINUATIONS; run++) {
    const resp = await request(run === 0 ? !!force : false);
    try {
      onResponse?.(resp);
    } catch {
      // Ignore header inspection errors
    }
    const cacheHit = resp.headers.get("X-Cache") === "HIT";

    let currentSection = 0;
    const seenThisRun = new Set<number>();
    let incomplete: { error?: string } | null = null;
    let streamError: { error?: string; code?: string } | null = null;

    await consumeSse(resp.body!, {
      onData: (parsed, event) => {
        switch (event) {
          case "progress": {
            currentSection = Number(parsed.section) || 0;
            onProgress?.({
              section: currentSection,
              total: Number(parsed.total) || 0,
              cached: parsed.cached === true,
            });
            return;
          }
          case "final":
            if (typeof parsed.markdown === "string") finalMarkdown = parsed.markdown;
            return;
          case "incomplete":
            incomplete = parsed as { error?: string };
            return;
          case "error":
            streamError = parsed as { error?: string; code?: string };
            return;
          case null:
            break;
          default:
            return; // unknown named event: ignore
        }
        const content = deltaContent(parsed);
        if (!content) return;
        if (run > 0 && cacheHit) {
          // Another run finished meanwhile: this is the complete saved note, not a delta.
          finalMarkdown = (finalMarkdown ?? "") + content;
          return;
        }
        if (currentSection && delivered.has(currentSection)) return;
        if (currentSection) seenThisRun.add(currentSection);
        full += content;
        onDelta(content);
      },
    });

    seenThisRun.forEach((s) => delivered.add(s));
    const failure = streamError as { error?: string; code?: string } | null;
    if (failure) throw new Error(failure.error || "Notes generation failed");
    const paused = incomplete as { error?: string } | null;
    if (!paused) break;
    if (run === MAX_NOTES_CONTINUATIONS) {
      throw new Error(paused.error || "Notes generation paused. Press Generate again to continue.");
    }
    await new Promise((r) => setTimeout(r, 500));
  }

  return finalMarkdown ?? full;
}
