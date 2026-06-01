-- Unique content hash per user for de-duplication (allow NULL hashes for in-progress docs)
CREATE UNIQUE INDEX IF NOT EXISTS documents_user_content_hash_unique
  ON public.documents (user_id, content_hash)
  WHERE content_hash IS NOT NULL;

-- Helpful indexes
CREATE INDEX IF NOT EXISTS documents_user_created_idx ON public.documents (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS notes_document_idx ON public.notes (document_id);
CREATE INDEX IF NOT EXISTS jobs_document_idx ON public.jobs (document_id, created_at DESC);

-- Allow users to update their own jobs (edge function uses service role, but keep this safe)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'jobs' AND policyname = 'Users update own jobs'
  ) THEN
    CREATE POLICY "Users update own jobs" ON public.jobs FOR UPDATE USING (auth.uid() = user_id);
  END IF;
END$$;

-- Cosine similarity RPC for future RAG (slice 6) — safe to add now
CREATE OR REPLACE FUNCTION public.match_document_chunks(
  _document_id uuid,
  _query_embedding extensions.vector,
  _match_count int DEFAULT 6
)
RETURNS TABLE (id uuid, chunk_text text, order_index int, similarity float)
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = public, extensions
AS $$
  SELECT id, chunk_text, order_index,
         1 - (embedding <=> _query_embedding) AS similarity
  FROM public.document_chunks
  WHERE document_id = _document_id
    AND embedding IS NOT NULL
  ORDER BY embedding <=> _query_embedding
  LIMIT _match_count;
$$;