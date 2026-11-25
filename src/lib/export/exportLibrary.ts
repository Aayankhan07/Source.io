/**
 * Full library export (roadmap 2.2): everything the signed-in user owns, as one JSON file.
 *
 * Split into three layers so the shaping logic is testable without Supabase:
 * - fetch layer (`createSupabaseExportSource`) — RLS limits every read to the caller's own rows
 * - pure shaping (`shapeLibraryExport`)
 * - browser download (`downloadJson`)
 */
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";

type Tables = Database["public"]["Tables"];
type Row<T extends keyof Tables> = Tables[T]["Row"];

export type ExportDocument = Pick<Row<"documents">, "id" | "title" | "source_type" | "created_at" | "raw_text">;
export type ExportNote = Pick<Row<"notes">, "id" | "document_id" | "markdown" | "created_at" | "updated_at">;
export type ExportFlashcard = Pick<Row<"flashcards">, "id" | "document_id" | "front" | "back" | "order_index">;
export type ExportQuiz = Pick<Row<"quizzes">, "id" | "document_id" | "title" | "created_at">;
export type ExportQuizQuestion = Pick<
  Row<"quiz_questions">,
  "id" | "quiz_id" | "question" | "type" | "choices" | "correct" | "explanation" | "order_index"
>;
export type ExportPodcast = Pick<Row<"podcasts">, "id" | "document_id" | "status" | "script" | "audio_url" | "created_at">;
export type ExportChatMessage = Pick<Row<"chat_messages">, "id" | "document_id" | "role" | "content" | "created_at">;

export interface RawLibrary {
  documents: ExportDocument[];
  notes: ExportNote[];
  flashcards: ExportFlashcard[];
  quizzes: ExportQuiz[];
  quizQuestions: ExportQuizQuestion[];
  podcasts: ExportPodcast[];
  chatMessages: ExportChatMessage[];
}

/** Anything that can produce the user's raw rows. Swapped for a fake in tests. */
export interface ExportSource {
  load(): Promise<RawLibrary>;
}

type NoDocId<T> = Omit<T, "document_id">;

export interface LibraryExportDocument extends ExportDocument {
  notes: NoDocId<ExportNote>[];
  flashcards: NoDocId<ExportFlashcard>[];
  quizzes: (NoDocId<ExportQuiz> & { questions: Omit<ExportQuizQuestion, "quiz_id">[] })[];
  podcasts: NoDocId<ExportPodcast>[];
  chat_messages: NoDocId<ExportChatMessage>[];
}

export interface LibraryExport {
  format: "sourceio-library-export";
  version: 1;
  exported_at: string;
  counts: Record<"documents" | "notes" | "flashcards" | "quizzes" | "quiz_questions" | "podcasts" | "chat_messages", number>;
  documents: LibraryExportDocument[];
}

function groupBy<T, K extends string>(rows: T[], key: (row: T) => K): Map<K, T[]> {
  const map = new Map<K, T[]>();
  for (const row of rows) {
    const k = key(row);
    const list = map.get(k);
    if (list) list.push(row);
    else map.set(k, [row]);
  }
  return map;
}

function stripDocId<T extends { document_id: string }>(row: T): NoDocId<T> {
  const { document_id: _documentId, ...rest } = row;
  void _documentId;
  return rest;
}

const byOrder = (a: { order_index: number }, b: { order_index: number }) => a.order_index - b.order_index;
const byCreated = (a: { created_at: string }, b: { created_at: string }) => a.created_at.localeCompare(b.created_at);

/** Pure: nests every child row under its document. Rows whose document is missing are dropped. */
export function shapeLibraryExport(raw: RawLibrary, exportedAt: Date): LibraryExport {
  const notesByDoc = groupBy(raw.notes, (r) => r.document_id);
  const cardsByDoc = groupBy(raw.flashcards, (r) => r.document_id);
  const quizzesByDoc = groupBy(raw.quizzes, (r) => r.document_id);
  const questionsByQuiz = groupBy(raw.quizQuestions, (r) => r.quiz_id);
  const podcastsByDoc = groupBy(raw.podcasts, (r) => r.document_id);
  const chatByDoc = groupBy(raw.chatMessages, (r) => r.document_id);

  const documents = [...raw.documents].sort(byCreated).map(
    (doc): LibraryExportDocument => ({
      id: doc.id,
      title: doc.title,
      source_type: doc.source_type,
      created_at: doc.created_at,
      raw_text: doc.raw_text,
      notes: (notesByDoc.get(doc.id) ?? []).slice().sort(byCreated).map(stripDocId),
      flashcards: (cardsByDoc.get(doc.id) ?? []).slice().sort(byOrder).map(stripDocId),
      quizzes: (quizzesByDoc.get(doc.id) ?? []).slice().sort(byCreated).map((quiz) => ({
        ...stripDocId(quiz),
        questions: (questionsByQuiz.get(quiz.id) ?? [])
          .slice()
          .sort(byOrder)
          .map(({ quiz_id: _quizId, ...q }) => {
            void _quizId;
            return q;
          }),
      })),
      podcasts: (podcastsByDoc.get(doc.id) ?? []).slice().sort(byCreated).map(stripDocId),
      chat_messages: (chatByDoc.get(doc.id) ?? []).slice().sort(byCreated).map(stripDocId),
    })
  );

  const sum = (pick: (d: LibraryExportDocument) => number) => documents.reduce((n, d) => n + pick(d), 0);

  return {
    format: "sourceio-library-export",
    version: 1,
    exported_at: exportedAt.toISOString(),
    counts: {
      documents: documents.length,
      notes: sum((d) => d.notes.length),
      flashcards: sum((d) => d.flashcards.length),
      quizzes: sum((d) => d.quizzes.length),
      quiz_questions: sum((d) => d.quizzes.reduce((n, q) => n + q.questions.length, 0)),
      podcasts: sum((d) => d.podcasts.length),
      chat_messages: sum((d) => d.chat_messages.length),
    },
    documents,
  };
}

/** `sourceio-export-YYYY-MM-DD.json` in the user's local date. */
export function exportFileName(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `sourceio-export-${y}-${m}-${d}.json`;
}

const PAGE_SIZE = 1000;

/** Reads every page of a query (PostgREST caps a single response at 1000 rows). */
async function fetchAll<T>(
  page: (from: number, to: number) => PromiseLike<{ data: T[] | null; error: { message: string } | null }>
): Promise<T[]> {
  const out: T[] = [];
  for (let from = 0; ; from += PAGE_SIZE) {
    const { data, error } = await page(from, from + PAGE_SIZE - 1);
    if (error) throw new Error(error.message);
    const rows = data ?? [];
    out.push(...rows);
    if (rows.length < PAGE_SIZE) return out;
  }
}

/** Fetch layer backed by Supabase. RLS restricts each table to the signed-in user's rows. */
export function createSupabaseExportSource(client: SupabaseClient<Database>): ExportSource {
  return {
    async load() {
      const [documents, notes, flashcards, quizzes, quizQuestions, podcasts, chatMessages] = await Promise.all([
        fetchAll<ExportDocument>((f, t) =>
          client.from("documents").select("id,title,source_type,created_at,raw_text").order("created_at").range(f, t)
        ),
        fetchAll<ExportNote>((f, t) =>
          client.from("notes").select("id,document_id,markdown,created_at,updated_at").order("created_at").range(f, t)
        ),
        fetchAll<ExportFlashcard>((f, t) =>
          client.from("flashcards").select("id,document_id,front,back,order_index").order("id").range(f, t)
        ),
        fetchAll<ExportQuiz>((f, t) =>
          client.from("quizzes").select("id,document_id,title,created_at").order("created_at").range(f, t)
        ),
        fetchAll<ExportQuizQuestion>((f, t) =>
          client
            .from("quiz_questions")
            .select("id,quiz_id,question,type,choices,correct,explanation,order_index")
            .order("id")
            .range(f, t)
        ),
        fetchAll<ExportPodcast>((f, t) =>
          client.from("podcasts").select("id,document_id,status,script,audio_url,created_at").order("created_at").range(f, t)
        ),
        fetchAll<ExportChatMessage>((f, t) =>
          client.from("chat_messages").select("id,document_id,role,content,created_at").order("created_at").range(f, t)
        ),
      ]);
      return { documents, notes, flashcards, quizzes, quizQuestions, podcasts, chatMessages };
    },
  };
}

/** Browser-only: triggers a download of `data` as pretty-printed JSON. */
export function downloadJson(data: unknown, fileName: string): void {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 0);
}

/** Loads, shapes, and downloads the library. Returns the export so callers can report counts. */
export async function exportLibrary(source: ExportSource, now: Date = new Date()): Promise<LibraryExport> {
  const raw = await source.load();
  const shaped = shapeLibraryExport(raw, now);
  downloadJson(shaped, exportFileName(now));
  return shaped;
}
