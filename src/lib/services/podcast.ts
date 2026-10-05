import { callFunction } from "@/lib/services/functions";

export async function generatePodcast(
  documentId: string,
  options?: { voiceDuo?: string; idempotencyKey?: string }
): Promise<{ ok: boolean; status: string }> {
  const idempotencyKey =
    options?.idempotencyKey ||
    `${documentId}:podcast:${Date.now()}:${Math.random().toString(36).slice(2, 8)}`;

  const resp = await callFunction("generate_podcast", {
    document_id: documentId,
    voice_duo: options?.voiceDuo,
    idempotency_key: idempotencyKey,
  });

  if (!resp.ok) {
    if (resp.status === 429) throw new Error("Rate limit exceeded — try again shortly.");
    if (resp.status === 402) throw new Error("Out of AI credits — add funds in Settings → Workspace → Usage.");
    const t = await resp.text();
    throw new Error(t || `Podcast generation failed (${resp.status})`);
  }

  return await resp.json();
}
