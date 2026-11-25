import { assertEquals } from "https://deno.land/std@0.224.0/assert/mod.ts";
import {
  buildCostReport,
  formatSlackText,
  isIsoDay,
  parseThreshold,
  secretsMatch,
  yesterdayUtc,
} from "./report.ts";

const U1 = "11111111-1111-4111-8111-111111111111";
const U2 = "22222222-2222-4222-8222-222222222222";

Deno.test("yesterdayUtc crosses month boundaries in UTC", () => {
  assertEquals(yesterdayUtc(new Date("2026-12-01T06:00:00Z")), "2026-11-30");
  assertEquals(yesterdayUtc(new Date("2026-01-01T00:30:00Z")), "2025-12-31");
});

Deno.test("isIsoDay accepts only real dates", () => {
  assertEquals(isIsoDay("2026-11-25"), true);
  assertEquals(isIsoDay("2026-02-30"), false);
  assertEquals(isIsoDay("2026-11-25T00:00:00Z"), false);
  assertEquals(isIsoDay(null), false);
});

Deno.test("parseThreshold falls back on missing or invalid values", () => {
  assertEquals(parseThreshold(undefined, 5), 5);
  assertEquals(parseThreshold("", 5), 5);
  assertEquals(parseThreshold("abc", 5), 5);
  assertEquals(parseThreshold("-1", 5), 5);
  assertEquals(parseThreshold("0.25", 5), 0.25);
});

Deno.test("buildCostReport flags users and the daily total over thresholds", () => {
  const report = buildCostReport({
    day: "2026-11-25",
    daily: [
      { provider: "groq", model: "openai/gpt-oss-120b", requests: "40", est_usd: "4.5", unpriced_requests: 0 },
      { provider: "groq", model: "unknown", requests: 2, est_usd: 0, unpriced_requests: 2 },
      { provider: "gemini", model: "gemini-2.5-flash-lite", requests: 10, est_usd: "1.0" },
    ],
    users: [
      { user_id: U1, tier: "free", actions: 30, est_usd: "0.9" },
      { user_id: U2, tier: "pro", actions: 5, est_usd: "0.1" },
    ],
    overThreshold: [{ user_id: U1, tier: "free", actions: 30, est_usd: "0.9" }],
    userThresholdUsd: 0.5,
    dailyThresholdUsd: 5,
  });
  assertEquals(report.totalUsd, 5.5);
  assertEquals(report.totalRequests, 52);
  assertEquals(report.unpricedRequests, 2);
  assertEquals(report.dailyExceeded, true);
  assertEquals(report.usersOverThreshold.map((u) => u.userId), [U1]);
  assertEquals(report.topUsers.length, 2);
  assertEquals(report.alert, true);
  const text = formatSlackText(report);
  assertEquals(text.startsWith(":rotating_light: AI cost alert for 2026-11-25"), true);
  assertEquals(text.includes(U1), true);
});

Deno.test("buildCostReport below thresholds is not an alert", () => {
  const report = buildCostReport({
    day: "2026-11-25",
    daily: [{ provider: "groq", model: "llama-3.1-8b-instant", requests: 3, est_usd: 0.001 }],
    users: [{ user_id: U1, tier: "free", actions: 3, est_usd: 0.001 }],
    userThresholdUsd: 0.5,
    dailyThresholdUsd: 5,
  });
  assertEquals(report.alert, false);
  assertEquals(formatSlackText(report).startsWith("AI cost digest"), true);
});

Deno.test("secretsMatch is exact and fails closed on an empty secret", async () => {
  assertEquals(await secretsMatch("s3cret", "s3cret"), true);
  assertEquals(await secretsMatch("s3cret ", "s3cret"), false);
  assertEquals(await secretsMatch("", ""), false);
});
