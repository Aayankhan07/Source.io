/// <reference lib="deno.ns" />
// Eval-only embedding endpoint: exposes the production gte-small embedText() from
// _shared/embeddings.ts so evals/retrieval/run.ts --embedder edge can score the real model.
// gte-small only runs inside the Supabase edge runtime (Supabase.ai.Session), so this file is
// served by the Supabase CLI. It is NOT a deployed function: install it temporarily, e.g.
//
//   mkdir -p supabase/functions/eval-embed
//   sed 's#../../supabase/functions/_shared/#../_shared/#' evals/retrieval/edge-runner.ts \
//     > supabase/functions/eval-embed/index.ts
//   supabase start && supabase functions serve eval-embed
//   # ...run the eval (see evals/README.md), then:
//   rm -r supabase/functions/eval-embed
//
// Request:  POST {"texts": ["...", ...]}  (at most 32 texts)
// Response: {"embeddings": [[...384 floats], ...]}
// Auth: the bearer token must equal this runtime's SUPABASE_SERVICE_ROLE_KEY, so a copy that is
// deployed by mistake is not an open embedding proxy.
import { EMBED_DIMS, EMBED_MODEL, embedText } from "../../supabase/functions/_shared/embeddings.ts";

const MAX_TEXTS = 32;

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });
}

Deno.serve(async (req) => {
  if (req.method !== "POST") return json({ error: "POST only" }, 405);
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  const token = (req.headers.get("Authorization") ?? "").replace(/^Bearer\s+/i, "");
  if (!serviceKey || token !== serviceKey) return json({ error: "unauthorized" }, 401);

  let texts: unknown;
  try {
    texts = (await req.json())?.texts;
  } catch {
    return json({ error: "invalid JSON" }, 400);
  }
  if (!Array.isArray(texts) || texts.length === 0 || texts.length > MAX_TEXTS || texts.some((t) => typeof t !== "string")) {
    return json({ error: `texts must be 1..${MAX_TEXTS} strings` }, 400);
  }
  const embeddings: number[][] = [];
  for (const t of texts as string[]) embeddings.push(await embedText(t));
  return json({ model: EMBED_MODEL, dims: EMBED_DIMS, embeddings });
});
