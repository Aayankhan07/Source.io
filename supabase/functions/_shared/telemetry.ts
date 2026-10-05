import { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2.57.4";

export type UsageRecord = {
  userId: string;
  documentId: string;
  requestId: string;
  idempotencyKey?: string | null;
  feature: "notes" | "derivatives" | "chat" | "podcast" | "transcribe";
  provider: "groq" | "gemini" | "openai" | "edge-tts";
  model: string;
  inputTokens?: number;
  outputTokens?: number;
  cachedInputTokens?: number;
  estimatedCostUsd?: number;
  status: "succeeded" | "failed" | "rate_limited";
  durationMs?: number;
  errorMessage?: string | null;
};

/**
 * Persists an AI telemetry usage record to the public.ai_usage_logs table.
 * All writes use the service-role admin client to prevent client tampering.
 */
export async function logAiUsage(admin: SupabaseClient, record: UsageRecord): Promise<void> {
  try {
    await admin.from("ai_usage_logs").insert({
      user_id: record.userId,
      document_id: record.documentId,
      request_id: record.requestId,
      idempotency_key: record.idempotencyKey || null,
      feature: record.feature,
      provider: record.provider,
      model: record.model,
      input_tokens: record.inputTokens || 0,
      output_tokens: record.outputTokens || 0,
      cached_input_tokens: record.cachedInputTokens || 0,
      estimated_cost_usd: record.estimatedCostUsd || 0,
      status: record.status,
      duration_ms: record.durationMs || 0,
      error_message: record.errorMessage || null,
    });
  } catch (err) {
    console.error("Failed to log AI usage telemetry:", err);
  }
}

/**
 * Captures rate limit and quota headers from a provider response (e.g. Groq)
 * and records the latest snapshot into public.provider_usage.
 */
export async function captureProviderUsage(
  admin: SupabaseClient,
  provider: "groq" | "gemini" | "openai",
  model: string,
  headers: Headers,
  scope: "organization" | "shared" | "byok" = "organization"
): Promise<void> {
  try {
    const remainingReqStr = headers.get("x-ratelimit-remaining-requests");
    const limitReqStr = headers.get("x-ratelimit-limit-requests");
    const remainingTokStr = headers.get("x-ratelimit-remaining-tokens");
    const limitTokStr = headers.get("x-ratelimit-limit-tokens");
    const resetReqStr = headers.get("x-ratelimit-reset-requests");
    const resetTokStr = headers.get("x-ratelimit-reset-tokens");

    // Only record if at least one quota header is present
    if (!remainingReqStr && !remainingTokStr && !limitReqStr) {
      return;
    }

    const remainingRequests = remainingReqStr ? parseInt(remainingReqStr, 10) : null;
    const requestLimit = limitReqStr ? parseInt(limitReqStr, 10) : null;
    const remainingTokens = remainingTokStr ? parseInt(remainingTokStr, 10) : null;
    const tokenLimit = limitTokStr ? parseInt(limitTokStr, 10) : null;

    // Parse reset strings (e.g. "2s", "48s", "1m23s", "0.45s") into estimated ISO timestamps
    const parseResetToDate = (reset: string | null): string | null => {
      if (!reset) return null;
      let seconds = 0;
      const minMatch = reset.match(/(\d+)m/);
      const secMatch = reset.match(/([\d.]+)s/);
      if (minMatch) seconds += parseInt(minMatch[1], 10) * 60;
      if (secMatch) seconds += parseFloat(secMatch[1]);
      if (seconds === 0 && !isNaN(Number(reset))) seconds = Number(reset);
      if (seconds > 0) {
        return new Date(Date.now() + seconds * 1000).toISOString();
      }
      return null;
    };

    const resetRequestsAt = parseResetToDate(resetReqStr);
    const resetTokensAt = parseResetToDate(resetTokStr);

    await admin.from("provider_usage").insert({
      provider,
      model,
      scope,
      remaining_requests: remainingRequests,
      request_limit: requestLimit,
      remaining_tokens: remainingTokens,
      token_limit: tokenLimit,
      reset_requests_at: resetRequestsAt,
      reset_tokens_at: resetTokensAt,
      raw_reset_requests: resetReqStr,
      raw_reset_tokens: resetTokStr,
    });
  } catch (err) {
    console.warn("Failed to capture provider usage headers:", err);
  }
}

