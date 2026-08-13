# Data model

Everything lives in the `public` schema of the Supabase Postgres database, defined by the migrations in `supabase/migrations/`. TypeScript types generated from this schema are in `src/integrations/supabase/types.ts`.

## Enums

| Type | Values |
| :--- | :--- |
| `app_role` | `admin`, `user` |
| `document_source` | `pdf`, `docx`, `text`, `audio`, `video`, `youtube` |
| `document_status` | `pending`, `processing`, `ready`, `failed` |
| `question_type` | `mcq`, `short_answer`, `true_false` |
| `podcast_status` | `pending`, `generating`, `ready`, `failed` |
| `chat_role` | `user`, `assistant`, `system` |
| `job_kind`, `job_status` | Background job bookkeeping |

## Tables

### `documents`

The root entity. Everything else cascades from it.

| Column | Type | Notes |
| :--- | :--- | :--- |
| `id` | uuid PK | |
| `user_id` | uuid → `auth.users` | cascade delete |
| `title` | text | filename, YouTube URL, or user-supplied |
| `source_type` | `document_source` | |
| `source_url` | text | Storage path for audio/video, or the YouTube URL |
| `content_hash` | text | SHA-256 of the extracted text, used for de-duplication |
| `raw_text` | text | the extracted or transcribed source text |
| `status` | `document_status` | drives the whole UI |
| `error_code` | text | shown verbatim in the failure badge |
| `created_at`, `updated_at` | timestamptz | `updated_at` maintained by trigger |

Indexes: `user_id`, `content_hash`, `(user_id, created_at DESC)`, plus a **partial unique index on `(user_id, content_hash)` where `content_hash IS NOT NULL`** — the same content uploaded twice by one user is rejected at the database level.

### `notes`

One row per document. `markdown` is the streamed output of `generate_notes`.

### `flashcards`

`front`, `back`, `order_index`. Indexed on `document_id`.

### `quizzes` / `quiz_questions` / `quiz_attempts`

A quiz belongs to a document; questions belong to a quiz. `quiz_questions` carries `question`, `type`, `choices` (jsonb array, null for short answer), `correct`, `explanation`, `order_index`.

`quiz_attempts` stores `answers` as jsonb alongside `score` and `total`. Attempts are **insert and select only** — there is deliberately no update or delete policy, so a recorded attempt cannot be rewritten.

### `podcasts`

`script` (the two-host dialogue), `audio_url` (public URL of the stitched MP3), and `status`. Realtime-subscribed by the workspace so the UI updates when generation finishes.

### `chat_messages`

`role` (`chat_role`), `content`, `document_id`. Written server-side by the `chat` function for both the user turn and the assistant reply. Select, insert, and delete policies only — no update.

### `document_chunks`

| Column | Type | Notes |
| :--- | :--- | :--- |
| `chunk_text` | text | the passage |
| `embedding` | `vector(1536)` | pgvector; see the retrieval section in [architecture](./architecture.md) |
| `order_index` | int | position within the document, shown as the citation number |

Indexed with `ivfflat (embedding vector_cosine_ops) WITH (lists = 100)` for cosine similarity search.

### `profiles`

Created automatically for every new auth user by the `handle_new_user` trigger on `auth.users`. **Readable by everyone** (`USING (true)`) — the only intentionally public table, so do not put anything sensitive in it.

### `user_roles`

Roles are stored separately from profiles on purpose: a user must not be able to update their own role. Checked through the `has_role(_user_id, _role)` `SECURITY DEFINER` function; only admins can write.

### `jobs`

Progress bookkeeping for long-running ingests: `kind`, `status`, `progress` (0–100), `error`, `payload`. Written by edge functions using the service role.

## Database functions

| Function | Purpose |
| :--- | :--- |
| `match_document_chunks(_document_id, _query_embedding, _match_count)` | Cosine similarity search over `document_chunks`. `SECURITY INVOKER`, so RLS applies. Returns `id, chunk_text, order_index, similarity`. |
| `has_role(_user_id, _role)` | Role check. `SECURITY DEFINER` to avoid recursive RLS evaluation. |
| `handle_new_user()` | Trigger on `auth.users` insert — creates the matching `profiles` row. |
| `update_updated_at_column()` | Generic `updated_at` trigger, attached to profiles, documents, notes, podcasts. |

## Row Level Security

**RLS is enabled on every table.** The standard pattern is four policies per table, all keyed on `auth.uid() = user_id`:

```sql
CREATE POLICY "Users view own X"   ON public.X FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users insert own X" ON public.X FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own X" ON public.X FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users delete own X" ON public.X FOR DELETE USING (auth.uid() = user_id);
```

Deliberate exceptions:

- `profiles` — select is `USING (true)`, public by design.
- `quiz_attempts` and `chat_messages` — no update policy; history is append-only.
- `user_roles` — writes restricted to admins via `has_role`.

**Every new table needs its own policies.** With RLS enabled and no policies, the table is invisible to clients — which looks exactly like "the data disappeared."

## Storage buckets

| Bucket | Public | Contents | Path convention |
| :--- | :--- | :--- | :--- |
| `uploads` | no | audio/video awaiting transcription | `{user_id}/{uuid}-{filename}` |
| `podcasts` | no | generated MP3 recaps | `{user_id}/...` |
| `avatars` | no | profile images | `{user_id}/...` |

All three enforce ownership through storage policies that compare the first path segment to `auth.uid()`, which is why the `{user_id}/` prefix is mandatory — see `UploadDialog.tsx:146`. The `podcasts` bucket was made private in a later migration; audio URLs are served through signed or path-scoped access rather than being world-readable.

## Migrations

Applied in filename order:

| File | Contents |
| :--- | :--- |
| `20260419182600_…` | Core schema: extensions, all enums, all tables, RLS, triggers, buckets |
| `20260419182628_…` | Storage read policies for avatars and podcasts |
| `20260420174623_…` | De-duplication unique index, extra indexes, `match_document_chunks` |
| `20260601125221_…` | Security tightening: admin-only role writes, private podcasts bucket |

Never edit an applied migration — add a new one. See [deployment](./deployment.md).
