-- Phase 1 backend reliability (roadmap tasks 1.7 - 1.11, 1.13).
-- See docs/superpowers/plans/2026-11-26-company-audit-and-roadmap.md, Phase 1.
--
-- Contents:
--   1. One row per document for notes / podcasts / quizzes (dedupe, then UNIQUE(document_id)).
--   2. Job lock: one active job per (document_id, kind); idempotency keys scoped per user.
--   3. Indexes: add missing, drop duplicates / unused.
--   4. documents REPLICA IDENTITY DEFAULT (stop shipping raw_text over Realtime).
--   5. RPC replace_document_derivatives (atomic flashcards + quiz replacement).
--   6. RPCs refund_daily_quota / refund_daily_tts_quota.
--   7. RLS tightening: documents server columns, jobs, document_chunks.
--   8. daily_ai_usage view: new telemetry features ('embed', 'tts') cost 0 credits.

-- ============================================================================
-- 1. One row per document for notes, podcasts, quizzes
-- ============================================================================

-- Keep the newest note per document.
DELETE FROM public.notes n
USING (
  SELECT id,
         row_number() OVER (PARTITION BY document_id ORDER BY updated_at DESC, created_at DESC, id DESC) AS rn
  FROM public.notes
) d
WHERE n.id = d.id AND d.rn > 1;

-- Keep the newest podcast per document, preferring one that is 'ready' (has audio/script).
DELETE FROM public.podcasts p
USING (
  SELECT id,
         row_number() OVER (
           PARTITION BY document_id
           ORDER BY (status = 'ready') DESC, updated_at DESC, created_at DESC, id DESC
         ) AS rn
  FROM public.podcasts
) d
WHERE p.id = d.id AND d.rn > 1;

-- Keep the newest quiz per document (quiz_questions / quiz_attempts of older quizzes cascade).
DELETE FROM public.quizzes q
USING (
  SELECT id,
         row_number() OVER (PARTITION BY document_id ORDER BY created_at DESC, id DESC) AS rn
  FROM public.quizzes
) d
WHERE q.id = d.id AND d.rn > 1;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'notes_document_id_key') THEN
    ALTER TABLE public.notes ADD CONSTRAINT notes_document_id_key UNIQUE (document_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'podcasts_document_id_key') THEN
    ALTER TABLE public.podcasts ADD CONSTRAINT podcasts_document_id_key UNIQUE (document_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'quizzes_document_id_key') THEN
    ALTER TABLE public.quizzes ADD CONSTRAINT quizzes_document_id_key UNIQUE (document_id);
  END IF;
END $$;

-- The unique constraints above index document_id; these plain indexes are now redundant.
DROP INDEX IF EXISTS public.idx_notes_document_id;
DROP INDEX IF EXISTS public.notes_document_idx;        -- duplicate of idx_notes_document_id (20260420174623)
DROP INDEX IF EXISTS public.idx_podcasts_document_id;
DROP INDEX IF EXISTS public.idx_quizzes_document_id;

-- ============================================================================
-- 2. Job lock support
-- ============================================================================

-- Release duplicate active jobs so the partial unique index can be built: keep the most
-- recently touched active job per (document_id, kind).
UPDATE public.jobs j
SET status = 'failed',
    error = 'Superseded during migration 20261126100000 (duplicate active job)'
FROM (
  SELECT id,
         row_number() OVER (PARTITION BY document_id, kind ORDER BY updated_at DESC, created_at DESC, id DESC) AS rn
  FROM public.jobs
  WHERE status IN ('queued', 'running') AND document_id IS NOT NULL
) d
WHERE j.id = d.id AND d.rn > 1;

-- At most one queued/running job per document and kind. acquireJobLock relies on the
-- resulting 23505 instead of check-then-insert.
CREATE UNIQUE INDEX IF NOT EXISTS jobs_one_active_per_document_kind
  ON public.jobs (document_id, kind)
  WHERE status IN ('queued', 'running');

-- Idempotency keys were unique across ALL users (20261005190000), letting one user's key
-- block another's. Scope them per user.
DROP INDEX IF EXISTS public.ai_jobs_idempotency_key_idx;
CREATE UNIQUE INDEX IF NOT EXISTS jobs_user_idempotency_key_idx
  ON public.jobs (user_id, idempotency_key)
  WHERE idempotency_key IS NOT NULL;

-- ============================================================================
-- 3. Indexes
-- ============================================================================

-- Job lookups by document + kind + status (lock acquire / stale reap).
CREATE INDEX IF NOT EXISTS idx_jobs_document_kind_status ON public.jobs (document_id, kind, status);
-- idx_jobs_document_id (document_id) is a prefix of the index above and of jobs_document_idx.
DROP INDEX IF EXISTS public.idx_jobs_document_id;

-- Chat history: WHERE document_id = ? ORDER BY created_at DESC LIMIT n.
CREATE INDEX IF NOT EXISTS idx_chat_messages_document_created ON public.chat_messages (document_id, created_at);
DROP INDEX IF EXISTS public.idx_chat_messages_document_id;

-- user_id indexes for RLS predicates (auth.uid() = user_id) on child tables.
CREATE INDEX IF NOT EXISTS idx_notes_user_id ON public.notes (user_id);
CREATE INDEX IF NOT EXISTS idx_flashcards_user_id ON public.flashcards (user_id);
CREATE INDEX IF NOT EXISTS idx_quizzes_user_id ON public.quizzes (user_id);
CREATE INDEX IF NOT EXISTS idx_quiz_questions_user_id ON public.quiz_questions (user_id);
CREATE INDEX IF NOT EXISTS idx_quiz_attempts_user_id ON public.quiz_attempts (user_id);
CREATE INDEX IF NOT EXISTS idx_podcasts_user_id ON public.podcasts (user_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_user_id ON public.chat_messages (user_id);
CREATE INDEX IF NOT EXISTS idx_document_chunks_user_id ON public.document_chunks (user_id);
CREATE INDEX IF NOT EXISTS idx_ai_feedback_user_id ON public.ai_feedback (user_id);

-- Unused GIN index on profiles.workspace_preferences (preferences are only read by user_id).
DROP INDEX IF EXISTS public.idx_profiles_workspace_preferences;

-- ============================================================================
-- 4. Realtime payload size
-- ============================================================================

-- FULL sent the whole old row (including raw_text) on every status change.
ALTER TABLE public.documents REPLICA IDENTITY DEFAULT;

-- ============================================================================
-- 5. Atomic flashcards + quiz replacement
-- ============================================================================

-- Called by generate_derivatives with the service-role client. Runs in one transaction:
-- if any insert fails, the old flashcards / quiz are left untouched.
--   p_flashcards: [{ "front": text, "back": text, "order_index"?: int }]
--   p_quiz:       { "title": text }
--   p_questions:  [{ "question": text, "type": "mcq"|"true_false"|"short_answer",
--                    "choices": [text] | null, "correct": text, "explanation": text | null,
--                    "order_index"?: int }]
CREATE OR REPLACE FUNCTION public.replace_document_derivatives(
  p_document_id uuid,
  p_user_id uuid,
  p_flashcards jsonb,
  p_quiz jsonb,
  p_questions jsonb
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
DECLARE
  v_quiz_id uuid := NULL;
  v_cards int := 0;
  v_questions int := 0;
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM public.documents WHERE id = p_document_id AND user_id = p_user_id
  ) THEN
    RAISE EXCEPTION 'document % not found for user', p_document_id USING ERRCODE = 'P0002';
  END IF;

  IF p_flashcards IS NULL OR jsonb_typeof(p_flashcards) <> 'array' THEN
    p_flashcards := '[]'::jsonb;
  END IF;
  IF p_questions IS NULL OR jsonb_typeof(p_questions) <> 'array' THEN
    p_questions := '[]'::jsonb;
  END IF;

  -- Serialize concurrent replacements of the same document's derivatives.
  PERFORM pg_advisory_xact_lock(hashtext('replace_document_derivatives:' || p_document_id::text));

  DELETE FROM public.flashcards WHERE document_id = p_document_id;
  DELETE FROM public.quizzes WHERE document_id = p_document_id; -- quiz_questions cascade

  INSERT INTO public.flashcards (document_id, user_id, front, back, order_index)
  SELECT p_document_id,
         p_user_id,
         c.value ->> 'front',
         c.value ->> 'back',
         coalesce((c.value ->> 'order_index')::int, (c.ordinality - 1)::int)
  FROM jsonb_array_elements(p_flashcards) WITH ORDINALITY AS c(value, ordinality);
  GET DIAGNOSTICS v_cards = ROW_COUNT;

  IF jsonb_array_length(p_questions) > 0 THEN
    INSERT INTO public.quizzes (document_id, user_id, title)
    VALUES (
      p_document_id,
      p_user_id,
      left(coalesce(nullif(btrim(p_quiz ->> 'title'), ''), 'Quiz'), 200)
    )
    RETURNING id INTO v_quiz_id;

    INSERT INTO public.quiz_questions (quiz_id, user_id, question, type, choices, correct, explanation, order_index)
    SELECT v_quiz_id,
           p_user_id,
           q.value ->> 'question',
           (q.value ->> 'type')::public.question_type,
           CASE WHEN jsonb_typeof(q.value -> 'choices') = 'array' THEN q.value -> 'choices' ELSE NULL END,
           q.value ->> 'correct',
           q.value ->> 'explanation',
           coalesce((q.value ->> 'order_index')::int, (q.ordinality - 1)::int)
    FROM jsonb_array_elements(p_questions) WITH ORDINALITY AS q(value, ordinality);
    GET DIAGNOSTICS v_questions = ROW_COUNT;
  END IF;

  RETURN jsonb_build_object(
    'quiz_id', v_quiz_id,
    'flashcards_count', v_cards,
    'questions_count', v_questions
  );
END;
$$;

REVOKE EXECUTE ON FUNCTION public.replace_document_derivatives(uuid, uuid, jsonb, jsonb, jsonb) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.replace_document_derivatives(uuid, uuid, jsonb, jsonb, jsonb) TO service_role;

-- ============================================================================
-- 6. Quota refunds
-- ============================================================================

-- Gives back daily AI actions after an upstream failure. Never goes below 0 and only
-- touches today's counter (a refund after the UTC rollover is a no-op).
CREATE OR REPLACE FUNCTION public.refund_daily_quota(p_user_id uuid, p_cost int DEFAULT 1)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_updated boolean;
BEGIN
  IF p_cost IS NULL OR p_cost <= 0 THEN
    RAISE EXCEPTION 'Refund cost must be a positive integer';
  END IF;

  UPDATE public.profiles
  SET daily_quota_used = greatest(coalesce(daily_quota_used, 0) - p_cost, 0),
      updated_at = now()
  WHERE user_id = p_user_id
    AND quota_reset_date = CURRENT_DATE
  RETURNING TRUE INTO v_updated;

  RETURN coalesce(v_updated, FALSE);
END;
$$;

CREATE OR REPLACE FUNCTION public.refund_daily_tts_quota(p_user_id uuid, p_cost int DEFAULT 1)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_updated boolean;
BEGIN
  IF p_cost IS NULL OR p_cost <= 0 THEN
    RAISE EXCEPTION 'Refund cost must be a positive integer';
  END IF;

  UPDATE public.profiles
  SET daily_tts_quota_used = greatest(coalesce(daily_tts_quota_used, 0) - p_cost, 0),
      updated_at = now()
  WHERE user_id = p_user_id
    AND quota_reset_date = CURRENT_DATE
  RETURNING TRUE INTO v_updated;

  RETURN coalesce(v_updated, FALSE);
END;
$$;

REVOKE EXECUTE ON FUNCTION public.refund_daily_quota(uuid, int) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.refund_daily_quota(uuid, int) TO service_role;
REVOKE EXECUTE ON FUNCTION public.refund_daily_tts_quota(uuid, int) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.refund_daily_tts_quota(uuid, int) TO service_role;

-- ============================================================================
-- 7. RLS tightening
-- ============================================================================

-- 7a. documents: the browser may create documents and rename them, but text, hash,
-- processing status and error codes are server-owned. Like protect_profile_billing_columns,
-- the trigger only restricts end-user roles; service_role / postgres pass through.
--
-- Allowed for end users:
--   INSERT  text/pdf/docx with browser-extracted raw_text + content_hash, status 'ready'
--           (or 'pending'); youtube/audio/video are forced to pending with no text.
--   UPDATE  title; and the DocumentWorkspace "self-heal" status pending/processing -> ready
--           when the row already has raw_text.
CREATE OR REPLACE FUNCTION public.protect_document_server_columns()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF coalesce(auth.role(), '') NOT IN ('authenticated', 'anon') THEN
    RETURN NEW; -- service_role, postgres, migrations
  END IF;

  IF TG_OP = 'INSERT' THEN
    NEW.error_code := NULL;
    IF NEW.source_type IN ('youtube', 'audio', 'video') THEN
      -- Text for these sources only ever comes from the ingest function.
      NEW.raw_text := NULL;
      NEW.content_hash := NULL;
      NEW.status := 'pending';
    ELSIF NEW.status NOT IN ('pending', 'ready')
       OR (NEW.status = 'ready' AND (NEW.raw_text IS NULL OR length(btrim(NEW.raw_text)) < 20)) THEN
      NEW.status := 'pending';
    END IF;
    RETURN NEW;
  END IF;

  IF NEW.user_id IS DISTINCT FROM OLD.user_id
     OR NEW.source_type IS DISTINCT FROM OLD.source_type
     OR NEW.source_url IS DISTINCT FROM OLD.source_url
     OR NEW.raw_text IS DISTINCT FROM OLD.raw_text
     OR NEW.content_hash IS DISTINCT FROM OLD.content_hash
     OR NEW.error_code IS DISTINCT FROM OLD.error_code THEN
    RAISE EXCEPTION 'document content and processing fields are read-only' USING ERRCODE = '42501';
  END IF;

  IF NEW.status IS DISTINCT FROM OLD.status THEN
    IF NOT (
      NEW.status = 'ready'
      AND OLD.status IN ('pending', 'processing')
      AND OLD.raw_text IS NOT NULL
      AND length(btrim(OLD.raw_text)) >= 20
    ) THEN
      RAISE EXCEPTION 'document status is managed by the server' USING ERRCODE = '42501';
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.protect_document_server_columns() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS protect_document_server_columns ON public.documents;
CREATE TRIGGER protect_document_server_columns
  BEFORE INSERT OR UPDATE ON public.documents
  FOR EACH ROW EXECUTE FUNCTION public.protect_document_server_columns();

-- UPDATE policies had USING but no WITH CHECK, so a row could be re-assigned to another user.
DROP POLICY IF EXISTS "Users update own documents" ON public.documents;
CREATE POLICY "Users update own documents" ON public.documents
  FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users update own notes" ON public.notes;
CREATE POLICY "Users update own notes" ON public.notes
  FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users update own flashcards" ON public.flashcards;
CREATE POLICY "Users update own flashcards" ON public.flashcards
  FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users update own quizzes" ON public.quizzes;
CREATE POLICY "Users update own quizzes" ON public.quizzes
  FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users update own quiz questions" ON public.quiz_questions;
CREATE POLICY "Users update own quiz questions" ON public.quiz_questions
  FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users update own podcasts" ON public.podcasts;
CREATE POLICY "Users update own podcasts" ON public.podcasts
  FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- 7b. jobs are written only by edge functions (service_role). Clients keep read access
-- (job progress via SELECT / Realtime).
DROP POLICY IF EXISTS "Users insert own jobs" ON public.jobs;
DROP POLICY IF EXISTS "Users update own jobs" ON public.jobs;
REVOKE INSERT, UPDATE, DELETE ON public.jobs FROM anon, authenticated;

-- 7c. document_chunks (RAG index) are written only by embed_chunks (service_role).
-- Clients keep SELECT and DELETE (deleting a document cascades anyway).
DROP POLICY IF EXISTS "Users insert own chunks" ON public.document_chunks;
REVOKE INSERT, UPDATE ON public.document_chunks FROM anon, authenticated;

-- ============================================================================
-- 8. daily_ai_usage: telemetry-only features cost no credits
-- ============================================================================

-- 'embed' (local embeddings) and 'tts' (audio render, separate TTS quota) are logged for
-- cost/latency visibility only. Same columns as before; keep security_invoker (Phase 0).
CREATE OR REPLACE VIEW public.daily_ai_usage
WITH (security_invoker = true) AS
SELECT
  user_id,
  (created_at AT TIME ZONE 'UTC')::date AS usage_date,
  COUNT(*) AS actions_used,
  SUM(CASE
    WHEN feature = 'chat' THEN 1
    WHEN feature = 'notes' THEN 5
    WHEN feature = 'derivatives' THEN 4
    WHEN feature = 'transcribe' THEN 1
    WHEN feature = 'podcast' THEN 10
    WHEN feature IN ('embed', 'tts') THEN 0
    ELSE 1
  END) AS credits_used
FROM public.ai_usage_logs
WHERE status != 'failed'
GROUP BY user_id, (created_at AT TIME ZONE 'UTC')::date;

REVOKE ALL ON public.daily_ai_usage FROM anon;
