# Source.io Documentation

Reference documentation for the Source.io codebase. Start with the root [`README.md`](../README.md) for a project overview and quick start; these pages go deeper.

| Page | What it covers |
| :--- | :--- |
| [Architecture](./architecture.md) | How the pieces fit together, the end-to-end document lifecycle, state management, streaming |
| [Data model](./data-model.md) | Every table, enum, index, RLS policy, and storage bucket |
| [Edge functions](./edge-functions.md) | Request/response contract for all six functions, models used, error codes |
| [Development](./development.md) | Environment setup, scripts, conventions, testing, common tasks |
| [Deployment](./deployment.md) | Deploying the frontend, functions, migrations, and secrets |
| [Troubleshooting](./troubleshooting.md) | Symptom-to-cause table for the failures you are most likely to hit |

## Conventions used in these docs

- Code references are written as `path/to/file.ts:42` so they can be opened directly.
- "Edge function" always means a Deno function under `supabase/functions/`, deployed to Supabase.
- Anything described as a *secret* is server-side only and must never appear in a `VITE_`-prefixed variable — Vite inlines those into the browser bundle.
