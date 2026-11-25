import type { Faq } from "./useCases";

export interface Alternative {
  slug: string;
  /** Competitor product name. */
  name: string;
  /** Path of the page that covers this comparison. NotebookLM reuses the existing /vs-notebooklm page. */
  path: string;
  h1: string;
  /** <= 60 characters. */
  metaTitle: string;
  /** <= 155 characters. */
  metaDescription: string;
  /** One-line summary for the index card. */
  summary: string;
  /** Neutral description of what the other product is. */
  whatItIs: string;
  /** Where the two products differ, stated without ranking. */
  differences: { topic: string; them: string; sourceio: string }[];
  chooseThem: string[];
  chooseSourceio: string[];
  faqs: Faq[];
  updated: string;
}

export const COMPARISON_DISCLAIMER =
  "This comparison reflects our understanding of each product in November 2026. Other products change often; check their own websites for current features and pricing.";

export const ALTERNATIVES: Alternative[] = [
  {
    slug: "quizlet",
    name: "Quizlet",
    path: "/alternatives/quizlet",
    h1: "Source.io and Quizlet: when to use which",
    metaTitle: "Quizlet Alternative for Studying Your Own PDFs | Source.io",
    metaDescription:
      "How Source.io and Quizlet differ: shared flashcard sets and study games versus notes, flashcards and quizzes generated from one document you upload.",
    summary: "Community flashcard sets and study games, compared with study material generated from your own document.",
    whatItIs:
      "Quizlet is a widely used flashcard platform. You can make your own sets or study sets other people have shared, using several study and game modes, on the web and in mobile apps.",
    differences: [
      {
        topic: "Where the content comes from",
        them: "Sets you write yourself or find among sets shared by other users.",
        sourceio: "Notes, flashcards and a quiz generated from one document you upload.",
      },
      {
        topic: "Checking answers against the source",
        them: "Depends on who wrote the set.",
        sourceio: "Chat answers list the passages of your document they used, with a similarity score.",
      },
      {
        topic: "Formats",
        them: "Focused on flashcard sets and study modes built from them.",
        sourceio: "Five modes from one source: notes, flashcards, practice quiz, audio recap and chat.",
      },
    ],
    chooseThem: [
      "You want ready-made sets for a common course or subject that someone has already shared.",
      "You like study games and want mobile apps for quick sessions.",
      "You prefer to write every card yourself.",
    ],
    chooseSourceio: [
      "Your material is a specific PDF, Word file, recording or set of readings, and you want study material from exactly that.",
      "You want to check where an answer came from before you learn it.",
      "You want notes, a practice quiz and an audio recap alongside the flashcards.",
    ],
    faqs: [
      {
        question: "Can I import Quizlet sets into Source.io?",
        answer: "No. Source.io generates material from documents, recordings and pasted text rather than importing flashcard sets.",
      },
      {
        question: "Can I use both?",
        answer:
          "Yes. Some students use shared sets for widely taught topics and Source.io for course-specific readings and lectures.",
      },
      {
        question: "Does Source.io have study games?",
        answer: "No. It has flashcards with Leitner scheduling and a practice quiz with explanations.",
      },
    ],
    updated: "2026-11-26",
  },
  {
    slug: "anki",
    name: "Anki",
    path: "/alternatives/anki",
    h1: "Source.io and Anki: when to use which",
    metaTitle: "Anki Alternative That Makes Cards from Your PDFs | Source.io",
    metaDescription:
      "Anki is a customisable spaced repetition app. Source.io makes flashcards with simple Leitner scheduling from your document, plus notes, quizzes and chat.",
    summary: "A highly customisable spaced repetition app, compared with generated cards and simpler Leitner scheduling.",
    whatItIs:
      "Anki is a free, open-source spaced repetition flashcard program with desktop apps and mobile apps. It is known for configurable scheduling, custom card templates, add-ons and shared decks.",
    differences: [
      {
        topic: "Making cards",
        them: "You write cards yourself or download shared decks. Formatting and templates are very flexible.",
        sourceio: "Cards are generated from the document you upload; you don't write them by hand.",
      },
      {
        topic: "Scheduling",
        them: "Configurable spaced repetition algorithms and settings.",
        sourceio: "A fixed Leitner 5-box system: Again, Good or Easy decides when a card comes back.",
      },
      {
        topic: "Beyond flashcards",
        them: "Focused on flashcards, extended by add-ons.",
        sourceio: "Notes, a practice quiz, an audio recap and source-checked chat from the same document.",
      },
    ],
    chooseThem: [
      "You keep large, long-term decks, such as for medicine or languages, and want fine control over scheduling.",
      "You want offline desktop study, add-ons or custom card templates.",
      "You already have decks you trust.",
    ],
    chooseSourceio: [
      "You want to go from a lecture or chapter to flashcards without writing the cards.",
      "You want notes, a quiz and chat with visible source passages for the same material.",
      "You prefer simple scheduling you don't need to configure.",
    ],
    faqs: [
      {
        question: "Can I export Source.io flashcards to Anki?",
        answer:
          "There is no Anki export. You can download all your generated material, including flashcards, as JSON from Settings, Data & Storage.",
      },
      {
        question: "Is Leitner scheduling as good as Anki's?",
        answer:
          "It is simpler. Leitner boxes are easy to understand and need no setup; Anki offers more control. Which suits you depends on how much you want to tune.",
      },
      {
        question: "What if a generated card is wrong?",
        answer:
          "Cards are generated by AI from your document and can contain mistakes. Ask about the point in chat and read the source passages it lists to check the card.",
      },
    ],
    updated: "2026-11-26",
  },
  {
    slug: "notebooklm",
    name: "NotebookLM",
    path: "/vs-notebooklm",
    h1: "Source.io and NotebookLM",
    metaTitle: "Source.io vs NotebookLM | Source.io",
    metaDescription: "How Source.io compares with Google NotebookLM for studying from your own sources.",
    summary: "Google's AI notebook for sources, compared on our dedicated comparison page.",
    whatItIs: "NotebookLM is Google's AI research and note-taking tool that works from sources you add.",
    differences: [],
    chooseThem: [],
    chooseSourceio: [],
    faqs: [],
    updated: "2026-11-26",
  },
  {
    slug: "knowt",
    name: "Knowt",
    path: "/alternatives/knowt",
    h1: "Source.io and Knowt: when to use which",
    metaTitle: "Knowt Alternative with Source-Checked Answers | Source.io",
    metaDescription:
      "Knowt and Source.io both turn study material into flashcards and notes. See how they differ and which fits the way you study.",
    summary: "Another AI study app for notes and flashcards; the difference is mostly in focus.",
    whatItIs:
      "Knowt is a study app that turns notes, documents and videos into flashcards and notes, and offers study modes and a library of shared content. It can also import sets from other flashcard apps.",
    differences: [
      {
        topic: "Focus",
        them: "A broad study platform with shared content and several study modes.",
        sourceio: "One source at a time, turned into five modes: notes, flashcards, quiz, audio recap and chat.",
      },
      {
        topic: "Checking answers",
        them: "See Knowt's own documentation for how it shows sources.",
        sourceio: "Every chat answer lists the passages it used, with a similarity score.",
      },
      {
        topic: "Audio",
        them: "See Knowt's own documentation.",
        sourceio: "A two-host audio recap, read aloud by your browser's built-in voices.",
      },
    ],
    chooseThem: [
      "You want to bring over existing flashcard sets from another app.",
      "You want access to content other students have shared.",
    ],
    chooseSourceio: [
      "You want to see the passages behind each chat answer and check them.",
      "You want an audio recap and a practice quiz with explanations from the same source.",
      "You want to work closely with one document at a time.",
    ],
    faqs: [
      {
        question: "Is Source.io free?",
        answer: "There is a free plan with daily limits and a paid Scholar Pass. See the pricing page for current limits.",
      },
      {
        question: "Can I import my Knowt or Quizlet sets?",
        answer: "No. Source.io generates material from documents, recordings and pasted text.",
      },
      {
        question: "Which file types does Source.io accept?",
        answer: "PDF, Word (.docx), audio and video files, YouTube links (beta) and pasted text.",
      },
    ],
    updated: "2026-11-26",
  },
];

/** Alternatives that have their own page under /alternatives/[slug]. */
export const ALTERNATIVE_PAGES = ALTERNATIVES.filter((a) => a.path === `/alternatives/${a.slug}`);

export function getAlternative(slug: string): Alternative | undefined {
  return ALTERNATIVES.find((a) => a.slug === slug);
}
