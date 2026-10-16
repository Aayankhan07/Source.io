// src/types/customization.ts
// Source.io Role-Adaptive & Customization Contracts

export type UserRole =
  | "school_student"
  | "high_school"
  | "undergrad"
  | "scholar"
  | "researcher"
  | "teacher"
  | "custom";

export type StudyModeId = "notes" | "flashcards" | "cards" | "quiz" | "podcast" | "ask";

export type NoteFormatStyle =
  | "simplified_eli12"     // School Student
  | "cornell_exam"         // High School
  | "executive_proofs"     // Undergrad / Scholar
  | "literature_critique"  // Researcher
  | "lesson_plan"          // Teacher
  | "custom_modular";      // Custom

export type CitationStyle =
  | "simple_page"          // [Page 14]
  | "coordinate_pills"     // [p. 14, ¶3]
  | "apa_7"                // (Author et al., 2024, p. 14)
  | "ieee"                 // [1, p. 14]
  | "exact_coordinate"     // [p. 14, ¶3:L12]
  | "apa"
  | "mla"
  | "chicago"
  | "bibtex"
  | "harvard";

export type QuizStyle =
  | "simple_check"
  | "diagnostic_mcq"
  | "case_vignettes"
  | "exam_rubric_builder";

export type FlashcardAlgorithm = "simple_flip" | "leitner_5_box";

export type PodcastStyle =
  | "storyteller_explainer"
  | "socratic_debate"
  | "methodology_review"
  | "lecture_monologue";

export interface NoteSectionToggles {
  executiveOverview: boolean;
  mathProofs: boolean;
  contrastTables: boolean;
  misconceptions: boolean;
  analogies: boolean;
  discussionPrompts: boolean;
  actionItems: boolean;
}

export interface WorkspacePreferences {
  enabledModes: StudyModeId[];
  defaultMode: StudyModeId;
  noteFormat: NoteFormatStyle;
  noteSections: NoteSectionToggles;
  rigorLevel: 1 | 2 | 3 | 4 | 5;
  citationStyle: CitationStyle;
  quizStyle: QuizStyle;
  flashcardAlgorithm: FlashcardAlgorithm;
  podcastStyle: PodcastStyle;
  customSystemInstruction?: string;
}

export interface UserProfileCustomization {
  user_role: UserRole;
  onboarding_completed: boolean;
  workspace_preferences: WorkspacePreferences;
}

/** Pre-configured role defaults applied during onboarding or preset resets */
export const ROLE_PRESETS: Record<UserRole, WorkspacePreferences> = {
  school_student: {
    enabledModes: ["notes", "flashcards", "quiz", "ask"],
    defaultMode: "notes",
    noteFormat: "simplified_eli12",
    noteSections: {
      executiveOverview: true,
      mathProofs: false,
      contrastTables: true,
      misconceptions: true,
      analogies: true,
      discussionPrompts: false,
      actionItems: true,
    },
    rigorLevel: 1,
    citationStyle: "simple_page",
    quizStyle: "simple_check",
    flashcardAlgorithm: "simple_flip",
    podcastStyle: "storyteller_explainer",
    customSystemInstruction: "",
  },
  high_school: {
    enabledModes: ["notes", "flashcards", "quiz", "podcast", "ask"],
    defaultMode: "notes",
    noteFormat: "cornell_exam",
    noteSections: {
      executiveOverview: true,
      mathProofs: true,
      contrastTables: true,
      misconceptions: true,
      analogies: true,
      discussionPrompts: true,
      actionItems: false,
    },
    rigorLevel: 2,
    citationStyle: "coordinate_pills",
    quizStyle: "diagnostic_mcq",
    flashcardAlgorithm: "leitner_5_box",
    podcastStyle: "socratic_debate",
    customSystemInstruction: "",
  },
  undergrad: {
    enabledModes: ["notes", "flashcards", "quiz", "podcast", "ask"],
    defaultMode: "notes",
    noteFormat: "executive_proofs",
    noteSections: {
      executiveOverview: true,
      mathProofs: true,
      contrastTables: true,
      misconceptions: true,
      analogies: false,
      discussionPrompts: false,
      actionItems: false,
    },
    rigorLevel: 3,
    citationStyle: "coordinate_pills",
    quizStyle: "diagnostic_mcq",
    flashcardAlgorithm: "leitner_5_box",
    podcastStyle: "socratic_debate",
    customSystemInstruction: "",
  },
  scholar: {
    enabledModes: ["notes", "flashcards", "quiz", "podcast", "ask"],
    defaultMode: "notes",
    noteFormat: "executive_proofs",
    noteSections: {
      executiveOverview: true,
      mathProofs: true,
      contrastTables: true,
      misconceptions: true,
      analogies: false,
      discussionPrompts: false,
      actionItems: false,
    },
    rigorLevel: 4,
    citationStyle: "exact_coordinate",
    quizStyle: "case_vignettes",
    flashcardAlgorithm: "leitner_5_box",
    podcastStyle: "socratic_debate",
    customSystemInstruction: "",
  },
  researcher: {
    enabledModes: ["notes", "podcast", "ask"],
    defaultMode: "notes",
    noteFormat: "literature_critique",
    noteSections: {
      executiveOverview: true,
      mathProofs: true,
      contrastTables: true,
      misconceptions: true,
      analogies: false,
      discussionPrompts: false,
      actionItems: false,
    },
    rigorLevel: 5,
    citationStyle: "apa_7",
    quizStyle: "case_vignettes",
    flashcardAlgorithm: "leitner_5_box",
    podcastStyle: "methodology_review",
    customSystemInstruction: "",
  },
  teacher: {
    enabledModes: ["notes", "flashcards", "quiz", "ask"],
    defaultMode: "notes",
    noteFormat: "lesson_plan",
    noteSections: {
      executiveOverview: true,
      mathProofs: true,
      contrastTables: true,
      misconceptions: true,
      analogies: true,
      discussionPrompts: true,
      actionItems: true,
    },
    rigorLevel: 3,
    citationStyle: "coordinate_pills",
    quizStyle: "exam_rubric_builder",
    flashcardAlgorithm: "simple_flip",
    podcastStyle: "lecture_monologue",
    customSystemInstruction: "",
  },
  custom: {
    enabledModes: ["notes", "flashcards", "quiz", "podcast", "ask"],
    defaultMode: "notes",
    noteFormat: "custom_modular",
    noteSections: {
      executiveOverview: true,
      mathProofs: true,
      contrastTables: true,
      misconceptions: true,
      analogies: false,
      discussionPrompts: false,
      actionItems: false,
    },
    rigorLevel: 3,
    citationStyle: "coordinate_pills",
    quizStyle: "diagnostic_mcq",
    flashcardAlgorithm: "leitner_5_box",
    podcastStyle: "socratic_debate",
    customSystemInstruction: "",
  },
};

/** Contextual Tab Labels adapted to each academic role */
export const TAB_LABELS: Record<UserRole, Record<StudyModeId, string>> = {
  school_student: { notes: "Study Guide", flashcards: "Word Cards", cards: "Word Cards", quiz: "Practice Check", podcast: "Audio Story", ask: "Ask Tutor" },
  high_school:    { notes: "Cornell Notes", flashcards: "Flashcards", cards: "Flashcards", quiz: "Exam Practice", podcast: "Audio Recap", ask: "Ask Copilot" },
  undergrad:      { notes: "Notes", flashcards: "Flashcards", cards: "Flashcards", quiz: "Quiz", podcast: "Podcast", ask: "Ask Copilot" },
  scholar:        { notes: "Synthesis", flashcards: "Leitner Deck", cards: "Leitner Deck", quiz: "Board Quiz", podcast: "Seminar Audio", ask: "Ask Copilot" },
  researcher:     { notes: "Lit Review", flashcards: "Key Claims", cards: "Key Claims", quiz: "Method Audit", podcast: "Paper Colloquium", ask: "Query Corpus" },
  teacher:        { notes: "Lesson Plan", flashcards: "Handout Cards", cards: "Handout Cards", quiz: "Exam Builder", podcast: "Lecture Audio", ask: "Curriculum Assistant" },
  custom:         { notes: "Notes", flashcards: "Flashcards", cards: "Flashcards", quiz: "Quiz", podcast: "Podcast", ask: "Ask Copilot" },
};

export const ROLE_METADATA: Record<UserRole, { label: string; badge: string; desc: string; iconName: string }> = {
  undergrad: {
    label: "Bachelor's / Undergrad",
    badge: "College",
    desc: "Lectures, proofs, KaTeX derivations & exam synthesis.",
    iconName: "GraduationCap",
  },
  high_school: {
    label: "High School (AP / IB / A-Level)",
    badge: "Exam Board",
    desc: "Cornell syllabus notes, step-by-step examples & exam traps.",
    iconName: "BookOpen",
  },
  school_student: {
    label: "School Student (Grades 6–8)",
    badge: "Junior",
    desc: "Simple analogies, bold definitions & visual guides.",
    iconName: "Smile",
  },
  scholar: {
    label: "Scholar / Postgrad",
    badge: "Grad / Med / Law",
    desc: "Dense monographs, clinical & legal differentials, high rigor.",
    iconName: "Library",
  },
  researcher: {
    label: "Researcher / PhD",
    badge: "Faculty / PI",
    desc: "IMRaD literature critique, methodology audits & APA/IEEE citations.",
    iconName: "Microscope",
  },
  teacher: {
    label: "Teacher / Educator",
    badge: "Instructor",
    desc: "Lesson plans, timed lecture pacing, exam rubrics & handouts.",
    iconName: "Presentation",
  },
  custom: {
    label: "Custom / Self-Learner",
    badge: "Independent",
    desc: "Modular control over all note blocks, tabs, and AI rigor.",
    iconName: "Sliders",
  },
};
