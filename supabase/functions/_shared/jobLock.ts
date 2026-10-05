import { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2.57.4";

export type JobKind = 'ingest' | 'generate_notes' | 'generate_derivatives' | 'generate_podcast' | 'embed_chunks';

/**
 * Attempts to acquire an in-flight job lock for a given document and kind.
 * Rejects concurrent duplicate jobs (if a job is already 'running' within the last 90s).
 * If an idempotency key is provided and already succeeded, prevents duplicate reprocessing.
 */
export async function acquireJobLock(
  admin: SupabaseClient,
  opts: {
    userId: string;
    documentId: string;
    kind: JobKind;
    idempotencyKey?: string | null;
  }
): Promise<{ acquired: boolean; jobId?: string; message?: string }> {
  try {
    // 1. Check for active running job for this document & kind
    const { data: running } = await admin
      .from("jobs")
      .select("id, status, updated_at")
      .eq("document_id", opts.documentId)
      .eq("kind", opts.kind)
      .eq("status", "running")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (running) {
      const ageMs = Date.now() - new Date(running.updated_at).getTime();
      // If active job was touched within last 90 seconds, treat as in-progress
      if (ageMs < 90_000) {
        return {
          acquired: false,
          jobId: running.id,
          message: `A ${opts.kind} generation job is already in progress for this document.`,
        };
      }
    }

    // 2. Check if this exact idempotency key was already completed
    if (opts.idempotencyKey) {
      const { data: existingKey } = await admin
        .from("jobs")
        .select("id, status")
        .eq("idempotency_key", opts.idempotencyKey)
        .maybeSingle();

      if (existingKey && existingKey.status === "succeeded") {
        return {
          acquired: false,
          jobId: existingKey.id,
          message: "Request already completed.",
        };
      }
    }

    // 3. Create or claim job with status 'running'
    const { data: newJob, error } = await admin
      .from("jobs")
      .insert({
        user_id: opts.userId,
        document_id: opts.documentId,
        kind: opts.kind,
        status: "running",
        progress: 10,
        idempotency_key: opts.idempotencyKey || null,
      })
      .select("id")
      .single();

    if (error) {
      // Postgres error 23505 = unique_violation on idempotency_key
      if (error.code === "23505") {
        return { acquired: false, message: "Duplicate concurrent request detected." };
      }
      return { acquired: false, message: error.message };
    }

    return { acquired: true, jobId: newJob.id };
  } catch (err: unknown) {
    console.error("acquireJobLock error:", err);
    // On unexpected error, fail safe and allow processing to proceed
    return { acquired: true };
  }
}

/**
 * Marks a job as completed or failed with updated timestamp.
 */
export async function completeJob(
  admin: SupabaseClient,
  jobId: string | undefined,
  success: boolean,
  error?: string
): Promise<void> {
  if (!jobId) return;
  try {
    await admin
      .from("jobs")
      .update({
        status: success ? "succeeded" : "failed",
        progress: 100,
        error: error || null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", jobId);
  } catch (err: unknown) {
    console.error("completeJob error:", err);
  }
}
