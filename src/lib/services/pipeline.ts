import { supabase } from "@/integrations/supabase/client";

const FN_URL = (name: string) =>
  `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/${name}`;

/** Trigger ingest pipeline (PDF/DOCX/YouTube/text). */
export async function triggerIngest(documentId: string): Promise<void> {
  const { data: { session } } = await supabase.auth.getSession();
  const token = session?.access_token;
  if (!token) throw new Error("Not authenticated");

  const resp = await fetch(FN_URL("ingest"), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ document_id: documentId }),
  });
  if (!resp.ok) {
    const t = await resp.text();
    throw new Error(t || `Ingest failed (${resp.status})`);
  }
}

/** Trigger embedding + chunking for RAG chat. */
export async function embedChunks(documentId: string): Promise<{ ok: boolean; chunks?: number; cached?: boolean }> {
  const { data: { session } } = await supabase.auth.getSession();
  const token = session?.access_token;
  if (!token) throw new Error("Not authenticated");

  const resp = await fetch(FN_URL("embed_chunks"), {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify({ document_id: documentId }),
  });
  if (!resp.ok) {
    if (resp.status === 429) throw new Error("Rate limit reached — please wait a moment and try again.");
    if (resp.status === 402) throw new Error("Hit the free-tier rate limit — please wait a moment and retry.");
    const t = await resp.text();
    throw new Error(t || `Embedding failed (${resp.status})`);
  }
  return await resp.json();
}

export type Citation = { n: number; order_index: number; similarity: number; text: string };

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
  const { data: { session } } = await supabase.auth.getSession();
  const token = session?.access_token;
  if (!token) throw new Error("Not authenticated");

  const resp = await fetch(FN_URL("chat"), {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify({ document_id: documentId, message }),
    signal,
  });

  if (!resp.ok || !resp.body) {
    if (resp.status === 429) throw new Error("Rate limit reached — please wait a moment and try again.");
    if (resp.status === 402) throw new Error("Hit the free-tier rate limit — please wait a moment and retry.");
    const t = await resp.text();
    throw new Error(t || `Chat failed (${resp.status})`);
  }

  const reader = resp.body.getReader();
  const decoder = new TextDecoder();
  let buf = "";
  let full = "";
  let currentEvent: string | null = null;
  let done = false;

  while (!done) {
    const { done: rd, value } = await reader.read();
    if (rd) break;
    buf += decoder.decode(value, { stream: true });

    let idx: number;
    while ((idx = buf.indexOf("\n")) !== -1) {
      let line = buf.slice(0, idx);
      buf = buf.slice(idx + 1);
      if (line.endsWith("\r")) line = line.slice(0, -1);
      if (line === "") { currentEvent = null; continue; }
      if (line.startsWith(":")) continue;
      if (line.startsWith("event: ")) { currentEvent = line.slice(7).trim(); continue; }
      if (!line.startsWith("data: ")) continue;
      const json = line.slice(6).trim();
      if (json === "[DONE]") { done = true; break; }
      try {
        const parsed = JSON.parse(json);
        if (currentEvent === "citations" && Array.isArray(parsed.citations)) {
          onCitations(parsed.citations as Citation[]);
        } else {
          const content = parsed.choices?.[0]?.delta?.content as string | undefined;
          if (content) { full += content; onDelta(content); }
        }
      } catch {
        buf = line + "\n" + buf;
        break;
      }
    }
  }
  return full;
}

/** Trigger flashcards + quiz generation. Returns counts. */
export async function generateDerivatives(documentId: string): Promise<{
  flashcards_count: number; questions_count: number; quiz_id: string | null;
}> {
  const { data: { session } } = await supabase.auth.getSession();
  const token = session?.access_token;
  if (!token) throw new Error("Not authenticated");

  const resp = await fetch(FN_URL("generate_derivatives"), {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify({ document_id: documentId }),
  });
  if (!resp.ok) {
    if (resp.status === 429) throw new Error("Rate limit reached — please wait a moment and try again.");
    if (resp.status === 402) throw new Error("Hit the free-tier rate limit — please wait a moment and retry.");
    const t = await resp.text();
    throw new Error(t || `Generation failed (${resp.status})`);
  }
  return await resp.json();
}

/**
 * Stream notes for a document. Calls onDelta for each token chunk.
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
  const { data: { session } } = await supabase.auth.getSession();
  const token = session?.access_token;
  if (!token) throw new Error("Not authenticated");

  let resp: Response | null = null;
  for (let attempt = 0; attempt < 3; attempt++) {
    resp = await fetch(FN_URL("generate_notes"), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ document_id: documentId }),
      signal,
    });
    if (resp.status !== 429) break;
    const waitMs = 2000 * Math.pow(2, attempt);
    await new Promise((r) => setTimeout(r, waitMs));
  }

  if (!resp || !resp.ok || !resp.body) {
    if (resp?.status === 429) {
      throw new Error("Groq free-tier rate limit reached. Please wait ~30 seconds and try again.");
    }
    if (resp?.status === 402) throw new Error("Hit the free-tier rate limit — please wait a moment and retry.");
    const t = resp ? await resp.text() : "";
    throw new Error(t || `Notes generation failed (${resp?.status ?? "no response"})`);
  }

  const reader = resp.body!.getReader();
  const decoder = new TextDecoder();
  let textBuffer = "";
  let full = "";
  let done = false;

  while (!done) {
    const { done: rd, value } = await reader.read();
    if (rd) break;
    textBuffer += decoder.decode(value, { stream: true });

    let idx: number;
    while ((idx = textBuffer.indexOf("\n")) !== -1) {
      let line = textBuffer.slice(0, idx);
      textBuffer = textBuffer.slice(idx + 1);
      if (line.endsWith("\r")) line = line.slice(0, -1);
      if (line.startsWith(":") || line.trim() === "") continue;
      if (!line.startsWith("data: ")) continue;
      const json = line.slice(6).trim();
      if (json === "[DONE]") { done = true; break; }
      try {
        const parsed = JSON.parse(json);
        const content = parsed.choices?.[0]?.delta?.content as string | undefined;
        if (content) {
          full += content;
          onDelta(content);
        }
      } catch {
        textBuffer = line + "\n" + textBuffer;
        break;
      }
    }
  }

  // Flush leftover
  if (textBuffer.trim()) {
    for (let raw of textBuffer.split("\n")) {
      if (raw.endsWith("\r")) raw = raw.slice(0, -1);
      if (!raw.startsWith("data: ")) continue;
      const json = raw.slice(6).trim();
      if (json === "[DONE]") continue;
      try {
        const parsed = JSON.parse(json);
        const content = parsed.choices?.[0]?.delta?.content as string | undefined;
        if (content) { full += content; onDelta(content); }
      } catch { /* ignore */ }
    }
  }

  return full;
}
