-- Atomic daily quota consumption with row-level locking to prevent TOCTOU race conditions
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
  -- Perform atomic update with condition check in a single statement
  UPDATE public.profiles
  SET daily_quota_used = daily_quota_used + p_cost,
      updated_at = NOW()
  WHERE id = p_user_id
    AND (daily_quota_used + p_cost) <= daily_quota_limit
  RETURNING TRUE INTO v_updated;

  RETURN COALESCE(v_updated, FALSE);
END;
$$;

-- Grant execution permissions
GRANT EXECUTE ON FUNCTION public.consume_daily_quota(UUID, INT) TO authenticated, service_role;
