import { supabase } from "@/integrations/supabase/client";

const FN_URL = (name: string) =>
  `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/${name}`;

export async function generatePodcast(documentId: string): Promise<{ ok: boolean; status: string }> {
  const { data: { session } } = await supabase.auth.getSession();
  const token = session?.access_token;
  if (!token) throw new Error("Not authenticated");

  const resp = await fetch(FN_URL("generate_podcast"), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ document_id: documentId }),
  });

  if (!resp.ok) {
    if (resp.status === 429) throw new Error("Rate limit exceeded — try again shortly.");
    if (resp.status === 402) throw new Error("Out of AI credits — add funds in Settings → Workspace → Usage.");
    const t = await resp.text();
    throw new Error(t || `Podcast generation failed (${resp.status})`);
  }

  return await resp.json();
}
