-- Phase 2 learning progress (roadmap task 2.4).
-- See docs/superpowers/plans/2026-11-26-company-audit-and-roadmap.md, Phase 2.
--
-- Contents:
--   1. flashcard_reviews: Leitner 5-box state per (user, flashcard).
--      Intervals (1, 2, 4, 7, 14 days) are computed client-side in
--      src/features/learning/leitner.ts; the table only stores the result.
--   2. Owner-only RLS. Inserts / updates must reference a flashcard the caller
--      owns, and document_id must match that flashcard's document.
--
-- quiz_attempts already has (quiz_id, user_id, score, total, answers jsonb,
-- created_at) plus owner SELECT / INSERT policies, so no change is needed there.

-- ============================================================================
-- 1. flashcard_reviews
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.flashcard_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  flashcard_id UUID NOT NULL REFERENCES public.flashcards(id) ON DELETE CASCADE,
  document_id UUID NOT NULL REFERENCES public.documents(id) ON DELETE CASCADE,
  box INT NOT NULL DEFAULT 1 CHECK (box BETWEEN 1 AND 5),
  due_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_result TEXT CHECK (last_result IN ('again', 'good', 'easy')),
  review_count INT NOT NULL DEFAULT 0 CHECK (review_count >= 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT flashcard_reviews_user_flashcard_key UNIQUE (user_id, flashcard_id)
);

CREATE INDEX IF NOT EXISTS idx_flashcard_reviews_user_due ON public.flashcard_reviews (user_id, due_at);
CREATE INDEX IF NOT EXISTS idx_flashcard_reviews_document_id ON public.flashcard_reviews (document_id);
-- flashcard_id is covered by the UNIQUE (user_id, flashcard_id) index only when
-- filtered by user; the FK cascade from flashcards needs its own index.
CREATE INDEX IF NOT EXISTS idx_flashcard_reviews_flashcard_id ON public.flashcard_reviews (flashcard_id);

DROP TRIGGER IF EXISTS update_flashcard_reviews_updated_at ON public.flashcard_reviews;
CREATE TRIGGER update_flashcard_reviews_updated_at
  BEFORE UPDATE ON public.flashcard_reviews
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================================================
-- 2. RLS: owner-only CRUD
-- ============================================================================

ALTER TABLE public.flashcard_reviews ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users view own flashcard reviews" ON public.flashcard_reviews;
CREATE POLICY "Users view own flashcard reviews" ON public.flashcard_reviews
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users insert own flashcard reviews" ON public.flashcard_reviews;
CREATE POLICY "Users insert own flashcard reviews" ON public.flashcard_reviews
  FOR INSERT WITH CHECK (
    auth.uid() = user_id
    AND EXISTS (
      SELECT 1 FROM public.flashcards f
      WHERE f.id = flashcard_reviews.flashcard_id
        AND f.user_id = auth.uid()
        AND f.document_id = flashcard_reviews.document_id
    )
  );

DROP POLICY IF EXISTS "Users update own flashcard reviews" ON public.flashcard_reviews;
CREATE POLICY "Users update own flashcard reviews" ON public.flashcard_reviews
  FOR UPDATE USING (auth.uid() = user_id)
  WITH CHECK (
    auth.uid() = user_id
    AND EXISTS (
      SELECT 1 FROM public.flashcards f
      WHERE f.id = flashcard_reviews.flashcard_id
        AND f.user_id = auth.uid()
        AND f.document_id = flashcard_reviews.document_id
    )
  );

DROP POLICY IF EXISTS "Users delete own flashcard reviews" ON public.flashcard_reviews;
CREATE POLICY "Users delete own flashcard reviews" ON public.flashcard_reviews
  FOR DELETE USING (auth.uid() = user_id);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.flashcard_reviews TO authenticated;
