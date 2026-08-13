# Development

## Prerequisites

- Node.js 18 or newer
- A Supabase project (the hosted one, or a local stack via the Supabase CLI)
- Optional: [Supabase CLI](https://supabase.com/docs/guides/cli) for edge functions and migrations
- Optional: Deno, if you want to run edge functions outside the CLI

## Setup

```bash
npm install
cp .env.example .env    # then fill in your values
npm run dev
```

The dev server listens on **port 8080** (`vite.config.ts`), falling back to 8081 if that is taken.

## Environment variables

Only two, both public and browser-safe:

| Variable | Where to find it |
| :--- | :--- |
| `VITE_SUPABASE_URL` | Supabase dashboard → Project Settings → API → Project URL |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | same page → the **anon** / publishable key |

> **Never put a service-role key in a `VITE_`-prefixed variable.** Vite inlines every `VITE_*` value into the JavaScript bundle shipped to browsers. Server-side secrets belong in Supabase project secrets — see [edge functions](./edge-functions.md).

`src/integrations/supabase/client.ts` falls back to placeholder values so the module stays importable in CI, and logs a `console.error` when the real values are missing. If every request 401s and that error is in the console, your `.env` was not loaded — restart the dev server, since Vite only reads it at startup.

## Scripts

| Command | Action |
| :--- | :--- |
| `npm run dev` | Vite dev server with HMR on :8080 |
| `npm run build` | Production bundle to `dist/` |
| `npm run build:dev` | Development-mode bundle (unminified, useful for debugging deploys) |
| `npm run preview` | Serve the built `dist/` locally |
| `npm run typecheck` | `tsc -b --noEmit` across all project references |
| `npm run lint` | ESLint over the whole repo |
| `npm test` | Vitest, single run |
| `npm run test:watch` | Vitest in watch mode |

### Run `npm run typecheck` before every commit

`npm run build` uses the SWC plugin, which **strips types without checking them**. A type error will build and deploy perfectly happily and then crash in the browser. This exact failure mode shipped a `ReferenceError` to production once already. The build is not a type gate; `typecheck` is.

## Testing

Vitest with jsdom, configured in `vitest.config.ts`. Tests live in `src/**/*.{test,spec}.{ts,tsx}`; `src/test/setup.ts` pulls in `@testing-library/jest-dom` and stubs `matchMedia`.

`src/test/supabase-connection.test.ts` is an integration test that queries the live project. It self-skips when `VITE_SUPABASE_URL` / `VITE_SUPABASE_PUBLISHABLE_KEY` are absent, so `npm test` passes on a fresh clone with no `.env`. A skipped result there is expected, not a failure.

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

**Styling.** Reach for the semantic CSS variables in `src/index.css` rather than raw hex. Note that the `@tailwindcss/typography` plugin is installed but **not enabled** — `prose-*` classes do nothing. Markdown is styled by `.prose-invert-tight`, which `MarkdownView` applies for you.

**Database changes.** Never edit an applied migration. Add a new timestamped file, and give every new table its own RLS policies — RLS is on by default and a table without policies is invisible to clients.

## Adding a feature

A new document-derived asset (say, a mind map) touches these places, in order:

1. **Migration** — new table + four RLS policies + index on `document_id`.
2. **Types** — regenerate `src/integrations/supabase/types.ts` (`supabase gen types typescript`).
3. **Edge function** — new directory under `supabase/functions/`, copying the auth-then-service-role preamble from an existing one.
4. **Client service** — a function in `src/lib/services/` built on `callFunction`.
5. **Store** — a per-document cache slice in `src/features/documents/store/workspace.ts`.
6. **UI** — a component under `src/features/<feature>/` and a tab in `DocumentWorkspace.tsx`.

## Known rough edges

- The production bundle is large (~1.6 MB, plus ~1.7 MB for pdf.js). Code-splitting the PDF extractor behind a dynamic import is the obvious first win.
- TanStack Query is mounted but unused; data flows through Zustand plus direct supabase-js calls.
- `src/integrations/supabase/client.ts` is marked generated but has been hand-edited to add the credential warning and the `SUPABASE_URL` export that `functions.ts` depends on. Regenerating it will drop both.
- 8 `react-refresh/only-export-components` lint warnings remain, all in stock shadcn files. They affect HMR granularity only.
