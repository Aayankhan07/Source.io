# Development

## Prerequisites

- Node.js 24 (what CI uses)
- A Supabase project (the hosted one, or a local stack via the Supabase CLI)
- Optional: [Supabase CLI](https://supabase.com/docs/guides/cli) for edge functions and migrations
- Optional: Deno 2, for checking and testing edge functions (or run it on demand with `npx -y deno@2`, no install needed)

## Setup

```bash
npm install
cp .env.example .env.local    # then fill in your values
npm run dev
```

The dev server listens on **port 3000** by default.

## Environment variables

Only two public, browser-safe variables are required:

| Variable | Where to find it |
| :--- | :--- |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase dashboard → Project Settings → API → Project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | same page → the **anon** / publishable key |

Optional (see `.env.example`): `NEXT_PUBLIC_SITE_URL`, `NEXT_PUBLIC_CONTACT_EMAIL`, `NEXT_PUBLIC_SENTRY_DSN` (+ `SENTRY_AUTH_TOKEN`/`ORG`/`PROJECT` for source maps), `NEXT_PUBLIC_POSTHOG_KEY`/`HOST`, and `E2E_USER_EMAIL`/`E2E_USER_PASSWORD` for the authenticated Playwright journey. Sentry and PostHog are no-ops without their keys.

> **Never put a service-role key in a `NEXT_PUBLIC_`-prefixed variable.** Next.js inlines every `NEXT_PUBLIC_*` value into the JavaScript bundle shipped to browsers. Server-side secrets belong in Supabase project secrets — see [edge functions](./edge-functions.md#secrets).

To sign in locally, add `http://localhost:3000/auth/callback` to Supabase → Authentication → URL Configuration → Redirect URLs.

### Edge function secrets (local serving)

`supabase functions serve <name> --env-file supabase/functions/.env` reads `GROQ_API_KEY`, `ALLOWED_ORIGIN`, `LEMONSQUEEZY_WEBHOOK_SECRET` and the `SUPABASE_*` values from `supabase/functions/.env.example`. Also add `GEMINI_API_KEY` (optional), `BYOK_ENCRYPTION_KEY` (`openssl rand -base64 32`; required to save API keys) and optionally `NOTES_TIME_BUDGET_MS`, which the template does not list yet.

`src/integrations/supabase/client.ts` falls back to placeholder values so the module stays importable in CI, and logs a `console.error` when the real values are missing. If requests fail or 401 and that error appears in the console, your `.env.local` was not loaded — restart the dev server after editing environment variables.

## Scripts

| Command | Action |
| :--- | :--- |
| `npm run dev` | Next.js development server on :3000 |
| `npm run build` | Next.js production build (`.next/`) |
| `npm run start` | Start Next.js production server |
| `npm run typecheck` | `tsc -b --noEmit` across all project references |
| `npm run lint` | ESLint over the whole repo |
| `npm test` | Vitest unit tests (includes `supabase/functions/_shared/*.test.ts`) |
| `npm run test:e2e` | Playwright end-to-end tests |

### Edge function checks (Deno)

ESLint and `tsc` skip `supabase/functions/**`; those files are Deno code. Run the same checks CI runs, without installing Deno:

```bash
npx -y deno@2 check supabase/functions/*/index.ts
npx -y deno@2 test --allow-env --allow-net $(find supabase/functions -name '*_test.ts')
```

Deno tests are named `*_test.ts`. `*.test.ts` files under `_shared/` are Vitest suites and run with `npm test`.

### Database tests (pgTAP)

With the Supabase CLI and Docker running:

```bash
supabase db start     # local Postgres with all migrations applied
supabase test db      # runs supabase/tests/**/*.sql
```

### What CI checks

Every PR runs lint, typecheck, unit tests, a production build, the Deno checks and tests, the pgTAP tests, and Playwright e2e (see [deployment](./deployment.md#cicd-github-actions)). Lint must have **0 errors**; warnings are allowed. Run `npm run lint && npm run typecheck && npm test` before pushing to catch most failures locally.

### Run `npm run typecheck` before every commit

Always run `npm run typecheck` before committing. Next.js production builds validate code, but running typecheck directly provides rapid feedback across the entire workspace.

## Conventions

**Errors.** `catch (e: any)` is a lint error. Use:

```ts
import { errorMessage } from "@/lib/utils";

try { /* ... */ }
catch (e: unknown) {
  toast({ title: "Failed", description: errorMessage(e), variant: "destructive" });
}
```

**Calling edge functions.** Never hand-roll `fetch` with a token. Use the helpers:

```ts
import { callFunction, functionError } from "@/lib/services/functions";

const resp = await callFunction("my_function", { document_id: id });
if (!resp.ok) throw await functionError(resp, "My operation failed");
return await resp.json();
```

**Imports.** Use the `@/` alias for anything under `src/`.

**shadcn/ui.** Files in `src/components/ui/` are generated. Prefer adding a variant (as `button.tsx` does with `size: xs`) over editing the component's structure, so a future regeneration is a smaller merge.

**Styling.** Reach for the semantic CSS variables in `app/globals.css` rather than raw hex. Note that the `@tailwindcss/typography` plugin is installed but **not enabled** — `prose-*` classes do nothing. Markdown is styled by `.prose-invert-tight`, which `MarkdownView` applies for you.

**Database changes.** Never edit an applied migration. Add a new timestamped file, and give every new table its own RLS policies — RLS is on by default and a table without policies is invisible to clients.

## Adding a feature

A new document-derived asset (say, a mind map) touches these places, in order:

1. **Migration** — new table + RLS policies (with `WITH CHECK` on update) + index on `document_id` and `user_id`, plus a pgTAP test in `supabase/tests/database/`.
2. **Types** — regenerate `src/integrations/supabase/types.ts` (`supabase gen types typescript`).
3. **Edge function** — new directory under `supabase/functions/`, using `authenticateRequest`, `corsHeadersFor`, `createLogger`, the quota helpers (charge after the ownership check, refund on upstream failure) and `fetchWithTimeout`. Add a `[functions.<name>]` entry to `supabase/config.toml` if it checks the JWT in code.
4. **Client service** — a function in `src/lib/services/` built on `callFunction`; map new error `code`s in `functionError`.
5. **Data** — a TanStack Query hook with a key from `src/lib/queryKeys.ts`.
6. **UI** — a component under `src/features/<feature>/` and a tab in the document workspace (`src/features/documents/workspace/`, currently being refactored).

## Known rough edges

- TypeScript runs with `strict: false` / `strictNullChecks: false`; turning strict mode on is still open (roadmap 1.12).
- Kokoro (`kokoro-js`) loads its model in the browser (in a Web Worker) when audio is rendered; devices that cannot run it fall back to `speechSynthesis` playback without saving a file.
- `src/integrations/supabase/client.ts` is marked generated but has been hand-edited to add the credential warning and the `SUPABASE_URL` export that `functions.ts` depends on. Regenerating it will drop both.
- 8 `react-refresh/only-export-components` lint warnings remain, all in stock shadcn files. They affect HMR granularity only.

## Running evals

Evals live in `evals/` (details, thresholds and baseline numbers in `evals/README.md`).

- Retrieval (Recall@K, roadmap 2.6): `npx -y deno@2 run -A evals/retrieval/run.ts --embedder hash` runs offline. Score the production gte-small model with `--embedder edge` (needs `supabase functions serve` and the temporary `eval-embed` runner, see the README). Exits 1 when Recall@6 < `MIN_RECALL6` (default 0.8). Run it before merging any change to chunking, embeddings, `match_document_chunks` or chat `TOP_K`.
- Notes and flashcards (LLM judge): `GROQ_API_KEY=... npx -y deno@2 run -A evals/generation/run.ts` (or `GEMINI_API_KEY`). Without a key it skips. Exits 1 below the `MIN_*` score thresholds.
- Type-check: `npx -y deno@2 check "evals/**/*.ts"`.
