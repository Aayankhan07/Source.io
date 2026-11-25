# Source.io - AI-Powered Study Workspace

Source.io turns any source (PDF, DOCX, pasted text, audio/video, or a YouTube link) into study assets grounded in that source: section-by-section study notes, Leitner flashcards, a quiz, a two-host audio recap, and a chat that cites the passages it used.

---

## Tech stack

- **Frontend:** Next.js 16 (App Router), React 18, TypeScript, Tailwind CSS, shadcn/ui (Radix), TanStack Query, Lucide. Auth gate in `proxy.ts` with `@supabase/ssr` cookie sessions. No Zustand.
- **Backend:** Supabase: Postgres + pgvector (`halfvec(384)`), Auth, Storage, Realtime, and 10 Deno Edge Functions.
- **AI:**
  - Groq: chat and podcast scripts (`openai/gpt-oss-20b`), notes and flashcards for short documents (`gpt-oss-120b` → `gpt-oss-20b` → `llama-3.1-8b-instant`), Whisper `whisper-large-v3` transcription.
  - Gemini `gemini-2.5-flash-lite`: notes and flashcards for long documents (over 20k characters), and fallback when Groq rate-limits.
  - Embeddings: Supabase's built-in `gte-small` (384 dimensions), run inside the edge runtime.
  - Podcast audio: Kokoro-82M (`kokoro-js`) rendered **in the browser**, with a `speechSynthesis` fallback.
  - Users can bring their own Groq, Gemini or OpenAI key (stored encrypted server-side).
- **Billing:** Lemon Squeezy (webhook → `subscriptions` + `billing_events` ledger).
- **Ops:** GitHub Actions CI, Sentry (optional), PostHog (optional), Vercel Analytics.

Plan limits live in one place, [`src/lib/plans.ts`](./src/lib/plans.ts): Free has 25 AI actions/day, 3 documents and 25 pages per document; Scholar Pass ($9/mo) has 200 actions/day, 100 documents and 50 pages; with your own key you get 300 pages per document.

---

## Documentation

Detailed docs live in [`docs/`](./docs/README.md):

| Page | Covers |
| :--- | :--- |
| [Architecture](./docs/architecture.md) | System shape, document lifecycle, quotas, BYOK, billing, auth, streaming, RAG |
| [Data model](./docs/data-model.md) | Tables, triggers, RPCs, RLS, storage buckets, migrations |
| [Edge functions](./docs/edge-functions.md) | Contract for all 10 functions and the error-code catalogue |
| [Development](./docs/development.md) | Setup, scripts, conventions, testing |
| [Deployment](./docs/deployment.md) | Env vars, secrets, migration order, CI/CD, first-deploy checklist |
| [Runbook](./docs/runbook.md) | Incident procedures |
| [Troubleshooting](./docs/troubleshooting.md) | Symptom-to-cause reference |
| [Roadmap](./docs/superpowers/plans/2026-11-26-company-audit-and-roadmap.md) | Audit, phased roadmap and implementation status |

Product and design intent: [`PRODUCT.md`](./PRODUCT.md), [`DESIGN.md`](./DESIGN.md).

---

## Project structure

```
.
├── app/                 Next.js routes: landing, /pricing, /demo, /use-cases, /alternatives,
│                        /vs-notebooklm, /changelog, legal pages, /auth, /app (dashboard,
│                        onboarding, settings, doc/[docId]), sitemap.ts, robots.ts
├── proxy.ts             Auth gate for /app and /auth (Next 16's renamed middleware)
├── src/
│   ├── components/      ui/ (shadcn), common/, landing/, legal/
│   ├── features/        auth, dashboard, documents, learning, podcast, demo, seo, onboarding, settings
│   ├── integrations/    Supabase browser/server/proxy clients and generated types
│   └── lib/             plans.ts, services/ (edge-function clients), analytics/, export/
├── supabase/
│   ├── migrations/      SQL migrations (apply in filename order)
│   ├── functions/       Deno edge functions + _shared/
│   └── tests/database/  pgTAP tests
├── tests/               Vitest unit tests (tests/unit) and Playwright e2e (tests/e2e)
└── docs/                Technical documentation
```

---

## Getting started

```bash
npm install
cp .env.example .env.local   # fill in NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY
npm run dev                  # http://localhost:3000
```

Add `http://localhost:3000/auth/callback` to Supabase → Authentication → URL Configuration → Redirect URLs to sign in locally. Both `NEXT_PUBLIC_SUPABASE_*` values are public; never put a service-role key in a `NEXT_PUBLIC_` variable.

---

## Scripts

| Command | Action |
| :--- | :--- |
| `npm run dev` | Next.js dev server |
| `npm run build` / `npm run start` | Production build / server |
| `npm run typecheck` | `tsc -b --noEmit` |
| `npm run lint` | ESLint |
| `npm test` | Vitest (includes `supabase/functions/_shared/*.test.ts`) |
| `npm run test:e2e` | Playwright (the authenticated journey needs `E2E_USER_EMAIL` / `E2E_USER_PASSWORD`) |
| `npx -y deno@2 check supabase/functions/*/index.ts` | Type-check the edge functions |
| `npx -y deno@2 test --allow-env --allow-net $(find supabase/functions -name '*_test.ts')` | Deno tests |
| `supabase db start && supabase test db` | pgTAP database tests (needs Docker) |

CI (`.github/workflows/ci.yml`) runs all of these on every pull request.

---

## Environment

**Frontend (Vercel / `.env.local`)**

| Variable | Required | Purpose |
| :--- | :--- | :--- |
| `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` | yes | Supabase project |
| `NEXT_PUBLIC_SITE_URL` | production | Canonical origin (default `https://sourceio.app`) |
| `NEXT_PUBLIC_CONTACT_EMAIL` | recommended | Contact address on legal pages |
| `NEXT_PUBLIC_SENTRY_DSN`, `SENTRY_AUTH_TOKEN`, `SENTRY_ORG`, `SENTRY_PROJECT` | optional | Error tracking and source maps |
| `NEXT_PUBLIC_POSTHOG_KEY`, `NEXT_PUBLIC_POSTHOG_HOST` | optional | Product analytics |

**Edge function secrets (`supabase secrets set`)**

| Secret | Required | Purpose |
| :--- | :--- | :--- |
| `GROQ_API_KEY` | yes | Chat, scripts, Whisper, short-document notes |
| `GEMINI_API_KEY` | recommended | Long-document notes and 429 fallback |
| `BYOK_ENCRYPTION_KEY` | for BYOK | AES-256 key for saved user API keys (`openssl rand -base64 32`); do not rotate casually |
| `ALLOWED_ORIGIN` | production | CORS allow-list (comma-separated) |
| `LEMONSQUEEZY_WEBHOOK_SECRET` | yes | Webhook signature; billing refuses all events without it |
| `NOTES_TIME_BUDGET_MS` | optional | Per-run time budget for long notes (default 120000) |

`SUPABASE_URL`, `SUPABASE_ANON_KEY` and `SUPABASE_SERVICE_ROLE_KEY` are injected by the platform. See [deployment](./docs/deployment.md) for the full checklist.
