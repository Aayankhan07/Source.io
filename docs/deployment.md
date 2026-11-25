# Deployment

Three things ship independently: the Next.js frontend (Vercel), the database migrations, and the edge functions (Supabase). They are not deployed together, so a schema change and the code that depends on it need ordering care.

## Frontend

The repository deploys cleanly to Vercel or any Node.js hosting platform with native Next.js support. Server and client routes are handled through the Next.js App Router.

**Build settings**

| Setting | Value |
| :--- | :--- |
| Framework Preset | Next.js |
| Build command | `npm run build` |
| Output directory | `.next` (managed automatically by Vercel) |
| Install command | `npm ci` |

**Environment variables** (Vercel → Project → Settings → Environment Variables; set per environment). `NEXT_PUBLIC_*` values are inlined into the browser bundle at build time, so redeploy after changing them.

| Variable | Required | Purpose |
| :--- | :--- | :--- |
| `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` | yes | Supabase project URL and anon/publishable key |
| `NEXT_PUBLIC_SITE_URL` | yes in prod | Canonical origin for metadata, `sitemap.ts`, `robots.ts` (default `https://sourceio.app`) |
| `NEXT_PUBLIC_CONTACT_EMAIL` | recommended | Contact address on legal pages (default `support@sourceio.app`, `src/lib/site.ts`) |
| `NEXT_PUBLIC_SENTRY_DSN` | optional | Enables Sentry; without it Sentry is off |
| `SENTRY_AUTH_TOKEN`, `SENTRY_ORG`, `SENTRY_PROJECT` | optional | Build-time source-map upload (only when the token is set) |
| `NEXT_PUBLIC_POSTHOG_KEY`, `NEXT_PUBLIC_POSTHOG_HOST` | optional | Product analytics; a no-op without the key |

**Supabase Auth URLs.** In Supabase → Authentication → URL Configuration, set the Site URL to the production origin and add `<origin>/auth/callback` to Redirect URLs for every origin that signs users in (production, preview domains, `http://localhost:3000`). Google OAuth and email-confirmation links fail without it.

## Migrations

```bash
supabase link --project-ref <your-project-ref>
supabase db push
```

Rules:

- **Never edit a migration that has been applied.** Add a new timestamped file instead. Editing in place desynchronizes environments in ways that are painful to unwind.
- **Every new table needs RLS policies in the same migration.** RLS is enabled by default; a table with no policies returns empty results to every client, which reads as data loss rather than a permissions error.
- Apply migrations **before** deploying code that depends on them.

**Order.** `supabase db push` applies files in filename order. The Phase 0–2 files must go in this order (each depends on the previous):

1. `20261126090000_phase0_security_fixes`
2. `20261126100000_phase1_reliability` (**deletes** duplicate notes/podcasts/quizzes before adding `UNIQUE(document_id)`)
3. `20261126110000_phase2_retrieval_limits_billing` (**nulls every embedding**; chat re-embeds lazily)
4. `20261126120000_phase2_long_docs_byok`
5. `20261126130000_phase2_podcast_audio`
6. `20261126140000_phase2_learning_progress`
7. `20261126150000_phase2_document_length_cap` (needs `user_api_keys` from step 4)

Take a backup (or confirm point-in-time recovery) before pushing to production. If the schema was ever changed by hand in the dashboard, run `supabase db diff` against production first.

## Edge functions

```bash
supabase functions deploy chat
supabase functions deploy   # all of them (verify_jwt comes from supabase/config.toml)
```

There are 10 functions (`api_keys`, `billing-webhook`, `chat`, `delete_account`, `embed_chunks`, `generate_derivatives`, `generate_notes`, `generate_podcast`, `ingest`, `podcast_audio`) plus `_shared/`. `supabase functions deploy` with no name deploys all of them.

Set secrets once per project:

```bash
supabase secrets set GROQ_API_KEY=...
supabase secrets set GEMINI_API_KEY=...                   # long documents + 429 fallback
supabase secrets set BYOK_ENCRYPTION_KEY=<output of: openssl rand -base64 32>
supabase secrets set ALLOWED_ORIGIN=https://sourceio.app  # comma-separated allow-list
supabase secrets set LEMONSQUEEZY_WEBHOOK_SECRET=...
supabase secrets set NOTES_TIME_BUDGET_MS=120000          # optional; keep under the platform wall-clock limit
```

`SUPABASE_URL`, `SUPABASE_ANON_KEY`, and `SUPABASE_SERVICE_ROLE_KEY` are injected by the platform — do not set them yourself. Keep a safe copy of `BYOK_ENCRYPTION_KEY`: losing or changing it makes every saved user key undecryptable ([runbook](./runbook.md#rotating-byok_encryption_key)).

`supabase/config.toml` sets `verify_jwt = false` on purpose for every function except `ingest` and `embed_chunks` (which also keep the gateway check). The user-facing functions verify the caller's JWT in code through `authenticateRequest` (`supabase/functions/_shared/auth.ts`, or the equivalent inline check in `generate_podcast`) and then re-check document ownership. `billing-webhook` is called by Lemon Squeezy, not by a user, so it is authenticated by its HMAC signature instead and refuses every event when `LEMONSQUEEZY_WEBHOOK_SECRET` is unset.

### Ordering for a change that spans layers

1. Migration first.
2. Edge function second.
3. Frontend last.

Deploying the frontend first means users hit a function or column that does not exist yet.

## CI/CD (GitHub Actions)

### CI gates — `.github/workflows/ci.yml`

Runs on every pull request and every push to `main`. A newer push to the same PR cancels the older run.

| Job | What it runs |
| :--- | :--- |
| `web` | `npm ci`, `npm run lint`, `npm run typecheck`, `npm test`, `npm run build` (Node 24, placeholder `NEXT_PUBLIC_SUPABASE_*` values) |
| `deno` | `deno check` on every `supabase/functions/*/index.ts`, then `deno test --allow-env --allow-net` on every `*_test.ts` file |
| `database` | `supabase db start` (applies all migrations to a local Postgres), then `supabase test db` for the pgTAP tests in `supabase/tests/`. Skips cleanly when that folder has no `.sql` files |
| `e2e` | `npm run build`, `npm run start`, then `npm run test:e2e` (Playwright, Chromium). Uploads the report on failure |

Note: `supabase/functions/_shared/*.test.ts` are **Vitest** suites run by `npm test`; only `*_test.ts` files are Deno tests.

### Edge function + migration deploys — `.github/workflows/supabase-deploy.yml`

```
push to main touching supabase/**  ->  staging (automatic)
Actions -> "Supabase deploy" -> Run workflow -> target=production  ->  waits for approval  ->  production
```

Each run does, in order: `supabase link --project-ref $REF`, `supabase db push`, `supabase functions deploy`. Migrations go first so functions never run against a missing schema. Production runs only from `main` and only after a reviewer approves the `production` environment. Deploys to the same environment never run in parallel and are never cancelled mid-flight.

The frontend is still deployed by the hosting provider (Vercel) on push to `main`. Keep the cross-layer ordering above in mind: if a frontend change depends on a new migration or function, ship the Supabase deploy to production first.

### Required GitHub secrets

Settings -> Secrets and variables -> Actions -> New repository secret:

| Secret | Value |
| :--- | :--- |
| `SUPABASE_ACCESS_TOKEN` | Personal access token from supabase.com/dashboard/account/tokens |
| `SUPABASE_PROJECT_REF_STAGING` | Project ref of the staging project (the subdomain in its URL) |
| `SUPABASE_DB_PASSWORD_STAGING` | Database password of the staging project |
| `SUPABASE_PROJECT_REF_PRODUCTION` | Project ref of the production project |
| `SUPABASE_DB_PASSWORD_PRODUCTION` | Database password of the production project |

CI itself needs no secrets. The deploy workflow never echoes these values; it only checks that they are non-empty.

### One-time GitHub setup (repository owner)

1. **Create the environments.** Settings -> Environments -> New environment -> `staging` (no protection rules), then `production`. On `production`, enable **Required reviewers** and add yourself (and anyone else allowed to ship), and under **Deployment branches and tags** choose *Selected branches* -> add `main`. Optionally move the `*_PRODUCTION` secrets into the `production` environment's secrets so only approved runs can read them.
2. **Make CI a required check on `main`.** Settings -> Branches -> Add branch ruleset (or classic *Add rule*) for `main`:
   - Require a pull request before merging.
   - Require status checks to pass -> search and add `Lint, typecheck, unit tests, build`, `Edge functions (deno check + deno test)`, `Database (pgTAP)` and `Playwright e2e`. (Checks only appear in the search after CI has run at least once, so open a PR first.)
   - Require branches to be up to date before merging.
   - Block force pushes.
3. **Dependabot.** `.github/dependabot.yml` opens weekly npm and monthly GitHub Actions update PRs; make sure Settings -> Code security -> Dependabot version updates is enabled.

## Storage

The buckets (`uploads`, `podcasts`, `avatars`) are created by the migrations; `20261126110000` and `20261126130000` set their size and MIME limits and make `avatars` private. All three are private, with policies matching the first path segment against `auth.uid()` — which is why every upload path must start with `{user_id}/`.

**Realtime.** The migrations publish `jobs`, `notes` and `documents` only. The workspace also listens to `podcasts`; add it under Database → Publications → `supabase_realtime` if podcast status should update live.

## First-deploy checklist (Phase 0–2 changes)

1. **Staging first.** `supabase link` the staging project, `supabase db push`, and confirm all 17 migrations applied (`supabase migration list`). Run `supabase test db` locally against the same migrations.
2. **Set secrets** on staging (the list above).
3. **Deploy all 10 functions:** `supabase functions deploy --project-ref <staging-ref>`.
4. **Vercel:** set the environment variables above for Preview and Production; add `<origin>/auth/callback` to Supabase Redirect URLs.
5. **Lemon Squeezy:** point the staging webhook at `https://<ref>.supabase.co/functions/v1/billing-webhook` with the same signing secret.
6. **Smoke tests** (fresh free user on staging):
   - *Self-upgrade blocked:* in the browser console, `supabase.from("profiles").update({ tier: "pro" }).eq("user_id", "<uid>")` returns error `42501`.
   - *Forged webhook rejected:* `curl -X POST https://<ref>.supabase.co/functions/v1/billing-webhook -H "X-Signature: deadbeef" -d '{}'` returns 401 `INVALID_SIGNATURE`.
   - *Header BYOK bypass charges quota:* call `chat` with an extra `x-byok-groq: anything` header; `profiles.daily_quota_used` still goes up by 1.
   - *Free user chat works:* paste text, open Chat, ask a question; the reply has citation chips and `chat_messages` has an assistant row with `citations`.
   - *Long document notes:* paste about 60k characters (~20 pages); notes show section progress, `note_sections` fills, and `notes.markdown` starts with an overview and table of contents. Above 25 pages on a free account the insert is refused with `DOCUMENT_TOO_LONG`.
   - *Audio render:* generate a podcast script, render audio in the browser, reload; it plays from a signed URL, `podcasts.audio_path` is set and `daily_tts_quota_used` went up by 1.
   - *BYOK:* save a Groq key in Settings (only the last 4 characters show), regenerate notes; `daily_quota_used` does not change.
   - *Webhook happy path:* buy a test subscription; `billing_events` gets a row with outcome `applied` and `profiles.tier` becomes `pro`.
7. **Production:** run the "Supabase deploy" workflow with `target=production` (or the same CLI steps), set production secrets, then deploy the frontend. Repeat the smoke tests.

## Post-deploy checks (any release)

1. Sign up with a fresh email; confirm a `profiles` row appears with free limits.
2. Paste text to create a document — exercises the direct-insert path and the length-cap trigger.
3. Confirm notes stream in — exercises `generate_notes` and SSE through your CDN. **A CDN or proxy that buffers responses will break streaming**; notes appear all at once at the end, or not at all.
4. Upload a small audio file — exercises Storage plus `ingest` plus Whisper.
5. Open the chat tab — exercises `embed_chunks` then `chat`.
6. Generate a podcast and render audio — exercises `generate_podcast`, Kokoro in the browser, and `podcast_audio`.

## Rollback

- **Frontend** — redeploy the previous build from the host's dashboard.
- **Edge functions** — redeploy from an earlier commit; there is no built-in version history. Functions and migrations are coupled (for example, `chat` needs the `halfvec(384)` `match_document_chunks`), so roll them back together.
- **Migrations** — no automatic down-migrations. Write a corrective forward migration, and take a backup before anything destructive. See the [runbook](./runbook.md#rolling-back-a-migration).
