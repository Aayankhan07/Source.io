// Pure helpers for the cost_report function (no Deno/Supabase globals) so they are unit-tested
// in report_test.ts.

export const DEFAULT_USER_THRESHOLD_USD = 0.5;
export const DEFAULT_DAILY_THRESHOLD_USD = 5;
export const TOP_USERS = 10;

export interface DailyCostRow {
  provider: string;
  model: string;
  requests: number | string;
  unpriced_requests?: number | string | null;
  est_usd: number | string | null;
}

export interface UserCostRow {
  user_id: string;
  tier: string | null;
  actions: number | string;
  est_usd: number | string | null;
}

export interface CostReport {
  day: string;
  totalUsd: number;
  totalRequests: number;
  unpricedRequests: number;
  byModel: Array<{ provider: string; model: string; requests: number; estUsd: number }>;
  topUsers: Array<{ userId: string; tier: string; actions: number; estUsd: number }>;
  usersOverThreshold: Array<{ userId: string; tier: string; actions: number; estUsd: number }>;
  userThresholdUsd: number;
  dailyThresholdUsd: number;
  dailyExceeded: boolean;
  alert: boolean;
}

/** Positive finite number from an env string, else the default. */
export function parseThreshold(raw: string | undefined | null, fallback: number): number {
  if (raw === undefined || raw === null || raw.trim() === "") return fallback;
  const n = Number(raw);
  return Number.isFinite(n) && n > 0 ? n : fallback;
}

/** The UTC calendar day before `now`, as YYYY-MM-DD. */
export function yesterdayUtc(now: Date = new Date()): string {
  const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() - 1));
  return d.toISOString().slice(0, 10);
}

/** Accepts only a real YYYY-MM-DD date. */
export function isIsoDay(v: unknown): v is string {
  if (typeof v !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(v)) return false;
  const t = Date.parse(`${v}T00:00:00Z`);
  return Number.isFinite(t) && new Date(t).toISOString().slice(0, 10) === v;
}

const num = (v: unknown): number => {
  const n = Number(v ?? 0);
  return Number.isFinite(n) ? n : 0;
};

const round = (n: number, digits = 4): number => Number(n.toFixed(digits));

function toUser(r: UserCostRow) {
  return { userId: r.user_id, tier: r.tier ?? "free", actions: num(r.actions), estUsd: round(num(r.est_usd)) };
}

export function buildCostReport(input: {
  day: string;
  daily: DailyCostRow[];
  users: UserCostRow[];
  overThreshold?: UserCostRow[];
  userThresholdUsd: number;
  dailyThresholdUsd: number;
}): CostReport {
  const byModel = input.daily
    .map((r) => ({ provider: r.provider, model: r.model, requests: num(r.requests), estUsd: round(num(r.est_usd)) }))
    .sort((a, b) => b.estUsd - a.estUsd);
  const totalUsd = round(input.daily.reduce((s, r) => s + num(r.est_usd), 0));
  const totalRequests = input.daily.reduce((s, r) => s + num(r.requests), 0);
  const unpricedRequests = input.daily.reduce((s, r) => s + num(r.unpriced_requests), 0);

  const allUsers = [...input.users, ...(input.overThreshold ?? [])];
  const unique = new Map<string, ReturnType<typeof toUser>>();
  for (const r of allUsers) if (r?.user_id) unique.set(r.user_id, toUser(r));
  const sorted = [...unique.values()].sort((a, b) => b.estUsd - a.estUsd);

  const topUsers = sorted.slice(0, TOP_USERS);
  const usersOverThreshold = sorted.filter((u) => u.estUsd > input.userThresholdUsd);
  const dailyExceeded = totalUsd > input.dailyThresholdUsd;

  return {
    day: input.day,
    totalUsd,
    totalRequests,
    unpricedRequests,
    byModel,
    topUsers,
    usersOverThreshold,
    userThresholdUsd: input.userThresholdUsd,
    dailyThresholdUsd: input.dailyThresholdUsd,
    dailyExceeded,
    alert: dailyExceeded || usersOverThreshold.length > 0,
  };
}

const usd = (n: number) => `$${n.toFixed(n < 1 ? 4 : 2)}`;

/** Slack-compatible message text. */
export function formatSlackText(report: CostReport): string {
  const lines: string[] = [];
  const head = report.alert ? ":rotating_light: AI cost alert" : "AI cost digest";
  lines.push(`${head} for ${report.day} (UTC): ${usd(report.totalUsd)} est. over ${report.totalRequests} requests`);
  if (report.dailyExceeded) {
    lines.push(`- Daily total is above the ${usd(report.dailyThresholdUsd)} threshold.`);
  }
  if (report.usersOverThreshold.length > 0) {
    lines.push(`- ${report.usersOverThreshold.length} user(s) above ${usd(report.userThresholdUsd)}/day:`);
    for (const u of report.usersOverThreshold.slice(0, TOP_USERS)) {
      lines.push(`  • ${u.userId} (${u.tier}): ${usd(u.estUsd)}, ${u.actions} actions`);
    }
  }
  if (report.byModel.length > 0) {
    lines.push("By model:");
    for (const m of report.byModel.slice(0, 8)) {
      lines.push(`  • ${m.provider}/${m.model}: ${usd(m.estUsd)} (${m.requests} req)`);
    }
  }
  if (report.topUsers.length > 0 && !report.alert) {
    lines.push("Top users:");
    for (const u of report.topUsers.slice(0, 5)) {
      lines.push(`  • ${u.userId} (${u.tier}): ${usd(u.estUsd)}`);
    }
  }
  if (report.unpricedRequests > 0) {
    lines.push(`Note: ${report.unpricedRequests} request(s) had no price row in ai_model_prices.`);
  }
  lines.push("Estimates use ai_model_prices list prices (check the verified column).");
  return lines.join("\n");
}

/** Constant-time string comparison via SHA-256 digests (lengths never leak). */
export async function secretsMatch(provided: string, expected: string): Promise<boolean> {
  if (!expected) return false;
  const enc = new TextEncoder();
  const [a, b] = await Promise.all([
    crypto.subtle.digest("SHA-256", enc.encode(provided)),
    crypto.subtle.digest("SHA-256", enc.encode(expected)),
  ]);
  const x = new Uint8Array(a);
  const y = new Uint8Array(b);
  let diff = 0;
  for (let i = 0; i < x.length; i++) diff |= x[i] ^ y[i];
  return diff === 0;
}
