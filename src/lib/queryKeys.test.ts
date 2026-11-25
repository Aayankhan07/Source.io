import { describe, it, expect } from "vitest";
import { queryKeys, accountKeys, learningKeys } from "./queryKeys";

describe("query keys", () => {
  it("scopes document keys by document id", () => {
    expect(queryKeys.documents).toEqual(["documents"]);
    expect(queryKeys.document("d")).toEqual(["document", "d"]);
    expect(queryKeys.assets("d")).toEqual(["assets", "d"]);
    expect(queryKeys.podcast("d")).toEqual(["podcast", "d"]);
    expect(queryKeys.chat("d")).toEqual(["chat", "d"]);
    expect(queryKeys.chunkCount("d")).toEqual(["chunk-count", "d"]);
  });

  it("scopes account keys by user id", () => {
    expect(accountKeys.profileTier("u")).toEqual(["profile-tier", "u"]);
    expect(accountKeys.dashboardTelemetry("u")).toEqual(["dashboard-telemetry", "u"]);
    expect(accountKeys.weeklyProgress("u", "2026-01-05")).toEqual(["weekly-progress", "u", "2026-01-05"]);
    expect(accountKeys.apiKeys("u")).toEqual(["user_api_keys", "u"]);
    expect(accountKeys.dailyUsage("u")).toEqual(["daily_ai_actions_usage", "u"]);
    expect(accountKeys.documentCount("u")).toEqual(["active_saved_documents_count", "u"]);
    expect(accountKeys.profileQuotas(undefined)).toEqual(["profile-quotas", undefined]);
  });

  it("keeps every flashcard-review key under the user's reviews root", () => {
    const root = learningKeys.reviewsRoot("u");
    for (const key of [learningKeys.documentReviews("u", "d"), learningKeys.leitnerBoxes("u"), learningKeys.dueSummary("u")]) {
      expect(key.slice(0, root.length)).toEqual([...root]);
    }
    expect(learningKeys.quizBest("u", "q")).toEqual(["quiz-best", "u", "q"]);
    expect(learningKeys.chatHistory("u", "d")).toEqual(["chat-history", "u", "d"]);
    expect(learningKeys.studyStreak("u")).toEqual(["study-streak", "u"]);
  });
});
