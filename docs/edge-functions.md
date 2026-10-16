# Edge functions

Seven Deno functions in `supabase/functions/`, deployed to Supabase. They are the only place server-side secrets are used.

## Shared contract

Every function follows the same shape:

- **Method** — `POST`, with `OPTIONS` handled for CORS preflight.
- **Auth** — an `Authorization: Bearer <access_token>` header is mandatory. The function verifies it with a user-scoped client (`auth.getClaims`) before doing anything, then switches to a service-role client for privileged writes.
- **Body** — JSON, always containing at least `document_id` (except for `billing-webhook`, which receives provider event payloads).
- **Ownership** — the referenced document is re-read server-side and checked against the caller. A document belonging to someone else returns 404, not 403.
- **Atomic Quotas** — `generate_notes`, `generate_derivatives`, and `chat` consume quota atomically via PostgreSQL RPC (`consume_daily_quota`) with row-level locks and lazy midnight UTC rollover. Personal BYOK keys (`x-byok-groq`, `x-byok-gemini`) and Scholar Pass subscribers (`tier = 'pro'`) bypass daily free deduction.

### Status codes

| Code | Meaning |
| :--- | :--- |
| 400 | Invalid JSON, or `document_id` missing |
| 401 | Missing/invalid bearer token or HMAC signature |
| 402 | Upstream AI provider credit exhausted |
| 404 | Document not found, or not owned by the caller |
| 409 | Concurrent lock in-flight (duplicate generation prevented) |
| 429 | Daily quota limit reached or rate limited by provider |
| 500 | Configuration or unexpected server error |

The client maps 429, 409, and 402 to friendly messages in `functionError` (`src/lib/services/functions.ts`); everything else surfaces the response body text.

### Environment secrets

Set these on the Supabase project, never in `.env`:

| Secret | Used by | Purpose |
| :--- | :--- | :--- |
| `GROQ_API_KEY` | ingest, generate_notes, generate_derivatives, generate_podcast, chat | Whisper transcription and llama chat completions |
| `LEMONSQUEEZY_WEBHOOK_SECRET` | billing-webhook | HMAC SHA-256 signature verification for subscription webhook events |
| `SUPABASE_URL` | all | injected automatically by the platform |
| `SUPABASE_ANON_KEY` | all | injected automatically; used for the caller-scoped client |
| `SUPABASE_SERVICE_ROLE_KEY` | all | injected automatically; bypasses RLS for server writes |
| `ALLOWED_ORIGIN` | all | optional CORS lock-down; defaults to `*` |

---

## `ingest`

Turns a raw source into `documents.raw_text` and flips the status to `ready`.

**Request** `{ "document_id": "uuid" }` → **Response** `{ "ok": true }`

Behavior by `source_type`:

| Source | What happens |
| :--- | :--- |
| `pdf`, `docx`, `text` | `raw_text` is already present (extracted in the browser); the function validates and hashes it |
| `audio`, `video` | Downloads the file from the `uploads` bucket and transcribes it with Groq `whisper-large-v3` |
| `youtube` | Fetches the video transcript server-side |

Then: strips null bytes, rejects anything under 20 characters, computes a SHA-256 `content_hash`, and checks for an existing document with the same hash for that user.

Progress is written to the `jobs` table throughout (5 → 65 → 70 → 100).

Limits: **25 MB** for audio/video (Groq Whisper free-tier ceiling, `MAX_BYTES` at `ingest/index.ts:16`). The browser separately rejects anything over 50 MB.

Error codes written to `documents.error_code`: `MISSING_RAW_TEXT`, `EMPTY_OR_TOO_SHORT`, `GROQ_WHISPER_EMPTY_TRANSCRIPT`, `duplicate`.

---

## `generate_notes`

Streams structured markdown study notes.

**Request** `{ "document_id": "uuid", "tone"?: string, "notes_depth"?: string, "idempotency_key"?: string }` → **Response** `text/event-stream`

- Model: Groq `llama-3.3-70b-versatile`
- Quota: Calls `consumeDailyQuota` RPC before acquiring job lock.
- Context distillation: Uses `distillSourceForNotes` for 50–300 page documents to prevent exceeding provider context limits.
- Emits OpenAI-shaped chunks; the client accumulates them via `streamNotes`.
- On stream completion the function persists the full markdown to `notes` itself.

---

## `generate_derivatives`

Generates flashcards and a diagnostic quiz from the notes in a single call.

**Request** `{ "document_id": "uuid", "flashcard_count"?: number, "quiz_difficulty"?: string }`

**Response**
```json
{ "ok": true, "flashcards_count": 12, "questions_count": 8, "quiz_id": "uuid" }
```

- Quota: Protected by atomic `consumeDailyQuota` RPC.
- Replaces existing flashcards and quiz rows for the document.
- Question types: `mcq`, `short_answer`, `true_false`.

---

## `embed_chunks`

Progressive 50-chunk batched passage embedding engine with 768-dimension local hashed embeddings (`halfvec(768)`).

**Request** 
```json
{ "document_id": "uuid", "batch_index"?: 0, "batch_size"?: 50 }
```

**Response**
```json
{ "ok": true, "batch_index": 0, "inserted": 50, "total_chunks": 420, "completed": false }
```

- Embedding: Deterministic 768-dimension FNV-1a hashed unigram/bigram vector, L2-normalized. Compatible with `extensions.halfvec(768)` in PostgreSQL.
- Batched Slicing: Accepts `batch_index` and `batch_size` (default 50) to allow client-side progressive indexing for 300+ page books without hitting Edge Function memory (150 MB) or CPU caps.

---

## `chat`

Retrieval-augmented chat over one document's chunks with 768-dimension vector search.

**Request** `{ "document_id": "uuid", "message": "..." }` → **Response** `text/event-stream`

1. Embeds the question with 768-dimension `embedQuery`.
2. Calls `match_document_chunks` over `halfvec(768)` composite index for the top 6 passages.
3. Emits a named SSE frame first:
   ```
   event: citations
   data: {"citations":[{"chunk_id":"uuid","similarity":0.83,"content":"..."}]}
   ```
4. Streams the answer as OpenAI-shaped chunks with citation references.
5. Persists both the user turn and the assistant reply to `chat_messages`.

---

## `generate_podcast`

Produces an educational two-host audio lesson with decoupled script vs studio TTS synthesis.

**Request** `{ "document_id": "uuid", "voice_duo"?: "rachel-alex" | "emma-daniel", "mode"?: "full" | "script_only" }`

**Response** 
```json
{ "ok": true, "status": "ready", "script": "...", "audio_url": "https://..." }
```

1. Synthesizes dialogue script via Groq (`openai/gpt-oss-20b`).
2. Quota Guard: Verifies `consume_daily_tts_quota` (capped at 2 studio audio renders/day for free users; unlimited for Scholar Pass and BYOK).
3. If TTS quota is exceeded or `script_only` requested: saves script with `audio_url: null` and returns `{ tts_quota_exceeded: true }` without failing.
4. If audio allowed: synthesizes segments with Microsoft Edge TTS, concatenates MP3 binary, uploads to private `podcasts` bucket, and issues long-lived signed URL.

---

## `billing-webhook`

Merchant of Record subscription fulfillment for Lemon Squeezy.

**Request** `POST /functions/v1/billing-webhook` (payload from Lemon Squeezy with `x-signature` header)

- Verification: Verifies HMAC SHA-256 signature using `crypto.subtle` and `LEMONSQUEEZY_WEBHOOK_SECRET`.
- On `subscription_created`, `order_created`, `subscription_resumed`:
  Updates `profiles.tier = 'pro'`, `daily_quota_limit = 200`, `daily_tts_quota_limit = 50`.
- On `subscription_cancelled`, `subscription_expired`:
  Reverts `profiles.tier = 'free'`, `daily_quota_limit = 25`, `daily_tts_quota_limit = 2`.

---

## Local development

Use the Supabase CLI:

```bash
npx supabase functions serve chat --env-file supabase/functions/.env
```
