/// <reference lib="deno.ns" />
// Pluggable embedders for the retrieval eval. Every embedder returns L2-normalized vectors so
// ranking by dot product equals ranking by cosine similarity (what match_document_chunks does
// with pgvector's <=> cosine distance).

export interface Embedder {
  name: string;
  /** Short description printed in the report (model, endpoint). */
  describe: string;
  embed(texts: string[]): Promise<number[][]>;
}

function l2normalize(v: number[]): number[] {
  let n = 0;
  for (const x of v) n += x * x;
  n = Math.sqrt(n) || 1;
  return v.map((x) => x / n);
}

// ---------------------------------------------------------------------------------------------
// (a) hash: the OLD lexical embedding, reproduced verbatim from
//     `git show 68d7f49:supabase/functions/embed_chunks/index.ts` (fnv1a / tokenize / embedLocal).
//     It was replaced by gte-small in migration 20261126110000. Runs fully offline; kept only as
//     a baseline that shows why lexical hashing failed on paraphrased questions.
// ---------------------------------------------------------------------------------------------
const HASH_DIMS = 768;

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

export function embedLocalHash(text: string): number[] {
  const v = new Float64Array(HASH_DIMS);
  const toks = tokenize(text);
  if (toks.length === 0) return Array.from(v);
  const add = (term: string) => {
    const h = fnv1a(term);
    const idx = h % HASH_DIMS;
    const sign = (h >>> 31) & 1 ? -1 : 1;
    v[idx] += sign;
  };
  for (let i = 0; i < toks.length; i++) {
    add(toks[i]);
    if (i + 1 < toks.length) add(toks[i] + "_" + toks[i + 1]);
  }
  let norm = 0;
  for (let i = 0; i < HASH_DIMS; i++) norm += v[i] * v[i];
  norm = Math.sqrt(norm) || 1;
  const out = new Array<number>(HASH_DIMS);
  for (let i = 0; i < HASH_DIMS; i++) out[i] = v[i] / norm;
  return out;
}

export const hashEmbedder: Embedder = {
  name: "hash",
  describe: "legacy FNV-1a hashed unigram+bigram, 768 dims (offline)",
  embed: (texts) => Promise.resolve(texts.map(embedLocalHash)),
};

// ---------------------------------------------------------------------------------------------
// (b) edge: Supabase gte-small through evals/retrieval/edge-runner.ts served by the Supabase edge
//     runtime (`supabase functions serve`, or deployed temporarily). This is the production
//     model, called through the same _shared/embeddings.ts embedText() the chat function uses.
// ---------------------------------------------------------------------------------------------
async function postJson(url: string, body: unknown, headers: Record<string, string>, tries = 4): Promise<unknown> {
  let last = "";
  for (let attempt = 0; attempt < tries; attempt++) {
    const resp = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...headers },
      body: JSON.stringify(body),
    });
    if (resp.ok) return await resp.json();
    last = `${resp.status} ${(await resp.text()).slice(0, 300)}`;
    if (resp.status !== 429 && resp.status < 500) break;
    await new Promise((r) => setTimeout(r, 1000 * 2 ** attempt));
  }
  throw new Error(`embedding request to ${url} failed: ${last}`);
}

export function edgeEmbedder(): Embedder {
  const base = Deno.env.get("SUPABASE_URL")?.replace(/\/$/, "") ?? "http://127.0.0.1:54321";
  const url = Deno.env.get("EDGE_EMBED_URL") ?? `${base}/functions/v1/eval-embed`;
  const key = Deno.env.get("EDGE_EMBED_KEY") ?? Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!key) throw new Error("edge embedder needs SUPABASE_SERVICE_ROLE_KEY (or EDGE_EMBED_KEY)");
  const batch = Number(Deno.env.get("EDGE_EMBED_BATCH")) || 8;
  return {
    name: "edge",
    describe: `gte-small via ${url}`,
    async embed(texts) {
      const out: number[][] = [];
      for (let i = 0; i < texts.length; i += batch) {
        const res = await postJson(url, { texts: texts.slice(i, i + batch) }, {
          Authorization: `Bearer ${key}`,
          apikey: key,
        }) as { embeddings?: number[][] };
        if (!Array.isArray(res.embeddings)) throw new Error("edge embedder: response has no embeddings[]");
        out.push(...res.embeddings.map(l2normalize));
      }
      return out;
    },
  };
}

// ---------------------------------------------------------------------------------------------
// (c) openai: any OpenAI-compatible /embeddings endpoint (to compare candidate models).
//     EMBED_ENDPOINT (e.g. https://api.openai.com/v1/embeddings), EMBED_MODEL, EMBED_API_KEY.
// ---------------------------------------------------------------------------------------------
export function openaiEmbedder(): Embedder {
  const url = Deno.env.get("EMBED_ENDPOINT");
  const model = Deno.env.get("EMBED_MODEL");
  const key = Deno.env.get("EMBED_API_KEY") ?? "";
  if (!url || !model) throw new Error("openai embedder needs EMBED_ENDPOINT and EMBED_MODEL (and usually EMBED_API_KEY)");
  const batch = Number(Deno.env.get("EMBED_BATCH")) || 64;
  return {
    name: `openai:${model}`,
    describe: `${model} via ${url}`,
    async embed(texts) {
      const out: number[][] = [];
      for (let i = 0; i < texts.length; i += batch) {
        const res = await postJson(url, { model, input: texts.slice(i, i + batch) }, key ? { Authorization: `Bearer ${key}` } : {}) as {
          data?: { index: number; embedding: number[] }[];
        };
        if (!Array.isArray(res.data)) throw new Error("openai embedder: response has no data[]");
        const sorted = [...res.data].sort((a, b) => a.index - b.index);
        out.push(...sorted.map((d) => l2normalize(d.embedding)));
      }
      return out;
    },
  };
}

export function makeEmbedder(name: string): Embedder {
  switch (name) {
    case "hash":
      return hashEmbedder;
    case "edge":
    case "supabase":
      return edgeEmbedder();
    case "openai":
      return openaiEmbedder();
    default:
      throw new Error(`unknown embedder "${name}" (use hash | edge | openai)`);
  }
}
