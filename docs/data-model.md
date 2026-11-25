# Data model

Everything lives in the `public` schema of the Supabase Postgres database, defined by `supabase/migrations/`. Generated TypeScript types are in `src/integrations/supabase/types.ts` (regenerate after a migration: `supabase gen types typescript`). pgTAP tests for the rules below are in `supabase/tests/database/*.test.sql` (`supabase test db`).

**Rule of thumb:** `auth.users(id)` is the user id everywhere. `profiles.id` is a random UUID; always match on `profiles.user_id`.

## Enums

| Type | Values |
| :--- | :--- |
| `app_role` | `admin`, `user` |
| `user_academic_role` | `school_student`, `high_school`, `undergrad`, `scholar`, `researcher`, `teacher`, `custom` |
| `document_source` | `pdf`, `docx`, `text`, `audio`, `video`, `youtube` |
| `document_status` | `pending`, `processing`, `ready`, `failed` |
| `question_type` | `mcq`, `short_answer`, `true_false` |
| `podcast_status` | `pending`, `generating`, `ready`, `failed` |
| `chat_role` | `user`, `assistant`, `system` |
| `job_kind` | `ingest`, `generate_notes`, `generate_derivatives`, `generate_podcast`, `embed_chunks` |
| `job_status` | `queued`, `running`, `succeeded`, `failed` |

## Tables

All user tables reference `auth.users(id) ON DELETE CASCADE` and document children reference `documents(id) ON DELETE CASCADE`, so deleting a user or a document removes everything below it. Exceptions are noted.

### `profiles`

Created for every new auth user by the `handle_new_user` trigger. Columns: `user_id` (unique), `display_name`, `avatar_url`, `user_role`, `onboarding_completed`, `workspace_preferences` (jsonb), plus the **server-owned** plan columns:

| Column | Notes |
| :--- | :--- |
| `tier` | `'free'` or `'pro'` (Scholar Pass) |
| `daily_quota_limit` / `daily_quota_used` | AI actions: 25 free, 200 pro |
| `daily_tts_quota_limit` / `daily_tts_quota_used` | audio renders: 2 free, 50 pro |
| `active_docs_limit` | 3 free, 100 pro |
| `quota_reset_date` | lazy UTC-midnight rollover, done by the consume RPCs |

`protect_profile_billing_columns` (BEFORE INSERT/UPDATE): for `authenticated`/`anon` callers it forces free defaults on INSERT and raises `42501` if an UPDATE touches any column above or `user_id`. `service_role` and `postgres` pass through; only `billing-webhook` (via `apply_billing_event`) and the RPCs change them.

### `documents`

| Column | Notes |
| :--- | :--- |
| `title`, `source_type`, `source_url` | `source_url` is the Storage path for audio/video, or the YouTube URL |
| `raw_text`, `content_hash` | extracted text and its SHA-256 |
| `status`, `error_code` | `error_code` is shown in the failure badge (`DUPLICATE_OF:<id>`, `DOCUMENT_TOO_LONG`, …) |

Indexes include a **partial unique index on `(user_id, content_hash)`**: the same text uploaded twice by one user is rejected. `REPLICA IDENTITY DEFAULT`.

Triggers on `documents`:

- **`protect_document_server_columns`** (BEFORE INSERT/UPDATE, end users only). INSERT: `error_code` cleared; `youtube`/`audio`/`video` get `raw_text`/`content_hash` cleared and status `pending`; text/PDF/DOCX may insert as `ready` only with at least 20 characters of `raw_text`. UPDATE: `user_id`, `source_type`, `source_url`, `raw_text`, `content_hash`, `error_code` are read-only, and status may only change `pending`/`processing` → `ready` when text already exists. Anything else raises `42501`.
- **`enforce_document_length_cap`** (BEFORE INSERT/UPDATE OF `raw_text`, end users only). Max characters = pages × 3,000: 300 pages if the user has any row in `user_api_keys`, 50 for `pro`, else 25. Raises `DOCUMENT_TOO_LONG: …` with SQLSTATE `22001`.
- **`trigger_check_user_active_document_limit`** (BEFORE INSERT/UPDATE OF `status`, all roles). When a row *becomes* active (`ready`/`processing`/`pending`) and the user already has `profiles.active_docs_limit` active documents, raises `LIMIT_EXCEEDED: …` (SQLSTATE `P0001`, hint `DOCUMENT_LIMIT_REACHED`). Advisory-locked per user, so two tabs cannot both pass.

### `notes` and `note_sections`

`notes`: one row per document (`UNIQUE (document_id)`); `markdown` is the final overview + table of contents + every section, written by `generate_notes` with `upsert … onConflict: document_id`.

`note_sections` (new): `document_id`, `user_id`, `idx` (≥ 0), `total` (≥ 1, the number of sections at write time), `markdown`, `status` (`pending`/`running`/`done`/`failed`), `model`, `error`. `UNIQUE (document_id, idx)`. A row whose `total` no longer matches the current split is discarded. Clients have SELECT only; `generate_notes` (service role) writes.

### `flashcards`, `quizzes`, `quiz_questions`, `quiz_attempts`

- `flashcards`: `front`, `back`, `order_index`.
- `quizzes`: `UNIQUE (document_id)`, `title`. `quiz_questions`: `question`, `type`, `choices` (jsonb, null for short answer), `correct`, `explanation`, `order_index`.
- Flashcards and the quiz are replaced together, atomically, by `replace_document_derivatives`.
- `quiz_attempts`: `quiz_id`, `score`, `total`, `answers` (jsonb). Insert and select only, so an attempt cannot be rewritten. Written by the browser (`useQuizAttempts`).

### `flashcard_reviews` (new)

Leitner state per `(user_id, flashcard_id)` (unique): `document_id`, `box` (1–5), `due_at`, `last_result` (`again`/`good`/`easy`), `review_count`. Intervals (1, 2, 4, 7, 14 days) are computed in the browser (`src/features/learning/leitner.ts`). Owner-only CRUD; INSERT/UPDATE also require that the flashcard belongs to the caller and to the same `document_id`.

### `podcasts`

One row per document (`UNIQUE (document_id)`): `script` (two-host dialogue), `status`, `audio_path` (new: Storage path of the current browser-rendered file; playback gets a 1-hour signed URL from `podcast_audio`), and legacy `audio_url` (long-lived signed URL from the old server TTS; cleared when a new script is generated).

### `chat_messages`

`role`, `content`, `document_id`, and `citations` (new, jsonb: `[{n, order_index, similarity, text}]` on assistant rows). Written by `chat` (service role) for both turns. Select, insert and delete policies; no update. Indexed on `(document_id, created_at)`.

### `document_chunks`

| Column | Notes |
| :--- | :--- |
| `chunk_text` | ~1,400-character passage |
| `embedding` | `extensions.halfvec(384)`, gte-small. Nulled by migration `20261126110000`; re-embedded on demand |
| `order_index` | position in the document; `UNIQUE (document_id, order_index)` makes indexing an idempotent upsert |

HNSW index `document_chunks_embedding_hnsw` (`halfvec_cosine_ops`, m=16, ef_construction=64). Clients have SELECT and DELETE only; `embed_chunks` and `chat` write.

### `jobs`

Progress and the per-document job lock: `kind`, `status`, `progress` (0–100), `error`, `payload`, `idempotency_key`. Clients have SELECT only.

- `jobs_one_active_per_document_kind`: partial unique `(document_id, kind) WHERE status IN ('queued','running')`. A concurrent second job fails with `23505`, which `_shared/jobLock.ts` treats as "busy".
- `jobs_user_idempotency_key_idx`: unique `(user_id, idempotency_key)` where the key is not null.
- Holders heartbeat `updated_at` every ~10 s; an active job untouched for **120 s** is reaped as stale by the next `acquireJobLock`.

### `user_api_keys` (new)

`provider` (`groq`/`gemini`/`openai`), `ciphertext` + `iv` (AES-256-GCM, base64), `last4`. `UNIQUE (user_id, provider)`. RLS on, **no grants** for `anon`/`authenticated`: only the service role touches it. The client reads `list_my_api_keys()`.

### `subscriptions` and `billing_events` (new)

- `subscriptions`: one row per user (`UNIQUE (user_id)`): `provider` (`lemonsqueezy`), `provider_subscription_id`, `provider_customer_id`, `status`, `variant_id`, `plan`, `renews_at`, `ends_at`, `trial_ends_at`, `updated_at` (the provider's timestamp of the last applied event), `synced_at`. Owner SELECT; no client writes.
- `billing_events`: append-only ledger, `UNIQUE (event_id)` (`sha256:<hash of signed body>`), `event_name`, `webhook_id`, `payload`, `outcome`, `received_at`. `user_id` is `ON DELETE SET NULL`, so the ledger outlives account deletion. RLS on with no policies and no client grants.

### Telemetry and operations

- `ai_usage_logs`: `request_id`, `feature` (`notes`, `derivatives`, `chat`, `podcast`, `transcribe`, `embed`, `tts`), `provider` (`groq`, `gemini`, `openai`, `local`, legacy `edge-tts`), `model`, token counts, `estimated_cost_usd`, `status`, `duration_ms`, `error_message`. Owner SELECT. `user_id` is `SET NULL` on user delete; `document_id` cascades.
- `daily_ai_usage` view (`security_invoker = true`): credits per user per UTC day (chat 1, notes 5, derivatives 4, transcribe 1, podcast 10, embed/tts 0). Reporting only; enforcement uses the `profiles` counters.
- `provider_usage`: rate-limit header snapshots per provider/model/scope. Any authenticated user can read.
- `ai_feedback`: thumbs up/down per feature; owner insert/select.
- `system_circuit_breakers`: `key`, `enabled`, `description`. Seeded keys: `ai_requests_enabled`, `uploads_enabled`, `podcasts_enabled` (seeded `false` but not read by any function). Authenticated users can read. See the [runbook](./runbook.md#circuit-breakers).
- `user_roles`: roles kept apart from profiles so users cannot grant themselves one; checked by `has_role()`, writable by admins only.

## Database functions (RPCs)

| Function | Callable by | Purpose |
| :--- | :--- | :--- |
| `consume_daily_quota(p_user_id, p_cost)` | `service_role` | Atomic, row-locked deduction with lazy UTC rollover; matches on `user_id`. Returns boolean |
| `consume_daily_tts_quota(p_user_id, p_cost)` | `service_role` | Same for audio renders |
| `refund_daily_quota` / `refund_daily_tts_quota(p_user_id, p_cost)` | `service_role` | Gives back usage after an upstream failure. Never below 0; only today's counter |
| `replace_document_derivatives(p_document_id, p_user_id, p_flashcards, p_quiz, p_questions)` | `service_role` | Deletes and re-inserts flashcards, quiz and questions in one transaction (advisory-locked). Returns `{quiz_id, flashcards_count, questions_count}` |
| `apply_billing_event(p_event_id, p_event_name, p_user_id, p_webhook_id, p_payload, p_subscription, p_entitlement)` | `service_role` | Ledger insert + subscription upsert + profile entitlement in one transaction. Returns `duplicate`, `recorded`, `unknown_user`, `stale` or `applied` |
| `match_document_chunks(_document_id, _query_embedding halfvec, _match_count)` | invoker (RLS applies) | Exact cosine ranking within one document; returns `id, chunk_text, order_index, similarity`; count clamped to 1–20 |
| `list_my_api_keys()` | `authenticated` | `provider, last4, updated_at` for `auth.uid()` |
| `has_role(_user_id, _role)` | any | Role check (`SECURITY DEFINER`) |
| `handle_new_user()`, `update_updated_at_column()` | triggers | Profile creation; `updated_at` maintenance |

## Row Level Security summary

RLS is enabled on every table. The default pattern is owner-only policies on `auth.uid() = user_id`, with `UPDATE` policies carrying `WITH CHECK (auth.uid() = user_id)` so a row cannot be handed to another user.

| Table | Client access |
| :--- | :--- |
| `documents` | owner CRUD, column-protected by triggers |
| `profiles` | owner select/insert/update; plan columns read-only by trigger |
| `notes`, `flashcards`, `quizzes`, `quiz_questions`, `podcasts` | owner CRUD |
| `flashcard_reviews` | owner CRUD with ownership checks on the flashcard |
| `quiz_attempts` | owner select/insert |
| `chat_messages` | owner select/insert/delete |
| `document_chunks` | owner select/delete |
| `jobs`, `note_sections`, `subscriptions` | owner select only |
| `ai_usage_logs`, `ai_feedback` | owner select (+ insert for feedback) |
| `user_api_keys`, `billing_events` | none |
| `provider_usage`, `system_circuit_breakers` | any authenticated user can read |

**A new table with RLS on and no policies is invisible to clients**, which looks exactly like "the data disappeared".

## Storage buckets

All three are private. Policies compare the first path segment to `auth.uid()`, so every path must start with `{user_id}/`.

| Bucket | Contents | Path | Limits |
| :--- | :--- | :--- | :--- |
| `uploads` | audio/video awaiting transcription | `{user_id}/{uuid}-{filename}` | 100 MB, `audio/*`, `video/*` |
| `podcasts` | browser-rendered podcast audio | `{user_id}/{document_id}/{timestamp}.{ogg,webm,wav}` | 50 MB, `audio/ogg`, `audio/webm`, `audio/wav`, `audio/mpeg` |
| `avatars` | profile images | `{user_id}/...` | owner read (made private in `20261126110000`) |

Per-plan upload limits (50/100 MB) and Whisper's 25 MB ceiling are enforced in `ingest`. Podcast uploads use signed upload URLs from `podcast_audio`.

## Migrations

Applied in filename order. Never edit an applied migration; add a new one.

| File | Contents |
| :--- | :--- |
| `20260419182600_…` | Core schema: enums, tables, RLS, triggers, buckets, Realtime publication (`jobs`, `notes`, `documents`) |
| `20260419182628_…` | Storage read policies |
| `20260420174623_…` | De-duplication unique index, indexes, first `match_document_chunks` |
| `20260601125221_…` | Admin-only role writes, private podcasts bucket |
| `20261005190000_ai_cost_guardrails` | `ai_usage_logs`, job idempotency keys |
| `20261005200000_full_free_cost_plan` | Document limit trigger, `provider_usage`, `ai_feedback`, `daily_ai_usage`, `system_circuit_breakers` |
| `20261016090000_atomic_quota_rpc` | `consume_daily_quota` |
| `20261016091000_halfvec_optimization` | Earlier vector change (superseded) |
| `20261016092000_podcast_tts_quota` | Tier and TTS quota columns, `consume_daily_tts_quota` |
| `20261017120000_role_customization_schema` | `user_role`, `onboarding_completed`, `workspace_preferences` |
| `20261126090000_phase0_security_fixes` | Billing-column trigger, private profiles, quota RPCs on `user_id`, `daily_ai_usage` security invoker |
| `20261126100000_phase1_reliability` | Dedupe + `UNIQUE(document_id)` on notes/podcasts/quizzes, job-lock index, per-user idempotency, index cleanup, `REPLICA IDENTITY DEFAULT`, `replace_document_derivatives`, refund RPCs, document/jobs/chunks lock-down |
| `20261126110000_phase2_retrieval_limits_billing` | `halfvec(384)` (all embeddings nulled), unique chunk position, new `match_document_chunks`, `chat_messages.citations`, plan-aware document limit, `subscriptions`, `billing_events`, `apply_billing_event`, bucket limits, private avatars |
| `20261126120000_phase2_long_docs_byok` | `note_sections`, `user_api_keys`, `list_my_api_keys` |
| `20261126130000_phase2_podcast_audio` | `podcasts.audio_path`, podcasts bucket limits |
| `20261126140000_phase2_learning_progress` | `flashcard_reviews` |
| `20261126150000_phase2_document_length_cap` | `enforce_document_length_cap` |

Destructive steps to know before applying to production: `20261126100000` deletes duplicate notes/podcasts/quizzes, and `20261126110000` nulls every embedding. See [deployment](./deployment.md) and the [runbook](./runbook.md#rolling-back-a-migration).
