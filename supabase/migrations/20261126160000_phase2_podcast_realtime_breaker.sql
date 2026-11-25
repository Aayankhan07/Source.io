-- 1. The workspace subscribes to podcasts changes (script/audio ready); the table was never
--    added to the realtime publication.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'podcasts'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.podcasts;
  END IF;
END $$;

-- 2. podcasts_enabled was seeded false but never read. generate_podcast now checks it, and
--    podcasts are part of every plan (audio is rendered in the browser at no cost), so enable it.
UPDATE public.system_circuit_breakers
SET enabled = true,
    description = 'Emergency switch for podcast script generation (all plans)'
WHERE key = 'podcasts_enabled';
