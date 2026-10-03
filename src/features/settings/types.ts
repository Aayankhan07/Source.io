export type NotesDepth = "comprehensive" | "concise" | "feynman";
export type QuizDifficulty = "easy" | "moderate" | "challenging";
export type PreferredModel = "llama-3.3-70b" | "llama-3.1-8b" | "gemini-2.0-flash" | "gpt-4o-mini";
export type PodcastVoiceDuo = "chen-marcus" | "rachel-alex" | "emma-daniel";
export type AppTheme = "light" | "dark" | "system";
export type AccentColor = "slate" | "sky" | "emerald" | "violet";

export interface GeneralSettings {
  displayName: string;
  notesDepth: NotesDepth;
  flashcardBatchSize: number;
  quizDifficulty: QuizDifficulty;
  preferredModel: PreferredModel;
  apiKeys: {
    groq?: string;
    gemini?: string;
    openai?: string;
  };
  podcastVoiceDuo: PodcastVoiceDuo;
  playbackSpeed: number;
  autoGeneratePodcast: boolean;
  theme: AppTheme;
  accentColor: AccentColor;
  readingTargetWpm: number;
}

export type NotesFontSize = "compact" | "regular" | "large";
export type NotesFontFamily = "sans" | "serif" | "mono";
export type NotesLineHeight = "tight" | "normal" | "relaxed";
export type RegenerationTone = "academic" | "simplified" | "exam-prep";

export interface NotesViewSettings {
  fontSize: NotesFontSize;
  fontFamily: NotesFontFamily;
  lineHeight: NotesLineHeight;
  renderKaTeX: boolean;
  showCodeLineNumbers: boolean;
  showPageSummaryBanner: boolean;
  autoScrollOutline: boolean;
  outlineDefaultState: "expanded" | "retracted";
  regenerationTone: RegenerationTone;
}

export const DEFAULT_GENERAL_SETTINGS: GeneralSettings = {
  displayName: "Scholar",
  notesDepth: "comprehensive",
  flashcardBatchSize: 15,
  quizDifficulty: "moderate",
  preferredModel: "llama-3.3-70b",
  apiKeys: {},
  podcastVoiceDuo: "chen-marcus",
  playbackSpeed: 1.0,
  autoGeneratePodcast: false,
  theme: "system",
  accentColor: "slate",
  readingTargetWpm: 200,
};

export const DEFAULT_NOTES_SETTINGS: NotesViewSettings = {
  fontSize: "regular",
  fontFamily: "sans",
  lineHeight: "normal",
  renderKaTeX: true,
  showCodeLineNumbers: true,
  showPageSummaryBanner: true,
  autoScrollOutline: true,
  outlineDefaultState: "expanded",
  regenerationTone: "academic",
};

export interface SettingsContextType {
  settings: GeneralSettings;
  updateSettings: (partial: Partial<GeneralSettings>) => void;
  notesSettings: NotesViewSettings;
  updateNotesSettings: (partial: Partial<NotesViewSettings>) => void;
  resetSettings: () => void;
}
