BEGIN;
SELECT plan(4);

-- Fixture user (profiles row is created by the handle_new_user trigger).
INSERT INTO auth.users (id, email, raw_user_meta_data)
VALUES ('00000000-0000-0000-0000-0000000000c1', 'cap@example.com', '{}'::jsonb);

SET LOCAL ROLE authenticated;
SELECT set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-0000000000c1","role":"authenticated"}', true);

SELECT lives_ok(
  $$ INSERT INTO public.documents (user_id, title, source_type, status, raw_text)
     VALUES ('00000000-0000-0000-0000-0000000000c1', 'ok', 'text', 'ready', repeat('a', 75000)) $$,
  'free user can insert a 25-page document'
);

SELECT throws_like(
  $$ INSERT INTO public.documents (user_id, title, source_type, status, raw_text)
     VALUES ('00000000-0000-0000-0000-0000000000c1', 'too long', 'text', 'ready', repeat('a', 75001)) $$,
  'DOCUMENT_TOO_LONG%',
  'free user cannot insert a document over 25 pages'
);

RESET ROLE;
-- Clear the user's JWT claims too, otherwise auth.role() still reports 'authenticated' and the
-- billing-column trigger (correctly) blocks the tier change.
SELECT set_config('request.jwt.claims', '{}', true);
UPDATE public.profiles SET tier = 'pro' WHERE user_id = '00000000-0000-0000-0000-0000000000c1';
DELETE FROM public.documents WHERE user_id = '00000000-0000-0000-0000-0000000000c1';
SET LOCAL ROLE authenticated;
SELECT set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-0000000000c1","role":"authenticated"}', true);

SELECT lives_ok(
  $$ INSERT INTO public.documents (user_id, title, source_type, status, raw_text)
     VALUES ('00000000-0000-0000-0000-0000000000c1', 'pro ok', 'text', 'ready', repeat('a', 150000)) $$,
  'Scholar user can insert a 50-page document'
);

SELECT throws_like(
  $$ INSERT INTO public.documents (user_id, title, source_type, status, raw_text)
     VALUES ('00000000-0000-0000-0000-0000000000c1', 'pro too long', 'text', 'ready', repeat('a', 150001)) $$,
  'DOCUMENT_TOO_LONG%',
  'Scholar user cannot insert a document over 50 pages'
);

SELECT * FROM finish();
ROLLBACK;
