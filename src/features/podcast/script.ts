// Client port of supabase/functions/generate_podcast/script.ts — keep the two in sync.
// The server validates scripts with the same rules before saving them.

export type Speaker = "host_1" | "host_2";
export type Segment = { speaker: Speaker; text: string };

export const MAX_SEGMENTS = 24;

/** Parses "Host 1: ... / Host 2: ..." dialogue. Throws INVALID_SCRIPT_FORMAT like the server. */
export function parseScript(script: string): Segment[] {
  const segments: Segment[] = [];
  for (const rawLine of script.split("\n")) {
    const line = rawLine.trim();
    if (!line) continue;
    const h1 = line.match(/^Host\s*1\s*:\s*(.+)$/i);
    if (h1) {
      segments.push({ speaker: "host_1", text: h1[1].trim() });
      continue;
    }
    const h2 = line.match(/^Host\s*2\s*:\s*(.+)$/i);
    if (h2) {
      segments.push({ speaker: "host_2", text: h2[1].trim() });
      continue;
    }
    if (segments.length > 0) {
      segments[segments.length - 1].text = `${segments[segments.length - 1].text} ${line}`.trim();
    }
  }

  const cleaned = segments.filter((segment) => segment.text.length > 0).slice(0, MAX_SEGMENTS);
  const speakers = new Set(cleaned.map((segment) => segment.speaker));
  if (cleaned.length < 2 || !speakers.has("host_1") || !speakers.has("host_2")) {
    throw new Error("INVALID_SCRIPT_FORMAT");
  }
  return cleaned;
}

/** Same as parseScript, but returns null instead of throwing (for rendering in the UI). */
export function tryParseScript(script: string | null | undefined): Segment[] | null {
  if (!script) return null;
  try {
    return parseScript(script);
  } catch {
    return null;
  }
}
