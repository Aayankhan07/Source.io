// Daily AI cost report and margin alert. Called by pg_cron (migration 20261126170000) at
// 06:00 UTC with the shared secret in `x-cron-secret`; config.toml sets verify_jwt = false.
//
// Computes yesterday's (UTC) estimated cost from the service-role-only views admin_daily_cost and
// admin_user_daily_cost, and posts a Slack-compatible {text} message to ALERT_WEBHOOK_URL when the
// daily or per-user threshold is exceeded (or always, as a digest, when COST_DIGEST=1).
//
// Env: CRON_SECRET (required; fails closed), ALERT_WEBHOOK_URL (unset => no-op),
//      COST_ALERT_USER_USD (default 0.50), COST_ALERT_DAILY_USD (default 5), COST_DIGEST.
// Manual rerun for another day: POST ?day=YYYY-MM-DD with the same header.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.4";
import { createLogger } from "../_shared/log.ts";
import { fetchWithTimeout } from "../_shared/http.ts";
import {
  buildCostReport,
  DEFAULT_DAILY_THRESHOLD_USD,
  DEFAULT_USER_THRESHOLD_USD,
  type DailyCostRow,
  formatSlackText,
  isIsoDay,
  parseThreshold,
  secretsMatch,
  TOP_USERS,
  type UserCostRow,
  yesterdayUtc,
} from "./report.ts";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const WEBHOOK_TIMEOUT_MS = 10_000;

function json(data: unknown, status: number) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

Deno.serve(async (req) => {
  if (req.method !== "POST") return json({ error: "Method not allowed", code: "METHOD_NOT_ALLOWED" }, 405);
  const log = createLogger("cost_report");

  // Fail closed: without a configured secret nobody can trigger the report.
  const cronSecret = Deno.env.get("CRON_SECRET") ?? "";
  if (!cronSecret) {
    log.error("CRON_SECRET not set; refusing request");
    return json({ error: "Not configured", code: "NOT_CONFIGURED" }, 500);
  }
  if (!(await secretsMatch(req.headers.get("x-cron-secret") ?? "", cronSecret))) {
    return json({ error: "Unauthorized", code: "UNAUTHORIZED" }, 401);
  }

  const webhookUrl = Deno.env.get("ALERT_WEBHOOK_URL") ?? "";
  if (!webhookUrl) {
    log.info("ALERT_WEBHOOK_URL not set; nothing to do");
    return json({ ok: true, skipped: true, reason: "ALERT_WEBHOOK_URL not set" }, 200);
  }

  const requestedDay = new URL(req.url).searchParams.get("day");
  if (requestedDay !== null && !isIsoDay(requestedDay)) {
    return json({ error: "day must be YYYY-MM-DD", code: "INVALID_DAY" }, 400);
  }
  const day = requestedDay ?? yesterdayUtc();
  const userThresholdUsd = parseThreshold(Deno.env.get("COST_ALERT_USER_USD"), DEFAULT_USER_THRESHOLD_USD);
  const dailyThresholdUsd = parseThreshold(Deno.env.get("COST_ALERT_DAILY_USD"), DEFAULT_DAILY_THRESHOLD_USD);
  const digest = Deno.env.get("COST_DIGEST") === "1";

  const admin = createClient(SUPABASE_URL, SERVICE_KEY);
  const [dailyRes, topRes, overRes] = await Promise.all([
    admin.from("admin_daily_cost").select("provider, model, requests, unpriced_requests, est_usd").eq("day", day),
    admin.from("admin_user_daily_cost").select("user_id, tier, actions, est_usd").eq("day", day)
      .order("est_usd", { ascending: false }).limit(TOP_USERS),
    admin.from("admin_user_daily_cost").select("user_id, tier, actions, est_usd").eq("day", day)
      .gt("est_usd", userThresholdUsd).order("est_usd", { ascending: false }).limit(100),
  ]);
  const dbError = dailyRes.error ?? topRes.error ?? overRes.error;
  if (dbError) {
    log.error("cost query failed", { err: dbError, day });
    return json({ error: "Cost query failed", code: "DB_ERROR" }, 500);
  }

  const report = buildCostReport({
    day,
    daily: (dailyRes.data ?? []) as DailyCostRow[],
    users: (topRes.data ?? []) as UserCostRow[],
    overThreshold: (overRes.data ?? []) as UserCostRow[],
    userThresholdUsd,
    dailyThresholdUsd,
  });
  const summary = {
    day,
    totalUsd: report.totalUsd,
    totalRequests: report.totalRequests,
    usersOverThreshold: report.usersOverThreshold.length,
    dailyExceeded: report.dailyExceeded,
    alert: report.alert,
  };

  if (!report.alert && !digest) {
    log.info("cost report: below thresholds", summary);
    return json({ ok: true, posted: false, ...summary }, 200);
  }

  try {
    const res = await fetchWithTimeout(
      webhookUrl,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: formatSlackText(report) }),
      },
      WEBHOOK_TIMEOUT_MS,
    );
    await res.body?.cancel().catch(() => {});
    if (!res.ok) {
      log.error("alert webhook rejected the message", { status: res.status, ...summary });
      return json({ ok: false, posted: false, code: "WEBHOOK_FAILED", status: res.status, ...summary }, 502);
    }
  } catch (err) {
    log.error("alert webhook request failed", { err, ...summary });
    return json({ ok: false, posted: false, code: "WEBHOOK_FAILED", ...summary }, 502);
  }

  log.info("cost report posted", summary);
  return json({ ok: true, posted: true, ...summary }, 200);
});
