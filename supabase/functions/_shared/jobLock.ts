import type { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2.57.4";

export type JobKind = "ingest" | "generate_notes" | "generate_derivatives" | "generate_podcast" | "embed_chunks";

/** Job statuses that count as "holding the lock" (see jobs_one_active_per_document_kind). */
export const ACTIVE_JOB_STATUSES = ["queued", "running"] as const;

/**
 * An active job whose updated_at is older than this is treated as abandoned and reaped.
 * Long-running holders must call heartbeatJob/startJobHeartbeat more often than this.
 */
export const STALE_JOB_MS = 120_000;

/** How often holders should heartbeat while working or streaming. */
export const HEARTBEAT_INTERVAL_MS = 10_000;

export interface JobLockResult {
  acquired: boolean;
  jobId?: string;
  message?: string;
  /** The lock state could not be determined (DB error). The lock is NOT granted. */
  unavailable?: true;
  /** The idempotency key already belongs to a succeeded job. */
  alreadyCompleted?: true;
}

const UNAVAILABLE: JobLockResult = {
  acquired: false,
  unavailable: true,
  message: "Job coordination is temporarily unavailable. Please retry in a minute.",
};

/**
 * Acquires the per-(document, kind) job lock by INSERTing a running job. Exclusivity is
 * enforced by the partial unique index jobs(document_id, kind) WHERE status IN
 * ('queued','running'); a 23505 means someone else holds the lock (or the idempotency key
 * is taken). Fails CLOSED: any unexpected error returns acquired=false.
 *
 * - Stale active jobs (no heartbeat for STALE_JOB_MS) are reaped first.
 * - force=true supersedes any active job and may reclaim a previous job row with the same
 *   idempotency key.
 */
export async function acquireJobLock(
  admin: SupabaseClient,
  opts: {
    userId: string;
    documentId: string;
    kind: JobKind;
    idempotencyKey?: string | null;
    force?: boolean;
  },
): Promise<JobLockResult> {
  const key = opts.idempotencyKey?.trim() || null;
  const busy = (jobId?: string): JobLockResult => ({
    acquired: false,
    jobId,
    message: `A ${opts.kind} generation job is already in progress for this document.`,
  });

  try {
    // 1. Already-completed idempotent request: never redo the work (or charge again).
    if (key && !opts.force) {
      const { data: prior, error } = await admin
        .from("jobs")
        .select("id,status")
        .eq("user_id", opts.userId)
        .eq("idempotency_key", key)
        .maybeSingle();
      if (error) {
        console.error("acquireJobLock: idempotency lookup failed; denying", error.message);
        return UNAVAILABLE;
      }
      if (prior?.status === "succeeded") {
        return { acquired: false, alreadyCompleted: true, jobId: prior.id, message: "Request already completed." };
      }
    }

    // 2. Release the lock from superseded (force) or abandoned (stale) holders.
    let release = admin
      .from("jobs")
      .update({
        status: "failed",
        error: opts.force ? "Superseded by user request" : "Stale job timeout (no heartbeat)",
        updated_at: new Date().toISOString(),
      })
      .eq("document_id", opts.documentId)
      .eq("kind", opts.kind)
      .in("status", [...ACTIVE_JOB_STATUSES]);
    if (!opts.force) {
      release = release.lt("updated_at", new Date(Date.now() - STALE_JOB_MS).toISOString());
    }
    const { error: releaseErr } = await release;
    if (releaseErr) {
      console.error("acquireJobLock: releasing stale jobs failed; denying", releaseErr.message);
      return UNAVAILABLE;
    }

    // 3. Take the lock. The unique indexes make this the single atomic decision point.
    const { data: inserted, error: insertErr } = await admin
      .from("jobs")
      .insert({
        user_id: opts.userId,
        document_id: opts.documentId,
        kind: opts.kind,
        status: "running",
        progress: 10,
        idempotency_key: key,
      })
      .select("id")
      .single();

    if (!insertErr && inserted?.id) return { acquired: true, jobId: inserted.id };

    if (insertErr?.code !== "23505") {
      console.error("acquireJobLock: insert failed; denying", insertErr?.message);
      return UNAVAILABLE;
    }

    // 4. Unique violation: either our idempotency key exists already, or another job is active.
    if (key) {
      const { data: keyed, error: keyedErr } = await admin
        .from("jobs")
        .select("id,status,document_id")
        .eq("user_id", opts.userId)
        .eq("idempotency_key", key)
        .maybeSingle();
      if (keyedErr) return UNAVAILABLE;
      if (keyed && keyed.document_id !== opts.documentId) {
        return { acquired: false, message: "Idempotency key was already used for a different document." };
      }
      if (keyed) {
        if (keyed.status === "succeeded" && !opts.force) {
          return { acquired: false, alreadyCompleted: true, jobId: keyed.id, message: "Request already completed." };
        }
        if (keyed.status === "running" || keyed.status === "queued") {
          if (!opts.force) return busy(keyed.id);
        }
        // Reclaim the existing row for this key (failed earlier, or force re-run).
        // Guarded by the status we read so two reclaimers cannot both win.
        const { data: reclaimed, error: reclaimErr } = await admin
          .from("jobs")
          .update({ status: "running", progress: 10, error: null, updated_at: new Date().toISOString() })
          .eq("id", keyed.id)
          .eq("status", keyed.status)
          .select("id")
          .maybeSingle();
        if (!reclaimErr && reclaimed?.id) return { acquired: true, jobId: reclaimed.id };
        if (reclaimErr && reclaimErr.code !== "23505") return UNAVAILABLE;
      }
    }

    const { data: active } = await admin
      .from("jobs")
      .select("id")
      .eq("document_id", opts.documentId)
      .eq("kind", opts.kind)
      .in("status", [...ACTIVE_JOB_STATUSES])
      .limit(1)
      .maybeSingle();
    return busy(active?.id);
  } catch (err: unknown) {
    console.error("acquireJobLock error; denying (fail closed):", err);
    return UNAVAILABLE;
  }
}

/**
 * Bumps updated_at on a running job so acquireJobLock does not reap it as stale.
 * Never throws; returns false when the job is no longer running or the write failed.
 */
export async function heartbeatJob(admin: SupabaseClient, jobId: string | undefined): Promise<boolean> {
  if (!jobId) return false;
  try {
    const { data, error } = await admin
      .from("jobs")
      .update({ updated_at: new Date().toISOString() })
      .eq("id", jobId)
      .eq("status", "running")
      .select("id")
      .maybeSingle();
    return !error && !!data;
  } catch (err) {
    console.warn("heartbeatJob failed:", err);
    return false;
  }
}

/**
 * Heartbeats `jobId` every `intervalMs` until the returned stop() is called.
 * Always call stop() in a finally block.
 */
export function startJobHeartbeat(
  admin: SupabaseClient,
  jobId: string | undefined,
  intervalMs: number = HEARTBEAT_INTERVAL_MS,
): () => void {
  if (!jobId) return () => {};
  const timer = setInterval(() => {
    void heartbeatJob(admin, jobId);
  }, intervalMs);
  return () => clearInterval(timer);
}

/**
 * Returns a function to call on every streamed chunk; it heartbeats at most once per
 * `intervalMs`, so a stalled stream stops heartbeating and eventually goes stale.
 */
export function throttledHeartbeat(
  admin: SupabaseClient,
  jobId: string | undefined,
  intervalMs: number = HEARTBEAT_INTERVAL_MS,
): () => void {
  let last = Date.now();
  return () => {
    if (!jobId) return;
    const now = Date.now();
    if (now - last < intervalMs) return;
    last = now;
    void heartbeatJob(admin, jobId);
  };
}

/**
 * Marks a job as completed or failed. Returns false if the write failed.
 */
export async function completeJob(
  admin: SupabaseClient,
  jobId: string | undefined,
  success: boolean,
  error?: string,
): Promise<boolean> {
  if (!jobId) return false;
  try {
    const { error: updErr } = await admin
      .from("jobs")
      .update({
        status: success ? "succeeded" : "failed",
        progress: 100,
        error: error ? error.slice(0, 500) : null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", jobId);
    if (updErr) {
      console.error("completeJob error:", updErr.message);
      return false;
    }
    return true;
  } catch (err: unknown) {
    console.error("completeJob error:", err);
    return false;
  }
}
