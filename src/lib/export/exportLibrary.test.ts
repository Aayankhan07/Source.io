import { describe, it, expect, vi, afterEach } from "vitest";
import {
  exportFileName,
  exportLibrary,
  shapeLibraryExport,
  type ExportSource,
  type RawLibrary,
} from "./exportLibrary";

function fixture(): RawLibrary {
  return {
    documents: [
      { id: "d2", title: "Second", source_type: "text", created_at: "2026-11-02T00:00:00Z", raw_text: "two" },
      { id: "d1", title: "First", source_type: "pdf", created_at: "2026-11-01T00:00:00Z", raw_text: "one" },
    ],
    notes: [
      { id: "n1", document_id: "d1", markdown: "# One", created_at: "2026-11-01T01:00:00Z", updated_at: "2026-11-01T01:00:00Z" },
    ],
    flashcards: [
      { id: "c2", document_id: "d1", front: "Q2", back: "A2", order_index: 1 },
      { id: "c1", document_id: "d1", front: "Q1", back: "A1", order_index: 0 },
      { id: "c3", document_id: "d2", front: "Q3", back: "A3", order_index: 0 },
    ],
    quizzes: [{ id: "q1", document_id: "d2", title: "Quiz", created_at: "2026-11-02T01:00:00Z" }],
    quizQuestions: [
      { id: "qq2", quiz_id: "q1", question: "B?", type: "mcq", choices: ["x", "y"], correct: "x", explanation: null, order_index: 1 },
      { id: "qq1", quiz_id: "q1", question: "A?", type: "true_false", choices: null, correct: "true", explanation: "because", order_index: 0 },
    ],
    podcasts: [
      { id: "p1", document_id: "d1", status: "ready", script: "Hello", audio_url: "https://x/a.mp3", created_at: "2026-11-01T02:00:00Z" },
    ],
    chatMessages: [
      { id: "m2", document_id: "d1", role: "assistant", content: "Hi", created_at: "2026-11-01T03:00:01Z" },
      { id: "m1", document_id: "d1", role: "user", content: "Hey", created_at: "2026-11-01T03:00:00Z" },
      // Orphan (document deleted between reads) must not appear.
      { id: "m3", document_id: "gone", role: "user", content: "?", created_at: "2026-11-01T03:00:00Z" },
    ],
  };
}

describe("shapeLibraryExport", () => {
  const now = new Date("2026-11-26T10:00:00Z");

  it("nests every child row under its document, ordered", () => {
    const out = shapeLibraryExport(fixture(), now);

    expect(out.format).toBe("sourceio-library-export");
    expect(out.exported_at).toBe("2026-11-26T10:00:00.000Z");
    expect(out.documents.map((d) => d.id)).toEqual(["d1", "d2"]);

    const [d1, d2] = out.documents;
    expect(d1.raw_text).toBe("one");
    expect(d1.notes).toEqual([
      { id: "n1", markdown: "# One", created_at: "2026-11-01T01:00:00Z", updated_at: "2026-11-01T01:00:00Z" },
    ]);
    expect(d1.flashcards.map((c) => c.id)).toEqual(["c1", "c2"]);
    expect(d1.podcasts[0]).toMatchObject({ script: "Hello", audio_url: "https://x/a.mp3" });
    expect(d1.chat_messages.map((m) => m.id)).toEqual(["m1", "m2"]);
    expect(d1.quizzes).toEqual([]);

    expect(d2.flashcards.map((c) => c.id)).toEqual(["c3"]);
    expect(d2.quizzes).toHaveLength(1);
    expect(d2.quizzes[0].questions.map((q) => q.id)).toEqual(["qq1", "qq2"]);
    expect(d2.quizzes[0].questions[0]).not.toHaveProperty("quiz_id");
    expect(d2.notes).toEqual([]);
  });

  it("drops the redundant document_id and reports accurate counts", () => {
    const out = shapeLibraryExport(fixture(), now);
    expect(out.documents[0].notes[0]).not.toHaveProperty("document_id");
    expect(out.counts).toEqual({
      documents: 2,
      notes: 1,
      flashcards: 3,
      quizzes: 1,
      quiz_questions: 2,
      podcasts: 1,
      chat_messages: 2,
    });
  });

  it("handles an empty library", () => {
    const empty: RawLibrary = {
      documents: [],
      notes: [],
      flashcards: [],
      quizzes: [],
      quizQuestions: [],
      podcasts: [],
      chatMessages: [],
    };
    const out = shapeLibraryExport(empty, now);
    expect(out.documents).toEqual([]);
    expect(out.counts.documents).toBe(0);
  });
});

describe("exportFileName", () => {
  it("uses sourceio-export-YYYY-MM-DD.json in local time", () => {
    expect(exportFileName(new Date(2026, 0, 5, 12))).toBe("sourceio-export-2026-01-05.json");
  });
});

describe("exportLibrary", () => {
  afterEach(() => vi.restoreAllMocks());

  it("loads from the fetch layer and downloads a single JSON file", async () => {
    const source: ExportSource = { load: vi.fn().mockResolvedValue(fixture()) };
    const createUrl = vi.fn().mockReturnValue("blob:test");
    Object.assign(URL, { createObjectURL: createUrl, revokeObjectURL: vi.fn() });
    const click = vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => {});

    const out = await exportLibrary(source, new Date(2026, 10, 26, 9));

    expect(source.load).toHaveBeenCalledOnce();
    expect(out.counts.documents).toBe(2);
    expect(createUrl).toHaveBeenCalledOnce();
    const blob = createUrl.mock.calls[0][0] as Blob;
    expect(blob.type).toBe("application/json");
    expect(click).toHaveBeenCalledOnce();
    const anchor = click.mock.instances[0] as unknown as HTMLAnchorElement;
    expect(anchor.download).toBe("sourceio-export-2026-11-26.json");
  });

  it("propagates fetch errors without downloading", async () => {
    const source: ExportSource = { load: vi.fn().mockRejectedValue(new Error("RLS denied")) };
    const click = vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => {});
    await expect(exportLibrary(source)).rejects.toThrow("RLS denied");
    expect(click).not.toHaveBeenCalled();
  });
});
