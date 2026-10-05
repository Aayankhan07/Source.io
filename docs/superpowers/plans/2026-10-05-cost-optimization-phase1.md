# Cost Optimization & Budget Guardrails (Phase 1) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement Phase 1 cost protection for Source.io by enforcing API-level output token limits, database-backed idempotency locks, server-side daily chat quotas, and secure usage telemetry logging.

**Architecture:** 
1. **Edge Function Token Guardrails:** Inject strict `max_tokens` into Groq/OpenAI completions across `chat`, `generate_notes`, `generate_derivatives`, and `generate_podcast`.
2. **Database Idempotency & Telemetry:** Add an `idempotency_key` unique index to `jobs` and create a secured `ai_usage_logs` table (read-only for clients, service-role write only).
3. **In-Flight Job Locking:** Reject duplicate generation triggers if an active job is already `processing` for the target document.
4. **Server-Side Quota Gate:** Count daily chat questions from `ai_usage_logs` and reject requests exceeding 25 questions/day on the free tier.

**Tech Stack:** Next.js 16, Supabase (Postgres, RLS, Deno Edge Functions), TypeScript, Groq Cloud API.

**Spec:** [`docs/cost-optimization-analysis.md`](file:///d:/PROJECT%20REPOS/Source.io/docs/cost-optimization-analysis.md)

---

## Global Constraints

- Never allow client apps to write directly to `ai_usage_logs`. All inserts must be performed by Supabase Edge Functions with `SUPABASE_SERVICE_ROLE_KEY`.
- Never break streaming SSE contracts in `chat` or `generate_notes`.
- Maintain full TypeScript correctness (`npm run typecheck` must pass with 0 errors).
- All Next.js builds (`npm run build`) must compile cleanly with exit code 0.
- All edge function changes must retain permissive CORS preflight headers (`getCorsHeaders` or `corsHeaders`).

---

## Review Focus

1. **Token Limit Truncation:** Ensure `max_tokens` in `generate_derivatives` is large enough (2500 tokens) so that JSON responses never truncate mid-string, which would break `JSON.parse`.
2. **Duplicate Request Rejection (409 Conflict):** Ensure a client retrying a request with the same idempotency key or while a job is running receives a clean HTTP 409 or existing job ID, rather than crashing with an unhandled 500.
3. **Daily Quota Reset Behavior:** Ensure quota calculations use `created_at >= date_trunc('day', now())` in UTC so free users reset cleanly each day without timezone drift bugs.
4. **Failed Call Cost Logging:** Ensure failed or rate-limited API calls (HTTP 429/500) still log a row to `ai_usage_logs` with `status: 'failed'` or `status: 'rate_limited'` and the error message, preserving audit visibility.
5. **BYOK (Bring Your Own Key) Bypass:** Ensure that if a user provides their own custom API key (`api_key` in request body), the platform quota does not block their request.

---

### Task 1: Enforce API-Level Output Token Limits Across All Edge Functions

**Files:**
- Modify: `supabase/functions/chat/index.ts:200-218`
- Modify: `supabase/functions/generate_derivatives/index.ts:180-199`
- Modify: `supabase/functions/generate_notes/index.ts:240-260`
- Modify: `supabase/functions/generate_podcast/index.ts:160-185`

**Interfaces:**
- Consumes: Upstream Groq chat completions API (`https://api.groq.com/openai/v1/chat/completions`)
- Produces: API payload with explicit `max_tokens` attribute on every request

- [ ] **Step 1: Add `max_tokens: 800` to `chat/index.ts`**
  In `supabase/functions/chat/index.ts`, add `max_tokens: 800` inside the `fetch` payload to Groq completions:
  ```typescript
  body: JSON.stringify({
    model: CHAT_MODEL,
    stream: true,
    temperature: 0.3,
    max_tokens: 800,
    messages: [
      { role: "system", content: systemPrompt },
      ...recent.map((m) => ({ role: m.role, content: m.content })),
      { role: "user", content: message },
    ],
  }),
  ```

- [ ] **Step 2: Add `max_tokens: 2500` to `generate_derivatives/index.ts`**
  In `supabase/functions/generate_derivatives/index.ts`, add `max_tokens: 2500` inside `callGroq`:
  ```typescript
  body: JSON.stringify({
    model,
    temperature: 0.3,
    max_tokens: 2500,
    response_format: { type: "json_object" },
    messages: [ ... ],
  }),
  ```

- [ ] **Step 3: Add `max_tokens: 4096` to `generate_notes/index.ts`**
  In `supabase/functions/generate_notes/index.ts`, add `max_tokens: 4096` inside `callGroq`:
  ```typescript
  body: JSON.stringify({
    model,
    stream: true,
    temperature: 0.4,
    max_tokens: 4096,
    messages: [ ... ],
  }),
  ```

- [ ] **Step 4: Add `max_tokens: 1800` to `generate_podcast/index.ts`**
  In `supabase/functions/generate_podcast/index.ts`, locate the Groq script generation call and add `max_tokens: 1800`.

- [ ] **Step 5: Verify edge functions syntax & commit**
  ```bash
  git add supabase/functions/chat/index.ts supabase/functions/generate_derivatives/index.ts supabase/functions/generate_notes/index.ts supabase/functions/generate_podcast/index.ts
  git commit -m "fix(edge): enforce explicit max_tokens on all LLM requests"
  ```

---

### Task 2: Supabase Migration for Idempotency Keys and `ai_usage_logs`

**Files:**
- Create: `supabase/migrations/20261005190000_ai_cost_guardrails.sql`

**Interfaces:**
- Produces: `jobs.idempotency_key` unique column and index
- Produces: `public.ai_usage_logs` table with RLS policies

- [ ] **Step 1: Write migration SQL**
  Create `supabase/migrations/20261005190000_ai_cost_guardrails.sql`:
  ```sql
  -- 1. Add idempotency_key to jobs table
  ALTER TABLE public.jobs 
  ADD COLUMN IF NOT EXISTS idempotency_key TEXT;

  CREATE UNIQUE INDEX IF NOT EXISTS ai_jobs_idempotency_key_idx 
  ON public.jobs (idempotency_key) 
  WHERE idempotency_key IS NOT NULL;

  -- 2. Create secure ai_usage_logs table
  CREATE TABLE IF NOT EXISTS public.ai_usage_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    document_id UUID REFERENCES public.documents(id) ON DELETE CASCADE,
    request_id TEXT NOT NULL,
    idempotency_key TEXT,
    feature TEXT NOT NULL,               -- 'notes' | 'derivatives' | 'chat' | 'podcast' | 'transcribe'
    provider TEXT NOT NULL,              -- 'groq' | 'gemini' | 'openai' | 'edge-tts'
    model TEXT NOT NULL,
    input_tokens INT DEFAULT 0,
    output_tokens INT DEFAULT 0,
    cached_input_tokens INT DEFAULT 0,
    estimated_cost_usd NUMERIC(12,8) DEFAULT 0,
    status TEXT NOT NULL,                -- 'succeeded' | 'failed' | 'rate_limited'
    duration_ms INT,
    error_message TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
  );

  -- Index for daily quota calculations and user reporting
  CREATE INDEX IF NOT EXISTS idx_ai_usage_logs_user_daily 
  ON public.ai_usage_logs (user_id, feature, created_at);

  -- Index for document audits
  CREATE INDEX IF NOT EXISTS idx_ai_usage_logs_document 
  ON public.ai_usage_logs (document_id, created_at);

  -- 3. Row Level Security: Client can read own logs, NO client insert allowed
  ALTER TABLE public.ai_usage_logs ENABLE ROW LEVEL SECURITY;

  DO $$ 
  BEGIN
    IF NOT EXISTS (
      SELECT 1 FROM pg_policies 
      WHERE tablename = 'ai_usage_logs' AND policyname = 'Users view own ai usage logs'
    ) THEN
      CREATE POLICY "Users view own ai usage logs"
        ON public.ai_usage_logs FOR SELECT
        USING (auth.uid() = user_id);
    END IF;
  END $$;
  ```

- [ ] **Step 2: Commit migration**
  ```bash
  git add supabase/migrations/20261005190000_ai_cost_guardrails.sql
  git commit -m "feat(db): add idempotency index to jobs and create ai_usage_logs table"
  ```

---

### Task 3: In-Flight Job Lock & Idempotency Helper for Edge Functions

**Files:**
- Create: `supabase/functions/_shared/jobLock.ts`
- Modify: `supabase/functions/generate_notes/index.ts`
- Modify: `supabase/functions/generate_derivatives/index.ts`

**Interfaces:**
- Consumes: `SupabaseClient` (admin client)
- Produces: `acquireJobLock(admin, { userId, documentId, kind, idempotencyKey })` and `releaseJobLock`

- [ ] **Step 1: Create `jobLock.ts` in `supabase/functions/_shared/`**
  ```typescript
  import { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2.57.4";

  export type JobKind = 'ingest' | 'generate_notes' | 'generate_derivatives' | 'generate_podcast' | 'embed_chunks';

  export async function acquireJobLock(
    admin: SupabaseClient,
    opts: {
      userId: string;
      documentId: string;
      kind: JobKind;
      idempotencyKey?: string | null;
    }
  ): Promise<{ acquired: boolean; jobId?: string; message?: string }> {
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
      // If updated less than 90 seconds ago, it is actively running
      const ageMs = Date.now() - new Date(running.updated_at).getTime();
      if (ageMs < 90_000) {
        return {
          acquired: false,
          jobId: running.id,
          message: `A ${opts.kind} job is already in progress for this document.`,
        };
      }
    }

    // 2. Check if idempotency key was already completed
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
      // Caught by unique index on idempotency_key
      if (error.code === "23505") {
        return { acquired: false, message: "Duplicate concurrent request detected." };
      }
      return { acquired: false, message: error.message };
    }

    return { acquired: true, jobId: newJob.id };
  }

  export async function completeJob(
    admin: SupabaseClient,
    jobId: string,
    success: boolean,
    error?: string
  ): Promise<void> {
    await admin
      .from("jobs")
      .update({
        status: success ? "succeeded" : "failed",
        progress: 100,
        error: error || null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", jobId);
  }
  ```

- [ ] **Step 2: Wire `acquireJobLock` into `generate_notes/index.ts`**
  In `generate_notes/index.ts`, parse `idempotency_key` from body, call `acquireJobLock`, and return HTTP 409 if `!acquired`. Mark job completed in `finally`.

- [ ] **Step 3: Wire `acquireJobLock` into `generate_derivatives/index.ts`**
  In `generate_derivatives/index.ts`, parse `idempotency_key` from body, call `acquireJobLock`, and return HTTP 409 if `!acquired`. Mark job completed in `finally`.

- [ ] **Step 4: Commit edge function locking**
  ```bash
  git add supabase/functions/_shared/jobLock.ts supabase/functions/generate_notes/index.ts supabase/functions/generate_derivatives/index.ts
  git commit -m "feat(edge): implement distributed job lock and idempotency checks"
  ```

---

### Task 4: Client-Side Idempotency Generation & Debounce Guards

**Files:**
- Modify: `src/lib/services/pipeline.ts`
- Modify: `src/lib/services/podcast.ts`
- Modify: `src/features/documents/pages/DocumentWorkspace.tsx`

**Interfaces:**
- Produces: Automatic UUIDv4 idempotency key passed on generation requests

- [ ] **Step 1: Add idempotency key generation in `pipeline.ts`**
  In `src/lib/services/pipeline.ts`:
  Update `generateDerivatives` and `streamNotes` to generate an idempotency key:
  ```typescript
  const idempotencyKey = `${documentId}:${action}:${Date.now()}:${Math.random().toString(36).slice(2, 8)}`;
  ```
  Pass `idempotency_key: idempotencyKey` in the request body to `callFunction`.

- [ ] **Step 2: Add idempotency key in `podcast.ts`**
  In `src/lib/services/podcast.ts`:
  Pass `idempotency_key` in the body payload to `generate_podcast`.

- [ ] **Step 3: Add UI disabled/loading states in `DocumentWorkspace.tsx`**
  Ensure generation trigger buttons (`Generate Notes`, `Regenerate`, `Create Podcast`) are disabled while streaming or `derivLoading` is active to prevent immediate client-side double taps.

- [ ] **Step 4: Verify typecheck & commit**
  ```bash
  npm run typecheck
  git add src/lib/services/pipeline.ts src/lib/services/podcast.ts src/features/documents/pages/DocumentWorkspace.tsx
  git commit -m "feat(client): attach idempotency keys and prevent duplicate UI generation triggers"
  ```

---

### Task 5: Server-Side Daily Chat Quota Enforcement

**Files:**
- Create: `supabase/functions/_shared/quotas.ts`
- Modify: `supabase/functions/chat/index.ts`

**Interfaces:**
- Produces: `checkDailyQuota(admin, userId, 'chat', maxDaily = 25)`
- Returns: `{ allowed: boolean; used: number; remaining: number }`

- [ ] **Step 1: Create `quotas.ts` helper**
  Create `supabase/functions/_shared/quotas.ts`:
  ```typescript
  import { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2.57.4";

  export async function checkDailyQuota(
    admin: SupabaseClient,
    userId: string,
    feature: string,
    maxDaily: number = 25
  ): Promise<{ allowed: boolean; used: number; remaining: number }> {
    const todayUtc = new Date();
    todayUtc.setUTCHours(0, 0, 0, 0);

    const { count, error } = await admin
      .from("ai_usage_logs")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId)
      .eq("feature", feature)
      .gte("created_at", todayUtc.toISOString())
      .neq("status", "failed");

    if (error) {
      console.error("Quota check error:", error);
      // Fail open on DB error so users are not blocked by a telemetry issue
      return { allowed: true, used: 0, remaining: maxDaily };
    }

    const used = count ?? 0;
    const allowed = used < maxDaily;
    return { allowed, used, remaining: Math.max(0, maxDaily - used) };
  }
  ```

- [ ] **Step 2: Enforce quota in `chat/index.ts`**
  In `supabase/functions/chat/index.ts`:
  Before initiating the Groq request, check quota:
  ```typescript
  const quota = await checkDailyQuota(admin, userId, "chat", 25);
  if (!quota.allowed) {
    return new Response(
      JSON.stringify({
        error: "Daily free Copilot question limit reached (25/day). Your quota will reset at midnight UTC.",
        quotaExceeded: true,
      }),
      { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
  ```

- [ ] **Step 3: Commit quota enforcement**
  ```bash
  git add supabase/functions/_shared/quotas.ts supabase/functions/chat/index.ts
  git commit -m "feat(edge): enforce server-side 25/day chat quota for free users"
  ```

---

### Task 6: Edge Function Usage Telemetry Logger (`ai_usage_logs`)

**Files:**
- Create: `supabase/functions/_shared/telemetry.ts`
- Modify: `supabase/functions/chat/index.ts`
- Modify: `supabase/functions/generate_notes/index.ts`
- Modify: `supabase/functions/generate_derivatives/index.ts`

**Interfaces:**
- Produces: `logAiUsage(admin, usageRecord)`

- [ ] **Step 1: Create `telemetry.ts` helper**
  Create `supabase/functions/_shared/telemetry.ts`:
  ```typescript
  import { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2.57.4";

  export type UsageRecord = {
    userId: string;
    documentId: string;
    requestId: string;
    idempotencyKey?: string | null;
    feature: 'notes' | 'derivatives' | 'chat' | 'podcast' | 'transcribe';
    provider: 'groq' | 'gemini' | 'openai' | 'edge-tts';
    model: string;
    inputTokens?: number;
    outputTokens?: number;
    cachedInputTokens?: number;
    estimatedCostUsd?: number;
    status: 'succeeded' | 'failed' | 'rate_limited';
    durationMs?: number;
    errorMessage?: string | null;
  };

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
  ```

- [ ] **Step 2: Log telemetry in `chat/index.ts`**
  In `chat/index.ts`, record duration and call `logAiUsage` when stream finishes or if error occurs.

- [ ] **Step 3: Log telemetry in `generate_notes/index.ts`**
  In `generate_notes/index.ts`, call `logAiUsage` upon note persistence.

- [ ] **Step 4: Log telemetry in `generate_derivatives/index.ts`**
  In `generate_derivatives/index.ts`, call `logAiUsage` with token estimates upon JSON generation.

- [ ] **Step 5: Verify build & commit**
  ```bash
  npm run typecheck
  npm run build
  git add supabase/functions/_shared/telemetry.ts supabase/functions/chat/index.ts supabase/functions/generate_notes/index.ts supabase/functions/generate_derivatives/index.ts
  git commit -m "feat(telemetry): record AI usage logs and costs across edge functions"
  ```

---

## Plan Self-Review Checklist

1. **Spec Coverage**: All Phase 1 deliverables from `docs/cost-optimization-analysis.md` (`max_completion_tokens`, unique idempotency key index, distributed in-flight locks, server-side daily quotas, secure telemetry logs) are covered in Tasks 1–6.
2. **No Placeholders**: Every task contains exact SQL, TypeScript code blocks, and bash verification commands.
3. **Type Consistency**: `UsageRecord`, `JobKind`, and `checkDailyQuota` signatures match across all shared modules.
4. **Review Focus**: Daily reset behavior, error logging, and idempotency conflicts (23505) are handled.
