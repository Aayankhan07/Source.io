-- pgTAP: flashcard_reviews (Leitner state) constraints + owner-only RLS (Phase 2, task 2.4).
-- Run with `supabase test db` (needs a local Supabase stack).
BEGIN;
CREATE EXTENSION IF NOT EXISTS pgtap WITH SCHEMA extensions;
SET LOCAL search_path = public, extensions;

SELECT plan(14);

SELECT has_table('public', 'flashcard_reviews', 'flashcard_reviews exists');
SELECT col_default_is('public', 'flashcard_reviews', 'box', '1', 'box defaults to 1');

-- Fixtures (as postgres).
INSERT INTO auth.users (id, instance_id, aud, role, email, raw_user_meta_data)
VALUES
  ('a5a5a5a5-aaaa-4aaa-8aaa-aaaaaaaaaaaa', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'lp-a@test.local', '{}'::jsonb),
  ('b5b5b5b5-bbbb-4bbb-8bbb-bbbbbbbbbbbb', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'lp-b@test.local', '{}'::jsonb);

INSERT INTO public.documents (id, user_id, title, source_type, raw_text, content_hash, status)
VALUES
  ('d5d5a000-0000-4000-8000-00000000000a', 'a5a5a5a5-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 'A doc', 'text',
   'Photosynthesis converts light energy into chemical energy stored in glucose.', 'lp-hash-a', 'ready'),
  ('d5d5a000-0000-4000-8000-00000000000c', 'a5a5a5a5-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 'A doc 2', 'text',
   'Mitochondria are the powerhouse of the cell and make ATP by respiration.', 'lp-hash-c', 'ready'),
  ('d5d5b000-0000-4000-8000-00000000000b', 'b5b5b5b5-bbbb-4bbb-8bbb-bbbbbbbbbbbb', 'B doc', 'text',
   'The French Revolution began in 1789 with the storming of the Bastille.', 'lp-hash-b', 'ready');

INSERT INTO public.flashcards (id, document_id, user_id, front, back)
VALUES
  ('f5f5a000-0000-4000-8000-00000000000a', 'd5d5a000-0000-4000-8000-00000000000a', 'a5a5a5a5-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 'Q', 'A'),
  ('f5f5b000-0000-4000-8000-00000000000b', 'd5d5b000-0000-4000-8000-00000000000b', 'b5b5b5b5-bbbb-4bbb-8bbb-bbbbbbbbbbbb', 'Q', 'A');

INSERT INTO public.flashcard_reviews (user_id, flashcard_id, document_id, box, due_at, last_result, review_count)
VALUES ('b5b5b5b5-bbbb-4bbb-8bbb-bbbbbbbbbbbb', 'f5f5b000-0000-4000-8000-00000000000b',
        'd5d5b000-0000-4000-8000-00000000000b', 3, now() + interval '4 days', 'good', 2);

-- ---------------------------------------------------------------------------
-- As user A
-- ---------------------------------------------------------------------------
SET LOCAL role authenticated;
SET LOCAL request.jwt.claims = '{"sub":"a5a5a5a5-aaaa-4aaa-8aaa-aaaaaaaaaaaa","role":"authenticated"}';

SELECT lives_ok(
  $$ INSERT INTO public.flashcard_reviews (user_id, flashcard_id, document_id, box, due_at, last_result, review_count)
     VALUES ('a5a5a5a5-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 'f5f5a000-0000-4000-8000-00000000000a',
             'd5d5a000-0000-4000-8000-00000000000a', 2, now() + interval '2 days', 'good', 1) $$,
  'user A can record a review for their own card'
);

SELECT lives_ok(
  $$ INSERT INTO public.flashcard_reviews (user_id, flashcard_id, document_id, box, due_at, last_result, review_count)
     VALUES ('a5a5a5a5-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 'f5f5a000-0000-4000-8000-00000000000a',
             'd5d5a000-0000-4000-8000-00000000000a', 4, now() + interval '7 days', 'easy', 2)
     ON CONFLICT (user_id, flashcard_id) DO UPDATE
       SET box = EXCLUDED.box, due_at = EXCLUDED.due_at, last_result = EXCLUDED.last_result,
           review_count = EXCLUDED.review_count $$,
  'upsert on (user_id, flashcard_id) updates the existing review'
);

SELECT results_eq(
  $$ SELECT box, review_count FROM public.flashcard_reviews $$,
  $$ VALUES (4, 2) $$,
  'user A sees exactly one (their own, upserted) review'
);

SELECT throws_ok(
  $$ INSERT INTO public.flashcard_reviews (user_id, flashcard_id, document_id)
     VALUES ('a5a5a5a5-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 'f5f5b000-0000-4000-8000-00000000000b',
             'd5d5b000-0000-4000-8000-00000000000b') $$,
  '42501', NULL,
  'user A cannot review user B''s flashcard'
);

SELECT throws_ok(
  $$ INSERT INTO public.flashcard_reviews (user_id, flashcard_id, document_id)
     VALUES ('b5b5b5b5-bbbb-4bbb-8bbb-bbbbbbbbbbbb', 'f5f5b000-0000-4000-8000-00000000000b',
             'd5d5b000-0000-4000-8000-00000000000b') $$,
  '42501', NULL,
  'user A cannot insert a review as user B'
);

SELECT throws_ok(
  $$ UPDATE public.flashcard_reviews SET document_id = 'd5d5a000-0000-4000-8000-00000000000c'
     WHERE flashcard_id = 'f5f5a000-0000-4000-8000-00000000000a' $$,
  '42501', NULL,
  'document_id must match the flashcard''s document'
);

SELECT throws_ok(
  $$ UPDATE public.flashcard_reviews SET box = 6 WHERE flashcard_id = 'f5f5a000-0000-4000-8000-00000000000a' $$,
  '23514', NULL,
  'box is limited to 1..5'
);

SELECT throws_ok(
  $$ UPDATE public.flashcard_reviews SET last_result = 'hard' WHERE flashcard_id = 'f5f5a000-0000-4000-8000-00000000000a' $$,
  '23514', NULL,
  'last_result is limited to again/good/easy'
);

SELECT is_empty(
  $$ UPDATE public.flashcard_reviews SET box = 1 WHERE flashcard_id = 'f5f5b000-0000-4000-8000-00000000000b' RETURNING id $$,
  'user A cannot update user B''s review'
);

SELECT is_empty(
  $$ DELETE FROM public.flashcard_reviews WHERE flashcard_id = 'f5f5b000-0000-4000-8000-00000000000b' RETURNING id $$,
  'user A cannot delete user B''s review'
);

-- Deleting the flashcard cascades to its review.
DELETE FROM public.flashcards WHERE id = 'f5f5a000-0000-4000-8000-00000000000a';
SELECT is_empty(
  $$ SELECT id FROM public.flashcard_reviews WHERE flashcard_id = 'f5f5a000-0000-4000-8000-00000000000a' $$,
  'review is removed with its flashcard'
);

-- ---------------------------------------------------------------------------
-- As postgres: user B's review is untouched.
-- ---------------------------------------------------------------------------
RESET role;
SELECT results_eq(
  $$ SELECT box FROM public.flashcard_reviews WHERE user_id = 'b5b5b5b5-bbbb-4bbb-8bbb-bbbbbbbbbbbb' $$,
  ARRAY[3],
  'user B''s review survives user A''s attempts'
);

SELECT * FROM finish();
ROLLBACK;
