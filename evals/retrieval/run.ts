/// <reference lib="deno.ns" />
// Recall@K eval for document retrieval (roadmap task 2.6).
//
//   npx -y deno@2 run -A evals/retrieval/run.ts --embedder hash      # offline baseline
//   npx -y deno@2 run -A evals/retrieval/run.ts --embedder edge      # gte-small (see README)
//   npx -y deno@2 run -A evals/retrieval/run.ts --embedder openai    # any OpenAI-compatible model
//
// Each document is chunked with the production chunker (_shared/chunking.ts), every chunk and
// question is embedded, and chunks are ranked by cosine similarity, exactly like the chat
// function + match_document_chunks (top-k = 6). A question is a hit at K when one of the top-K
// chunks contains one of its gold substrings.
//
// Two scopes are scored:
//   doc    - rank only the question's own document's chunks (what production does).
//   corpus - rank every chunk of all 20 documents together. Our documents are short (~8-30
//            chunks each), so the doc scope is easy; the corpus scope (~300 chunks) stands in
//            for a long textbook-sized document and is far more sensitive to regressions.
//
// Gate: exits 1 when Recall@6 in GATE_SCOPE (default "corpus") is below MIN_RECALL6
// (default 0.8). Pass --no-gate to only report.
import { chunkText } from "../../supabase/functions/_shared/chunking.ts";
import { TOP_K_CHAT } from "./constants.ts";
import { makeEmbedder } from "./embedders.ts";
import {
  envNumber,
  fmt,
  loadDocuments,
  loadRetrievalQuestions,
  normalizeWs,
  parseArgs,
  type RetrievalQuestion,
  writeResult,
} from "../lib/data.ts";

const KS = [1, 3, 6] as const;
type Scope = "doc" | "corpus";

interface Chunk {
  doc: string;
  orderIndex: number;
  text: string;
  vec: number[];
}

interface QuestionResult {
  doc: string;
  question: string;
  paraphrase: boolean;
  /** 1-based rank of the first chunk containing a gold string, null when none does. */
  rank: Record<Scope, number | null>;
  topChunks: Record<Scope, string[]>;
}

interface Metrics {
  n: number;
  recall: Record<string, number>;
  mrr: number;
}

function dot(a: number[], b: number[]): number {
  let s = 0;
  for (let i = 0; i < a.length; i++) s += a[i] * b[i];
  return s;
}

function isGoldChunk(chunk: Chunk, q: RetrievalQuestion): boolean {
  if (chunk.doc !== q.doc) return false;
  const text = chunk.text.toLowerCase();
  return q.gold.some((g) => text.includes(normalizeWs(g).toLowerCase()));
}

function metrics(results: QuestionResult[], scope: Scope): Metrics {
  const n = results.length;
  const recall: Record<string, number> = {};
  for (const k of KS) {
    recall[`@${k}`] = n ? results.filter((r) => r.rank[scope] !== null && r.rank[scope]! <= k).length / n : NaN;
  }
  const mrr = n ? results.reduce((s, r) => s + (r.rank[scope] ? 1 / r.rank[scope]! : 0), 0) / n : NaN;
  return { n, recall, mrr };
}

async function main() {
  const args = parseArgs(Deno.args);
  const embedderName = String(args.embedder ?? Deno.env.get("EMBEDDER") ?? "hash");
  const minRecall6 = envNumber("MIN_RECALL6", 0.8);
  const gateScope = (Deno.env.get("GATE_SCOPE") ?? "corpus") as Scope;
  if (gateScope !== "doc" && gateScope !== "corpus") throw new Error("GATE_SCOPE must be doc or corpus");
  const noGate = args["no-gate"] === true;

  const embedder = makeEmbedder(embedderName);
  const docs = await loadDocuments();
  const questions = await loadRetrievalQuestions();
  const docSlugs = new Set(docs.map((d) => d.slug));

  // ---- Chunk with the production chunker and validate the dataset ----
  const chunks: Chunk[] = [];
  for (const d of docs) {
    chunkText(d.text).forEach((text, orderIndex) => chunks.push({ doc: d.slug, orderIndex, text, vec: [] }));
  }
  const problems: string[] = [];
  for (const q of questions) {
    if (!docSlugs.has(q.doc)) problems.push(`unknown doc "${q.doc}" for: ${q.question}`);
    else if (!chunks.some((c) => isGoldChunk(c, q))) problems.push(`gold not found in any chunk of ${q.doc}: ${q.gold[0]}`);
  }
  if (problems.length) {
    console.error("Dataset errors:\n- " + problems.join("\n- "));
    Deno.exit(2);
  }

  console.log(`Embedder: ${embedder.describe}`);
  console.log(`${docs.length} documents, ${chunks.length} chunks, ${questions.length} questions ` +
    `(${questions.filter((q) => q.paraphrase).length} paraphrased)`);

  const t0 = Date.now();
  const chunkVecs = await embedder.embed(chunks.map((c) => c.text));
  chunkVecs.forEach((v, i) => (chunks[i].vec = v));
  const queryVecs = await embedder.embed(questions.map((q) => q.question));
  const embedMs = Date.now() - t0;

  // ---- Rank ----
  const results: QuestionResult[] = questions.map((q, qi) => {
    const qv = queryVecs[qi];
    const rankIn = (pool: Chunk[]) => {
      const ranked = pool
        .map((c) => ({ c, s: dot(qv, c.vec) }))
        .sort((a, b) => b.s - a.s || a.c.orderIndex - b.c.orderIndex);
      const idx = ranked.findIndex((r) => isGoldChunk(r.c, q));
      return {
        rank: idx >= 0 ? idx + 1 : null,
        top: ranked.slice(0, TOP_K_CHAT).map((r) => `${r.c.doc}#${r.c.orderIndex} (${r.s.toFixed(3)})`),
      };
    };
    const docRank = rankIn(chunks.filter((c) => c.doc === q.doc));
    const corpusRank = rankIn(chunks);
    return {
      doc: q.doc,
      question: q.question,
      paraphrase: q.paraphrase,
      rank: { doc: docRank.rank, corpus: corpusRank.rank },
      topChunks: { doc: docRank.top, corpus: corpusRank.top },
    };
  });

  const subsets = {
    all: results,
    literal: results.filter((r) => !r.paraphrase),
    paraphrase: results.filter((r) => r.paraphrase),
  };
  const table: Record<Scope, Record<string, Metrics>> = { doc: {}, corpus: {} };
  for (const scope of ["doc", "corpus"] as Scope[]) {
    for (const [name, rs] of Object.entries(subsets)) table[scope][name] = metrics(rs, scope);
  }

  const gateValue = table[gateScope].all.recall["@6"];
  const passed = gateValue >= minRecall6;

  // ---- Report ----
  const lines: string[] = [];
  lines.push(`# Retrieval eval: ${embedder.name}`, "");
  lines.push(`- Embedder: ${embedder.describe}`);
  lines.push(`- Date: ${new Date().toISOString()}`);
  lines.push(`- ${docs.length} documents, ${chunks.length} chunks (chunking.ts), ${questions.length} questions, ${subsets.paraphrase.length} paraphrased`);
  lines.push(`- Gate: Recall@6 (${gateScope} scope) = ${fmt(gateValue)} vs MIN_RECALL6 ${minRecall6} -> ${passed ? "PASS" : "FAIL"}`, "");
  lines.push("| Scope | Subset | n | Recall@1 | Recall@3 | Recall@6 | MRR |");
  lines.push("|---|---|---|---|---|---|---|");
  for (const scope of ["doc", "corpus"] as Scope[]) {
    for (const [name, m] of Object.entries(table[scope])) {
      lines.push(`| ${scope} | ${name} | ${m.n} | ${fmt(m.recall["@1"])} | ${fmt(m.recall["@3"])} | ${fmt(m.recall["@6"])} | ${fmt(m.mrr)} |`);
    }
  }
  const misses = results.filter((r) => r.rank[gateScope] === null || r.rank[gateScope]! > 6);
  lines.push("", `## Misses at top-6 (${gateScope} scope): ${misses.length}`, "");
  for (const r of misses) {
    lines.push(`- [${r.paraphrase ? "paraphrase" : "literal"}] ${r.doc}: ${r.question} (rank ${r.rank[gateScope] ?? "none"})`);
  }
  const markdown = lines.join("\n") + "\n";
  console.log("\n" + markdown);

  const safe = embedder.name.replace(/[^a-z0-9._-]+/gi, "_");
  const jsonPath = await writeResult(`retrieval-${safe}.json`, JSON.stringify({
    embedder: embedder.name,
    describe: embedder.describe,
    date: new Date().toISOString(),
    documents: docs.length,
    chunks: chunks.length,
    questions: questions.length,
    embedMs,
    gate: { scope: gateScope, metric: "recall@6", min: minRecall6, value: gateValue, passed },
    metrics: table,
    results,
  }, null, 2) + "\n");
  const mdPath = await writeResult(`retrieval-${safe}.md`, markdown);
  console.log(`Wrote ${jsonPath}\nWrote ${mdPath}`);

  if (!passed && !noGate) {
    console.error(`GATE FAILED: Recall@6 (${gateScope}) ${fmt(gateValue)} < MIN_RECALL6 ${minRecall6}`);
    Deno.exit(1);
  }
}

if (import.meta.main) await main();
