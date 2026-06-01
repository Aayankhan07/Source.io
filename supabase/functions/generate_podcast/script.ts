export type Segment = { speaker: "host_1" | "host_2"; text: string };

const MAX_SEGMENTS = 24;

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