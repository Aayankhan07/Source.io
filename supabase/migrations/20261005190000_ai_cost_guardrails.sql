-- ============================================================================
-- Migration: 20261005190000_ai_cost_guardrails.sql
-- Purpose: Adds idempotency indexing to jobs and creates secure ai_usage_logs table
-- ============================================================================

-- 1. Add idempotency_key column to jobs table
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
