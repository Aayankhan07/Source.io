-- Phase 0 security & correctness fixes (see docs/superpowers/plans/2026-11-26-phase0-security-and-crash-fixes.md)

-- 1. Billing/quota columns on profiles are server-owned.
CREATE OR REPLACE FUNCTION public.protect_profile_billing_columns()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF coalesce(auth.role(), '') NOT IN ('authenticated', 'anon') THEN
    RETURN NEW; -- service_role, postgres, migrations
  END IF;

  IF TG_OP = 'INSERT' THEN
    NEW.tier := 'free';
    NEW.daily_quota_limit := 25;
    NEW.daily_tts_quota_limit := 2;
    NEW.daily_quota_used := 0;
    NEW.daily_tts_quota_used := 0;
    NEW.active_docs_limit := 3;
    NEW.quota_reset_date := CURRENT_DATE;
    RETURN NEW;
  END IF;

  IF NEW.tier IS DISTINCT FROM OLD.tier
     OR NEW.daily_quota_limit IS DISTINCT FROM OLD.daily_quota_limit
     OR NEW.daily_tts_quota_limit IS DISTINCT FROM OLD.daily_tts_quota_limit
     OR NEW.daily_quota_used IS DISTINCT FROM OLD.daily_quota_used
     OR NEW.daily_tts_quota_used IS DISTINCT FROM OLD.daily_tts_quota_used
     OR NEW.active_docs_limit IS DISTINCT FROM OLD.active_docs_limit
     OR NEW.quota_reset_date IS DISTINCT FROM OLD.quota_reset_date
     OR NEW.user_id IS DISTINCT FROM OLD.user_id THEN
    RAISE EXCEPTION 'billing and quota fields are read-only' USING ERRCODE = '42501';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS protect_profile_billing_columns ON public.profiles;
CREATE TRIGGER protect_profile_billing_columns
  BEFORE INSERT OR UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.protect_profile_billing_columns();

-- 2. Profiles are private to their owner (was: viewable by everyone).
DROP POLICY IF EXISTS "Profiles viewable by everyone" ON public.profiles;
DROP POLICY IF EXISTS "Users view own profile" ON public.profiles;
CREATE POLICY "Users view own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = user_id);

-- 3. Role-customization policy compared auth.uid() to the random profiles.id.
DROP POLICY IF EXISTS "Users can update their own profile and preferences" ON public.profiles;
DROP POLICY IF EXISTS "Users update own profile" ON public.profiles;
CREATE POLICY "Users update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- 4. Quota RPCs must match on user_id (profiles.id is a random UUID).
CREATE OR REPLACE FUNCTION public.consume_daily_quota(p_user_id UUID, p_cost INT DEFAULT 1)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_updated BOOLEAN;
BEGIN
  IF p_cost <= 0 THEN
    RAISE EXCEPTION 'Quota cost must be a positive integer';
  END IF;

  UPDATE public.profiles
  SET
    daily_quota_used = CASE
      WHEN quota_reset_date IS NULL OR quota_reset_date < CURRENT_DATE THEN p_cost
      ELSE coalesce(daily_quota_used, 0) + p_cost
    END,
    daily_tts_quota_used = CASE
      WHEN quota_reset_date IS NULL OR quota_reset_date < CURRENT_DATE THEN 0
      ELSE coalesce(daily_tts_quota_used, 0)
    END,
    quota_reset_date = CURRENT_DATE,
    updated_at = NOW()
  WHERE user_id = p_user_id
    AND (
      ((quota_reset_date IS NULL OR quota_reset_date < CURRENT_DATE) AND p_cost <= coalesce(daily_quota_limit, 25))
      OR
      (quota_reset_date = CURRENT_DATE AND (coalesce(daily_quota_used, 0) + p_cost) <= coalesce(daily_quota_limit, 25))
    )
  RETURNING TRUE INTO v_updated;

  RETURN COALESCE(v_updated, FALSE);
END;
$$;

CREATE OR REPLACE FUNCTION public.consume_daily_tts_quota(p_user_id UUID, p_cost INT DEFAULT 1)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_updated BOOLEAN;
BEGIN
  IF p_cost <= 0 THEN
    RAISE EXCEPTION 'TTS quota cost must be a positive integer';
  END IF;

  UPDATE public.profiles
  SET
    daily_quota_used = CASE
      WHEN quota_reset_date IS NULL OR quota_reset_date < CURRENT_DATE THEN 0
      ELSE coalesce(daily_quota_used, 0)
    END,
    daily_tts_quota_used = CASE
      WHEN quota_reset_date IS NULL OR quota_reset_date < CURRENT_DATE THEN p_cost
      ELSE coalesce(daily_tts_quota_used, 0) + p_cost
    END,
    quota_reset_date = CURRENT_DATE,
    updated_at = NOW()
  WHERE user_id = p_user_id
    AND (
      ((quota_reset_date IS NULL OR quota_reset_date < CURRENT_DATE) AND p_cost <= coalesce(daily_tts_quota_limit, 2))
      OR
      (quota_reset_date = CURRENT_DATE AND (coalesce(daily_tts_quota_used, 0) + p_cost) <= coalesce(daily_tts_quota_limit, 2))
    )
  RETURNING TRUE INTO v_updated;

  RETURN COALESCE(v_updated, FALSE);
END;
$$;

REVOKE EXECUTE ON FUNCTION public.consume_daily_quota(UUID, INT) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.consume_daily_quota(UUID, INT) TO service_role;
REVOKE EXECUTE ON FUNCTION public.consume_daily_tts_quota(UUID, INT) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.consume_daily_tts_quota(UUID, INT) TO service_role;

-- 5. Usage view must respect RLS of ai_usage_logs.
ALTER VIEW public.daily_ai_usage SET (security_invoker = true);
REVOKE ALL ON public.daily_ai_usage FROM anon;

-- 6. Embedding column: code writes 768-d vectors, column was vector(1536).
DROP INDEX IF EXISTS public.idx_document_chunks_embedding;
DROP INDEX IF EXISTS public.document_chunks_embedding_idx;
ALTER TABLE public.document_chunks
  ALTER COLUMN embedding TYPE extensions.vector(768)
  USING CASE
    WHEN embedding IS NOT NULL AND extensions.vector_dims(embedding) = 768
      THEN embedding::extensions.vector(768)
    ELSE NULL
  END;
CREATE INDEX IF NOT EXISTS document_chunks_embedding_hnsw
  ON public.document_chunks
  USING hnsw (embedding extensions.vector_cosine_ops)
  WITH (m = 16, ef_construction = 64);
