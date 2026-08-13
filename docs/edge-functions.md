# Edge functions

Six Deno functions in `supabase/functions/`, deployed to Supabase. They are the only place server-side secrets are used.

## Shared contract

Every function follows the same shape:

- **Method** — `POST`, with `OPTIONS` handled for CORS preflight.
- **Auth** — an `Authorization: Bearer <access_token>` header is mandatory. The function verifies it with a user-scoped client (`auth.getClaims`) before doing anything, then switches to a service-role client for privileged writes.
- **Body** — JSON, always containing at least `document_id`.
- **Ownership** — the referenced document is re-read server-side and checked against the caller. A document belonging to someone else returns 404, not 403.

### Status codes

| Code | Meaning |
| :--- | :--- |
| 400 | Invalid JSON, or `document_id` missing |
| 401 | Missing/invalid bearer token |
| 402 | Upstream AI provider credit exhausted |
| 404 | Document not found, or not owned by the caller |
| 429 | Rate limited by the AI provider |
| 500 | Configuration or unexpected server error |

The client maps 429 and 402 to friendly messages in `functionError` (`src/lib/services/functions.ts`); everything else surfaces the response body text.

### Environment secrets

Set these on the Supabase project, never in `.env`:

| Secret | Used by | Purpose |
| :--- | :--- | :--- |
| `GROQ_API_KEY` | ingest, generate_notes, generate_derivatives, generate_podcast, chat | Whisper transcription and llama chat completions |
| `SUPABASE_URL` | all | injected automatically by the platform |
| `SUPABASE_ANON_KEY` | all | injected automatically; used for the caller-scoped client |
| `SUPABASE_SERVICE_ROLE_KEY` | all | injected automatically; bypasses RLS for server writes |
| `ALLOWED_ORIGIN` | all | optional CORS lock-down; defaults to `*` |

`ALLOWED_ORIGIN` is read at module load. Set it to your deployed site URL to stop other origins calling the functions from a browser. Leaving it unset preserves the permissive default.

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

**Request** `{ "document_id": "uuid" }` → **Response** `text/event-stream`

- Model: Groq `llama-3.3-70b-versatile`
- Input cap: 35,000 characters of `raw_text`
- Emits OpenAI-shaped chunks; the client accumulates them via `streamNotes`
- On stream completion the function persists the full markdown to `notes` itself — the client's follow-up `SELECT` is a re-read, not the write

The client retries up to 3 times with exponential backoff (2s, 4s, 8s) while the function returns 429, because Groq's free tier rate-limits aggressively.

---

## `generate_derivatives`

Generates flashcards and a quiz from the notes in a single call.

**Request** `{ "document_id": "uuid" }`

**Response**
```json
{ "ok": true, "flashcards_count": 12, "questions_count": 8, "quiz_id": "uuid" }
```

- Model: Groq `llama-3.3-70b-versatile`, 35,000-character input cap
- Replaces existing flashcards and quiz rows for the document, so re-running regenerates rather than duplicates
- Question types: `mcq`, `short_answer`, `true_false`

---

## `embed_chunks`

Splits the notes into passages and stores hashed embeddings for retrieval.

**Request** `{ "document_id": "uuid" }`

**Response** `{ "ok": true, "chunks": 42, "cached": false }`

`cached: true` means chunks already existed and nothing was recomputed.

The embedding is **not** produced by a model — it is a deterministic 1536-dimension FNV-1a hashed bag of unigrams and bigrams, L2-normalized. See `embedLocal`. This makes indexing free and instant at the cost of pure lexical (not semantic) matching.

> **Keep in sync:** `embedLocal` here and `embedQuery` in `chat/index.ts:28` must produce identical vectors for the same text. Change one without the other and retrieval silently degrades to noise. Any change requires re-indexing every document.

---

## `chat`

Retrieval-augmented chat over one document's chunks.

**Request** `{ "document_id": "uuid", "message": "..." }` → **Response** `text/event-stream`

Sequence:

1. Embeds the question with `embedQuery`.
2. Calls `match_document_chunks` for the top 6 passages (`TOP_K`).
3. Emits a named SSE frame first:
   ```
   event: citations
   data: {"citations":[{"n":1,"order_index":4,"similarity":0.83,"text":"..."}]}
   ```
4. Streams the answer as OpenAI-shaped chunks. The model is prompted to cite as `[1]`, `[2]`, which `ChatPanel` renders as clickable chips.
5. Persists both the user turn and the assistant reply to `chat_messages`.

Model: Groq `llama-3.1-8b-instant`. History window: the last 10 messages.

---

## `generate_podcast`

Produces a two-host audio recap.

**Request** `{ "document_id": "uuid" }` → **Response** `{ "ok": true, "status": "ready" }`

1. Writes a dialogue script from the notes (Groq llama), parsed by `script.ts` into `host_1` / `host_2` segments.
2. Synthesizes each segment through **Microsoft Edge TTS** over a WebSocket (`tts.ts`) — voices `en-US-ChristopherNeural` and `en-US-AriaNeural`. This is a free service, not a Groq or Azure paid API, and it is the most failure-prone dependency in the system.
3. Concatenates the MP3 segments, uploads to the `podcasts` bucket, and updates the `podcasts` row.

The row's `status` moves `generating` → `ready` | `failed`; the workspace watches it over Realtime. Per-segment synthesis has a 30-second timeout (`EDGE_TTS_TIMEOUT`).

`index_test.ts` sits alongside for Deno-side testing and is not part of the Vitest suite.

---

## Local development

Edge functions are **not** covered by `npm run lint`, `npm run typecheck`, or `npm test` — they target Deno, and `eslint.config.js` ignores them deliberately. Use the Supabase CLI:

```bash
supabase functions serve chat --env-file supabase/functions/.env
```

`supabase/functions/.env` and `supabase/functions/*/.env` are gitignored. `verify_jwt` is left at its default (enabled), which is correct — every function expects a real user token.
