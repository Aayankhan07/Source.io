// Chunk a document's raw_text and embed via deterministic local hashed n-gram embeddings.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const EMBED_DIMS = 1536;
const TARGET_CHARS = 1400; // ~350 tokens
const OVERLAP = 200;
const BATCH_SIZE = 32;

// FNV-1a 32-bit
function fnv1a(str: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = (h + ((h << 1) + (h << 4) + (h << 7) + (h << 8) + (h << 24))) >>> 0;
  }
  return h >>> 0;
}

function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((t) => t.length >= 2 && t.length <= 40);
}

// Deterministic local embedding: hashed unigrams + bigrams, L2-normalized, 1536d.
// No external API needed — stable across embed_chunks and chat query embedding.
export function embedLocal(text: string): number[] {
  const v = new Float64Array(EMBED_DIMS);
  const toks = tokenize(text);
  if (toks.length === 0) return Array.from(v);

  const add = (term: string) => {
    const h = fnv1a(term);
    const idx = h % EMBED_DIMS;
    const sign = (h >>> 31) & 1 ? -1 : 1;
    v[idx] += sign;
  };

  for (let i = 0; i < toks.length; i++) {
    add(toks[i]);
    if (i + 1 < toks.length) add(toks[i] + "_" + toks[i + 1]);
  }

  let norm = 0;
  for (let i = 0; i < EMBED_DIMS; i++) norm += v[i] * v[i];
  norm = Math.sqrt(norm) || 1;
  const out = new Array<number>(EMBED_DIMS);
  for (let i = 0; i < EMBED_DIMS; i++) out[i] = v[i] / norm;
  return out;
}

function chunkText(raw: string | null | undefined): string[] {
  const text = (raw ?? "").replace(/\s+/g, " ").trim();
  if (!text) return [];
  const out: string[] = [];
  let i = 0;
  while (i < text.length) {
    const end = Math.min(text.length, i + TARGET_CHARS);
    out.push(text.slice(i, end).trim());
    if (end >= text.length) break;
    i = end - OVERLAP;
    if (i < 0) i = 0;
  }
  return out.filter((c) => c.length > 0);
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const authHeader = req.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
  const ANON = Deno.env.get("SUPABASE_ANON_KEY")!;
  const SERVICE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  // Note: embeddings are computed locally (deterministic hashed n-grams), so no AI key required.

  const userClient = createClient(SUPABASE_URL, ANON, {
    global: { headers: { Authorization: authHeader } },
  });
  const admin = createClient(SUPABASE_URL, SERVICE);

  const { data: claimsData, error: claimsErr } = await userClient.auth.getClaims(
    authHeader.replace("Bearer ", ""),
  );
  if (claimsErr || !claimsData?.claims) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
  const userId = claimsData.claims.sub as string;

  let body: { document_id?: string };
  try { body = await req.json(); } catch {
    return new Response(JSON.stringify({ error: "Invalid JSON" }), {
      status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
  const documentId = body.document_id;
  if (!documentId) {
    return new Response(JSON.stringify({ error: "document_id required" }), {
      status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const { data: doc } = await admin
    .from("documents")
    .select("id,user_id,raw_text,status")
    .eq("id", documentId)
    .maybeSingle();
  if (!doc || doc.user_id !== userId) {
    return new Response(JSON.stringify({ error: "Document not found" }), {
      status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
  if (!doc.raw_text || doc.raw_text.trim().length < 40) {
    return new Response(JSON.stringify({ error: "Document has no text yet" }), {
      status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  // Skip if already embedded.
  const { count: existing } = await admin
    .from("document_chunks")
    .select("id", { count: "exact", head: true })
    .eq("document_id", documentId);
  if ((existing ?? 0) > 0) {
    return new Response(JSON.stringify({ ok: true, chunks: existing, cached: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const { data: job } = await admin
    .from("jobs")
    .insert({ user_id: userId, document_id: documentId, kind: "embed_chunks", status: "running", progress: 5 })
    .select("id")
    .single();
  const jobId = job?.id;

  try {
    const chunks = chunkText(doc.raw_text);
    if (chunks.length === 0) throw new Error("no_chunks");

    let inserted = 0;
    for (let i = 0; i < chunks.length; i += BATCH_SIZE) {
      const batch = chunks.slice(i, i + BATCH_SIZE);
      const vectors = batch.map((c: string) => embedLocal(c));
      const rows = batch.map((chunk_text: string, j: number) => ({
        user_id: userId,
        document_id: documentId,
        chunk_text,
        order_index: i + j,
        embedding: `[${vectors[j].join(",")}]`,
      }));
      const { error: insErr } = await admin.from("document_chunks").insert(rows);
      if (insErr) throw new Error("insert_failed:" + insErr.message);
      inserted += rows.length;
      if (jobId) {
        await admin.from("jobs").update({
          progress: Math.min(95, Math.round((inserted / chunks.length) * 95)),
        }).eq("id", jobId);
      }
    }

    if (jobId) await admin.from("jobs").update({ status: "succeeded", progress: 100 }).eq("id", jobId);
    return new Response(JSON.stringify({ ok: true, chunks: inserted }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error("embed_chunks error", msg);
    if (jobId) await admin.from("jobs").update({ status: "failed", error: msg.slice(0, 200), progress: 100 }).eq("id", jobId);
    if (msg.includes("429")) {
      return new Response(JSON.stringify({ error: "Rate limit exceeded" }), {
        status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (msg.includes("402")) {
      return new Response(JSON.stringify({ error: "Out of credits" }), {
        status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    return new Response(JSON.stringify({ error: msg }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
