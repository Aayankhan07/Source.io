# Runbook

Operational procedures for production incidents. SQL below runs in the Supabase SQL editor (as `postgres`, which bypasses RLS and the column-protection triggers). Edge function logs: Supabase dashboard → Edge Functions → *function* → Logs; every line is JSON with `fn`, `requestId` and `userId`, and the same `requestId` is in `ai_usage_logs.request_id`.

Useful first queries:

```sql
-- AI calls in the last hour by feature, provider and status
select feature, provider, status, count(*), avg(duration_ms)::int as avg_ms
from ai_usage_logs where created_at > now() - interval '1 hour'
group by 1,2,3 order by 4 desc;

-- Latest rate-limit headers seen per provider/model
select distinct on (provider, model) provider, model, scope, remaining_requests, remaining_tokens, captured_at
from provider_usage order by provider, model, captured_at desc;
```

## AI provider outage

**Symptoms:** spikes of `RATE_LIMITED`, `UPSTREAM_UNAVAILABLE` or `UPSTREAM_TIMEOUT`; `ai_usage_logs.status` = `failed` / `rate_limited`.

**Impact by provider**

| Provider down | Affected | Not affected |
| :--- | :--- | :--- |
| Groq | `chat`, `generate_podcast` (script), audio/video ingest (Whisper) fail. Notes/derivatives fall back to Gemini if `GEMINI_API_KEY` is set | Embeddings (gte-small is in-runtime), audio rendering (browser), BYOK users on Gemini/OpenAI |
| Gemini | Long-document notes/derivatives fall back to Groq, which rate-limits sooner on large inputs (expect more `NOTES_INCOMPLETE` / `RATE_LIMITED`) | Everything else |

Users are not charged for failed calls: functions refund the action automatically. `generate_notes` keeps finished sections, so a retry after recovery resumes instead of starting over.

**Actions**

1. Confirm on the provider's status page and in the queries above.
2. For a long outage, pause AI features so users see a maintenance message instead of errors (see [circuit breakers](#circuit-breakers)). Note this only covers `chat`, `generate_notes` and `generate_derivatives`, not `generate_podcast` or ingest.
3. After recovery, turn the breaker back on. Nothing needs replaying.

## Quota RPC failing (503 `QUOTA_UNAVAILABLE`)

Quotas fail **closed**: every AI action returns 503 while the RPC errors.

1. Logs: look for `consume_daily_quota RPC failed; denying (fail closed)` and the Postgres message.
2. Check the function exists and `service_role` may execute it:
   ```sql
   select proname from pg_proc where proname in ('consume_daily_quota','consume_daily_tts_quota','refund_daily_quota');
   select has_function_privilege('service_role', 'public.consume_daily_quota(uuid,int)', 'execute');
   ```
3. Try it for an affected user: `select public.consume_daily_quota('<user_id>', 1);` then refund with `select public.refund_daily_quota('<user_id>', 1);`.
4. A `false` result (not an error) means over the limit or **no `profiles` row** for that user (`select * from profiles where user_id = '<user_id>'`). A missing profile means `handle_new_user` did not run; insert one as `postgres` with free defaults.
5. Common causes: a migration only partly applied; database connection exhaustion; the `SUPABASE_SERVICE_ROLE_KEY` secret overridden by hand.

Do **not** "fix" this by making quotas fail open: that is unlimited AI spend.

## Billing webhook failures

Lemon Squeezy retries non-2xx deliveries; inspect them in Lemon Squeezy → Settings → Webhooks.

| Response | Cause | Fix |
| :--- | :--- | :--- |
| 500 `NOT_CONFIGURED` | `LEMONSQUEEZY_WEBHOOK_SECRET` unset | `supabase secrets set …`; LS retries succeed |
| 401 `INVALID_SIGNATURE` | Secret differs from the one in LS | Copy the signing secret again; resend from LS |
| 400 `MISSING_USER_ID` | Checkout did not pass `checkout[custom][user_id]` | Fix the checkout link (`src/features/settings/checkout.ts`); grant the plan manually (below) |
| 500 `DB_ERROR` | `apply_billing_event` failed (often migration `20261126110000` missing) | Fix, then resend; the transaction rolled back so the resend is not a duplicate |

Inspect what was applied:

```sql
select received_at, event_name, user_id, outcome from billing_events order by received_at desc limit 50;
select * from subscriptions where user_id = '<user_id>';
```

`duplicate` = same body already processed. `stale` = an older event arrived after a newer one (expected). `unknown_user` = the user id is not (or no longer) in `auth.users`.

**Manual grant or revoke** (only after confirming payment in Lemon Squeezy):

```sql
update profiles set tier = 'pro', daily_quota_limit = 200, daily_tts_quota_limit = 50, active_docs_limit = 100
where user_id = '<user_id>';
-- revoke: tier 'free', 25, 2, 3
```

A later subscription event will overwrite this with the provider's state. A cancelled subscription keeps pro until `ends_at`; the downgrade happens when Lemon Squeezy sends the next event (for example `subscription_expired`). Nothing in the app downgrades on a timer.

## Stuck jobs and documents

`jobs` rows hold the per-document lock (one active job per `(document_id, kind)`). Holders heartbeat every ~10 s, and any active job untouched for **120 s** is reaped automatically by the next request for that document and kind. Usually the fix is simply to retry from the UI.

```sql
-- Active jobs with no heartbeat for 2+ minutes
select id, user_id, document_id, kind, status, progress, updated_at, error
from jobs where status in ('queued','running') and updated_at < now() - interval '2 minutes';

-- Release them by hand if needed
update jobs set status = 'failed', error = 'released manually'
where status in ('queued','running') and updated_at < now() - interval '2 minutes';
```

- **Document stuck in `pending`/`processing`** (YouTube/audio/video): check `jobs` for kind `ingest` and the `ingest` logs; then the user retries, or set `status = 'failed'` with an `error_code` so the UI offers a retry.
- **Notes stopped part-way:** `note_sections` shows which sections are `done`/`failed`. Calling `generate_notes` again resumes; the client does this automatically on `incomplete`. To force a clean run, delete that document's `note_sections` rows (the UI's regenerate does this).
- **409 `ACTIVE_JOB_RUNNING` that never clears:** a job with a fresh `updated_at` is still heartbeating; wait for it or check the logs for a hung upstream call (all calls have timeouts).

## Re-indexing embeddings

Chunks are unique on `(document_id, order_index)` and indexing only fills missing ones, so re-indexing is always safe.

- **One document:** `delete from document_chunks where document_id = '<id>';` The next chat question re-indexes it inline (60 s budget), or the user's client calls `embed_chunks`.
- **Everything** (for example after changing the chunker or model): `update document_chunks set embedding = null;` or delete all rows. Documents are re-embedded lazily on their next chat question. There is no server-side bulk job: `embed_chunks` needs the owner's JWT.
- If you change `EMBED_MODEL` or `EMBED_DIMS` (`_shared/embeddings.ts`), you also need a migration for the column type and `match_document_chunks`, and the query and index embeddings must use the same model.

## Circuit breakers

`system_circuit_breakers` is an emergency switch, read on every request (no cache):

| Key | Checked by | When off |
| :--- | :--- | :--- |
| `ai_requests_enabled` | `chat`, `generate_notes`, `generate_derivatives` | 503 with a maintenance message (`AI_PAUSED`) |
| `uploads_enabled` | `ingest` | 503 `UPLOADS_DISABLED` (browser text/PDF/DOCX inserts are not blocked) |
| `podcasts_enabled` | nothing (seeded `false`, unused) | no effect |

```sql
update system_circuit_breakers set enabled = false, updated_at = now() where key = 'ai_requests_enabled';
-- and back:
update system_circuit_breakers set enabled = true, updated_at = now() where key = 'ai_requests_enabled';
```

If the breaker table cannot be read, `checkCircuitBreaker` treats the switch as **on** (fails open), so a database outage does not also block reads that would otherwise work. Quotas still fail closed in that case.

## Rotating `BYOK_ENCRYPTION_KEY`

Saved user keys are AES-256-GCM ciphertext under this one master key. The code supports **one** key at a time, with no re-encryption path. Changing it makes every existing row in `user_api_keys` undecryptable:

- `generate_notes` / `generate_derivatives` for those users fail closed with 503 `BYOK_UNAVAILABLE` (they never silently fall back to the platform key).
- `api_keys` `test` returns `BYOK_DECRYPT_FAILED`; users must delete and re-save their keys.
- `ingest` falls back to the platform key and platform limits.
- The `enforce_document_length_cap` trigger still grants the 300-page cap while a row exists.

So rotate only if the key may have leaked, and then:

1. `supabase secrets set BYOK_ENCRYPTION_KEY=<new value from openssl rand -base64 32>`.
2. Delete the unreadable rows so affected users go back to platform behavior instead of 503s: `delete from user_api_keys;` (or only rows created before the rotation).
3. Tell affected users to re-save their keys in Settings. If the old key leaked, also advise them to revoke the old provider keys with the provider.

Never unset the secret: saving keys then returns 503 `BYOK_UNAVAILABLE` and existing keys stop working.

## Rolling back a migration

There are no down-migrations. Options, in order of preference:

1. **Forward fix:** write a new migration that corrects the problem. Never edit an applied file.
2. **Roll back code instead:** redeploy the previous edge functions/frontend if the schema change is backward compatible.
3. **Restore:** point-in-time recovery or a backup (Supabase dashboard → Database → Backups). This loses writes made after the restore point.

Irreversible steps in the current chain: `20261126100000` deleted duplicate notes/podcasts/quizzes, and `20261126110000` nulled every embedding (recoverable by re-indexing, not by rollback). Functions depend on the new schema (`halfvec(384)` `match_document_chunks`, `note_sections`, `user_api_keys`, `apply_billing_event`), so roll functions and schema back together. To undo a trigger quickly: `drop trigger <name> on public.<table>;` in a forward migration.

## Deleting a user's data on request

**Self-service (preferred):** Settings → Data & Storage → delete account. It calls `delete_account`, which removes every file under `{user_id}/` in `uploads`, `podcasts` and `avatars`, then deletes the auth user. All user rows cascade.

**Operator procedure** (when the user cannot sign in; `delete_account` needs the user's own JWT):

1. Find the user: `select id, email from auth.users where email = '<email>';`
2. Delete their files in Storage for each bucket (`uploads`, `podcasts`, `avatars`), folder `<user_id>/` — via the dashboard or a service-role script.
3. Delete the user in Authentication → Users (or `auth.admin.deleteUser`). Documents, notes, chunks, chat, reviews, jobs, profiles, `user_api_keys` and `subscriptions` cascade.
4. What remains by design: `billing_events` (financial ledger, `user_id` set to null), and `ai_usage_logs` / `ai_feedback` rows not tied to a document (`user_id` set to null). Lemon Squeezy holds its own customer record; delete it there if requested.
5. Export first if the request is for access (GDPR Art. 15): the user can use Settings → Data & Storage → export, which downloads their documents, notes, flashcards, quizzes, podcast scripts and chat history.
