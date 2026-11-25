-- Phase 2: podcast audio is rendered in the user's browser (Kokoro-82M via kokoro-js) and
-- uploaded through the podcast_audio edge function with a signed upload URL.
-- The server no longer calls any text-to-speech service.

-- 1. Store the storage PATH of the current audio file. Playback gets a 1-hour signed URL
--    from podcast_audio (action 'url') instead of a long-lived signed URL in audio_url.
ALTER TABLE public.podcasts ADD COLUMN IF NOT EXISTS audio_path TEXT;

-- 2. Bound what a signed upload can put in the private podcasts bucket.
--    50 MB covers a ~16 minute 24 kHz 16-bit WAV fallback; Opus files are ~1-2 MB.
UPDATE storage.buckets
SET file_size_limit = 52428800,
    allowed_mime_types = ARRAY['audio/ogg', 'audio/webm', 'audio/wav', 'audio/mpeg']
WHERE id = 'podcasts';
