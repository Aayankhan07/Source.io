/**
 * Central query-key registry.
 *
 * Realtime subscriptions invalidate these same keys, so defining them in one
 * place keeps the fetch sites and the invalidation sites from drifting apart.
 */
export const queryKeys = {
  documents: ["documents"] as const,
  document: (docId: string) => ["document", docId] as const,
  assets: (docId: string) => ["assets", docId] as const,
  podcast: (docId: string) => ["podcast", docId] as const,
  chat: (docId: string) => ["chat", docId] as const,
  chunkCount: (docId: string) => ["chunk-count", docId] as const,
};

/** Dashboard + account keys (scoped by user so a sign-out never shows another account's cache). */
export const accountKeys = {
  profileTier: (userId: string | undefined) => ["profile-tier", userId] as const,
  dashboardTelemetry: (userId: string | undefined) => ["dashboard-telemetry", userId] as const,
  weeklyProgress: (userId: string | undefined, weekStartIso: string) =>
    ["weekly-progress", userId, weekStartIso] as const,
  /** Saved BYOK keys (provider + last 4 only), from the api_keys edge function. */
  apiKeys: (userId: string | undefined) => ["user_api_keys", userId] as const,
  /** Today's AI-action usage shown in the quota pill. */
  dailyUsage: (userId: string | undefined) => ["daily_ai_actions_usage", userId] as const,
  /** Number of documents the user owns (plan document limit). */
  documentCount: (userId: string | undefined) => ["active_saved_documents_count", userId] as const,
  /** Plan tier + daily quota limits from profiles (settings pages). */
  profileQuotas: (userId: string | undefined) => ["profile-quotas", userId] as const,
};

/** Learning-progress keys (Leitner reviews, quiz attempts, chat history), scoped by user. */
export const learningKeys = {
  /** Prefix for every flashcard-review query of a user (dashboard + per-document). */
  reviewsRoot: (userId: string | undefined) => ["flashcard-reviews", userId] as const,
  documentReviews: (userId: string | undefined, docId: string) =>
    ["flashcard-reviews", userId, "doc", docId] as const,
  leitnerBoxes: (userId: string | undefined) => ["flashcard-reviews", userId, "boxes"] as const,
  quizBest: (userId: string | undefined, quizId: string) => ["quiz-best", userId, quizId] as const,
  chatHistory: (userId: string | undefined, docId: string) => ["chat-history", userId, docId] as const,
};
