// Splits a long source into sections of roughly `targetChars` (about 5 pages at 3,000
// characters per page) so every part of a document is read in full (roadmap task 2.13).
// Pure functions: no Deno or network APIs, so vitest can exercise them directly.

/** About 5 pages per section (CHARS_PER_PAGE = 3,000). */
export const SECTION_TARGET_CHARS = 15_000;

/** Page / slide markers written by ingest, e.g. "--- Page 12 ---" or "--- Slide / Page 3 ---". */
const PAGE_MARKER = /^-{2,}\s*(?:slide\s*\/\s*page|slide|page)\s+\d+\s*-{2,}\s*$/i;
/** Markdown headings (#..######) and numbered chapter headings ("Chapter 3", "CHAPTER IV", "Part 2"). */
const HEADING = /^(?:#{1,6}\s+\S|(?:chapter|part|unit|lecture|module|section)\s+[0-9ivxlcdm]+\b)/i;

/** Normalizes line endings and whitespace without changing the content. */
export function normalizeSource(raw: string): string {
  return (raw ?? "")
    .replace(/\r\n?/g, "\n")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

/** True when `line` starts a natural break: a page marker, a form feed, or a heading. */
export function isBoundaryLine(line: string): boolean {
  const t = line.trim();
  if (!t) return false;
  if (line.startsWith("\f")) return true;
  return PAGE_MARKER.test(t) || HEADING.test(t);
}

/** Splits text into blocks that each start at a natural boundary (page break or heading). */
function splitIntoBlocks(text: string): string[] {
  const blocks: string[] = [];
  let current: string[] = [];
  for (const line of text.split("\n")) {
    if (isBoundaryLine(line) && current.some((l) => l.trim())) {
      blocks.push(current.join("\n"));
      current = [];
    }
    current.push(line);
  }
  if (current.some((l) => l.trim())) blocks.push(current.join("\n"));
  return blocks;
}

/** Breaks one oversized block at paragraph, then line, then sentence, then hard character limits. */
function splitOversized(block: string, max: number): string[] {
  if (block.length <= max) return [block];
  // Lookbehind splits keep the separator at the end of each part, so no text is lost.
  const separators = [/(?<=\n\n)/, /(?<=\n)/, /(?<=[.!?] )/];
  for (const sep of separators) {
    const parts = block.split(sep);
    if (parts.length < 2) continue;
    const out: string[] = [];
    let cur = "";
    for (const part of parts) {
      const piece = cur + part;
      if (piece.length <= max) {
        cur = piece;
        continue;
      }
      if (cur) out.push(cur);
      cur = part;
    }
    if (cur) out.push(cur);
    // Recurse on any piece still too large (one huge paragraph / line).
    return out.flatMap((p) => (p.length > max ? splitOversized(p, max) : [p]));
  }
  const out: string[] = [];
  for (let i = 0; i < block.length; i += max) out.push(block.slice(i, i + max));
  return out;
}

/**
 * Splits `raw` into ordered sections of about `targetChars` characters, preferring to cut at
 * page markers, form feeds and headings. Sections never exceed `targetChars * 1.25` (unless a
 * single unbreakable run is longer, which is then hard-split at `targetChars`). A tiny trailing
 * section is merged into the previous one. No text is dropped: only whitespace at cut points
 * can change.
 */
export function splitIntoSections(raw: string, targetChars: number = SECTION_TARGET_CHARS): string[] {
  const text = normalizeSource(raw);
  if (!text) return [];
  if (text.length <= targetChars) return [text];

  const hardMax = Math.floor(targetChars * 1.25);
  const blocks = splitIntoBlocks(text).flatMap((b) => splitOversized(b, targetChars));

  const sections: string[] = [];
  let cur = "";
  for (const block of blocks) {
    if (!cur) {
      cur = block;
      continue;
    }
    const merged = cur + "\n" + block;
    // Close the section once it reaches the target; allow a little overflow to keep a block whole.
    if (cur.length >= targetChars || merged.length > hardMax) {
      sections.push(cur);
      cur = block;
    } else {
      cur = merged;
    }
  }
  if (cur) sections.push(cur);

  // Merge a small tail (< 25% of target) into the previous section when it still fits.
  if (sections.length > 1) {
    const last = sections[sections.length - 1];
    const prev = sections[sections.length - 2];
    if (last.length < targetChars * 0.25 && prev.length + 1 + last.length <= hardMax) {
      sections.splice(sections.length - 2, 2, prev + "\n" + last);
    }
  }
  return sections.map((s) => s.trim()).filter(Boolean);
}

/** Splits `total` items as evenly as possible over `buckets` (earlier buckets get the remainder). */
export function allocateEvenly(total: number, buckets: number): number[] {
  if (buckets <= 0) return [];
  const t = Math.max(0, Math.floor(total));
  const base = Math.floor(t / buckets);
  const extra = t % buckets;
  return Array.from({ length: buckets }, (_, i) => base + (i < extra ? 1 : 0));
}

/**
 * Shrinks a section's study notes to the lines that carry the most learning value (headings,
 * table rows, bullets, callouts, formulas) when it is longer than `maxChars`. Used to fit many
 * sections into a small number of flashcard / quiz calls while still covering every section.
 */
export function condenseNotes(markdown: string, maxChars: number): string {
  const text = normalizeSource(markdown);
  if (text.length <= maxChars) return text;
  const keep = text.split("\n").filter((line) => {
    const t = line.trim();
    return (
      /^#{1,6}\s/.test(t) ||
      t.startsWith("|") ||
      /^[-*•]\s/.test(t) ||
      /^\d+[.)]\s/.test(t) ||
      t.startsWith(">") ||
      t.startsWith("$$") ||
      t.includes("**")
    );
  });
  const condensed = keep.join("\n");
  // Too little structure to pick from (plain prose): fall back to the head of the text.
  const source = keep.length >= 3 ? condensed : text;
  return source.length <= maxChars ? source : source.slice(0, maxChars).replace(/\n[^\n]*$/, "");
}

/**
 * Packs ordered parts into consecutive groups whose joined length (with `separatorLength`
 * between parts) stays within `maxChars`. Returns the part indexes of each group; a part is
 * never split, so one oversized part forms its own group.
 */
export function packIntoGroups(parts: string[], maxChars: number, separatorLength = 2): number[][] {
  const groups: number[][] = [];
  let cur: number[] = [];
  let len = 0;
  parts.forEach((part, i) => {
    const add = (cur.length ? separatorLength : 0) + part.length;
    if (cur.length && len + add > maxChars) {
      groups.push(cur);
      cur = [];
      len = 0;
    }
    len += (cur.length ? separatorLength : 0) + part.length;
    cur.push(i);
  });
  if (cur.length) groups.push(cur);
  return groups;
}
