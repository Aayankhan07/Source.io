# Troubleshooting

Error `code` values are listed in full in [edge functions](./edge-functions.md#error-code-catalogue). Operational fixes (stuck jobs, outages, webhooks, key rotation) are in the [runbook](./runbook.md).

## Setup and auth

**Every request 401s, or the console shows the `[supabase]` credentials error.**
`.env.local` is missing or was not loaded. Copy `.env.example`, fill in `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`, and **restart the dev server**. The app falls back to placeholder credentials rather than crashing, so this looks like an auth bug rather than a config one.

**Redirected to `/auth` on every `/app` page, even after signing in.**
`proxy.ts` cannot see a session cookie. Check that `NEXT_PUBLIC_SUPABASE_*` match the project you signed in to, and that cookies are not blocked. Users from before the cookie client are migrated once on `/auth` (their old `localStorage` session is moved into cookies); if the old refresh token expired they must sign in again.

**Google sign-in or email confirmation link fails / lands on an error.**
`<origin>/auth/callback` is missing from Supabase → Authentication → URL Configuration → Redirect URLs for that origin (production, preview, `http://localhost:3000`).

**Stuck on the loading spinner forever.**
`AuthContext` never resolved `loading`. It registers `onAuthStateChange` *before* calling `getSession()`; reversing that order drops the initial event.

**Signed up but nothing works / every AI call returns 429 at zero usage.**
Check for a `profiles` row (`user_id` = the auth user id). It is created by the `handle_new_user` trigger; without it the quota RPC matches no row and returns `false`.

**Updating the profile fails with `42501` "billing and quota fields are read-only".**
Working as intended: `tier`, quota and limit columns are server-owned (`protect_profile_billing_columns`). Only send the columns you mean to change (`display_name`, `workspace_preferences`, …).

**Data reads as empty but the rows exist in the dashboard.**
Missing RLS policies, or a table with no client grants (`user_api_keys`, `billing_events` are deliberately invisible). A table with RLS on and no policies returns zero rows with no error.

## Plans and limits

| Message / code | Cause |
| :--- | :--- |
| `QUOTA_EXCEEDED` (429) | Daily AI actions used (25 free / 200 Scholar). Resets 00:00 UTC. BYOK skips it only for notes, flashcards/quiz and Whisper |
| `AUDIO_QUOTA_EXCEEDED` (429) | Daily audio renders used (2 free / 50 Scholar). The script can still be played with device voices |
| `QUOTA_UNAVAILABLE` (503) | The quota check itself failed; quotas fail closed. See the [runbook](./runbook.md#quota-rpc-failing-503-quota_unavailable) |
| `DOCUMENT_LIMIT_REACHED` / `LIMIT_EXCEEDED: …` | Saved-document limit (3 free / 100 Scholar). Delete a document |
| `DOCUMENT_TOO_LONG` (413, or SQLSTATE `22001` on insert) | Over the page cap: 3,000 characters = 1 page; 25 free, 50 Scholar, 300 with a saved API key |
| `UPLOAD_TOO_LARGE` / `FILE_TOO_LARGE` (413) | Plan upload size (50 / 100 MB), or Whisper's 25 MB limit for audio/video |

## Uploads and ingest

**PDF or DOCX produces "Could not extract readable text from this file."**
Extraction happens in the *browser* (`src/lib/services/extract.ts`). Scanned PDFs have no text layer and there is no OCR. The threshold is 20 characters.

**Insert fails with `42501` "document content and processing fields are read-only" / "document status is managed by the server".**
The browser tried to change `raw_text`, `content_hash`, `error_code`, `source_*` or a status transition other than `pending`/`processing` → `ready` (`protect_document_server_columns`). Text for YouTube/audio/video must come from `ingest`.

**YouTube import fails with `YOUTUBE_TRANSCRIPT_UNAVAILABLE`.**
Captions are fetched best-effort (beta). Expected for many videos: open the video, "…more" → "Show transcript", copy, and paste it as text.

**Upload succeeds, then a storage permission error.**
The object path must begin with `{user_id}/`, and the bucket's MIME limits apply (`uploads`: `audio/*`, `video/*`).

**`DUPLICATE_DOCUMENT` / `error_code = DUPLICATE_OF:<id>`.**
Working as intended: the same text already exists for this user. Delete the original to re-upload.

**Document stuck on `pending` or `processing`.**
`ingest` never finished. Check `jobs` (kind `ingest`) and the function logs; stale locks clear after 120 s. See the [runbook](./runbook.md#stuck-jobs-and-documents).

## Generation

**409 `ACTIVE_JOB_RUNNING`.**
The same job is already running for this document (another tab, or a double click). The client retries briefly; otherwise wait. A crashed job's lock is reaped after 120 s without a heartbeat.

**503 `JOB_LOCK_UNAVAILABLE`, `AI_PAUSED`, `UPLOADS_DISABLED`.**
Lock table error, or an operator switched a [circuit breaker](./runbook.md#circuit-breakers) off.

**Long document: notes stop with "Paused after n of m sections" (`NOTES_INCOMPLETE`).**
Normal for long documents: each run stops before the time budget (`NOTES_TIME_BUDGET_MS`, default 120 s) and the client calls again, resuming at the next section. If it keeps pausing without progress, check the logs for upstream errors on that section.

**`RATE_LIMITED` / `UPSTREAM_UNAVAILABLE` / `UPSTREAM_TIMEOUT`.**
Every provider attempt failed (Groq, then Gemini if configured, with one `retry-after` wait). The action is refunded. Setting `GEMINI_API_KEY` gives notes and flashcards a second provider.

**`BYOK_KEY_INVALID`.**
The provider rejected the user's saved key (revoked, no credit, wrong key). The request is *not* retried on the platform key. Update or delete the key in Settings.

**`BYOK_UNAVAILABLE` (503) for a user with saved keys.**
`BYOK_ENCRYPTION_KEY` is missing, invalid, or was changed (old ciphertext no longer decrypts). See [rotating the key](./runbook.md#rotating-byok_encryption_key).

**`AI_NOT_CONFIGURED`.**
No `GROQ_API_KEY` / `GEMINI_API_KEY` secret and no user key.

**Notes appear all at once at the end instead of streaming.**
Something between the browser and the function buffers `text/event-stream` (a CDN or proxy).

**Flashcards/quiz say "cached" and do not change.**
Existing results are returned at no cost unless the client sends `force_regenerate: true` (the regenerate button).

**`EMPTY_AI_OUTPUT` / `INVALID_AI_OUTPUT` / `PERSIST_FAILED`.**
The model returned nothing usable, or saving failed. Old flashcards/quiz are untouched (atomic replace) and the action is refunded; retry.

## Podcast

**Script fails.**
`generate_podcast` uses the platform Groq key only; check Groq status and the logs. Under 80 characters of source returns 400.

**Audio does not render or sounds robotic.**
Audio is made in the browser with Kokoro-82M. If the device cannot run it, the UI plays the script with the browser's `speechSynthesis` and nothing is saved; that is the intended fallback, not an error.

**`NO_SCRIPT` (409) from `podcast_audio`.**
Generate the script first; a new script also clears the previous audio.

**Audio plays once, then fails after an hour.**
Read URLs are signed for 1 hour; the client asks `podcast_audio` (`action: "url"`) for a fresh one.

**Podcast status does not update live.**
`podcasts` is not in the `supabase_realtime` publication by migration; add it in the dashboard (Database → Publications).

## Chat and retrieval

**409 `DOCUMENT_INDEXING`.**
Another request is building the index and nothing is searchable yet. Retry in a few seconds.

**Chat answers "could not find it in the passages" for everything.**
The document has no embeddings (for example after the gte-small migration nulled them) and inline indexing failed (`INDEX_FAILED` / `EMBED_FAILED`). Check `select count(*), count(embedding) from document_chunks where document_id = '<id>'` and the `chat` / `embed_chunks` logs.

**Citations render as plain `[1]` with no chip.**
The `event: citations` frame (sent before any tokens) was missed; check that `consumeSse` receives the event name. Saved answers carry `chat_messages.citations`.

## Build and tooling

**Type error in production that was not caught locally.**
Run `npm run typecheck` (`tsc -b --noEmit`) before pushing; CI runs it too.

**Deno type errors in `supabase/functions/`.**
ESLint and `tsc` skip that folder. Run `npx -y deno@2 check supabase/functions/*/index.ts`.

**Next.js dynamic server usage error (`useSearchParams`).**
Wrap components calling `useSearchParams()` in a `<Suspense>` boundary.

**`prose-*` classes have no effect.**
`@tailwindcss/typography` is not registered. Use `.prose-invert-tight` (in `app/globals.css`), which `MarkdownView` applies.

## Where to look next

| Symptom | Place to look |
| :--- | :--- |
| Anything server-side | Supabase → Edge Functions → Logs (JSON lines with `requestId`) |
| AI usage, failures, cost | `ai_usage_logs`, `provider_usage` |
| Job progress / locks | `jobs`, `note_sections` |
| Billing | `billing_events`, `subscriptions`, `profiles.tier` |
| Permissions | the table's RLS policies and the protection triggers |
| Streaming | browser devtools → Network → the SSE request |
| Frontend errors | Sentry (if `NEXT_PUBLIC_SENTRY_DSN` is set) |
| Auth | Application → Cookies → the `sb-*` auth cookies |
