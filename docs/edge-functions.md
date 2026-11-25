# Edge functions

Ten Deno functions plus shared modules in `supabase/functions/` (11 directories counting `_shared/`). They are the only place server-side secrets are used. Client wrappers live in `src/lib/services/` and always go through `callFunction` / `functionError`.

| Function | Purpose | Auth | Costs |
| :--- | :--- | :--- | :--- |
| `ingest` | YouTube captions / Whisper transcription, page cap, duplicate check | user JWT | 1 action for Whisper (platform key) |
| `embed_chunks` | Chunk + embed with gte-small | user JWT | free |
| `generate_notes` | Section-by-section notes, SSE | user JWT | 1 action per completed document (BYOK: free) |
| `generate_derivatives` | Flashcards + quiz | user JWT | 1 action (BYOK: free) |
| `chat` | RAG chat with citations, SSE | user JWT | 1 action per message, always |
| `generate_podcast` | Two-host podcast script | user JWT | 1 action, always |
| `podcast_audio` | Meter + signed URLs for browser-rendered audio | user JWT | 1 audio render on `start` |
| `api_keys` | Save / test / list / delete encrypted BYOK keys | user JWT | free |
| `delete_account` | Delete storage + auth user | user JWT | free |
| `billing-webhook` | Lemon Squeezy events → ledger, subscription, tier | HMAC `X-Signature` | n/a |

## Shared contract

- **Method** — `POST`; `OPTIONS` answers CORS preflight. `api_keys`, `podcast_audio`, `delete_account` and `billing-webhook` return 405 for other methods.
- **Auth** — `Authorization: Bearer <access_token>` is mandatory except for `billing-webhook`. The JWT is verified in code with `auth.getClaims` (`_shared/auth.ts`; `generate_podcast` and `podcast_audio` inline the same check). `supabase/config.toml` sets `verify_jwt = false` for every function except `ingest` and `embed_chunks`, which keep the platform default (gateway JWT check as well).
- **Ownership** — the document is re-read with the service-role client and compared to the caller. Someone else's document returns 404, not 403. Ownership is checked **before** any quota is charged.
- **CORS** — `_shared/cors.ts`: `ALLOWED_ORIGIN` is a comma-separated allow-list; a listed request origin is echoed, otherwise the first entry is returned. Unset or `*` sends `*` (never echoes). `billing-webhook` sends no CORS headers.
- **Errors** — JSON `{ "error": "<message safe to show>", "code": "<STABLE_CODE>", "retryable"?: true }`. Some older paths return only `error` (noted below).
- **Quotas** — `_shared/quotas.ts` calls the `consume_daily_quota` / `consume_daily_tts_quota` RPCs. They fail **closed**: an RPC error is 503 `QUOTA_UNAVAILABLE`; over the limit is 429 `QUOTA_EXCEEDED` (`AUDIO_QUOTA_EXCEEDED` for renders). After charging, any upstream failure refunds once (`refund_daily_quota`).
- **BYOK** — decided by the server only (`_shared/byok.ts`). Request headers are ignored. See [architecture](./architecture.md#byok-key-vault).
- **Circuit breakers** — `chat`, `generate_notes`, `generate_derivatives` check `ai_requests_enabled`; `ingest` checks `uploads_enabled`. Off → 503 (`AI_PAUSED` / `UPLOADS_DISABLED`; `chat` sends no code). A database error while reading the breaker is treated as "on" (fails open).
- **Job lock** — `_shared/jobLock.ts`: insert of a `running` job, protected by a partial unique index. Busy → 409 `ACTIVE_JOB_RUNNING`; lock error → 503 `JOB_LOCK_UNAVAILABLE` (fails closed). Heartbeat every ~10 s; stale after 120 s.
- **Timeouts** — every upstream call goes through `_shared/http.ts` `fetchWithTimeout`: Groq chat 60 s (streams: 60 s until headers), Whisper 120 s, YouTube 15 s (20 s total budget), key validation 10 s. Timeouts become 504 `UPSTREAM_TIMEOUT`.
- **Engine** — `_shared/engine.ts` (notes, derivatives, overview). Providers: Groq (`openai/gpt-oss-120b` → `gpt-oss-20b` → `llama-3.1-8b-instant`), Gemini (`gemini-2.5-flash-lite`), OpenAI (`gpt-4o-mini`, BYOK only). Sources over 20,000 characters start on Gemini when a Gemini key is available. 429/5xx/timeouts move to the next provider; if every attempt was rate-limited it waits for the shortest `retry-after` (max 20 s) and tries once more. A 401/403 on a user's own key stops immediately with `BYOK_KEY_INVALID`.
- **Logging** — `_shared/log.ts` JSON lines with `requestId`; `ai_usage_logs` rows for every AI call (including `embed` and `tts`).
- **supabase-js** — one version everywhere: `https://esm.sh/@supabase/supabase-js@2.57.4`.

## Secrets

Set with `supabase secrets set` (never in a `NEXT_PUBLIC_` variable):

| Secret | Required | Used by |
| :--- | :--- | :--- |
| `GROQ_API_KEY` | yes | chat, generate_podcast, ingest (Whisper), notes/derivatives (short docs, fallback) |
| `GEMINI_API_KEY` | recommended | notes/derivatives for long documents and as 429 fallback. Without it everything runs on Groq |
| `BYOK_ENCRYPTION_KEY` | yes for BYOK | api_keys, notes, derivatives, ingest. Base64 of 32 random bytes (`openssl rand -base64 32`). Missing → saving keys returns 503 `BYOK_UNAVAILABLE` |
| `ALLOWED_ORIGIN` | yes in prod | all browser-facing functions |
| `LEMONSQUEEZY_WEBHOOK_SECRET` | yes | billing-webhook (refuses everything without it) |
| `NOTES_TIME_BUDGET_MS` | optional | generate_notes; default 120000. Keep below the platform wall-clock limit |
| `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` | injected | all |

---

## `ingest`

**Request** `{ "document_id": "uuid", "api_key"?: "gsk_..." }` → `{ "ok": true, "length": 12345 }`, or `{ "ok": false, "duplicate_of": "uuid", "code": "DUPLICATE_DOCUMENT" }` (HTTP 200).

Called by the browser for `youtube`, `audio` and `video` documents (text/PDF/DOCX are inserted `ready` directly). Steps: breaker `uploads_enabled` → ownership → profile limits (fail closed) → active-document count → job lock → `processing` → source:

- `youtube`: best-effort captions (labelled beta in the UI); failure is 422 `YOUTUBE_TRANSCRIPT_UNAVAILABLE` with paste-the-transcript instructions.
- `audio`/`video`: plan upload size (50/100 MB), then Whisper's 25 MB limit, then **1 action** (skipped with the user's stored or body Groq key), Groq `whisper-large-v3`. Refunded if transcription fails or is empty.

Then: strip null bytes, at least 20 characters, page cap (`DOCUMENT_TOO_LONG`; BYOK raises it to 300 pages), SHA-256 duplicate check, `status = 'ready'`. Failures set `documents.status = 'failed'` and `error_code` to the code or message (for example `DOCUMENT_TOO_LONG`, `DUPLICATE_OF:<id>`, `MISSING_FILE_PATH`, `FILE_DOWNLOAD_FAILED`, `EMPTY_OR_TOO_SHORT`, `GROQ_WHISPER_EMPTY_TRANSCRIPT`, `GROQ_API_KEY_NOT_CONFIGURED`); unclassified errors return 500 `INGEST_FAILED`.

## `embed_chunks`

**Request** `{ "document_id": "uuid", "batch_index"?: 0, "batch_size"?: 50 }` (batch size clamped 10–100).

- **Batched** (what the browser uses): embeds only the missing chunks of that range → `{ ok, batch_index, inserted, total_chunks, completed }`; batch 0 on a fully indexed document returns `{ ok, cached: true, completed: true }`. No job lock (upserts on `(document_id, order_index)` are idempotent).
- **Whole document** (no `batch_index`): under the `embed_chunks` job lock → `{ ok, chunks, cached }`.
- 400 `NO_TEXT` under 40 characters; 413 `DOCUMENT_TOO_LONG` above the absolute 300-page ceiling; 500 `EMBED_FAILED`. Logs one `embed` usage row per fully indexed document (0 credits). Extra rows beyond the current chunk count are pruned.

## `generate_notes`

**Request** `{ "document_id", "tone"?, "notes_depth"?, "api_key"?, "idempotency_key"?, "force_regenerate"?: bool, "user_role"?, "workspace_preferences"? }` → `text/event-stream`.

1. Breaker, ownership, `DOCUMENT_NOT_READY` (< 20 characters), key resolution (`BYOK_UNAVAILABLE` if stored keys cannot be read; `AI_NOT_CONFIGURED` if no provider key at all), page cap (413).
2. Existing notes are streamed back as-is (no charge) unless `force_regenerate`.
3. Quota (skipped in BYOK mode), then job lock. If busy it polls for finished notes for ~4 s, then 409.
4. Background job (`EdgeRuntime.waitUntil`, survives the client disconnecting): split into ~15,000-character sections; for each section emit `progress`, reuse a `done` row from `note_sections` or generate it; after `NOTES_TIME_BUDGET_MS` emit `incomplete` (the action is refunded; the next call charges again and resumes). Then one overview call, `notes.markdown = overview + TOC + sections`, emit `final`.

SSE events and payloads are listed in [architecture](./architecture.md#streaming-sse). In-stream error codes: `BYOK_KEY_INVALID`, `RATE_LIMITED`, `UPSTREAM_UNAVAILABLE`, `INTERNAL`; pause: `NOTES_INCOMPLETE`.

## `generate_derivatives`

**Request** `{ "document_id", "flashcard_count"?, "quiz_difficulty"?, "quiz_style"?, "flashcard_algorithm"?, "user_role"?, "workspace_preferences"?, "api_key"?, "idempotency_key"?, "force_regenerate"? }`

**Response** `{ "ok": true, "flashcards_count": 24, "questions_count": 14, "quiz_id": "uuid", "parts": 8, "source": "section_notes" | "notes" | "raw_text" }`. Without `force_regenerate`, existing results return `{ flashcards_count, questions_count: 0, quiz_id, cached: true }` at no cost.

Source preference: complete `note_sections` → saved notes split into sections → `raw_text` split. Parts are packed into at most 6 calls of ~14k characters (condensed when needed), with a few cards/questions per part (max 30 cards, 20 questions). Results are deduplicated and saved by `replace_document_derivatives` in one transaction. Prompt fields are capped (`capPromptField`, 300 characters). Errors: `EMPTY_AI_OUTPUT` / `INVALID_AI_OUTPUT` / `UPSTREAM_UNAVAILABLE` (502), `RATE_LIMITED` (429), `BYOK_KEY_INVALID` (400), `PERSIST_FAILED` / `INTERNAL` (500); all refund and mark the job failed.

## `chat`

**Request** `{ "document_id", "message" }` → `text/event-stream`.

Always uses the platform Groq key (`openai/gpt-oss-20b`, 800 max tokens, last 10 messages of history) and always costs 1 action. Steps: breaker → ownership → quota → make sure the index is complete (embeds missing chunks inline, 60 s budget; 409 `DOCUMENT_INDEXING` if another request holds the index lock and nothing is searchable yet; 500 `INDEX_FAILED`) → embed the question with gte-small → `match_document_chunks` top 6 → save the user message → stream. The first frame is `event: citations` with `[{n, order_index, similarity, text}]`; the assistant reply is saved with the same `citations`. Refunded on upstream error, timeout (504) or an empty stream. Upstream errors return `{error}` only, with 429 or 500.

## `generate_podcast`

**Request** `{ "document_id", "user_role"?, "podcast_style"? }` (`voice_duo` and `mode` are accepted and ignored) → `{ "ok": true, "status": "ready", "script": "Host 1: …", "audio_url": null }`.

Writes the script only. Source = saved notes if present, else `raw_text` (truncated to 30,000 characters); under 80 characters → 400. Charges **1 action** after the ownership and source checks, upserts the `podcasts` row (`generating`), calls Groq `openai/gpt-oss-20b`, validates that the script splits into two hosts, saves it with `audio_url`/`audio_path` cleared and deletes old audio. Failures set `status = 'failed'` and refund; most return `{error}` only (500), timeouts 504 `UPSTREAM_TIMEOUT`, quota errors carry codes.

## `podcast_audio`

Audio is synthesized in the browser with Kokoro-82M (`kokoro-js`, Web Worker, encoded to Ogg/WebM or WAV). If the model cannot run, the UI plays the script with the browser's `speechSynthesis` and saves nothing.

| Request | Response |
| :--- | :--- |
| `{ "action": "start", "document_id", "ext"?: "ogg"\|"webm"\|"wav" }` | Consumes **1 audio render**; `{ path, token, upload_url, content_type, renders_remaining }`. Refunded if the signed upload URL cannot be created |
| `{ "action": "finish", "document_id", "path" }` | Verifies the path is `{user}/{doc}/{digits}.{ext}` and the object exists and is non-empty; sets `podcasts.audio_path`, deletes older files, logs a `tts` usage row; `{ ok, path, url, expires_in: 3600 }` |
| `{ "action": "url", "document_id" }` | `{ url, expires_in?, renders_remaining }`; a 1-hour signed URL, or the legacy `audio_url`, or `null` |

Errors: 409 `NO_SCRIPT` (start/finish before a script exists), 429 `AUDIO_QUOTA_EXCEEDED`, 503 `QUOTA_UNAVAILABLE`; path/upload problems return `{error}` only (400/404/500).

## `api_keys`

| Request | Response |
| :--- | :--- |
| `{ "action": "save", "provider": "groq"\|"gemini"\|"openai", "key" }` | Shape check, free validation call, AES-GCM encrypt, upsert → `{ ok, provider, last4 }` |
| `{ "action": "test", "provider" }` | Decrypts and re-validates → `{ ok, provider, last4 }` |
| `{ "action": "delete", "provider" }` | `{ ok, provider }` |
| `{ "action": "list" }` | `{ keys: [{ provider, last4, updated_at }] }` |

Responses carry `Cache-Control: no-store`; the key itself is never returned. Errors: 400 `BAD_REQUEST` / `BYOK_KEY_INVALID`, 404 `NOT_FOUND` (test with no key), 429 `RATE_LIMITED`, 502 `UPSTREAM_UNAVAILABLE`, 504 `UPSTREAM_TIMEOUT`/`UPSTREAM_UNAVAILABLE` (provider unreachable), 503 `BYOK_UNAVAILABLE` (no valid `BYOK_ENCRYPTION_KEY`), `BYOK_DECRYPT_FAILED` (stored ciphertext unreadable, for example after a key rotation), `DB_ERROR`.

## `delete_account`

**Request** `{}` → `{ "ok": true }`. Removes every object under `{user_id}/` in `uploads`, `podcasts` and `avatars`, then `auth.admin.deleteUser`; all user rows cascade (`billing_events.user_id`, `ai_usage_logs.user_id` and `ai_feedback.user_id` are set to null). Fails closed: if any file cannot be removed the account is kept (500 `STORAGE_DELETE_FAILED`); 500 `ACCOUNT_DELETE_FAILED` if the auth delete fails. Both are retryable.

## `billing-webhook`

**Request** Lemon Squeezy event JSON with `X-Signature` (hex HMAC-SHA256 of the raw body). The checkout must pass `checkout[custom][user_id]`.

| Situation | Response |
| :--- | :--- |
| Secret not set | 500 `NOT_CONFIGURED` (Lemon Squeezy retries later) |
| Bad signature | 401 `INVALID_SIGNATURE` |
| Not JSON | 400 `INVALID_JSON` |
| Subscription event without a UUID `user_id` | 400 `MISSING_USER_ID` |
| `apply_billing_event` fails | 500 `DB_ERROR` (transaction rolled back; the retry is not a duplicate) |
| OK | 200 `{ received: true, event, outcome }`, outcome `applied`, `recorded`, `duplicate`, `stale` or `unknown_user` |

Only events whose `data.type` is `subscriptions` change entitlement. Status → tier: `active`, `on_trial`, `past_due` → pro; `cancelled` → pro until `ends_at`; `paused`, `unpaid`, `expired` → free. Orders and invoices are recorded only.

---

## Error code catalogue

Every `code` the functions return (from `grep -rn "code:" supabase/functions`).

| Code | HTTP | Where | Meaning / action |
| :--- | :--- | :--- | :--- |
| `BAD_REQUEST` | 400 | notes, derivatives, ingest, embed_chunks, api_keys | Invalid JSON or missing field |
| `INVALID_JSON` | 400 | ingest, embed_chunks, billing-webhook | Body is not JSON |
| `METHOD_NOT_ALLOWED` | 405 | api_keys, delete_account, billing-webhook | Not POST |
| `NOT_FOUND` | 404 | most | Document missing or not owned; api_keys test with no saved key |
| `NO_TEXT` | 400 | embed_chunks | Document has no text yet |
| `DOCUMENT_NOT_READY` | 400 | notes, derivatives | No usable source text |
| `DOCUMENT_TOO_LONG` | 413 | ingest, notes, derivatives, embed_chunks | Over the plan's page cap (DB trigger raises the same text) |
| `DOCUMENT_LIMIT_REACHED` | 403 | ingest (+ DB trigger hint) | Too many saved documents for the plan |
| `DUPLICATE_DOCUMENT` | 200 | ingest | Same text already exists (`duplicate_of`) |
| `UPLOAD_TOO_LARGE` | 413 | ingest | Over the plan's upload size |
| `FILE_TOO_LARGE` | 413 | ingest | Over Whisper's 25 MB |
| `INVALID_YOUTUBE_URL` | 400 | ingest | Not a YouTube link |
| `YOUTUBE_TRANSCRIPT_UNAVAILABLE` | 422 | ingest | Captions not fetchable; paste the transcript |
| `INGEST_FAILED` | 500 | ingest | Unclassified ingest failure (see `documents.error_code`) |
| `UPLOADS_DISABLED` | 503 | ingest | `uploads_enabled` breaker off |
| `AI_PAUSED` | 503 | notes, derivatives | `ai_requests_enabled` breaker off |
| `AI_NOT_CONFIGURED` | 500 | notes, derivatives | No platform or user provider key |
| `QUOTA_EXCEEDED` | 429 | notes, derivatives, chat, generate_podcast, ingest | Daily actions used up |
| `AUDIO_QUOTA_EXCEEDED` | 429 | podcast_audio | Daily audio renders used up |
| `QUOTA_UNAVAILABLE` | 503 | quota callers, ingest (profile read) | Quota RPC/profile read failed; fail closed, retry |
| `ACTIVE_JOB_RUNNING` | 409 | notes, derivatives, ingest, embed_chunks | Same job already running for this document |
| `JOB_LOCK_UNAVAILABLE` | 503 | notes, derivatives, ingest, embed_chunks, chat | Lock could not be taken; fail closed, retry |
| `DOCUMENT_INDEXING` | 409 | chat | Index being built elsewhere; retry shortly |
| `INDEX_FAILED` | 500 | chat | Inline indexing failed |
| `EMBED_FAILED` | 500 | embed_chunks | Embedding/upsert failed; retryable |
| `BYOK_UNAVAILABLE` | 503 | notes, derivatives, api_keys | `BYOK_ENCRYPTION_KEY` missing/invalid, or stored keys unreadable |
| `BYOK_KEY_INVALID` | 400 | notes, derivatives, api_keys | Provider rejected the user's key, or wrong key shape |
| `BYOK_DECRYPT_FAILED` | 503 | api_keys | Stored ciphertext cannot be decrypted; delete and re-save |
| `RATE_LIMITED` | 429 | notes, derivatives, ingest, api_keys | Provider rate limit after fallbacks |
| `UPSTREAM_UNAVAILABLE` | 502/504 | notes, derivatives, api_keys | Every provider attempt failed |
| `UPSTREAM_TIMEOUT` | 504 | chat, ingest, generate_podcast, api_keys | Provider did not respond in time |
| `EMPTY_AI_OUTPUT` | 502 | derivatives | Model returned no cards/questions |
| `INVALID_AI_OUTPUT` | 502 | derivatives | Model output not parseable JSON |
| `PERSIST_FAILED` | 500 | derivatives | `replace_document_derivatives` failed |
| `NOTES_INCOMPLETE` | SSE `incomplete` | notes | Paused at the time budget; call again to resume |
| `NO_SCRIPT` | 409 | podcast_audio | Generate the script first |
| `DB_ERROR` | 503 / 500 | api_keys / billing-webhook | Database write failed |
| `NOT_CONFIGURED` | 500 | billing-webhook | `LEMONSQUEEZY_WEBHOOK_SECRET` unset |
| `INVALID_SIGNATURE` | 401 | billing-webhook | HMAC mismatch |
| `MISSING_USER_ID` | 400 | billing-webhook | Checkout did not pass `custom.user_id` |
| `STORAGE_DELETE_FAILED` | 500 | delete_account | Files remain; account kept; retry |
| `ACCOUNT_DELETE_FAILED` | 500 | delete_account | Auth delete failed; retry |
| `INTERNAL` | 500 | most | Unexpected error (logged with `requestId`) |

Internal-only codes: `BYOK_ENCRYPTION_UNAVAILABLE` (surfaced as `BYOK_UNAVAILABLE`); `EMPTY_SCRIPT` and `INVALID_SCRIPT_FORMAT` (surfaced in `generate_podcast`'s `error` message with HTTP 500). A 401 without a code means a missing or invalid bearer token.

## Local development

```bash
cp supabase/functions/.env.example supabase/functions/.env   # fill in values
npx supabase functions serve chat --env-file supabase/functions/.env
```

Unit tests for `_shared/*` are Vitest (`*.test.ts`, run by `npm test`); `*_test.ts` files are Deno tests. See [development](./development.md).
