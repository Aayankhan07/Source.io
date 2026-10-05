-- ============================================================================
-- Migration: 20261005200000_full_free_cost_plan.sql
-- Purpose: 
--   1. Enforce 3 active saved documents limit at database level with transaction-level advisory lock.
--   2. Create provider_usage table for live provider health/capacity snapshots with freshness metadata.
--   3. Create ai_feedback table for user ratings on generated notes and answers.
--   4. Create daily_ai_usage view for aggregated student daily action/credit tracking.
--   5. Create system_circuit_breakers table for emergency admin kill switches.
-- ============================================================================

-- 1. Database-level 3-document limit enforcement with strict serialization
CREATE OR REPLACE FUNCTION public.check_user_active_document_limit()
RETURNS TRIGGER AS $$
DECLARE
  active_count INT;
BEGIN
  -- Acquire an exclusive transaction-level advisory lock on the user's ID.
  -- This serializes concurrent uploads across multiple browser tabs/requests,
  -- ensuring two simultaneous inserts cannot both observe "2 of 3" and create a 4th document.
  PERFORM pg_advisory_xact_lock(hashtext(NEW.user_id::text));

  -- Only count active documents ('ready', 'processing', 'pending')
  IF NEW.status IN ('ready', 'processing', 'pending') THEN
    SELECT COUNT(*) INTO active_count
    FROM public.documents
    WHERE user_id = NEW.user_id
      AND status IN ('ready', 'processing', 'pending')
      AND id != NEW.id;

    IF active_count >= 3 THEN
      RAISE EXCEPTION 'LIMIT_EXCEEDED: You have reached the free limit of 3 saved documents. Delete a document to add another one.';
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_check_user_active_document_limit ON public.documents;
CREATE TRIGGER trigger_check_user_active_document_limit
  BEFORE INSERT OR UPDATE OF status ON public.documents
  FOR EACH ROW
  EXECUTE FUNCTION public.check_user_active_document_limit();

-- 2. Create provider_usage table with freshness and source metadata
CREATE TABLE IF NOT EXISTS public.provider_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider TEXT NOT NULL,                     -- 'groq' | 'gemini' | 'openai'
  model TEXT NOT NULL,
  scope TEXT NOT NULL DEFAULT 'organization', -- 'organization' | 'shared' | 'byok'
  source_type TEXT NOT NULL DEFAULT 'response_header', -- 'response_header' | 'estimate' | 'unknown'
  remaining_requests INT,
  request_limit INT,
  remaining_tokens INT,
  token_limit INT,
  reset_requests_at TIMESTAMPTZ,
  reset_tokens_at TIMESTAMPTZ,
  raw_reset_tokens TEXT,
  raw_reset_requests TEXT,
  captured_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_provider_usage_latest 
ON public.provider_usage (provider, scope, captured_at DESC);

ALTER TABLE public.provider_usage ENABLE ROW LEVEL SECURITY;

DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'provider_usage' AND policyname = 'Anyone authenticated can view provider usage'
  ) THEN
    CREATE POLICY "Anyone authenticated can view provider usage"
      ON public.provider_usage FOR SELECT
      TO authenticated
      USING (true);
  END IF;
END $$;

-- 3. Create ai_feedback table
CREATE TABLE IF NOT EXISTS public.ai_feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  document_id UUID REFERENCES public.documents(id) ON DELETE CASCADE,
  feature TEXT NOT NULL,           -- 'notes' | 'derivatives' | 'chat'
  model TEXT NOT NULL,
  helpful BOOLEAN NOT NULL,        -- true = thumbs up, false = thumbs down
  feedback_text TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_ai_feedback_doc 
ON public.ai_feedback (document_id, feature, created_at DESC);

ALTER TABLE public.ai_feedback ENABLE ROW LEVEL SECURITY;

DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'ai_feedback' AND policyname = 'Users insert own feedback'
  ) THEN
    CREATE POLICY "Users insert own feedback"
      ON public.ai_feedback FOR INSERT
      WITH CHECK (auth.uid() = user_id);
    CREATE POLICY "Users view own feedback"
      ON public.ai_feedback FOR SELECT
      USING (auth.uid() = user_id);
  END IF;
END $$;

-- 4. Ensure ai_usage_logs and jobs idempotency exist before creating view
ALTER TABLE public.jobs 
ADD COLUMN IF NOT EXISTS idempotency_key TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS ai_jobs_idempotency_key_idx 
ON public.jobs (idempotency_key) 
WHERE idempotency_key IS NOT NULL;

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

CREATE INDEX IF NOT EXISTS idx_ai_usage_logs_user_daily 
ON public.ai_usage_logs (user_id, feature, created_at);

CREATE INDEX IF NOT EXISTS idx_ai_usage_logs_document 
ON public.ai_usage_logs (document_id, created_at);

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

-- 5. Create daily_ai_usage view for unified daily action accounting
CREATE OR REPLACE VIEW public.daily_ai_usage AS
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
    ELSE 1
  END) AS credits_used
FROM public.ai_usage_logs
WHERE status != 'failed'
GROUP BY user_id, (created_at AT TIME ZONE 'UTC')::date;

-- 5. Create system_circuit_breakers table
CREATE TABLE IF NOT EXISTS public.system_circuit_breakers (
  key TEXT PRIMARY KEY,
  enabled BOOLEAN NOT NULL DEFAULT true,
  description TEXT,
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Default system controls
INSERT INTO public.system_circuit_breakers (key, enabled, description)
VALUES 
  ('ai_requests_enabled', true, 'Global emergency switch for all LLM calls'),
  ('uploads_enabled', true, 'Global switch for new document ingests'),
  ('podcasts_enabled', false, 'Podcasts disabled in free plan circuit breaker')
ON CONFLICT (key) DO NOTHING;

ALTER TABLE public.system_circuit_breakers ENABLE ROW LEVEL SECURITY;

DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'system_circuit_breakers' AND policyname = 'Anyone authenticated can view circuit breakers'
  ) THEN
    CREATE POLICY "Anyone authenticated can view circuit breakers"
      ON public.system_circuit_breakers FOR SELECT
      TO authenticated
      USING (true);
  END IF;
END $$;
