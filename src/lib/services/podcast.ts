import { callFunction } from "@/lib/services/functions";

export async function generatePodcast(
  documentId: string,
  options?: { voiceDuo?: string }
): Promise<{ ok: boolean; status: string }> {
  const resp = await callFunction("generate_podcast", {
    document_id: documentId,
    voice_duo: options?.voiceDuo,
  });

  if (!resp.ok) {
    if (resp.status === 429) throw new Error("Rate limit exceeded — try again shortly.");
    if (resp.status === 402) throw new Error("Out of AI credits — add funds in Settings → Workspace → Usage.");
    const t = await resp.text();
    throw new Error(t || `Podcast generation failed (${resp.status})`);
  }

  return await resp.json();
}
