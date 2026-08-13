# Deployment

Three things ship independently: the static frontend, the database migrations, and the edge functions. They are not deployed together, so a schema change and the code that depends on it need ordering care.

## Frontend

The repo carries a `vercel.json` with a catch-all rewrite to `/index.html`, which is what keeps client-side routes working on a hard refresh. Any static host works with the equivalent SPA fallback.

**Build settings**

| Setting | Value |
| :--- | :--- |
| Build command | `npm run build` |
| Output directory | `dist` |
| Install command | `npm ci` |

**Environment variables** — set `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY` in the host's dashboard. They are read at *build* time and inlined into the bundle, so changing them requires a rebuild, not just a restart.

Consider adding `npm run typecheck && npm run lint` to the build command. `vite build` does not typecheck, so without it a type error deploys silently.

## Migrations

```bash
supabase link --project-ref <your-project-ref>
supabase db push
```

Rules:

- **Never edit a migration that has been applied.** Add a new timestamped file instead. Editing in place desynchronizes environments in ways that are painful to unwind.
- **Every new table needs RLS policies in the same migration.** RLS is enabled by default; a table with no policies returns empty results to every client, which reads as data loss rather than a permissions error.
- Apply migrations **before** deploying code that depends on them.

## Edge functions

```bash
supabase functions deploy chat
supabase functions deploy --no-verify-jwt=false   # all of them
```

Set secrets once per project:

```bash
supabase secrets set GROQ_API_KEY=...
supabase secrets set ALLOWED_ORIGIN=https://your-site.example
```

`SUPABASE_URL`, `SUPABASE_ANON_KEY`, and `SUPABASE_SERVICE_ROLE_KEY` are injected by the platform — do not set them yourself.

Leave `verify_jwt` at its default (enabled). Every function expects a real user token and re-checks document ownership on top of that.

### Ordering for a change that spans layers

1. Migration first.
2. Edge function second.
3. Frontend last.

Deploying the frontend first means users hit a function or column that does not exist yet.

## Storage

The buckets (`uploads`, `podcasts`, `avatars`) are created by the migrations, so a freshly pushed database has them. All three are private, with policies matching the first path segment against `auth.uid()` — which is why every upload path must start with `{user_id}/`.

## Post-deploy checks

1. Sign up with a fresh email; confirm a `profiles` row appears.
2. Paste text to create a document — exercises the direct-insert path with no edge function.
3. Confirm notes stream in — exercises `generate_notes` and SSE through your CDN. **A CDN or proxy that buffers responses will break streaming**; notes appear all at once at the end, or not at all.
4. Upload a small audio file — exercises Storage plus `ingest` plus Whisper.
5. Open the chat tab — exercises `embed_chunks` then `chat`.
6. Generate a podcast — exercises Edge TTS, the flakiest dependency.

## Rollback

- **Frontend** — redeploy the previous build from the host's dashboard.
- **Edge functions** — redeploy from an earlier commit; there is no built-in version history.
- **Migrations** — no automatic down-migrations. Write a corrective forward migration. Take a database backup before anything destructive.
