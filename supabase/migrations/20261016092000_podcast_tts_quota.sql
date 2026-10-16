-- Add columns for podcast TTS quota and automated midnight UTC daily rollover
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS daily_quota_used INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS daily_quota_limit INTEGER DEFAULT 25,
ADD COLUMN IF NOT EXISTS daily_tts_quota_used INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS daily_tts_quota_limit INTEGER DEFAULT 2,
ADD COLUMN IF NOT EXISTS tier TEXT DEFAULT 'free',
ADD COLUMN IF NOT EXISTS quota_reset_date DATE DEFAULT CURRENT_DATE;

-- Enhanced consume_daily_quota with lazy midnight UTC rollover
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
  -- Lazy rollover: reset daily counters at midnight UTC if a new day has begun
  UPDATE public.profiles
  SET daily_quota_used = 0,
      daily_tts_quota_used = 0,
      quota_reset_date = CURRENT_DATE
  WHERE (id = p_user_id OR user_id = p_user_id)
    AND (quota_reset_date IS NULL OR quota_reset_date < CURRENT_DATE);

  -- Atomic update with row-level locking
  UPDATE public.profiles
  SET daily_quota_used = daily_quota_used + p_cost,
      updated_at = NOW()
  WHERE (id = p_user_id OR user_id = p_user_id)
    AND (daily_quota_used + p_cost) <= daily_quota_limit
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
  -- Lazy rollover: reset daily counters at midnight UTC if a new day has begun
  UPDATE public.profiles
  SET daily_quota_used = 0,
      daily_tts_quota_used = 0,
      quota_reset_date = CURRENT_DATE
  WHERE (id = p_user_id OR user_id = p_user_id)
    AND (quota_reset_date IS NULL OR quota_reset_date < CURRENT_DATE);

  -- Atomic update with row-level locking
  UPDATE public.profiles
  SET daily_tts_quota_used = daily_tts_quota_used + p_cost,
      updated_at = NOW()
  WHERE (id = p_user_id OR user_id = p_user_id)
    AND (daily_tts_quota_used + p_cost) <= daily_tts_quota_limit
  RETURNING TRUE INTO v_updated;

  RETURN COALESCE(v_updated, FALSE);
END;
$$;

GRANT EXECUTE ON FUNCTION public.consume_daily_quota(UUID, INT) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.consume_daily_tts_quota(UUID, INT) TO authenticated, service_role;
