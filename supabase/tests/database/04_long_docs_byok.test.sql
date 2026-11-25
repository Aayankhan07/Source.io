-- pgTAP: note_sections RLS and user_api_keys lock-down (Phase 2, tasks 2.13 / 2.11).
-- Run with `supabase test db` (needs a local Supabase stack).
BEGIN;
CREATE EXTENSION IF NOT EXISTS pgtap WITH SCHEMA extensions;
SET LOCAL search_path = public, extensions;

SELECT plan(12);

-- Fixtures (as postgres).
INSERT INTO auth.users (id, instance_id, aud, role, email, raw_user_meta_data)
VALUES
  ('aaaaaaaa-0004-4aaa-8aaa-aaaaaaaaaaaa', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'byok-a@test.local', '{}'::jsonb),
  ('bbbbbbbb-0004-4bbb-8bbb-bbbbbbbbbbbb', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'byok-b@test.local', '{}'::jsonb);

INSERT INTO public.documents (id, user_id, title, source_type, raw_text, content_hash, status)
VALUES
  ('d0c00004-0000-4000-8000-00000000000a', 'aaaaaaaa-0004-4aaa-8aaa-aaaaaaaaaaaa', 'A long doc', 'text',
   'Chapter 1. Cells are the basic unit of life and contain organelles.', 'hash-04-a', 'ready'),
  ('d0c00004-0000-4000-8000-00000000000b', 'bbbbbbbb-0004-4bbb-8bbb-bbbbbbbbbbbb', 'B long doc', 'text',
   'Chapter 1. The Treaty of Westphalia was signed in 1648.', 'hash-04-b', 'ready');

INSERT INTO public.note_sections (document_id, user_id, idx, total, markdown, status, model)
VALUES
  ('d0c00004-0000-4000-8000-00000000000a', 'aaaaaaaa-0004-4aaa-8aaa-aaaaaaaaaaaa', 0, 2, '## Part 1', 'done', 'm'),
  ('d0c00004-0000-4000-8000-00000000000a', 'aaaaaaaa-0004-4aaa-8aaa-aaaaaaaaaaaa', 1, 2, '', 'pending', NULL),
  ('d0c00004-0000-4000-8000-00000000000b', 'bbbbbbbb-0004-4bbb-8bbb-bbbbbbbbbbbb', 0, 1, '## B', 'done', 'm');

INSERT INTO public.user_api_keys (user_id, provider, ciphertext, iv, last4)
VALUES
  ('aaaaaaaa-0004-4aaa-8aaa-aaaaaaaaaaaa', 'gemini', 'Y2lwaGVydGV4dA==', 'aXZpdml2aXZpdml2', 'abcd'),
  ('bbbbbbbb-0004-4bbb-8bbb-bbbbbbbbbbbb', 'groq', 'b3RoZXI=', 'aXZpdml2aXZpdml2', 'wxyz');

SELECT throws_ok(
  $$ INSERT INTO public.note_sections (document_id, user_id, idx, total)
     VALUES ('d0c00004-0000-4000-8000-00000000000a', 'aaaaaaaa-0004-4aaa-8aaa-aaaaaaaaaaaa', 0, 2) $$,
  '23505', NULL,
  'note_sections is unique per (document_id, idx)'
);

SELECT throws_ok(
  $$ INSERT INTO public.user_api_keys (user_id, provider, ciphertext, iv, last4)
     VALUES ('aaaaaaaa-0004-4aaa-8aaa-aaaaaaaaaaaa', 'anthropic', 'x', 'y', 'z') $$,
  '23514', NULL,
  'user_api_keys only accepts groq, gemini or openai'
);

-- ---------------------------------------------------------------------------
-- As user A
-- ---------------------------------------------------------------------------
SET LOCAL role authenticated;
SET LOCAL request.jwt.claims = '{"sub":"aaaaaaaa-0004-4aaa-8aaa-aaaaaaaaaaaa","role":"authenticated"}';

SELECT results_eq(
  $$ SELECT count(*)::int FROM public.note_sections $$,
  ARRAY[2],
  'user A sees only their own note sections'
);

SELECT is_empty(
  $$ SELECT id FROM public.note_sections WHERE document_id = 'd0c00004-0000-4000-8000-00000000000b' $$,
  'user A cannot see user B''s note sections'
);

SELECT throws_ok(
  $$ INSERT INTO public.note_sections (document_id, user_id, idx, total)
     VALUES ('d0c00004-0000-4000-8000-00000000000a', 'aaaaaaaa-0004-4aaa-8aaa-aaaaaaaaaaaa', 5, 6) $$,
  '42501', NULL,
  'client cannot insert note sections'
);

SELECT throws_ok(
  $$ UPDATE public.note_sections SET markdown = 'forged' WHERE document_id = 'd0c00004-0000-4000-8000-00000000000a' $$,
  '42501', NULL,
  'client cannot update note sections'
);

SELECT throws_ok(
  $$ SELECT ciphertext FROM public.user_api_keys $$,
  '42501', NULL,
  'authenticated cannot select user_api_keys.ciphertext'
);

SELECT throws_ok(
  $$ SELECT provider, last4 FROM public.user_api_keys $$,
  '42501', NULL,
  'authenticated cannot read user_api_keys at all'
);

SELECT throws_ok(
  $$ INSERT INTO public.user_api_keys (user_id, provider, ciphertext, iv, last4)
     VALUES ('aaaaaaaa-0004-4aaa-8aaa-aaaaaaaaaaaa', 'groq', 'x', 'y', 'z') $$,
  '42501', NULL,
  'authenticated cannot write user_api_keys'
);

SELECT results_eq(
  $$ SELECT provider, last4 FROM public.list_my_api_keys() $$,
  $$ VALUES ('gemini'::text, 'abcd'::text) $$,
  'list_my_api_keys returns only the caller''s provider + last4'
);

-- ---------------------------------------------------------------------------
-- As anon
-- ---------------------------------------------------------------------------
SET LOCAL role anon;
SET LOCAL request.jwt.claims = '{"role":"anon"}';

-- Privilege check instead of executing the function: asserts the REVOKE without running the body.
SELECT ok(
  NOT has_function_privilege('anon', 'public.list_my_api_keys()', 'EXECUTE'),
  'anon cannot call list_my_api_keys'
);

SELECT throws_ok(
  $$ SELECT ciphertext FROM public.user_api_keys $$,
  '42501', NULL,
  'anon cannot select user_api_keys'
);

SELECT * FROM finish();
ROLLBACK;
