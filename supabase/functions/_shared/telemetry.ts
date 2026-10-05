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
