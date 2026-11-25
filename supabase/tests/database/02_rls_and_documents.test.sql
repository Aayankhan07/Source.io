-- pgTAP: RLS isolation, server-owned document columns, jobs/chunks write lock-down,
-- one-row-per-document constraints and the replace_document_derivatives RPC (Phase 1).
-- Run with `supabase test db` (needs a local Supabase stack).
BEGIN;
CREATE EXTENSION IF NOT EXISTS pgtap WITH SCHEMA extensions;
SET LOCAL search_path = public, extensions;

SELECT plan(20);

-- Fixtures (as postgres: the protect_* triggers pass through).
INSERT INTO auth.users (id, instance_id, aud, role, email, raw_user_meta_data)
VALUES
  ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'rls-a@test.local', '{}'::jsonb),
  ('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'rls-b@test.local', '{}'::jsonb);

INSERT INTO public.documents (id, user_id, title, source_type, raw_text, content_hash, status)
VALUES
  ('d0c0a000-0000-4000-8000-00000000000a', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 'A doc', 'text',
   'Photosynthesis converts light energy into chemical energy stored in glucose.', 'hash-a', 'ready'),
  ('d0c0a000-0000-4000-8000-00000000000c', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 'A pending doc', 'text',
   'Mitochondria are the powerhouse of the cell and make ATP by respiration.', 'hash-c', 'processing'),
  ('d0c0b000-0000-4000-8000-00000000000b', 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb', 'B doc', 'text',
   'The French Revolution began in 1789 with the storming of the Bastille.', 'hash-b', 'ready');

-- ---------------------------------------------------------------------------
-- As user A
-- ---------------------------------------------------------------------------
SET LOCAL role authenticated;
SET LOCAL request.jwt.claims = '{"sub":"aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa","role":"authenticated"}';

SELECT is_empty(
  $$ SELECT id FROM public.documents WHERE id = 'd0c0b000-0000-4000-8000-00000000000b' $$,
  'user A cannot see user B''s document'
);

SELECT results_eq(
  $$ SELECT count(*)::int FROM public.documents $$,
  ARRAY[2],
  'user A sees only their own documents'
);

SELECT throws_ok(
  $$ UPDATE public.documents SET status = 'failed' WHERE id = 'd0c0a000-0000-4000-8000-00000000000a' $$,
  '42501', NULL,
  'client cannot change documents.status'
);

SELECT throws_ok(
  $$ UPDATE public.documents SET raw_text = 'injected text that is long enough' WHERE id = 'd0c0a000-0000-4000-8000-00000000000a' $$,
  '42501', NULL,
  'client cannot change documents.raw_text'
);

SELECT throws_ok(
  $$ UPDATE public.documents SET content_hash = 'forged' WHERE id = 'd0c0a000-0000-4000-8000-00000000000a' $$,
  '42501', NULL,
  'client cannot change documents.content_hash'
);

SELECT lives_ok(
  $$ UPDATE public.documents SET title = 'Renamed' WHERE id = 'd0c0a000-0000-4000-8000-00000000000a' $$,
  'client can rename their document'
);

SELECT lives_ok(
  $$ UPDATE public.documents SET status = 'ready' WHERE id = 'd0c0a000-0000-4000-8000-00000000000c' $$,
  'client self-heal processing -> ready is allowed when raw_text exists'
);

SELECT is_empty(
  $$ UPDATE public.documents SET title = 'hijack' WHERE id = 'd0c0b000-0000-4000-8000-00000000000b' RETURNING id $$,
  'user A cannot update user B''s document'
);

-- Browser-created YouTube docs cannot smuggle in text or a ready status.
SELECT lives_ok(
  $$ INSERT INTO public.documents (id, user_id, title, source_type, source_url, raw_text, status)
     VALUES ('d0c0a000-0000-4000-8000-0000000000e1', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 'yt', 'youtube',
             'https://youtu.be/x', 'fake transcript that is long enough', 'ready') $$,
  'client can insert a youtube document'
);

SELECT results_eq(
  $$ SELECT status::text, raw_text IS NULL FROM public.documents WHERE id = 'd0c0a000-0000-4000-8000-0000000000e1' $$,
  $$ VALUES ('pending'::text, true) $$,
  'youtube insert is forced to pending with no client text'
);

SELECT throws_ok(
  $$ INSERT INTO public.jobs (user_id, document_id, kind, status)
     VALUES ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 'd0c0a000-0000-4000-8000-00000000000a', 'generate_notes', 'running') $$,
  '42501', NULL,
  'client cannot insert jobs'
);

SELECT throws_ok(
  $$ INSERT INTO public.document_chunks (document_id, user_id, chunk_text)
     VALUES ('d0c0a000-0000-4000-8000-00000000000a', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 'chunk') $$,
  '42501', NULL,
  'client cannot insert document_chunks'
);

-- Privilege check instead of executing the function: asserts the REVOKE without running the body.
SELECT ok(
  NOT has_function_privilege('authenticated', 'public.replace_document_derivatives(uuid, uuid, jsonb, jsonb, jsonb)', 'EXECUTE'),
  'client cannot call replace_document_derivatives'
);

-- ---------------------------------------------------------------------------
-- As the server (postgres / service role)
-- ---------------------------------------------------------------------------
RESET role;
SET LOCAL request.jwt.claims = '{}';

INSERT INTO public.notes (document_id, user_id, markdown)
VALUES ('d0c0a000-0000-4000-8000-00000000000a', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', '# Notes');

SELECT throws_ok(
  $$ INSERT INTO public.notes (document_id, user_id, markdown)
     VALUES ('d0c0a000-0000-4000-8000-00000000000a', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', '# Dup') $$,
  '23505', NULL,
  'notes has one row per document'
);

INSERT INTO public.jobs (user_id, document_id, kind, status)
VALUES ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 'd0c0a000-0000-4000-8000-00000000000a', 'generate_notes', 'running');

SELECT throws_ok(
  $$ INSERT INTO public.jobs (user_id, document_id, kind, status)
     VALUES ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 'd0c0a000-0000-4000-8000-00000000000a', 'generate_notes', 'queued') $$,
  '23505', NULL,
  'only one active job per document and kind'
);

SELECT lives_ok(
  $$ INSERT INTO public.jobs (user_id, document_id, kind, status)
     VALUES ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 'd0c0a000-0000-4000-8000-00000000000a', 'generate_notes', 'failed') $$,
  'finished jobs do not hold the lock'
);

SELECT is(
  public.replace_document_derivatives(
    'd0c0a000-0000-4000-8000-00000000000a',
    'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
    '[{"front":"Q1","back":"A1"},{"front":"Q2","back":"A2"}]'::jsonb,
    '{"title":"Photosynthesis"}'::jsonb,
    '[{"question":"Is light needed?","type":"true_false","choices":null,"correct":"True","explanation":"Yes."}]'::jsonb
  ) - 'quiz_id',
  '{"flashcards_count":2,"questions_count":1}'::jsonb,
  'replace_document_derivatives inserts cards and quiz'
);

-- A failing replacement (invalid question type) must leave the previous set intact.
SELECT throws_ok(
  $$ SELECT public.replace_document_derivatives(
       'd0c0a000-0000-4000-8000-00000000000a',
       'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
       '[{"front":"New","back":"Card"}]'::jsonb,
       '{"title":"Broken"}'::jsonb,
       '[{"question":"Bad","type":"essay","correct":"x"}]'::jsonb) $$,
  '22P02', NULL,
  'invalid payload raises'
);

SELECT results_eq(
  $$ SELECT
       (SELECT count(*)::int FROM public.flashcards WHERE document_id = 'd0c0a000-0000-4000-8000-00000000000a'),
       (SELECT count(*)::int FROM public.quizzes WHERE document_id = 'd0c0a000-0000-4000-8000-00000000000a') $$,
  $$ VALUES (2, 1) $$,
  'failed replacement rolled back: old cards and quiz kept'
);

SELECT throws_ok(
  $$ SELECT public.replace_document_derivatives(
       'd0c0b000-0000-4000-8000-00000000000b',
       'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
       '[]'::jsonb, '{}'::jsonb, '[]'::jsonb) $$,
  'P0002', NULL,
  'replace_document_derivatives rejects a document the user does not own'
);

SELECT * FROM finish();
ROLLBACK;
