import { callFunction } from "@/lib/services/functions";

export async function generatePodcast(documentId: string): Promise<{ ok: boolean; status: string }> {
  const resp = await callFunction("generate_podcast", { document_id: documentId });

  if (!resp.ok) {
    if (resp.status === 429) throw new Error("Rate limit exceeded — try again shortly.");
    if (resp.status === 402) throw new Error("Out of AI credits — add funds in Settings → Workspace → Usage.");
    const t = await resp.text();
    throw new Error(t || `Podcast generation failed (${resp.status})`);
  }

  return await resp.json();
}
