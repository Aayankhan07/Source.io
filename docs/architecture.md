# Architecture

## The shape of the system

Source.io is a Next.js 16 App Router app on Vercel, backed by Supabase. There is no bespoke backend server: every server-side operation is either a direct PostgREST query guarded by Row Level Security, or a Deno edge function.

```
Browser (React 18, Next.js 16 App Router)
  │   Kokoro-82M TTS (kokoro-js, Web Worker) ── renders podcast audio on the device
  │
  ├── Vercel ── proxy.ts (auth gate, session cookie refresh via @supabase/ssr)
  │             Server Components / route handlers (app/**), Sentry, Vercel Analytics
  │
  ├── supabase-js ──────────► PostgREST  ──► Postgres + pgvector (RLS enforced per user)
  │                           Realtime   ──► postgres_changes (documents, podcasts)
  │                           Storage    ──► uploads / podcasts / avatars (private)
  │                           Auth       ──► email + password / Google, session in cookies
  │
  └── fetch + Bearer JWT ───► Edge Functions (Deno, 10 functions + _shared)
                                 ├─► Groq     chat, notes/derivatives (short docs), podcast script, Whisper
                                 ├─► Gemini   notes/derivatives for long docs (> 20k chars), fallback on 429
                                 ├─► OpenAI   only with a user's own key (BYOK)
                                 └─► Supabase.ai gte-small  embeddings, in-runtime (no external call)
Lemon Squeezy ── HMAC-signed webhook ──► billing-webhook
PostHog (optional) ◄── browser funnel events
```

Two consequences worth internalizing:

1. **The browser holds the only session.** Edge functions never mint tokens; they verify the caller's JWT (`_shared/auth.ts`, `auth.getClaims`) and then use the service-role client for privileged writes, after re-checking document ownership.
2. **RLS plus triggers are the authorization layer.** Policies stop one user reading another's rows; the triggers `protect_profile_billing_columns` and `protect_document_server_columns` stop users writing server-owned columns (plan, quotas, document text and status). Any new table needs policies before it is usable. See [data model](./data-model.md).

## Document lifecycle

```
 paste text / drop PDF·DOCX            YouTube link / audio·video file
   text extracted IN THE BROWSER         file → Storage uploads/{user_id}/...
   documents INSERT status='ready'       documents INSERT status='pending'
   (DB trigger enforces page cap)               │
        │                                       ▼
        │                               ingest: captions (beta) or Groq Whisper
        │                               page cap, duplicate check → status='ready'
        ▼                                       │
 embed_chunks (client, batches of 50) ◄─────────┘   (chat also re-indexes missing chunks inline)
   1400-char chunks, gte-small 384-d → document_chunks.embedding halfvec(384)
        │
 generate_notes (SSE) ── split into ~15k-char sections (~5 pages)
   one call per section (Gemini for long sources, else Groq; 429 → other provider)
   each section saved to note_sections → overview + TOC → notes.markdown
        │
        ├──► generate_derivatives ─► flashcards + quiz (from section notes, a few per section)
        ├──► generate_podcast ─────► podcasts.script (Groq) ──► browser renders audio (Kokoro)
        │                                                      └► podcast_audio: signed upload, audio_path
        └──► chat (SSE) ───────────► top-6 passages via match_document_chunks, citations event,
                                     chat_messages (assistant row stores citations)
```

### Where each step lives

| Step | Client trigger | Edge function |
| :--- | :--- | :--- |
| Upload / create | `src/features/documents/components/UploadDialog.tsx` | none for text/PDF/DOCX |
| Ingest (YouTube, audio, video) | `triggerIngest` in `src/lib/services/pipeline.ts` | `ingest` |
| Indexing | `embedChunks` (batched) | `embed_chunks` |
| Notes | `streamNotes`, auto-fired by the workspace once status is `ready`; it re-calls on `incomplete` | `generate_notes` |
| Flashcards + quiz | `generateDerivatives` | `generate_derivatives` |
| Podcast script / audio | `src/lib/services/podcast.ts`, `src/features/podcast/*` | `generate_podcast`, `podcast_audio` |
| Grounded chat | `streamChat` | `chat` |
| BYOK keys | `src/lib/services/apiKeys.ts` | `api_keys` |
| Account deletion | Settings → Data & Storage | `delete_account` |
| Billing | Lemon Squeezy checkout (`src/features/settings/checkout.ts`) | `billing-webhook` |

PDF and DOCX are parsed in the browser (`src/lib/services/extract.ts`, `unpdf` / `mammoth`); the file itself is never uploaded. A PDF that produces no notes usually failed at extraction, not in an edge function.

### Long documents and page caps

Pages are measured by extracted characters: **3,000 characters = 1 page** (`CHARS_PER_PAGE`). The cap is enforced three times: by the `enforce_document_length_cap` trigger on browser inserts, by `ingest` for server-extracted text, and again by `generate_notes` / `generate_derivatives` (413 `DOCUMENT_TOO_LONG`).

`generate_notes` runs as a background job (`EdgeRuntime.waitUntil`), so closing the tab does not lose work. It stops starting new sections after `NOTES_TIME_BUDGET_MS` (default 120 s), emits `incomplete`, and the client calls again; finished sections are read back from `note_sections` instead of being regenerated.

## Plans, quotas and fail-closed rules

`src/lib/plans.ts` is the single source of truth; `supabase/functions/_shared/planLimits.ts` mirrors it on the server and `tests/unit/plans-consistency.test.ts` checks the static copies (`public/pricing.md`, `llms*.txt`).

| Limit | Free | Scholar Pass ($9/mo, tier `pro`) | Own API key (BYOK) |
| :--- | :--- | :--- | :--- |
| AI actions / day | 25 | 200 | no platform cap (only when the user's key is actually used) |
| Audio renders / day | 2 | 50 | 2 |
| Saved documents | 3 | 100 | plan's limit |
| Pages per document | 25 | 50 | 300 |
| Upload size | 50 MB | 100 MB | plan's limit |

- **Enforcement** is in Postgres: `consume_daily_quota` / `consume_daily_tts_quota` (atomic, lazy UTC-midnight reset, `service_role` only) read limits from server-owned `profiles` columns. The active-document limit is the `check_user_active_document_limit` trigger (reads `profiles.active_docs_limit`).
- **What costs an action:** one per chat message, notes generation (per completed document), flashcards+quiz generation, podcast script, and Whisper transcription. Embeddings and audio renders cost no actions (audio has its own counter).
- **Refunds:** if the upstream AI fails after charging, the function calls `refund_daily_quota` once.
- **Fail closed:** a quota RPC error returns 503 `QUOTA_UNAVAILABLE`, never a free pass; the job lock and BYOK key loading also fail closed. **Exception:** `checkCircuitBreaker` still fails *open* on a database error (by design for a cosmetic kill-switch; see the [runbook](./runbook.md#circuit-breakers)).

## BYOK key vault

- Keys are saved through the `api_keys` function: shape-checked (`gsk_`, `AIza`, `sk-`), validated with a free models-list call, then encrypted with **AES-256-GCM** using the edge secret `BYOK_ENCRYPTION_KEY`. The additional authenticated data is `userId:provider`, so a ciphertext copied to another row will not decrypt.
- `user_api_keys` has no client grants at all. The UI reads only provider + last 4 characters (`list` action or the `list_my_api_keys()` RPC).
- `generate_notes` / `generate_derivatives` use stored keys first (BYOK mode uses **only** the user's keys, never mixing in platform keys) and skip the quota; a key is only ever sent to its own provider. `ingest` uses a stored Groq key for Whisper. `chat` and `generate_podcast` always use the platform Groq key and always charge.
- Request headers are never trusted to mean BYOK. A legacy body `api_key` starting with `gsk_` still works for notes, derivatives and ingest.

## Billing ledger

Lemon Squeezy calls `billing-webhook` (HMAC `X-Signature`, refuses everything without `LEMONSQUEEZY_WEBHOOK_SECRET`). The `apply_billing_event` RPC, in one transaction, records the event in `billing_events` (idempotent: the event id is the SHA-256 of the signed body), upserts `subscriptions` (older deliveries are ignored by provider `updated_at`), and sets `profiles.tier` and limits from the subscription state: `active`/`on_trial`/`past_due` → pro; `cancelled` → pro until `ends_at`; everything else → free. `order_created` alone never grants pro.

## Frontend structure

Organized by feature, not file type.

```
app/                      Next.js routes (see Routing)
proxy.ts                  auth gate (Next 16's renamed middleware)
src/
├── components/  ui/ (shadcn, generated), common/, landing/, legal/
├── features/
│   ├── auth/         AuthContext, RequireAuth fallback, Auth page, safeNextPath
│   ├── dashboard/    library dashboard, command palette
│   ├── documents/    upload dialog and the per-document workspace (being split into documents/workspace/)
│   ├── learning/     Leitner scheduling, flashcard reviews, quiz attempts, chat history hooks
│   ├── podcast/      Kokoro worker, encoders (Ogg/WAV), device-voice fallback
│   ├── demo/         static public demo data and workspace
│   ├── seo/          use-case, alternatives, changelog content + JSON-LD helpers
│   ├── onboarding/, settings/
├── integrations/supabase/  browser, server and proxy clients + generated types
└── lib/          plans.ts, site.ts, queryKeys.ts, services/ (edge-function clients), analytics/, export/
```

### Routing

| Path | What | Guard |
| :--- | :--- | :--- |
| `/` | Landing page | public |
| `/pricing`, `/vs-notebooklm`, `/alternatives`, `/alternatives/[slug]`, `/use-cases`, `/use-cases/[slug]`, `/changelog` | Marketing and SEO pages | public |
| `/demo`, `/demo/[slug]` | Static sample workspaces, zero backend calls | public |
| `/privacy`, `/terms`, `/refunds` | Legal pages | public |
| `/auth`, `/auth/callback` | Sign in / sign up; PKCE code exchange | public (`/auth` redirects signed-in users) |
| `/app` | Dashboard | `proxy.ts` (+ `RequireAuth`) |
| `/app/onboarding`, `/app/settings` | Onboarding wizard, settings | `proxy.ts` (+ `RequireAuth`) |
| `/app/doc/[docId]` | The five-tab document workspace | `proxy.ts` (+ `RequireAuth`) |

`app/sitemap.ts` and `app/robots.ts` are generated from `NEXT_PUBLIC_SITE_URL`.

### Authentication

Supabase Auth via `@supabase/ssr`, with the session stored in cookies so the server can see it.

- **Browser client** — `src/integrations/supabase/client.ts` (`createBrowserClient`, PKCE flow). `supabase.auth.getSession()` still works, so `callFunction` keeps attaching the Bearer token unchanged.
- **Server client** — `createSupabaseServerClient()` in `src/integrations/supabase/server.ts` (`createServerClient` + `next/headers` `cookies()`), for Server Components, Server Functions and Route Handlers.
- **Primary gate: `proxy.ts`** (Next 16's renamed middleware, matcher `/app/:path*` and `/auth`). It calls `getClaims()` (validates the JWT, refreshes an expired session and rewrites the cookies), redirects signed-out `/app/**` requests to `/auth?next=<path>`, and sends signed-in visitors of `/auth` to `next` (default `/app`). If the auth server is unreachable it lets the request through rather than reporting a false sign-out. `next` is restricted to same-origin relative paths (`src/features/auth/lib/safeNextPath.ts`).
- **Callback** — `app/auth/callback/route.ts` exchanges the PKCE `?code` from Google OAuth and email-confirmation links for a session cookie. `<origin>/auth/callback` must be in Supabase Auth → URL Configuration → Redirect URLs.
- **Client fallback** — `RequireAuth` still wraps `/app` (spinner, "couldn't reach sign-in" state, onboarding redirect), but it is no longer the primary gate.
- **Legacy sessions** — before the cookie client, sessions lived in `localStorage` (`sb-<ref>-auth-token`). On load, `AuthContext` calls `migrateLegacyLocalStorageSession()`, which moves such a session into cookies via `setSession()` and deletes the old key. Because the proxy cannot see `localStorage`, such users are first redirected to `/auth`, where the migration signs them in and they are sent on to `next`. If the old refresh token is no longer valid, the auth page asks them to sign in once more.

### State management

- **`AuthContext`** (`src/features/auth/context/AuthContext.tsx`) — session and user; migrates legacy sessions and identifies the user (by id only) to analytics. It registers `onAuthStateChange` *before* calling `getSession()`; reversing that order drops the initial event and leaves the app stuck loading.
- **TanStack Query** — server data (documents, notes, flashcards, reviews, quiz attempts, chat history, saved API keys). Keys live in `src/lib/queryKeys.ts`. There is **no Zustand** store.
- **`SettingsContext`** (`src/features/settings/context`) — per-user preferences.
- **Component state** — anything ephemeral (input text, flip state, current card).

Learning progress is persisted: `flashcard_reviews` (Leitner 5 boxes, intervals 1/2/4/7/14 days computed client-side in `src/features/learning/leitner.ts`), `quiz_attempts`, and `chat_messages` (history with citations).

### Realtime

The workspace data hook (`src/features/documents/workspace/useWorkspaceData.ts`) subscribes per document to `documents` UPDATE (`id=eq.<docId>`) and `podcasts` `*` (`document_id=eq.<docId>`), so status changes arrive without polling. `documents` uses `REPLICA IDENTITY DEFAULT`, so `raw_text` is not resent as the old row on every status change. Note: the migrations add only `jobs`, `notes` and `documents` to the `supabase_realtime` publication; enable `podcasts` in the dashboard (Database → Publications) or its subscription receives nothing.

## Streaming (SSE)

`generate_notes` and `chat` stream Server-Sent Events. Token deltas use the OpenAI chunk shape (`data: {"choices":[{"delta":{"content":"..."}}]}`), followed by `data: [DONE]`. Named events:

| Event | Sent by | Payload |
| :--- | :--- | :--- |
| `citations` | `chat`, **before** any tokens | `{"citations":[{"n":1,"order_index":12,"similarity":0.83,"text":"..."}]}` |
| `progress` | `generate_notes`, once per section | `{"section":3,"total":8,"cached":false}` |
| `final` | `generate_notes` | `{"markdown":"...","sections":8}`: the saved notes; replaces the streamed draft |
| `incomplete` | `generate_notes` | `{"done":5,"total":8,"resumable":true,"error":"...","code":"NOTES_INCOMPLETE"}`: call again to resume |
| `error` | `generate_notes` | `{"error":"...","code":"...","retryable":bool,"done":n,"total":n}` |

`consumeSse` in `src/lib/services/pipeline.ts` is the one shared parser: it strips `\r\n`, keeps partial JSON in the buffer until more bytes arrive, and passes the event name to the handler. A CDN or proxy that buffers responses breaks streaming.

## Retrieval (RAG)

- `chunkText` (`_shared/chunking.ts`): ~1,400-character chunks with 200 characters of overlap.
- Embeddings: Supabase's built-in **gte-small** (`Supabase.ai.Session('gte-small')`, `_shared/embeddings.ts`), 384 dimensions, stored as `extensions.halfvec(384)`. No API key, and text never leaves Supabase.
- Rows are unique on `(document_id, order_index)`, so indexing is an idempotent, resumable upsert. `chat` embeds any missing chunks inline (60 s budget, under the `embed_chunks` job lock) before answering.
- `match_document_chunks(_document_id, _query_embedding, _match_count)` ranks one document's chunks exactly (a `MATERIALIZED` CTE keeps the planner off the global HNSW index, which would filter most hits away). `SECURITY INVOKER`, so RLS applies. Chat uses the top 6.

## Observability and analytics

- **Logs** — `_shared/log.ts` writes JSON lines `{ts, level, fn, requestId, userId, msg, …}`; the `requestId` is also stored in `ai_usage_logs.request_id`.
- **AI telemetry** — `ai_usage_logs` (every function, including `embed` and `tts` at 0 credits) and `provider_usage` (rate-limit header snapshots).
- **Sentry** — Next.js only (`instrumentation*.ts`, `sentry.*.config.ts`), disabled unless `NEXT_PUBLIC_SENTRY_DSN` is set. Edge functions do not report to Sentry.
- **PostHog** — `src/lib/analytics/track.ts`, a no-op unless `NEXT_PUBLIC_POSTHOG_KEY` is set. Events: `signup_completed`, `onboarding_completed`, `document_uploaded`, `notes_generated`, `flashcards_reviewed`, `quiz_completed`, `chat_question_asked`, `podcast_audio_created`, `upgrade_clicked`, `upgrade_completed`.
- **Vercel Analytics / Speed Insights** — mounted in the app.

## Shared conventions

- **Path alias** — `@/` maps to `src/`.
- **Edge function calls** — always through `callFunction` / `functionError` in `src/lib/services/functions.ts`. `functionError` maps known `code` values to friendly messages.
- **Error messages** — `errorMessage(e)` from `src/lib/utils.ts` in `catch` blocks. `catch (e: any)` is a lint error.
- **Styling** — Tailwind with semantic tokens in `app/globals.css`; fonts via `next/font` (Outfit, Geist). Markdown is styled by `.prose-invert-tight`.
