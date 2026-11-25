-- pgTAP: Phase 2 retrieval/limits/billing (20261126110000).
-- Run with `supabase test db` (needs a local Supabase stack).
BEGIN;
CREATE EXTENSION IF NOT EXISTS pgtap WITH SCHEMA extensions;
SET LOCAL search_path = public, extensions;

SELECT plan(21);

-- ---------------------------------------------------------------------------
-- Schema
-- ---------------------------------------------------------------------------
SELECT has_column('public', 'chat_messages', 'citations', 'chat_messages.citations exists');
SELECT col_type_is('public', 'chat_messages', 'citations', 'jsonb', 'chat_messages.citations is jsonb');
SELECT ok(
  (SELECT format_type(a.atttypid, a.atttypmod) FROM pg_attribute a
   WHERE a.attrelid = 'public.document_chunks'::regclass AND a.attname = 'embedding') LIKE '%halfvec(384)',
  'embedding is halfvec(384)'
);
SELECT is(
  (SELECT count(*)::int FROM pg_proc WHERE proname = 'match_document_chunks' AND pronamespace = 'public'::regnamespace),
  1,
  'exactly one match_document_chunks overload'
);
SELECT ok(
  (SELECT pg_get_function_identity_arguments(oid) FROM pg_proc
   WHERE proname = 'match_document_chunks' AND pronamespace = 'public'::regnamespace) LIKE '%halfvec%',
  'match_document_chunks takes a halfvec query'
);
SELECT has_table('public', 'subscriptions', 'subscriptions table exists');
SELECT has_table('public', 'billing_events', 'billing_events table exists');

-- Fixtures (as postgres): a free user and a pro user. handle_new_user() creates profiles.
INSERT INTO auth.users (id, instance_id, aud, role, email, raw_user_meta_data)
VALUES
  ('33333333-3333-4333-8333-333333333333', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'limit-free@test.local', '{}'::jsonb),
  ('44444444-4444-4444-8444-444444444444', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'limit-pro@test.local', '{}'::jsonb);

UPDATE public.profiles SET tier = 'pro', active_docs_limit = 100
WHERE user_id = '44444444-4444-4444-8444-444444444444';

-- ---------------------------------------------------------------------------
-- Active-document limit per tier
-- ---------------------------------------------------------------------------
INSERT INTO public.documents (user_id, title, source_type, raw_text, content_hash, status)
SELECT '33333333-3333-4333-8333-333333333333', 'Free doc ' || g, 'text',
       'Some study text that is long enough to count as a document ' || g, 'free-hash-' || g, 'ready'
FROM generate_series(1, 3) g;

SELECT throws_like(
  $$ INSERT INTO public.documents (user_id, title, source_type, raw_text, content_hash, status)
     VALUES ('33333333-3333-4333-8333-333333333333', 'Free doc 4', 'text',
             'Some study text that is long enough to count as a document 4', 'free-hash-4', 'ready') $$,
  'LIMIT_EXCEEDED%3 saved documents%',
  'free user is blocked at 3 active documents'
);

SELECT lives_ok(
  $$ INSERT INTO public.documents (user_id, title, source_type, raw_text, content_hash, status)
     VALUES ('33333333-3333-4333-8333-333333333333', 'Free doc failed', 'text',
             'A failed document does not count towards the active limit at all', 'free-hash-f', 'failed') $$,
  'failed documents do not count'
);

INSERT INTO public.documents (user_id, title, source_type, raw_text, content_hash, status)
SELECT '44444444-4444-4444-8444-444444444444', 'Pro doc ' || g, 'text',
       'Some study text that is long enough to count as a document ' || g, 'pro-hash-' || g, 'ready'
FROM generate_series(1, 4) g;

SELECT is(
  (SELECT count(*)::int FROM public.documents WHERE user_id = '44444444-4444-4444-8444-444444444444'),
  4,
  'pro user can keep more than 3 documents (reads profiles.active_docs_limit)'
);

UPDATE public.profiles SET active_docs_limit = 4
WHERE user_id = '44444444-4444-4444-8444-444444444444';
SELECT throws_like(
  $$ INSERT INTO public.documents (user_id, title, source_type, raw_text, content_hash, status)
     VALUES ('44444444-4444-4444-8444-444444444444', 'Pro doc 5', 'text',
             'Some study text that is long enough to count as a document 5', 'pro-hash-5', 'ready') $$,
  'LIMIT_EXCEEDED%4 saved documents%',
  'limit follows active_docs_limit'
);

SELECT lives_ok(
  $$ UPDATE public.documents SET status = 'processing'
     WHERE user_id = '44444444-4444-4444-8444-444444444444' AND title = 'Pro doc 1' $$,
  'documents already active can change status after a downgrade'
);

-- ---------------------------------------------------------------------------
-- Billing ledger
-- ---------------------------------------------------------------------------
SELECT lives_ok(
  $$ INSERT INTO public.billing_events (event_id, event_name, payload) VALUES ('evt-1', 'order_created', '{}') $$,
  'first billing event insert works'
);
SELECT throws_ok(
  $$ INSERT INTO public.billing_events (event_id, event_name, payload) VALUES ('evt-1', 'order_created', '{}') $$,
  '23505', NULL,
  'billing_events.event_id is unique'
);

SELECT is(
  public.apply_billing_event('evt-sub-1', 'subscription_created', '33333333-3333-4333-8333-333333333333', NULL, '{}'::jsonb,
    '{"provider_subscription_id":"sub_1","status":"active","updated_at":"2026-11-20T10:00:00Z"}'::jsonb,
    '{"tier":"pro","daily_quota_limit":200,"daily_tts_quota_limit":50,"active_docs_limit":100}'::jsonb),
  'applied',
  'subscription event is applied'
);
SELECT is(
  (SELECT tier || ':' || active_docs_limit FROM public.profiles WHERE user_id = '33333333-3333-4333-8333-333333333333'),
  'pro:100',
  'profile tier and docs limit follow the subscription'
);
SELECT is(
  public.apply_billing_event('evt-sub-1', 'subscription_created', '33333333-3333-4333-8333-333333333333', NULL, '{}'::jsonb,
    '{"provider_subscription_id":"sub_1","status":"active","updated_at":"2026-11-20T10:00:00Z"}'::jsonb,
    '{"tier":"pro","daily_quota_limit":200,"daily_tts_quota_limit":50,"active_docs_limit":100}'::jsonb),
  'duplicate',
  'redelivered event is a no-op'
);
SELECT is(
  public.apply_billing_event('evt-sub-old', 'subscription_expired', '33333333-3333-4333-8333-333333333333', NULL, '{}'::jsonb,
    '{"provider_subscription_id":"sub_1","status":"expired","updated_at":"2026-11-01T10:00:00Z"}'::jsonb,
    '{"tier":"free","daily_quota_limit":25,"daily_tts_quota_limit":2,"active_docs_limit":3}'::jsonb),
  'stale',
  'out-of-order older event is ignored'
);
SELECT is(
  (SELECT tier FROM public.profiles WHERE user_id = '33333333-3333-4333-8333-333333333333'),
  'pro',
  'stale event did not downgrade'
);

-- Clients cannot read the ledger or write subscriptions.
SET LOCAL role authenticated;
SET LOCAL request.jwt.claims = '{"sub":"33333333-3333-4333-8333-333333333333","role":"authenticated"}';
SELECT throws_ok(
  $$ SELECT count(*) FROM public.billing_events $$,
  '42501', NULL,
  'authenticated users cannot read billing_events'
);
SELECT results_eq(
  $$ SELECT status FROM public.subscriptions $$,
  ARRAY['active'],
  'user can read their own subscription'
);

SELECT * FROM finish();
ROLLBACK;
