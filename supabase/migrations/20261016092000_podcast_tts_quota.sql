-- Add columns for podcast TTS quota and automated midnight UTC daily rollover
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS daily_quota_used INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS daily_quota_limit INTEGER DEFAULT 25,
ADD COLUMN IF NOT EXISTS daily_tts_quota_used INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS daily_tts_quota_limit INTEGER DEFAULT 2,
ADD COLUMN IF NOT EXISTS tier TEXT DEFAULT 'free',
ADD COLUMN IF NOT EXISTS active_docs_limit INTEGER DEFAULT 3,
ADD COLUMN IF NOT EXISTS quota_reset_date DATE DEFAULT CURRENT_DATE;

-- Enhanced consume_daily_quota with lazy midnight UTC rollover (Single atomic update + Negative-cost guard + fixed id column)
CREATE OR REPLACE FUNCTION public.consume_daily_quota(
  p_user_id UUID,
  p_cost INT DEFAULT 1
)
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
      ELSE daily_quota_used + p_cost 
    END,
    daily_tts_quota_used = CASE 
      WHEN quota_reset_date IS NULL OR quota_reset_date < CURRENT_DATE THEN 0 
      ELSE daily_tts_quota_used 
    END,
    quota_reset_date = CURRENT_DATE,
    updated_at = NOW()
  WHERE id = p_user_id
    AND (
      ( (quota_reset_date IS NULL OR quota_reset_date < CURRENT_DATE) AND p_cost <= daily_quota_limit )
      OR 
      ( quota_reset_date = CURRENT_DATE AND (daily_quota_used + p_cost) <= daily_quota_limit )
    )
  RETURNING TRUE INTO v_updated;

  RETURN COALESCE(v_updated, FALSE);
END;
$$;

-- Atomic daily TTS audio synthesis quota consumption
CREATE OR REPLACE FUNCTION public.consume_daily_tts_quota(
  p_user_id UUID,
  p_cost INT DEFAULT 1
)
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
      ELSE daily_quota_used 
    END,
    daily_tts_quota_used = CASE 
      WHEN quota_reset_date IS NULL OR quota_reset_date < CURRENT_DATE THEN p_cost 
      ELSE daily_tts_quota_used + p_cost 
    END,
    quota_reset_date = CURRENT_DATE,
    updated_at = NOW()
  WHERE id = p_user_id
    AND (
      ( (quota_reset_date IS NULL OR quota_reset_date < CURRENT_DATE) AND p_cost <= daily_tts_quota_limit )
      OR 
      ( quota_reset_date = CURRENT_DATE AND (daily_tts_quota_used + p_cost) <= daily_tts_quota_limit )
    )
  RETURNING TRUE INTO v_updated;

  RETURN COALESCE(v_updated, FALSE);
END;
$$;

-- Lock down execution strictly to backend service_role
REVOKE EXECUTE ON FUNCTION public.consume_daily_quota(UUID, INT) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.consume_daily_quota(UUID, INT) TO service_role;

REVOKE EXECUTE ON FUNCTION public.consume_daily_tts_quota(UUID, INT) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.consume_daily_tts_quota(UUID, INT) TO service_role;

