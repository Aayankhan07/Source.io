# Troubleshooting

## Setup and auth

**Every request 401s, or the console shows the `[supabase]` credentials error.**
`.env` is missing or was not loaded. Copy `.env.example`, fill it in, and **restart the dev server** — Vite reads env files only at startup. The app falls back to placeholder credentials rather than crashing, so this looks like an auth bug rather than a config one.

**Stuck on the loading spinner forever.**
`AuthContext` never resolved `loading`. It registers `onAuthStateChange` *before* calling `getSession()`; reversing that order drops the initial event. Check `src/features/auth/context/AuthContext.tsx:24-39`.

**Signed up but nothing works.**
Check for a `profiles` row. It is created by the `handle_new_user` trigger on `auth.users`; if migrations were only partially applied, the trigger may be missing.

**Data reads as empty but the rows exist in the dashboard.**
Missing RLS policies. A table with RLS enabled and no policies returns zero rows to every client with no error. This is the single most common "the data vanished" cause.

## Uploads and ingest

**PDF or DOCX produces "Could not extract readable text from this file."**
Extraction happens in the *browser*, before anything is uploaded (`src/lib/services/extract.ts`). Scanned PDFs are images with no text layer — there is no OCR in the pipeline. The threshold is 20 characters.

**Audio or video upload fails.**
Two separate limits: the browser rejects files over 50 MB (`MAX_FILE_BYTES`), and `ingest` rejects over 25 MB (`MAX_BYTES`, the Groq Whisper free-tier ceiling). A 40 MB file passes the first and fails the second.

**Upload succeeds, then a storage permission error.**
The object path must begin with `{user_id}/` — the storage policies compare the first path segment to `auth.uid()`.

**"duplicate" error code on the document.**
Working as intended. A partial unique index on `(user_id, content_hash)` blocks re-ingesting identical content. Delete the original document to re-upload it.

**Document stuck on `pending` or `processing`.**
The `ingest` function never finished. Check the `jobs` table for the row's `status`, `progress`, and `error`, then the function logs in the Supabase dashboard.

## Generation

**429s constantly.**
Groq's free tier rate-limits aggressively. `streamNotes` already retries 3 times with 2s/4s/8s backoff. Other functions surface the 429 directly. Wait, or move to a paid tier.

**Notes appear all at once at the end instead of streaming.**
Something between the browser and the function is buffering the `text/event-stream` response — usually a CDN or reverse proxy. Streaming works fine against Supabase directly; this shows up only after deploying behind a proxy.

**Notes stream then vanish on refresh.**
The function persists the markdown itself when the stream completes; the client re-reads it afterward. If the stream was cut short, nothing was saved. Look for an aborted request.

**Truncated notes on a long document.**
Input is capped at 35,000 characters in both `generate_notes` and `generate_derivatives`.

**Podcast generation fails.**
The most fragile path in the system. Speech synthesis uses Microsoft Edge TTS over a WebSocket (`supabase/functions/generate_podcast/tts.ts`) — a free, unofficial service that breaks when Microsoft changes its token scheme. Per-segment timeout is 30 seconds. The `podcasts` row's `status` becomes `failed`; the workspace shows a retry card.

**Podcast audio never appears even though status is `ready`.**
The `podcasts` bucket is private. Check that the URL being rendered is a valid signed or path-scoped URL.

## Chat and retrieval

**Chat answers are nonsense or cite irrelevant passages.**
Almost always an embedding mismatch. `embedLocal` in `embed_chunks/index.ts` and `embedQuery` in `chat/index.ts:28` must produce byte-identical vectors for the same text. If either was changed independently — tokenization, dimensions, hash — retrieval degrades to noise. Fix both, then re-index every document.

Also remember the embedding is lexical, not semantic: a question sharing no vocabulary with the source will retrieve poorly by design.

**Chat says the document is not indexed.**
`document_chunks` is empty. `ChatPanel` auto-triggers `embedChunks` once notes exist; the manual "Index passages" button re-runs it.

**Citations render as plain `[1]` with no chip.**
The `event: citations` SSE frame was missed. It is emitted once, before the token stream — check that `consumeSse` is receiving the event name.

## Build and tooling

**Type error in production that `npm run build` never caught.**
Expected. `vite build` uses SWC, which strips types without checking. Run `npm run typecheck` — that is the actual gate. Add it to CI.

**`npm test` fails on a fresh clone.**
It should not any more. `supabase-connection.test.ts` self-skips without credentials. A *skipped* result there is normal.

**ESLint reports errors in `supabase/functions/`.**
It should not — they are in the ignore list, since they are Deno code with different globals. If you see them, `eslint.config.js` lost its `supabase/functions/**` entry.

**`prose-*` classes have no effect.**
`@tailwindcss/typography` is installed but not registered in `tailwind.config.ts`. Use `.prose-invert-tight` (defined in `src/index.css`), which `MarkdownView` already applies.

**Realtime updates not arriving.**
Confirm Realtime is enabled for the table in the Supabase dashboard, and that the channel filter matches (`id=eq.{docId}` for documents, `document_id=eq.{docId}` for podcasts).

## Where to look next

| Symptom | Place to look |
| :--- | :--- |
| Anything server-side | Supabase dashboard → Edge Functions → Logs |
| Ingest progress | the `jobs` table |
| Permissions | the table's RLS policies |
| Streaming | browser devtools → Network → the SSE request, response tab |
| Auth | Application → Local Storage → the `sb-*` session key |
