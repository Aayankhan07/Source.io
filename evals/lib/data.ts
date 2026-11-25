/// <reference lib="deno.ns" />
// Loads the committed eval datasets (evals/data). Pure Deno file IO, no network.

export const EVALS_DIR = new URL("../", import.meta.url);
export const DATA_DIR = new URL("data/", EVALS_DIR);
export const DOCS_DIR = new URL("documents/", DATA_DIR);
export const RESULTS_DIR = new URL("results/", EVALS_DIR);

export interface EvalDocument {
  slug: string;
  title: string;
  text: string;
}

export interface RetrievalQuestion {
  doc: string;
  question: string;
  /** Exact substrings of the document; any one of them inside a retrieved chunk is a hit. */
  gold: string[];
  /** True when the question deliberately avoids the passage's vocabulary. */
  paraphrase: boolean;
}

/** Collapses whitespace the same way _shared/chunking.ts does, so gold strings match chunks. */
export function normalizeWs(s: string): string {
  return s.replace(/\s+/g, " ").trim();
}

export async function loadDocuments(only?: string[]): Promise<EvalDocument[]> {
  const docs: EvalDocument[] = [];
  for await (const entry of Deno.readDir(DOCS_DIR)) {
    if (!entry.isFile || !entry.name.endsWith(".md")) continue;
    const slug = entry.name.slice(0, -3);
    if (only && only.length && !only.includes(slug)) continue;
    const text = await Deno.readTextFile(new URL(entry.name, DOCS_DIR));
    const title = text.match(/^#\s+(.+)$/m)?.[1]?.trim() ?? slug;
    docs.push({ slug, title, text });
  }
  return docs.sort((a, b) => a.slug.localeCompare(b.slug));
}

export async function loadRetrievalQuestions(): Promise<RetrievalQuestion[]> {
  const raw = await Deno.readTextFile(new URL("retrieval.jsonl", DATA_DIR));
  return raw
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean)
    .map((l, i) => {
      const q = JSON.parse(l) as RetrievalQuestion;
      if (!q.doc || !q.question || !Array.isArray(q.gold) || q.gold.length === 0 || typeof q.paraphrase !== "boolean") {
        throw new Error(`retrieval.jsonl line ${i + 1}: expected {doc, question, gold[], paraphrase}`);
      }
      return q;
    });
}

export async function loadKeyFacts(): Promise<Record<string, string[]>> {
  return JSON.parse(await Deno.readTextFile(new URL("key_facts.json", DATA_DIR)));
}

/** Parses "--flag=value" / "--flag value" / "--bool" style args. */
export function parseArgs(args: string[]): Record<string, string | true> {
  const out: Record<string, string | true> = {};
  for (let i = 0; i < args.length; i++) {
    const a = args[i];
    if (!a.startsWith("--")) continue;
    const eq = a.indexOf("=");
    if (eq > 0) out[a.slice(2, eq)] = a.slice(eq + 1);
    else if (args[i + 1] && !args[i + 1].startsWith("--")) out[a.slice(2)] = args[++i];
    else out[a.slice(2)] = true;
  }
  return out;
}

export function envNumber(name: string, fallback: number): number {
  const v = Number(Deno.env.get(name));
  return Number.isFinite(v) && Deno.env.get(name) !== undefined && Deno.env.get(name) !== "" ? v : fallback;
}

export async function writeResult(name: string, content: string): Promise<string> {
  await Deno.mkdir(RESULTS_DIR, { recursive: true });
  const url = new URL(name, RESULTS_DIR);
  await Deno.mkdir(new URL("./", url), { recursive: true });
  await Deno.writeTextFile(url, content);
  return decodeURIComponent(url.pathname).replace(/^\/([A-Za-z]:)/, "$1");
}

export const fmt = (x: number, digits = 3) => (Number.isFinite(x) ? x.toFixed(digits) : "n/a");
