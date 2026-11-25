BEGIN;
SELECT plan(14);

-- Price table exists, is seeded, and flags unverified prices.
SELECT has_table('public', 'ai_model_prices', 'ai_model_prices exists');
SELECT ok(
  (SELECT count(*) FROM public.ai_model_prices
   WHERE (provider, model) IN (
     ('groq', 'openai/gpt-oss-120b'), ('groq', 'openai/gpt-oss-20b'), ('groq', 'llama-3.1-8b-instant'),
     ('groq', 'whisper-large-v3'), ('gemini', 'gemini-2.5-flash-lite'), ('local', 'gte-small'))) = 6,
  'price table is seeded for every model the functions use'
);
SELECT ok(
  (SELECT usd_per_audio_hour IS NOT NULL FROM public.ai_model_prices
   WHERE provider = 'groq' AND model = 'whisper-large-v3'),
  'whisper is priced per audio hour'
);

-- Cost math: 1M input + 1M output tokens of llama-3.1-8b-instant = input + output price.
INSERT INTO auth.users (id, email, raw_user_meta_data)
VALUES ('00000000-0000-0000-0000-0000000000d1', 'cost@example.com', '{}'::jsonb);
INSERT INTO public.ai_usage_logs (user_id, request_id, feature, provider, model, input_tokens, output_tokens, status)
VALUES ('00000000-0000-0000-0000-0000000000d1', 'pgtap-cost', 'chat', 'groq', 'llama-3.1-8b-instant',
        1000000, 1000000, 'succeeded');
SELECT is(
  (SELECT est_usd FROM public.admin_cost_per_user_30d WHERE user_id = '00000000-0000-0000-0000-0000000000d1'),
  (SELECT round(input_usd_per_mtok + output_usd_per_mtok, 6) FROM public.ai_model_prices
   WHERE provider = 'groq' AND model = 'llama-3.1-8b-instant' ORDER BY effective_from DESC LIMIT 1),
  'est_usd is computed from the price table'
);

-- Client roles cannot read the admin views or the price table.
SELECT ok(NOT has_table_privilege('authenticated', 'public.admin_daily_cost', 'SELECT'),
  'authenticated cannot select admin_daily_cost');
SELECT ok(NOT has_table_privilege('authenticated', 'public.admin_cost_per_user_30d', 'SELECT'),
  'authenticated cannot select admin_cost_per_user_30d');
SELECT ok(NOT has_table_privilege('authenticated', 'public.admin_user_daily_cost', 'SELECT'),
  'authenticated cannot select admin_user_daily_cost');
SELECT ok(NOT has_table_privilege('authenticated', 'public.admin_ai_usage_costed', 'SELECT'),
  'authenticated cannot select admin_ai_usage_costed');
SELECT ok(NOT has_table_privilege('anon', 'public.admin_daily_cost', 'SELECT'),
  'anon cannot select admin_daily_cost');
SELECT ok(NOT has_table_privilege('anon', 'public.admin_cost_per_user_30d', 'SELECT'),
  'anon cannot select admin_cost_per_user_30d');
SELECT ok(NOT has_table_privilege('authenticated', 'public.ai_model_prices', 'SELECT'),
  'authenticated cannot select ai_model_prices');
SELECT ok(has_table_privilege('service_role', 'public.admin_daily_cost', 'SELECT'),
  'service_role can select admin_daily_cost');

SET LOCAL ROLE authenticated;
SELECT set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-0000000000d1","role":"authenticated"}', true);
SELECT throws_ok(
  $$ SELECT * FROM public.admin_cost_per_user_30d $$,
  '42501',
  NULL,
  'a signed-in user selecting admin_cost_per_user_30d gets permission denied'
);
SELECT throws_ok(
  $$ SELECT * FROM public.admin_daily_cost $$,
  '42501',
  NULL,
  'a signed-in user selecting admin_daily_cost gets permission denied'
);
RESET ROLE;

SELECT * FROM finish();
ROLLBACK;
