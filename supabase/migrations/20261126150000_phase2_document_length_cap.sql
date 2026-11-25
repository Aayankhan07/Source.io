-- Server-side page cap for every document, including PDF/DOCX/pasted text that the browser
-- inserts directly as 'ready' without calling the ingest function.
-- Limits mirror src/lib/plans.ts: 3,000 characters per page; free 25 pages, Scholar (tier 'pro')
-- 50 pages, users with a stored API key (user_api_keys) 300 pages.

CREATE OR REPLACE FUNCTION public.enforce_document_length_cap()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_tier text;
  v_has_key boolean;
  v_max_chars integer;
  v_len integer;
BEGIN
  -- Server code (service_role, migrations) is trusted; ingest applies the same limits itself.
  IF coalesce(auth.role(), '') NOT IN ('authenticated', 'anon') THEN
    RETURN NEW;
  END IF;

  IF NEW.raw_text IS NULL THEN
    RETURN NEW;
  END IF;
  IF TG_OP = 'UPDATE' AND NEW.raw_text IS NOT DISTINCT FROM OLD.raw_text THEN
    RETURN NEW;
  END IF;

  v_len := char_length(NEW.raw_text);

  SELECT tier INTO v_tier FROM public.profiles WHERE user_id = NEW.user_id;
  SELECT EXISTS (SELECT 1 FROM public.user_api_keys WHERE user_id = NEW.user_id) INTO v_has_key;

  v_max_chars := CASE
    WHEN v_has_key THEN 300 * 3000
    WHEN v_tier = 'pro' THEN 50 * 3000
    ELSE 25 * 3000
  END;

  IF v_len > v_max_chars THEN
    RAISE EXCEPTION 'DOCUMENT_TOO_LONG: This document is about % pages; your plan allows up to % pages per document.',
      ceil(v_len / 3000.0)::int, v_max_chars / 3000
      USING ERRCODE = '22001';
  END IF;

  RETURN NEW;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.enforce_document_length_cap() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS enforce_document_length_cap ON public.documents;
CREATE TRIGGER enforce_document_length_cap
  BEFORE INSERT OR UPDATE OF raw_text ON public.documents
  FOR EACH ROW EXECUTE FUNCTION public.enforce_document_length_cap();
