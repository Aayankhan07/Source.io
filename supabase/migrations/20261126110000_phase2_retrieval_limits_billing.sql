-- Phase 2: semantic retrieval, plan limits, billing ledger, storage hygiene.
-- See docs/superpowers/plans/2026-11-26-company-audit-and-roadmap.md (§6 decision 4, §6.1, tasks 2.5-2.7).
--
-- Contents:
--   1. document_chunks.embedding -> halfvec(384) for gte-small (old FNV hash vectors are nulled;
--      chat / embed_chunks re-embed on demand), HNSW halfvec_cosine_ops, one row per
--      (document_id, order_index) so re-indexing is an idempotent upsert (fixes B12).
--   2. match_document_chunks takes a halfvec(384) query.
--   3. chat_messages.citations.
--   4. Active-document limit trigger reads profiles.active_docs_limit.
--   5. subscriptions + billing_events ledger and the apply_billing_event RPC.
--   6. Storage bucket limits; avatars bucket private.

-- ============================================================================
-- 0. Schema drift guard: some projects applied an earlier version of 20261016092000 that did not add
--    profiles.active_docs_limit, which the Phase 0 billing trigger and the document-limit trigger read.
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS active_docs_limit INTEGER DEFAULT 3;

-- 1. Embeddings: gte-small (384 dims) stored as halfvec
-- ============================================================================

DROP INDEX IF EXISTS public.document_chunks_embedding_hnsw;
DROP INDEX IF EXISTS public.idx_document_chunks_embedding;
DROP INDEX IF EXISTS public.document_chunks_embedding_idx;

-- Hashed n-gram vectors are not comparable with gte-small vectors: drop them all.
ALTER TABLE public.document_chunks
  ALTER COLUMN embedding TYPE extensions.halfvec(384) USING NULL::extensions.halfvec(384);

-- Keep one row per chunk position (newest wins) so upserts can key on it.
DELETE FROM public.document_chunks c
USING (
  SELECT id,
         row_number() OVER (PARTITION BY document_id, order_index ORDER BY created_at DESC, id DESC) AS rn
  FROM public.document_chunks
) d
WHERE c.id = d.id AND d.rn > 1;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'document_chunks_document_order_key') THEN
    ALTER TABLE public.document_chunks
      ADD CONSTRAINT document_chunks_document_order_key UNIQUE (document_id, order_index);
  END IF;
END $$;

-- The unique constraint indexes (document_id, order_index); document_id alone is a prefix of it.
DROP INDEX IF EXISTS public.idx_document_chunks_document_id;

CREATE INDEX IF NOT EXISTS document_chunks_embedding_hnsw
  ON public.document_chunks
  USING hnsw (embedding extensions.halfvec_cosine_ops)
  WITH (m = 16, ef_construction = 64);

-- ============================================================================
-- 2. match_document_chunks(halfvec)
-- ============================================================================

-- Remove the vector overload so PostgREST resolves a single function.
DROP FUNCTION IF EXISTS public.match_document_chunks(uuid, extensions.vector, int);

-- Retrieval is scoped to one document (at most ~750 chunks at the 300-page cap), so it ranks
-- that document's chunks exactly. The MATERIALIZED CTE keeps the planner from using the
-- global HNSW index here: an HNSW scan returns the nearest ef_search rows across ALL
-- documents and would then filter most of them away, often returning nothing.
CREATE OR REPLACE FUNCTION public.match_document_chunks(
  _document_id uuid,
  _query_embedding extensions.halfvec,
  _match_count int DEFAULT 6
)
RETURNS TABLE (id uuid, chunk_text text, order_index int, similarity float)
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = public, extensions
AS $$
  WITH doc_chunks AS MATERIALIZED (
    SELECT c.id, c.chunk_text, c.order_index, c.embedding
    FROM public.document_chunks c
    WHERE c.document_id = _document_id
      AND c.embedding IS NOT NULL
  )
  SELECT d.id, d.chunk_text, d.order_index,
         1 - (d.embedding <=> _query_embedding::extensions.halfvec(384)) AS similarity
  FROM doc_chunks d
  ORDER BY d.embedding <=> _query_embedding::extensions.halfvec(384)
  LIMIT least(greatest(coalesce(_match_count, 6), 1), 20);
$$;

-- ============================================================================
-- 3. Chat citations
-- ============================================================================

-- Array of { n, order_index, similarity, text } for assistant messages (written by chat).
ALTER TABLE public.chat_messages ADD COLUMN IF NOT EXISTS citations jsonb;

-- ============================================================================
-- 4. Active-document limit per plan
-- ============================================================================

-- Reads the server-owned profiles.active_docs_limit (3 free / 100 pro, set by billing).
-- Only checks when a row BECOMES active (insert, or failed -> active), so a downgraded user's
-- existing documents can still finish processing.
CREATE OR REPLACE FUNCTION public.check_user_active_document_limit()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  active_count int;
  docs_limit int;
BEGIN
  IF NEW.status NOT IN ('ready', 'processing', 'pending') THEN
    RETURN NEW;
  END IF;
  IF TG_OP = 'UPDATE' AND OLD.status IN ('ready', 'processing', 'pending') THEN
    RETURN NEW;
  END IF;

  -- Serialize concurrent inserts for the same user (two tabs cannot both see "2 of 3").
  PERFORM pg_advisory_xact_lock(hashtext(NEW.user_id::text));

  SELECT coalesce(p.active_docs_limit, 3) INTO docs_limit
  FROM public.profiles p
  WHERE p.user_id = NEW.user_id;
  docs_limit := coalesce(docs_limit, 3);

  SELECT count(*) INTO active_count
  FROM public.documents
  WHERE user_id = NEW.user_id
    AND status IN ('ready', 'processing', 'pending')
    AND id <> NEW.id;

  IF active_count >= docs_limit THEN
    RAISE EXCEPTION 'LIMIT_EXCEEDED: You have reached your plan''s limit of % saved documents. Delete a document to add another one.', docs_limit
      USING ERRCODE = 'P0001', HINT = 'DOCUMENT_LIMIT_REACHED';
  END IF;
  RETURN NEW;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.check_user_active_document_limit() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS trigger_check_user_active_document_limit ON public.documents;
CREATE TRIGGER trigger_check_user_active_document_limit
  BEFORE INSERT OR UPDATE OF status ON public.documents
  FOR EACH ROW
  EXECUTE FUNCTION public.check_user_active_document_limit();

-- Existing pro users get the Scholar document limit (billing-webhook keeps it in sync).
UPDATE public.profiles SET active_docs_limit = 100 WHERE tier = 'pro' AND coalesce(active_docs_limit, 3) < 100;

-- ============================================================================
-- 5. Billing ledger
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  provider text NOT NULL DEFAULT 'lemonsqueezy',
  provider_subscription_id text NOT NULL,
  provider_customer_id text,
  status text NOT NULL,
  variant_id text,
  plan text,
  renews_at timestamptz,
  ends_at timestamptz,
  trial_ends_at timestamptz,
  -- Provider-side updated_at of the last applied event; older deliveries are ignored.
  updated_at timestamptz NOT NULL,
  synced_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_subscriptions_provider_subscription_id
  ON public.subscriptions (provider_subscription_id);

ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users view own subscription" ON public.subscriptions;
CREATE POLICY "Users view own subscription" ON public.subscriptions
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
REVOKE INSERT, UPDATE, DELETE ON public.subscriptions FROM anon, authenticated;
REVOKE ALL ON public.subscriptions FROM anon;

CREATE TABLE IF NOT EXISTS public.billing_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id text NOT NULL,
  event_name text NOT NULL,
  -- SET NULL: the financial ledger outlives account deletion.
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  webhook_id text,
  payload jsonb NOT NULL,
  outcome text,
  received_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT billing_events_event_id_key UNIQUE (event_id)
);

CREATE INDEX IF NOT EXISTS idx_billing_events_user_received ON public.billing_events (user_id, received_at DESC);

-- Service-only: RLS on with no policies, and no table privileges for client roles.
ALTER TABLE public.billing_events ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.billing_events FROM anon, authenticated;

-- Applies one verified webhook event atomically:
--   'duplicate'    event_id already recorded (nothing else happens)
--   'recorded'     ledger only (orders, invoices, unknown events)
--   'unknown_user' user does not exist (anymore); ledger only
--   'stale'        older than the stored subscription state; ledger only
--   'applied'      subscription upserted and profile tier/limits set from p_entitlement
-- p_subscription: { provider_subscription_id, provider_customer_id, status, variant_id, plan,
--                   renews_at, ends_at, trial_ends_at, updated_at }
-- p_entitlement:  { tier, daily_quota_limit, daily_tts_quota_limit, active_docs_limit }
CREATE OR REPLACE FUNCTION public.apply_billing_event(
  p_event_id text,
  p_event_name text,
  p_user_id uuid,
  p_webhook_id text,
  p_payload jsonb,
  p_subscription jsonb,
  p_entitlement jsonb
)
RETURNS text
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
DECLARE
  v_user uuid := p_user_id;
  v_updated_at timestamptz;
  v_applied boolean;
  v_outcome text;
BEGIN
  IF p_event_id IS NULL OR btrim(p_event_id) = '' THEN
    RAISE EXCEPTION 'event id required';
  END IF;

  IF v_user IS NOT NULL AND NOT EXISTS (SELECT 1 FROM auth.users WHERE id = v_user) THEN
    v_user := NULL;
  END IF;

  INSERT INTO public.billing_events (event_id, event_name, user_id, webhook_id, payload)
  VALUES (p_event_id, coalesce(p_event_name, 'unknown'), v_user, p_webhook_id, coalesce(p_payload, '{}'::jsonb))
  ON CONFLICT (event_id) DO NOTHING;
  IF NOT FOUND THEN
    RETURN 'duplicate';
  END IF;

  IF p_subscription IS NULL OR jsonb_typeof(p_subscription) <> 'object' THEN
    v_outcome := 'recorded';
  ELSIF v_user IS NULL THEN
    v_outcome := 'unknown_user';
  ELSE
    v_updated_at := coalesce((p_subscription ->> 'updated_at')::timestamptz, now());

    INSERT INTO public.subscriptions AS s (
      user_id, provider_subscription_id, provider_customer_id, status, variant_id, plan,
      renews_at, ends_at, trial_ends_at, updated_at, synced_at
    )
    VALUES (
      v_user,
      p_subscription ->> 'provider_subscription_id',
      p_subscription ->> 'provider_customer_id',
      p_subscription ->> 'status',
      p_subscription ->> 'variant_id',
      p_subscription ->> 'plan',
      (p_subscription ->> 'renews_at')::timestamptz,
      (p_subscription ->> 'ends_at')::timestamptz,
      (p_subscription ->> 'trial_ends_at')::timestamptz,
      v_updated_at,
      now()
    )
    ON CONFLICT (user_id) DO UPDATE SET
      provider_subscription_id = EXCLUDED.provider_subscription_id,
      provider_customer_id = EXCLUDED.provider_customer_id,
      status = EXCLUDED.status,
      variant_id = EXCLUDED.variant_id,
      plan = EXCLUDED.plan,
      renews_at = EXCLUDED.renews_at,
      ends_at = EXCLUDED.ends_at,
      trial_ends_at = EXCLUDED.trial_ends_at,
      updated_at = EXCLUDED.updated_at,
      synced_at = now()
    WHERE s.updated_at <= EXCLUDED.updated_at
    RETURNING TRUE INTO v_applied;

    IF coalesce(v_applied, FALSE) THEN
      IF p_entitlement IS NOT NULL AND jsonb_typeof(p_entitlement) = 'object' THEN
        UPDATE public.profiles
        SET tier = CASE WHEN p_entitlement ->> 'tier' = 'pro' THEN 'pro' ELSE 'free' END,
            daily_quota_limit = (p_entitlement ->> 'daily_quota_limit')::int,
            daily_tts_quota_limit = (p_entitlement ->> 'daily_tts_quota_limit')::int,
            active_docs_limit = (p_entitlement ->> 'active_docs_limit')::int,
            updated_at = now()
        WHERE user_id = v_user;
      END IF;
      v_outcome := 'applied';
    ELSE
      v_outcome := 'stale';
    END IF;
  END IF;

  UPDATE public.billing_events SET outcome = v_outcome WHERE event_id = p_event_id;
  RETURN v_outcome;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.apply_billing_event(text, text, uuid, text, jsonb, jsonb, jsonb) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.apply_billing_event(text, text, uuid, text, jsonb, jsonb, jsonb) TO service_role;

-- ============================================================================
-- 6. Storage hygiene (S10)
-- ============================================================================

-- uploads: audio/video for transcription (PDF/DOCX/text are parsed in the browser, never stored).
UPDATE storage.buckets
SET file_size_limit = 104857600,
    allowed_mime_types = ARRAY['audio/*', 'video/*']
WHERE id = 'uploads';

-- podcasts: rendered podcast audio only.
UPDATE storage.buckets
SET file_size_limit = 104857600,
    allowed_mime_types = ARRAY['audio/*']
WHERE id = 'podcasts';

-- avatars: nothing reads public avatar URLs; make the bucket private and owner-readable.
UPDATE storage.buckets SET public = false WHERE id = 'avatars';
DROP POLICY IF EXISTS "Avatars readable by path" ON storage.objects;
DROP POLICY IF EXISTS "Users read own avatars" ON storage.objects;
CREATE POLICY "Users read own avatars" ON storage.objects
  FOR SELECT TO authenticated
  USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);
