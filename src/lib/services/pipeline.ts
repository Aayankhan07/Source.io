import { callFunction, functionError } from "@/lib/services/functions";

/** Trigger ingest pipeline (PDF/DOCX/YouTube/text). */
export async function triggerIngest(documentId: string): Promise<void> {
  const resp = await callFunction("ingest", { document_id: documentId });
  if (!resp.ok) throw await functionError(resp, "Ingest failed");
}

/** Trigger embedding + chunking for RAG chat. */
export async function embedChunks(documentId: string): Promise<{ ok: boolean; chunks?: number; cached?: boolean }> {
  const resp = await callFunction("embed_chunks", { document_id: documentId });
  if (!resp.ok) throw await functionError(resp, "Embedding failed");
  return await resp.json();
}

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
      } catch {
        // Payload split mid-JSON: put it back and wait for the next read.
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
      } catch { /* incomplete trailing payload — nothing more is coming */ }
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
export async function generateDerivatives(documentId: string): Promise<{
  flashcards_count: number; questions_count: number; quiz_id: string | null;
}> {
  const resp = await callFunction("generate_derivatives", { document_id: documentId });
  if (!resp.ok) throw await functionError(resp, "Generation failed");
  return await resp.json();
}

/**
 * Stream notes for a document. Calls onDelta for each token chunk.
 * Retries up to 3 times while the function reports a 429.
 * Returns the full markdown when done.
 */
export async function streamNotes({
  documentId,
  onDelta,
  signal,
}: {
  documentId: string;
  onDelta: (chunk: string) => void;
  signal?: AbortSignal;
}): Promise<string> {
  let resp: Response | null = null;
  for (let attempt = 0; attempt < 3; attempt++) {
    resp = await callFunction("generate_notes", { document_id: documentId }, { signal });
    if (resp.status !== 429) break;
    const waitMs = 2000 * Math.pow(2, attempt);
    await new Promise((r) => setTimeout(r, waitMs));
  }

  if (!resp || !resp.ok || !resp.body) {
    if (resp?.status === 429) {
      throw new Error("Groq free-tier rate limit reached. Please wait ~30 seconds and try again.");
    }
    if (!resp) throw new Error("Notes generation failed (no response)");
    throw await functionError(resp, "Notes generation failed");
  }

  let full = "";
  await consumeSse(resp.body, {
    onData: (parsed) => {
      const content = deltaContent(parsed);
      if (content) { full += content; onDelta(content); }
    },
  });
  return full;
}
