# Architecture

## The shape of the system

Source.io is a single-page React app talking to Supabase. There is no bespoke backend server — every server-side operation is either a direct PostgREST query (guarded by Row Level Security) or a Deno edge function.

```
Browser (React / Next.js 16 App Router)
  │
  ├── supabase-js ──────────► PostgREST  ──► Postgres (RLS enforced per user)
  │                           Realtime   ──► postgres_changes subscriptions
  │                           Storage    ──► uploads / podcasts / avatars buckets
  │                           Auth       ──► email + password, JWT in localStorage
  │
  └── fetch + Bearer JWT ───► Edge Functions (Deno)
                                 │
                                 ├─► Groq API  (llama models, Whisper transcription)
                                 └─► Microsoft Edge TTS (WebSocket speech synthesis)
```

Two consequences worth internalizing:

1. **The browser holds the only session.** Edge functions never mint tokens; they verify the caller's JWT and then use the service-role key for privileged writes. See `supabase/functions/ingest/index.ts:85` onward for the canonical pattern.
2. **RLS is the authorization layer.** There is no middleware to add a `WHERE user_id = ...` clause — the policies in the migrations are what stop one user reading another's documents. Any new table needs policies before it is usable.

## Document lifecycle

This is the spine of the product. Everything else hangs off it.

```
 upload / paste / YouTube link
        │
        ▼
 documents row inserted            status = 'pending'  (or 'ready' for pasted text)
        │
        ▼
 ingest ──────────────────────────► status = 'processing' → 'ready' | 'failed'
   PDF/DOCX text extracted in the browser before insert
   audio/video transcribed server-side via Groq Whisper
   YouTube transcript fetched server-side
        │
        ▼
 generate_notes  (SSE stream) ────► notes.markdown
        │
        ├──► generate_derivatives ─► flashcards + quizzes + quiz_questions
        ├──► generate_podcast ─────► podcasts.script + audio_url
        └──► embed_chunks ─────────► document_chunks (+ embeddings)
                     │
                     ▼
                   chat  (SSE stream) ──► chat_messages, cited from document_chunks
```

### Where each step lives

| Step | Client trigger | Edge function |
| :--- | :--- | :--- |
| Upload / create | `src/features/documents/components/UploadDialog.tsx` | — |
| Ingest | `triggerIngest` in `src/lib/services/pipeline.ts` | `ingest` |
| Notes | `streamNotes` — auto-fires once status is `ready` | `generate_notes` |
| Flashcards + quiz | `generateDerivatives` | `generate_derivatives` |
| Podcast | `generatePodcast` in `src/lib/services/podcast.ts` | `generate_podcast` |
| Vector indexing | `embedChunks` (batched 50 chunks/slice) | `embed_chunks` |
| Grounded chat | `streamChat` (SSE stream) | `chat` |
| Billing & Checkout | Lemon Squeezy webhook notification | `billing-webhook` |

### PDF and DOCX are extracted client-side

`src/lib/services/extract.ts` parses PDFs with `unpdf` and DOCX with `mammoth` **in the browser**, then inserts the plain text directly into `documents.raw_text`. The file itself is never uploaded. Only audio and video go to Storage, because they need Whisper.

This matters when debugging: a PDF that produces no notes usually failed at extraction in the browser, not in any edge function. `UploadDialog.tsx` rejects extractions shorter than 20 characters.

## Frontend structure

The app is organized by feature, not by file type.

```
src/
├── components/
│   ├── ui/        shadcn/ui primitives — generated, avoid hand-editing
│   └── common/    MarkdownView, NavLink
├── features/
│   ├── auth/      AuthContext, RequireAuth guard, Auth page
│   ├── chat/      ChatPanel (RAG chat with citation popovers)
│   ├── documents/ UploadDialog, AppSidebar, workspace pages, Zustand store
│   ├── flashcards/FlashcardsDeck
│   └── quiz/      QuizPlayer
├── integrations/supabase/  generated client + database types
├── lib/services/  pipeline.ts, podcast.ts, extract.ts, functions.ts
└── pages/         Index (landing), NotFound
```

### Routing

Defined in `src/App.tsx`:

| Path | Component | Guard |
| :--- | :--- | :--- |
| `/` | `Index` — landing page with an interactive simulated demo | public |
| `/auth` | `Auth` — sign in / sign up | public |
| `/app` | `AppHome` — sidebar shell with an `<Outlet />` | `RequireAuth` |
| `/app` (index) | `AppEmpty` | `RequireAuth` |
| `/app/doc/:docId` | `DocumentWorkspace` — the five-tab workspace | `RequireAuth` |
| `*` | `NotFound` | public |

`vercel.json` rewrites every path to `/index.html` so client-side routing survives a hard refresh.

### State management

Three layers, deliberately kept separate:

- **`AuthContext`** (`src/features/auth/context/AuthContext.tsx`) — session and user. It registers `onAuthStateChange` *before* calling `getSession()`; reversing that order drops the initial event and leaves the app stuck loading.
- **Zustand `useWorkspace`** (`src/features/documents/store/workspace.ts`) — the document list plus per-document caches of notes, flashcards, quiz, and podcast, all keyed by document id. Assets survive tab switches without refetching.
- **Component `useState`** — anything ephemeral (input text, flip state, which card is showing).

TanStack Query is installed and its provider is mounted, but the data flow above does not currently route through it.

### Realtime

`DocumentWorkspace` subscribes to a per-document channel for `documents` UPDATE and `podcasts` `*` events, so a status flipping from `processing` to `ready` on the server updates the UI without polling. `AppSidebar` subscribes to all of the user's documents. Both unsubscribe via `supabase.removeChannel` on unmount.

## Streaming

`generate_notes` and `chat` stream Server-Sent Events using the OpenAI chat-completion chunk shape. `src/lib/services/pipeline.ts` contains one shared parser, `consumeSse`, which handles the two things that break naive implementations:

- **`\r\n` line endings** — stripped per line.
- **JSON payloads split across reads** — a `JSON.parse` failure pushes the partial line back into the buffer and waits for more bytes rather than dropping the token.

`chat` additionally emits a named `event: citations` frame *before* the token stream, carrying the retrieved passages. `consumeSse` passes the event name to the handler so `streamChat` can route it to `onCitations`.

## Retrieval (RAG)

Retrieval runs on deterministic 768-dimensional embeddings stored as `extensions.halfvec(768)` in Supabase Postgres. `embed_chunks` and `chat` both compute a deterministic 768-dimension hashed vector locally — FNV-1a hashing over unigrams and bigrams, signed buckets, and L2 normalization:

- **Database Column:** `document_chunks.embedding extensions.halfvec(768)`.
- **Indexing:** HNSW index on `document_chunks` using cosine distance ops (`m = 16, ef_construction = 64`).
- **Batch Processing:** Document ingestion slices chunk embeddings into progressive batches of 50 to avoid edge memory saturation.
- **Byte-for-byte Parity:** `embedLocal` in `supabase/functions/embed_chunks/index.ts` and `embedQuery` in `supabase/functions/chat/index.ts` are identical in hash seed, tokenization, dimension (`768`), and normalization.

Similarity search runs through the `match_document_chunks` Postgres function using pgvector cosine distance, returning the top 6 chunks. The function is `SECURITY INVOKER`, so RLS still applies.

## Quotas and Monetization

- **Free Tier:** 25 daily actions, 2 studio audio TTS generations, 5-document limit.
- **Scholar Pass (Pro):** $9.99/mo or $79/yr (handled via Lemon Squeezy Merchant of Record), unlocking 200 daily actions, 50 audio renders, and unlimited documents.
- **Atomic Enforcement:** `consume_daily_quota` and `consume_daily_tts_quota` RPCs perform atomic test-and-increment operations with automatic UTC midnight rollovers directly inside PostgreSQL.

## Shared conventions

- **Path alias** — `@/` maps to `src/`, configured in `tsconfig.json`.
- **Edge function calls** — always go through `callFunction` / `functionError` in `src/lib/services/functions.ts`. It attaches the Bearer token and throws `"Not authenticated"` when no session exists.
- **Error messages** — use `errorMessage(e)` from `src/lib/utils.ts` in `catch` blocks. `catch (e: any)` is a lint error.
- **Styling** — Tailwind CSS with semantic tokens and charcoal/zinc variables defined in `app/globals.css`. Markdown is styled by tailored `.prose-invert-tight` and KaTeX mathematical typography rules.
