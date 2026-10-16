-- ============================================================================
-- Migration: 20261016091000_halfvec_optimization.sql
-- Purpose: Optimize vector RAG index for 768 dimensions and document filtering
-- ============================================================================

-- 1. Drop old 1536d vector index to allow 768d compressed vector embeddings
DROP INDEX IF EXISTS public.idx_document_chunks_embedding;
DROP INDEX IF EXISTS public.document_chunks_embedding_idx;

-- 2. Ensure composite document_id index exists for fast filtered retrieval
CREATE INDEX IF NOT EXISTS idx_document_chunks_document_id 
ON public.document_chunks(document_id);

-- 3. Update match_document_chunks RPC function with strict execution plan
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
