-- ============================================================================
-- Migration: 20261126170000_phase4_cost_monitoring.sql
-- Purpose (roadmap §3.10 / Phase 4 analytics):
--   1. ai_model_prices: per-model list prices, so cost is computed from the tokens logged in
--      ai_usage_logs instead of the hard-coded estimates in each function.
--   2. Service-role-only views: admin_ai_usage_costed (per log row), admin_daily_cost,
--      admin_user_daily_cost (used by the cost_report function) and admin_cost_per_user_30d.
--   3. Optional pg_cron + pg_net job calling the cost_report edge function daily at 06:00 UTC.
--      Skipped with a NOTICE when the extensions or vault secrets are missing.
--
-- Known limitations (see docs/runbook.md "Cost monitoring"):
--   * ai_usage_logs has no BYOK flag. Calls made with a user's own Groq/Gemini key are priced as
--     if the platform paid for them, so est_usd is an upper bound. (OpenAI is BYOK-only and is
--     priced at 0 via platform_paid = false.)
--   * Several functions log tokens estimated from characters (chars / 4), not provider usage.
--   * Whisper logs the audio file size in bytes in input_tokens (ingest/index.ts); audio hours
--     are estimated from bytes assuming 128 kbit/s, with Groq's 10-second minimum per request.
--   * cached_input_tokens are priced at the full input rate.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. Price table
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.ai_model_prices (
  provider text NOT NULL,
  model text NOT NULL,
  input_usd_per_mtok numeric(12,6) NOT NULL DEFAULT 0,
  output_usd_per_mtok numeric(12,6) NOT NULL DEFAULT 0,
  -- Speech-to-text models bill per audio hour instead of per token; NULL for token-priced models.
  usd_per_audio_hour numeric(12,6),
  -- false: calls are paid by the user (BYOK-only provider); priced at 0 in the views.
  platform_paid boolean NOT NULL DEFAULT true,
  effective_from date NOT NULL DEFAULT current_date,
  -- false until the owner has checked the number against the provider's pricing page.
  verified boolean NOT NULL DEFAULT false,
  source_url text,
  notes text,
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (provider, model, effective_from)
);

ALTER TABLE public.ai_model_prices ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.ai_model_prices FROM PUBLIC, anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.ai_model_prices TO service_role;

-- Seed prices. UNVERIFIED (verified = false) values come from the providers' published pricing
-- as last known when this migration was written; they could not be checked against the live
-- pricing pages. The owner must confirm each one and set verified = true (or insert a new row
-- with a later effective_from when a price changes).
INSERT INTO public.ai_model_prices
  (provider, model, input_usd_per_mtok, output_usd_per_mtok, usd_per_audio_hour, platform_paid,
   effective_from, verified, source_url, notes)
VALUES
  -- UNVERIFIED: Groq list price (on-demand tier).
  ('groq', 'openai/gpt-oss-120b', 0.15, 0.60, NULL, true, '2026-01-01', false,
   'https://groq.com/pricing', 'UNVERIFIED seed; confirm on groq.com/pricing'),
  -- UNVERIFIED: Groq list price (on-demand tier).
  ('groq', 'openai/gpt-oss-20b', 0.075, 0.30, NULL, true, '2026-01-01', false,
   'https://groq.com/pricing', 'UNVERIFIED seed; confirm on groq.com/pricing'),
  -- UNVERIFIED: Groq list price (on-demand tier).
  ('groq', 'llama-3.1-8b-instant', 0.05, 0.08, NULL, true, '2026-01-01', false,
   'https://groq.com/pricing', 'UNVERIFIED seed; confirm on groq.com/pricing'),
  -- UNVERIFIED: Groq bills Whisper per audio hour (10 s minimum per request); no token price.
  ('groq', 'whisper-large-v3', 0, 0, 0.111, true, '2026-01-01', false,
   'https://groq.com/pricing', 'UNVERIFIED seed; per audio hour, 10 s minimum per request'),
  -- UNVERIFIED: Gemini API paid tier, text input/output. The free tier costs 0.
  ('gemini', 'gemini-2.5-flash-lite', 0.10, 0.40, NULL, true, '2026-01-01', false,
   'https://ai.google.dev/gemini-api/docs/pricing', 'UNVERIFIED seed; paid tier text price'),
  -- BYOK only (no platform OpenAI key): the user pays, so it is excluded from platform cost.
  ('openai', 'gpt-4o-mini', 0.15, 0.60, NULL, false, '2026-01-01', false,
   'https://openai.com/api/pricing', 'UNVERIFIED seed; BYOK only, not a platform cost'),
  -- Runs inside the Supabase edge runtime: no per-call charge.
  ('local', 'gte-small', 0, 0, NULL, true, '2026-01-01', true,
   NULL, 'Supabase built-in embedding model; no per-call charge'),
  -- Rendered in the user''s browser (podcast_audio logs it): no per-call charge.
  ('local', 'kokoro-82m-browser', 0, 0, NULL, true, '2026-01-01', true,
   NULL, 'Browser-side TTS; no platform charge')
ON CONFLICT (provider, model, effective_from) DO NOTHING;

-- Supports the per-row price lookup below.
CREATE INDEX IF NOT EXISTS idx_ai_usage_logs_created_at ON public.ai_usage_logs (created_at);

-- ----------------------------------------------------------------------------
-- 2. Views (service_role only)
-- ----------------------------------------------------------------------------

-- One row per ai_usage_logs row with the price in force on that day.
-- est_usd is NULL when no price row exists for (provider, model) — counted as unpriced.
CREATE OR REPLACE VIEW public.admin_ai_usage_costed
WITH (security_invoker = true) AS
SELECT
  l.id,
  l.user_id,
  l.feature,
  l.provider,
  l.model,
  l.status,
  l.created_at,
  (l.created_at AT TIME ZONE 'UTC')::date AS day,
  coalesce(l.input_tokens, 0) AS input_tokens,
  coalesce(l.output_tokens, 0) AS output_tokens,
  coalesce(l.estimated_cost_usd, 0) AS logged_cost_usd,
  (p.provider IS NOT NULL) AS priced,
  CASE
    WHEN p.provider IS NULL THEN NULL
    WHEN NOT p.platform_paid THEN 0::numeric
    WHEN p.usd_per_audio_hour IS NOT NULL THEN
      -- input_tokens = audio bytes for Whisper; 16000 bytes/s = 128 kbit/s; 10 s minimum.
      CASE WHEN coalesce(l.input_tokens, 0) > 0
        THEN greatest(l.input_tokens / (16000.0 * 3600.0), 10.0 / 3600.0) * p.usd_per_audio_hour
        ELSE 0::numeric
      END
    ELSE
      (coalesce(l.input_tokens, 0) * p.input_usd_per_mtok
        + coalesce(l.output_tokens, 0) * p.output_usd_per_mtok) / 1000000.0
  END AS est_usd
FROM public.ai_usage_logs l
LEFT JOIN LATERAL (
  SELECT mp.*
  FROM public.ai_model_prices mp
  WHERE mp.provider = l.provider
    AND mp.model = l.model
    AND mp.effective_from <= (l.created_at AT TIME ZONE 'UTC')::date
  ORDER BY mp.effective_from DESC
  LIMIT 1
) p ON true;

CREATE OR REPLACE VIEW public.admin_daily_cost
WITH (security_invoker = true) AS
SELECT
  day,
  provider,
  model,
  count(*) AS requests,
  count(*) FILTER (WHERE status = 'failed') AS failed_requests,
  count(*) FILTER (WHERE NOT priced) AS unpriced_requests,
  sum(input_tokens) AS input_tokens,
  sum(output_tokens) AS output_tokens,
  round(coalesce(sum(est_usd), 0), 6) AS est_usd,
  round(sum(logged_cost_usd), 6) AS logged_cost_usd
FROM public.admin_ai_usage_costed
GROUP BY day, provider, model;

CREATE OR REPLACE VIEW public.admin_user_daily_cost
WITH (security_invoker = true) AS
SELECT
  c.day,
  c.user_id,
  coalesce(pr.tier, 'free') AS tier,
  count(*) AS actions,
  round(coalesce(sum(c.est_usd), 0), 6) AS est_usd
FROM public.admin_ai_usage_costed c
LEFT JOIN public.profiles pr ON pr.user_id = c.user_id
WHERE c.user_id IS NOT NULL
GROUP BY c.day, c.user_id, coalesce(pr.tier, 'free');

-- Revenue assumption (src/lib/plans.ts): Scholar (tier 'pro') $9/month, everyone else $0.
-- BYOK users are tier 'free' and bring their own key, so their revenue is $0 too.
CREATE OR REPLACE VIEW public.admin_cost_per_user_30d
WITH (security_invoker = true) AS
WITH usage AS (
  SELECT user_id, count(*) AS actions, coalesce(sum(est_usd), 0) AS est_usd
  FROM public.admin_ai_usage_costed
  WHERE user_id IS NOT NULL
    AND created_at >= now() - interval '30 days'
  GROUP BY user_id
)
SELECT
  u.user_id,
  coalesce(pr.tier, 'free') AS tier,
  u.actions,
  round(u.est_usd, 6) AS est_usd,
  (CASE WHEN pr.tier = 'pro' THEN 9 ELSE 0 END)::numeric AS plan_revenue_usd,
  round((CASE WHEN pr.tier = 'pro' THEN 9 ELSE 0 END) - u.est_usd, 6) AS margin_usd
FROM usage u
LEFT JOIN public.profiles pr ON pr.user_id = u.user_id;

REVOKE ALL ON public.admin_ai_usage_costed FROM PUBLIC, anon, authenticated;
REVOKE ALL ON public.admin_daily_cost FROM PUBLIC, anon, authenticated;
REVOKE ALL ON public.admin_user_daily_cost FROM PUBLIC, anon, authenticated;
REVOKE ALL ON public.admin_cost_per_user_30d FROM PUBLIC, anon, authenticated;
GRANT SELECT ON public.admin_ai_usage_costed TO service_role;
GRANT SELECT ON public.admin_daily_cost TO service_role;
GRANT SELECT ON public.admin_user_daily_cost TO service_role;
GRANT SELECT ON public.admin_cost_per_user_30d TO service_role;

-- ----------------------------------------------------------------------------
-- 3. Daily schedule (optional; never fails the migration)
-- ----------------------------------------------------------------------------
-- The job reads the vault secrets at run time, so rotating them needs no reschedule.
DO $outer$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_cron')
     OR NOT EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_net') THEN
    RAISE NOTICE 'cost_report schedule skipped: pg_cron and/or pg_net not installed';
    RETURN;
  END IF;

  IF to_regclass('vault.decrypted_secrets') IS NULL THEN
    RAISE NOTICE 'cost_report schedule skipped: vault not available';
    RETURN;
  END IF;

  IF (SELECT count(DISTINCT name) FROM vault.decrypted_secrets
      WHERE name IN ('project_url', 'cron_secret')) < 2 THEN
    RAISE NOTICE 'cost_report schedule skipped: create vault secrets project_url and cron_secret, then run the schedule SQL from docs/runbook.md';
    RETURN;
  END IF;

  IF EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'cost_report_daily') THEN
    PERFORM cron.unschedule('cost_report_daily');
  END IF;

  PERFORM cron.schedule(
    'cost_report_daily',
    '0 6 * * *',
    $cmd$
    SELECT net.http_post(
      url := (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'project_url')
             || '/functions/v1/cost_report',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'x-cron-secret', (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'cron_secret')
      ),
      body := '{}'::jsonb,
      timeout_milliseconds := 30000
    );
    $cmd$
  );
  RAISE NOTICE 'cost_report_daily scheduled at 06:00 UTC';
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'cost_report schedule skipped: %', SQLERRM;
END
$outer$;
