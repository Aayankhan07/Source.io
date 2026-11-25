-- Phase 2: full-document generation (task 2.13) and server-side encrypted BYOK keys
-- (task 2.11, roadmap §6.0). See docs/superpowers/plans/2026-11-26-company-audit-and-roadmap.md.
--
-- Contents:
--   1. note_sections: per-section notes so a long document is generated (and retried) section by section.
--   2. user_api_keys: AES-GCM encrypted provider keys. Clients can never read ciphertext;
--      list_my_api_keys() returns provider + last4 only.

-- ============================================================================
-- 1. note_sections
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.note_sections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id uuid NOT NULL REFERENCES public.documents(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  idx int NOT NULL CHECK (idx >= 0),
  -- Number of sections the document was split into when this row was written. A different
  -- split (source or splitter changed) invalidates the stored sections.
  total int NOT NULL CHECK (total >= 1),
  markdown text NOT NULL DEFAULT '',
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'running', 'done', 'failed')),
  model text,
  error text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT note_sections_document_idx_key UNIQUE (document_id, idx)
);

CREATE INDEX IF NOT EXISTS idx_note_sections_user_id ON public.note_sections (user_id);

ALTER TABLE public.note_sections ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users view own note sections" ON public.note_sections;
CREATE POLICY "Users view own note sections" ON public.note_sections
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

-- Written only by the generate_notes edge function (service role).
REVOKE ALL ON public.note_sections FROM anon;
REVOKE INSERT, UPDATE, DELETE, TRUNCATE ON public.note_sections FROM authenticated;
GRANT SELECT ON public.note_sections TO authenticated;
GRANT ALL ON public.note_sections TO service_role;

DROP TRIGGER IF EXISTS update_note_sections_updated_at ON public.note_sections;
CREATE TRIGGER update_note_sections_updated_at
  BEFORE UPDATE ON public.note_sections
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================================================
-- 2. user_api_keys
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.user_api_keys (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  provider text NOT NULL CHECK (provider IN ('groq', 'gemini', 'openai')),
  -- base64 AES-256-GCM ciphertext (+ tag) and 12-byte IV. The master key lives only in the
  -- edge-function secret BYOK_ENCRYPTION_KEY; the database never sees plaintext.
  ciphertext text NOT NULL,
  iv text NOT NULL,
  last4 text NOT NULL CHECK (char_length(last4) BETWEEN 1 AND 4),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT user_api_keys_user_provider_key UNIQUE (user_id, provider)
);

ALTER TABLE public.user_api_keys ENABLE ROW LEVEL SECURITY;
-- No policies for anon/authenticated: with RLS on and no grants, clients cannot touch the
-- table at all. Only the service role (api_keys / generate_* edge functions) reads it.
REVOKE ALL ON public.user_api_keys FROM PUBLIC, anon, authenticated;
GRANT ALL ON public.user_api_keys TO service_role;

DROP TRIGGER IF EXISTS update_user_api_keys_updated_at ON public.user_api_keys;
CREATE TRIGGER update_user_api_keys_updated_at
  BEFORE UPDATE ON public.user_api_keys
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- The only client-facing read: which providers have a key, and its last 4 characters.
CREATE OR REPLACE FUNCTION public.list_my_api_keys()
RETURNS TABLE (provider text, last4 text, updated_at timestamptz)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT k.provider, k.last4, k.updated_at
  FROM public.user_api_keys k
  WHERE k.user_id = auth.uid()
  ORDER BY k.provider;
$$;

REVOKE EXECUTE ON FUNCTION public.list_my_api_keys() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.list_my_api_keys() TO authenticated, service_role;
