export type StudyMode = "notes" | "flashcards" | "quiz" | "audio" | "chat";

/** The five study modes, with the label used in the document workspace. */
export const STUDY_MODES: Record<StudyMode, { name: string; where: string; summary: string }> = {
  notes: {
    name: "Study notes",
    where: "Notes tab",
    summary: "Structured notes written from your source, with headings, key terms and formulas rendered as math.",
  },
  flashcards: {
    name: "Flashcards",
    where: "Flashcards tab",
    summary: "Question-and-answer cards scheduled with a Leitner 5-box system: cards you know move up a box and come back less often.",
  },
  quiz: {
    name: "Practice quiz",
    where: "Quiz tab",
    summary: "Practice questions on the material, each with an explanation of the answer.",
  },
  audio: {
    name: "Audio recap",
    where: "Podcast tab",
    summary: "A two-host conversation script about your source, read aloud by your browser's built-in voices.",
  },
  chat: {
    name: "Source chat",
    where: "Ask panel",
    summary: "Ask questions about the document. Each answer lists the source passages it used, with a similarity score you can check.",
  },
};

export const MODE_ORDER: StudyMode[] = ["notes", "flashcards", "quiz", "audio", "chat"];
