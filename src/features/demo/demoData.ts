/**
 * Static data for the public demo at /demo/<slug>.
 *
 * Everything here is bundled at build time from mockDocuments.ts. Nothing in
 * src/features/demo may import the Supabase client or call the backend.
 */
import { DEMO_DOCUMENTS, type DemoDocumentData } from "@/features/documents/data/mockDocuments";

export const DEMO_TABS = ["notes", "flashcards", "quiz", "audio", "chat"] as const;
export type DemoTab = (typeof DEMO_TABS)[number];

export const DEMO_TAB_LABELS: Record<DemoTab, string> = {
  notes: "Notes",
  flashcards: "Flashcards",
  quiz: "Quiz",
  audio: "Audio",
  chat: "Chat",
};

export interface DemoSample {
  slug: string;
  data: DemoDocumentData;
  summary: string;
}

const LEGACY_PREFIX = "demo-";

const SUMMARIES: Record<string, string> = {
  quantum: "Superposition, entanglement and decoherence, with a classical vs quantum comparison table.",
  linalg: "Eigenvalues, eigenvectors, the characteristic equation and diagonalization.",
  networking: "ALOHA, CSMA/CD, CSMA/CA, token passing and channelization (FDMA, TDMA, CDMA).",
};

export const DEMO_SAMPLES: DemoSample[] = Object.entries(DEMO_DOCUMENTS).map(([id, data]) => {
  const slug = id.startsWith(LEGACY_PREFIX) ? id.slice(LEGACY_PREFIX.length) : id;
  return { slug, data, summary: SUMMARIES[slug] ?? data.document.title };
});

export function getDemoSample(slug: string): DemoSample | undefined {
  return DEMO_SAMPLES.find((s) => s.slug === slug);
}

/** Maps legacy workspace `?tab=` values (notes, cards, quiz, podcast, chat) to demo tabs. */
export function demoTabFromQuery(tab: string | null | undefined): DemoTab | undefined {
  switch (tab) {
    case "notes":
      return "notes";
    case "cards":
    case "flashcards":
      return "flashcards";
    case "quiz":
      return "quiz";
    case "podcast":
    case "audio":
      return "audio";
    case "chat":
      return "chat";
    default:
      return undefined;
  }
}

/** /app/doc/demo-quantum -> /demo/quantum. Unknown legacy ids (e.g. demo-biology) go to the demo index. */
export function demoUrlForLegacyId(legacyId: string, tab?: DemoTab): string {
  const slug = legacyId.startsWith(LEGACY_PREFIX) ? legacyId.slice(LEGACY_PREFIX.length) : legacyId;
  if (!getDemoSample(slug)) return "/demo";
  return tab && tab !== "notes" ? `/demo/${slug}?tab=${tab}` : `/demo/${slug}`;
}

export interface DemoScriptLine {
  speaker: string;
  text: string;
  timestamp?: string;
}

export function parseDemoScript(script: string | null | undefined): DemoScriptLine[] {
  if (!script) return [];
  try {
    const parsed: unknown = JSON.parse(script);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (l): l is DemoScriptLine =>
        !!l && typeof l === "object" && typeof (l as DemoScriptLine).speaker === "string" && typeof (l as DemoScriptLine).text === "string",
    );
  } catch {
    return [];
  }
}
