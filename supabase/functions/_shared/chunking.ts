// Pure chunking helpers shared by embed_chunks and chat (no Deno/Supabase globals).

/** ~350 tokens: stays well inside gte-small's 512-token input window. */
export const TARGET_CHARS = 1400;
export const OVERLAP = 200;

/** Splits text into overlapping windows of TARGET_CHARS. Deterministic for a given input. */
export function chunkText(raw: string | null | undefined): string[] {
  const text = (raw ?? "").replace(/\s+/g, " ").trim();
  if (!text) return [];
  const out: string[] = [];
  let i = 0;
  while (i < text.length) {
    const end = Math.min(text.length, i + TARGET_CHARS);
    out.push(text.slice(i, end).trim());
    if (end >= text.length) break;
    i = Math.max(0, end - OVERLAP);
  }
  return out.filter((c) => c.length > 0);
}

/** pgvector/halfvec text literal: "[0.1,0.2,...]". */
export function toVectorLiteral(v: ArrayLike<number>): string {
  return `[${Array.from(v).join(",")}]`;
}

/** Order indexes in [0, total) that are not in `present`, ascending. */
export function missingOrderIndexes(total: number, present: Iterable<number>): number[] {
  const have = new Set(present);
  const out: number[] = [];
  for (let i = 0; i < total; i++) if (!have.has(i)) out.push(i);
  return out;
}
