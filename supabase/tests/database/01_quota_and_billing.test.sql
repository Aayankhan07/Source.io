-- pgTAP: billing columns are server-owned (Phase 0) and quota RPCs (Phase 0 + 1.9).
-- Run with `supabase test db` (needs a local Supabase stack).
BEGIN;
CREATE EXTENSION IF NOT EXISTS pgtap WITH SCHEMA extensions;
SET LOCAL search_path = public, extensions;

SELECT plan(17);

-- Fixtures: two users. handle_new_user() creates their profiles.
INSERT INTO auth.users (id, instance_id, aud, role, email, raw_user_meta_data)
VALUES
  ('11111111-1111-4111-8111-111111111111', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'quota-a@test.local', '{}'::jsonb),
  ('22222222-2222-4222-8222-222222222222', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'quota-b@test.local', '{}'::jsonb);

SELECT isnt(
  (SELECT id FROM public.profiles WHERE user_id = '11111111-1111-4111-8111-111111111111'),
  '11111111-1111-4111-8111-111111111111'::uuid,
  'profiles.id is not the auth user id (RPCs must match on user_id)'
);

-- ---------------------------------------------------------------------------
-- Phase 0 trigger: a user cannot change their own tier or limits.
-- ---------------------------------------------------------------------------
SET LOCAL role authenticated;
SET LOCAL request.jwt.claims = '{"sub":"11111111-1111-4111-8111-111111111111","role":"authenticated"}';

SELECT throws_ok(
  $$ UPDATE public.profiles SET tier = 'pro' WHERE user_id = '11111111-1111-4111-8111-111111111111' $$,
  '42501', NULL,
  'user cannot upgrade their own tier'
);

SELECT throws_ok(
  $$ UPDATE public.profiles SET daily_quota_limit = 100000 WHERE user_id = '11111111-1111-4111-8111-111111111111' $$,
  '42501', NULL,
  'user cannot raise their own daily quota limit'
);

SELECT lives_ok(
  $$ UPDATE public.profiles SET display_name = 'Renamed' WHERE user_id = '11111111-1111-4111-8111-111111111111' $$,
  'user can still update non-billing profile fields'
);

SELECT throws_ok(
  $$ SELECT public.consume_daily_quota('11111111-1111-4111-8111-111111111111', 1) $$,
  '42501', NULL,
  'authenticated users cannot call consume_daily_quota'
);

SELECT throws_ok(
  $$ SELECT public.refund_daily_quota('11111111-1111-4111-8111-111111111111', 1) $$,
  '42501', NULL,
  'authenticated users cannot call refund_daily_quota'
);

-- ---------------------------------------------------------------------------
-- Back to the server role (no JWT claims => billing trigger passes through).
-- ---------------------------------------------------------------------------
RESET role;
SET LOCAL request.jwt.claims = '{}';

SELECT is(
  (SELECT tier FROM public.profiles WHERE user_id = '11111111-1111-4111-8111-111111111111'),
  'free',
  'tier is unchanged after the rejected self-upgrade'
);

UPDATE public.profiles
SET daily_quota_limit = 2, daily_quota_used = 0, quota_reset_date = CURRENT_DATE
WHERE user_id = '11111111-1111-4111-8111-111111111111';

SELECT ok(public.consume_daily_quota('11111111-1111-4111-8111-111111111111', 1), 'consume 1/2 allowed (matched on user_id)');
SELECT ok(public.consume_daily_quota('11111111-1111-4111-8111-111111111111', 1), 'consume 2/2 allowed');
SELECT ok(NOT public.consume_daily_quota('11111111-1111-4111-8111-111111111111', 1), 'consume 3/2 denied: limit enforced');
SELECT ok(NOT public.consume_daily_quota(gen_random_uuid(), 1), 'unknown user is denied');

SELECT is(
  (SELECT daily_quota_used FROM public.profiles WHERE user_id = '22222222-2222-4222-8222-222222222222'),
  0,
  'other users are not charged'
);

-- ---------------------------------------------------------------------------
-- refund_daily_quota
-- ---------------------------------------------------------------------------
SELECT ok(public.refund_daily_quota('11111111-1111-4111-8111-111111111111', 1), 'refund applied');
SELECT is(
  (SELECT daily_quota_used FROM public.profiles WHERE user_id = '11111111-1111-4111-8111-111111111111'),
  1,
  'refund gives back exactly the cost'
);

SELECT lives_ok(
  $$ SELECT public.refund_daily_quota('11111111-1111-4111-8111-111111111111', 50) $$,
  'over-refund does not error'
);
SELECT is(
  (SELECT daily_quota_used FROM public.profiles WHERE user_id = '11111111-1111-4111-8111-111111111111'),
  0,
  'refund never goes below 0'
);

-- A refund for a previous day (counter not yet rolled over) is a no-op.
UPDATE public.profiles
SET daily_quota_used = 5, quota_reset_date = CURRENT_DATE - 1
WHERE user_id = '22222222-2222-4222-8222-222222222222';
SELECT ok(NOT public.refund_daily_quota('22222222-2222-4222-8222-222222222222', 1), 'refund only applies to today''s usage');

SELECT * FROM finish();
ROLLBACK;
