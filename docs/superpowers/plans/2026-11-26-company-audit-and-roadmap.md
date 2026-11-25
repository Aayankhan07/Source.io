# Source.io: Audit and Roadmap Across Every Role

**Date:** 2026-11-26
**Scope:** The whole repository at commit `dd7d453`: 221 tracked files, about 16.8k lines in the main feature and function files, 231 commits.
**Method:** Separate audits covered backend/security/data, frontend/product/UX, and QA/DevOps/SEO/docs. I re-checked each critical finding marked ✅ against the source myself.

> **Caveat.** All database findings come from `supabase/migrations/*.sql`. If the live project was changed by hand in the Supabase dashboard, it may differ. Before starting Phase 0, run `supabase db diff` against production to confirm which findings still apply there.

---

## Implementation status (2026-11-26)

Derived from the code in the working tree on branch `fix/phase0-security`. Commit `4bd2a7f` contains part of Phase 0; everything else listed as "in code" is **uncommitted** and **not yet applied to any Supabase project**. Nothing below has been verified against a live database: the pgTAP tests in `supabase/tests/database/` run only in CI or with a local `supabase db start`.

**Phase 0: in code.** Billing-column trigger, private profiles, quota RPCs on `user_id`, header BYOK removed (server decides), webhook HMAC fail-closed with UUID-validated `user_id`, quotas fail closed (503), `GROQ_API_KEY`/TDZ crash fixes, `daily_ai_usage` security invoker, embedding column fixed, CORS allow-list. *By design:* `checkCircuitBreaker` fails **open** on a DB error. It is a manual kill switch, and the quota RPC already fails closed, so spending is still capped during an outage. `podcasts_enabled` is now enforced by `generate_podcast` and enabled by migration `20261126160000`. *Open:* `supabase/.temp/` and `tsconfig.tsbuildinfo` are still tracked by git (0.9).

**Phase 1: mostly in code.** CI workflow (lint, typecheck, Vitest, build, `deno check`/`deno test`, pgTAP, Playwright); staging→production deploy workflow (1.2); Sentry for Next.js, Vercel Analytics/Speed Insights, JSON logs with request id (1.3, no Sentry in edge functions); pgTAP tests for quotas, billing, RLS, documents, BYOK, learning progress and length cap (1.4); authenticated Playwright journey, skipped unless `E2E_USER_*` is set (1.5); upstream timeouts and one supabase-js version (1.6); atomic derivatives RPC (1.7); job lock with partial unique index, heartbeat and 120 s stale reaping (1.8); quota refunds (1.9); uniques, indexes, `REPLICA IDENTITY DEFAULT` (1.10); RLS tightening for documents/jobs/chunks (1.11); `logAiUsage` in every function (1.13). TypeScript `strict: true` with 0 errors, and `no-unused-vars` re-enabled with 0 lint errors (1.12). *Open:* `_shared` coverage is not measured.

**Phase 2: mostly in code.** Plans single source `src/lib/plans.ts` with a consistency test and plan-aware document limit (2.3); real export and account deletion (2.2); `flashcard_reviews` (Leitner), quiz attempts and chat history saved (2.4); chat citations streamed and stored with similarity, citation regex fixed (2.5); gte-small `halfvec(384)` retrieval (2.6); `subscriptions` + `billing_events` ledger, out-of-order and idempotent handling, `order_created` no longer grants pro (2.7, tier is set by the `apply_billing_event` RPC rather than a trigger); privacy, terms and refund pages linked from the footer and signup (2.8); in-browser Kokoro audio with `speechSynthesis` fallback, server TTS code deleted, YouTube labelled beta with a paste-transcript fallback (2.9); static public `/demo/[slug]` and `GUEST_USER` removed (2.10); BYOK keys encrypted server-side (AES-256-GCM with `BYOK_ENCRYPTION_KEY`, not Supabase Vault) (2.11); section-by-section notes with Gemini routing, `note_sections`, page cap trigger (2.13). Fabricated dashboard data removed, including the quiz "98% Grounded Proof" line (2.1; checked with a repo grep). Settings are stored per user and cleared on sign-out, profile sync runs on every auth change, and onboarding ends at `/app?upload=1` (2.11, 2.12; covered by unit tests but not yet exercised in a browser against a real account). *Open:* the Recall@K eval set (2.6).

**Phase 3: partly in code.** `proxy.ts` + `@supabase/ssr` server auth; `next/font` (Outfit/Geist); no-flash theme script; `InteractiveWorkflowDemo` and unused public media deleted; prompt fields capped at 300 characters. `DocumentWorkspace` split into `src/features/documents/workspace/` (965 → 130 lines, one notes view mounted); Radix Tabs for workspace and settings (`?tab=` deep links); command palette is a Radix Dialog; 12px floor applied in landing, workspace, settings, flashcards and quiz. *Open:* axe in CI, a repo-wide 12px sweep of the remaining files, and LLM-judge evals for notes and flashcards.

**Phase 4: partly in code.** PostHog funnel events (no-op without a key); use-case, alternatives and changelog pages; sitemap and robots from `NEXT_PUBLIC_SITE_URL`; docs rewritten, root duplicate plans deleted, `docs/runbook.md` added. *Open:* cost-per-user dashboard and margin alert, review-reminder emails, streaks from real reviews.

**Needs owner action before any of this is live**

1. Commit the working tree (in logical commits) and open a PR; let CI run.
2. Create the staging Supabase project; add GitHub secrets `SUPABASE_ACCESS_TOKEN`, `SUPABASE_PROJECT_REF_*`, `SUPABASE_DB_PASSWORD_*`; create the `staging`/`production` environments (required reviewers on production) and make the CI checks required on `main` (`docs/deployment.md`).
3. Back up production, then apply migrations `20261126090000` → `20261126160000` to staging first. Two are destructive: duplicate notes/podcasts/quizzes are deleted and all embeddings are nulled (re-embedded lazily).
4. Set Supabase secrets: `GROQ_API_KEY`, `GEMINI_API_KEY`, `BYOK_ENCRYPTION_KEY` (`openssl rand -base64 32`, keep a copy), `ALLOWED_ORIGIN`, `LEMONSQUEEZY_WEBHOOK_SECRET`, optionally `NOTES_TIME_BUDGET_MS`. Deploy all 11 functions.
5. Vercel env: `NEXT_PUBLIC_SITE_URL`, `NEXT_PUBLIC_CONTACT_EMAIL`, Sentry and PostHog keys. Add `<origin>/auth/callback` to Supabase Auth redirect URLs. (Migration `20261126160000` adds `podcasts` to the Realtime publication.)
6. Run the smoke tests in `docs/deployment.md` (self-upgrade blocked, forged webhook 401, header BYOK still charges, free user chat, long-document notes, audio render), then promote to production.
7. Review the legal pages' wording (they state that Google's free tier may use data sent to Gemini) and set a real contact email.
8. `git rm --cached -r supabase/.temp tsconfig.tsbuildinfo`.

---

## 1. Executive summary

Source.io has a strong product idea: one source, five renderings, each grounded in citations. It has polished marketing and a real AI pipeline. But it is **not production-safe today**, and several core paths are **broken at the code level**:

1. **Money and abuse.** Users can make themselves "pro" from the browser. A request header skips all quotas while the platform's own Groq key is still used. The billing webhook can be forged. The quota system lets requests through when it fails. In practice the AI bill has no ceiling.
2. **Core features broken in code.** Chat and audio/video ingest refer to a `GROQ_API_KEY` variable that is never defined. The quota RPCs update `profiles.id` instead of `profiles.user_id`, so they match no rows. The embedding column is `vector(1536)` but the code writes 768 dimensions. Error handling in notes generation has a temporal-dead-zone (TDZ) crash.
3. **Trust.** The dashboard shows invented numbers to real users (streaks, retention, rankings, fake documents). "Export library" exports demo data. Pricing claims differ between the pricing page, `pricing.md`, `llms.txt` and the code. Citations, the product's main trust promise, don't link anywhere.
4. **Engineering basics are missing.** There is no CI, about 3–5% test coverage, TypeScript `strict: false`, and no error tracking. Edge functions are deployed by hand. Build artifacts and Supabase link metadata are committed.

**Recommendation:** freeze new feature and landing work for about 2 weeks and run Phases 0–1 below. Recent history includes about 10 near-identical "add TactileHeroPrototype" commits, which shows effort going into the landing page while the product's core is broken.

---

## 2. Scorecard by role

| Role | Grade | One-line verdict |
|---|---|---|
| Product management | C | Clear vision in `PRODUCT.md`. The shipped UI contradicts its own "never fabricate" rule, and pricing is inconsistent. |
| Backend engineering | D | Thoughtful design (job locks, circuit breakers, atomic quotas), but key paths are broken and fail open. |
| Security | F | Self-upgrade, quota bypass, forgeable webhook, RLS leaks through a view. |
| Database / DBA | D+ | Good RLS coverage, but wrong key columns, wrong vector dimension, missing uniques and indexes. |
| Frontend engineering | C | Works, but has 900+ line components, 50 `'use client'` files, no server-side auth, and dead code. |
| UX / Design | C+ | Distinct visual language. Fonts don't match the spec, the theme flashes, the mobile nav is dead, and text is under 12px in 268 places. |
| AI / ML engineering | C− | Sensible model fallback chains. Retrieval is lexical hashing, not semantic. No evals, unbounded prompt injection. |
| QA | F | About 5% coverage, no authenticated end-to-end tests, a Deno test that never runs. |
| DevOps / SRE | F | No CI, no staging, manual deploys, no monitoring or alerts. |
| Data / Analytics | F | No product analytics. AI usage logging covers 3 of 7 functions. |
| SEO / Growth | B | Solid metadata, JSON-LD, llms.txt and robots. The sitemap lists auth-gated pages, and there are only 3 indexable pages. |
| Tech writing | C | Good `docs/` set, but stale (still says Vite, `src/App.tsx`, Zustand), with duplicated plans and unchecked boxes. |
| Finance / Billing ops | F | Only a partial webhook: no subscription table, no idempotency, and `order_created` grants permanent pro. |
| Legal / Compliance | Unknown, high risk | No privacy policy or terms page found. Uses an unofficial Edge TTS token and scrapes Google Translate TTS. Claims "zero data retention" without enforcement. |

---

## 3. Findings by role

Severity: **P0** = exploitable or broken now. **P1** = must fix before paid launch. **P2** = quality or scale. **P3** = polish.

### 3.1 Security engineer

| # | Sev | Finding | Evidence |
|---|---|---|---|
| S1 ✅ | P0 | **Users can upgrade themselves.** The `profiles` UPDATE policy allows every column, including `tier`, `daily_quota_limit` and `daily_tts_quota_limit`. `generate_podcast` trusts `tier`. | `migrations/20260419182600…sql:62`, `20261016092000…sql:2-9`, `generate_podcast/index.ts:133-143` |
| S2 ✅ | P0 | **A BYOK header skips quotas.** If `x-byok-groq` or `x-byok-gemini` is present, `isByok = true`, but the server's key is still used. | `chat/index.ts:155`, `generate_podcast/index.ts:140`, `generate_notes` and `generate_derivatives` (similar) |
| S3 ✅ | P0 | **The webhook works without a secret.** The HMAC check runs only `if (WEBHOOK_SECRET)`. | `billing-webhook/index.ts:56` |
| S4 | P0 | **Webhook filter injection.** `.or(\`id.eq.${userId},user_id.eq.${userId}\`)` takes `userId` from the payload. The fallback matches on `display_name = email`, which the user controls. | `billing-webhook/index.ts:86-90, 122, 145` |
| S5 | P1 | **The `daily_ai_usage` view has no `security_invoker`**, so it bypasses RLS and exposes every user's usage. | `20261005200000…sql:160` |
| S6 | P1 | **Users can write server-owned state.** The client can update `documents.status/raw_text/content_hash` and `jobs`, and insert `document_chunks`. | initial migration `:115, :281`, `20260420174623:17` |
| S7 | P1 | **BYOK keys are stored in plaintext localStorage** and are not cleared on sign-out. Two accounts on one browser share them. The Gemini key is sent to Groq. | `SettingsContext.tsx:39-44`, `DocumentWorkspace.tsx:305, 421` |
| S8 | P1 | **CORS defaults to `*`.** In notes and derivatives, any Origin is echoed back. | `chat:11`, `generate_notes:14-16` |
| S9 | P2 | **Unbounded user text in prompts** (`customSystemInstruction`, `quiz_style`, `podcast_style`). This is a cost and injection risk. | `promptCompiler.ts:114` |
| S10 | P2 | **Storage buckets have no size or MIME limits.** `avatars` is public. Podcast signed URLs last 1 year. | initial `:321-323`, `generate_podcast:328` |
| S11 | P2 | **Supabase link metadata is committed** (project ref, org id, pooler host). It contains no password. | `supabase/.temp/*` |

### 3.2 Backend engineer

| # | Sev | Finding | Evidence |
|---|---|---|---|
| B1 ✅ | P0 | **`GROQ_API_KEY` is never defined** in `chat` or `ingest`. This causes a ReferenceError, so every chat call and every audio/video ingest fails. | `chat/index.ts:203`, `ingest/index.ts:181,195` |
| B2 ✅ | P0 | **The quota RPCs use `WHERE id = p_user_id`**, but `profiles.id` is a random UUID. They update 0 rows and return FALSE, so free users get a 429. The client has the same bug in `.eq("id", …)`. | `20261016090000:18`, `20261016092000:40,81`, `SettingsContext.tsx:80,155,180,219` |
| B3 ✅ | P0 | **Vector dimension mismatch.** The column is `vector(1536)` and the code inserts 768. The "halfvec" migration only drops the index. There is now no ANN index. | initial `:270`, `20261016091000`, `embed_chunks:16` |
| B4 ✅ | P0 | **TDZ crash in `generate_notes`.** `isRateLimit` is used at line 492 but declared at 497. | `generate_notes/index.ts:492-497` |
| B5 | P0 | **Quotas and circuit breakers fail open.** They return `{allowed:true}` on any error. | `_shared/quotas.ts:31,98,135`, `circuitBreakers.ts:37` |
| B6 | P1 | **`generate_derivatives` is not atomic.** There is no top-level try/catch. It deletes old cards before inserting new ones, outside a transaction. It marks the job succeeded even when inserts fail. | `generate_derivatives:398, 490-535` |
| B7 | P1 | **Job lock problems.** A job is "stale" after 25s, but streams never heartbeat. Check-then-insert races. The lock is granted on error. | `_shared/jobLock.ts:47,110,121` |
| B8 | P1 | **Quota is charged before the ownership check** and never refunded on failure. | `generate_podcast:144` vs `:182` |
| B9 | P1 | **No timeouts or AbortSignal on Groq and YouTube fetches.** Up to 24 TTS segments run one after another with 30s each, which risks the wall-clock limit. | all functions |
| B10 | P1 | **`supabase-js` versions differ.** `auth.ts` uses 2.48.1 and the rest use 2.57.4. Check that `auth.getClaims` exists in 2.48.1. | `_shared/auth.ts:2` |
| B11 | P1 | **The YouTube `video.google.com/timedtext` endpoint is deprecated.** The TTS relies on an unofficial Edge token and a Google Translate scrape. | `ingest:44`, `generate_podcast/tts.ts:4,96` |
| B12 | P2 | **`embed_chunks` batch 0 deletes all chunks without a lock**, so concurrent batches corrupt each other. | `embed_chunks:151-178` |
| B13 | P2 | **Dead and contradictory config.** `podcasts_enabled` is seeded `false` but never read. `verify_jwt=false` in `config.toml` contradicts `docs/deployment.md`. | `20261005200000:190`, `config.toml` |

### 3.3 Database administrator

- **P1: no `UNIQUE(document_id)`** on `notes`, `podcasts` or `quizzes`, while the code uses `maybeSingle()`. Duplicate rows cause errors, which then cause more inserts.
- **P1: the document limit trigger hard-codes 3.** It ignores `tier` and `active_docs_limit`, so paying users are blocked. The same check is copied in `ingest:132-148` and `UploadDialog.tsx:65`.
- **P2: missing indexes.** Needed: `jobs(document_id, kind, status)`, `chat_messages(document_id, created_at)`, and `user_id` on the child tables used by RLS.
- **P2: duplicate indexes** on `notes` and `jobs`. There is an unused GIN index on `workspace_preferences`.
- **P2: `REPLICA IDENTITY FULL` on `documents`** sends the full `raw_text` over Realtime on every status change.
- **P2:** the `ai_usage_logs` DDL appears in two migrations. `provider_usage` has no retention policy. The idempotency key is unique across all users instead of per user. Quota columns are nullable and have no CHECK constraints.

### 3.4 Frontend engineer

- **P0: "Export library" exports `DEMO_DOCUMENTS`** instead of the user's data ✅ (`DataStorageSettings.tsx:6,21`).
- **P1: the citation regex has the `/g` flag and is used with `.test()`** ✅. Because `lastIndex` carries over, every other match fails (`MarkdownView.tsx:11-16`). Ask citations call `onScrollToHeading(chunk_id)`, which never matches a heading (`AskPanel.tsx:219`).
- **P1: the mobile nav state is never rendered** ✅ (`AppHome.tsx:15`). The Menu button does nothing.
- **P1: `demo-biology` card is a dead link.** Guest mode (`GUEST_USER`) calls the backend with fake IDs. `generate`, `runPodcast` and `handleDelete` don't check `isDemo`.
- **P1: onboarding sync reads the profile only on mount** and defaults to `onboardingCompleted: true`, so the dashboard flashes before the redirect and new devices are sent back to onboarding.
- **P2: auth is client-only** (`RequireAuth`). There is no `@supabase/ssr` or `proxy.ts`, so `/app` can't use Server Components.
- **P2: very large components.** `DocumentWorkspace` 965 lines, `QuizPlayer` 957, `OnboardingWizard` 801, `WorkspaceOutline` 710, `AIModelSettings` 692. `InteractiveWorkflowDemo` (697) is dead code.
- **P2: the notes view is mounted twice** (desktop and mobile hidden with CSS). That doubles the KaTeX render and creates two `AskPanel` instances with separate state.
- **P2: React Query hygiene.** Ad hoc keys bypass `queryKeys.ts`. One `queryFn` writes data. `count:"exact"` is used without `head:true`. A documents query is duplicated.
- **P2: bundle size.** `unpdf` and `mammoth` are imported statically into an always-mounted `UploadDialog`. KaTeX runs on the landing page for 5 strings. About 14MB of unused public media.
- **P3:** two toast systems, both `next-themes` and a custom `use-theme`, about 15 unused imports, and `confirm()` used alongside AlertDialog.

### 3.5 Product manager

- **P0: fabricated data shown to real users.** Chart fallbacks (`TactilePerformanceChart.tsx:66-96`), weekly goals ("9.5h studied", "88% retention"), notifications ("Rank #1 among friends"), and "Continue where you left off" copy. This directly breaks the `PRODUCT.md` rule: *"Future work must not fabricate them."*
- **P0: pricing is inconsistent.**

  | Claim | Pricing page | pricing.md / llms.txt / landing | Code |
  |---|---|---|---|
  | Scholar daily actions | 200 | Unlimited | 200 |
  | Scholar documents | — | Unlimited | 3 (hard-coded for everyone) |
  | Page limit | — | 100 / 300 | not enforced; settings says 250 |
  | BYOK providers | — | Gemini/Groq/OpenAI | settings also lists Anthropic; type allows 3 |
  | Leitner spaced repetition | claimed | claimed | progress is never saved |
  | "1-click cancel", "zero data retention", "custom decay curves" | — | claimed | not implemented |

- **P1: progress is never saved** for quizzes, flashcards or chat history, so there is no learning loop and no retention mechanic.
- **P1: onboarding ends on the dashboard instead of the first upload.** Activation is lost at the most important step.
- **Decisions needed from leadership:** see §6.

### 3.6 UX and product designer

- Fonts don't match the spec. `DESIGN.md` says Outfit/Geist; the code uses Inter/Plus Jakarta/Fira Code, loaded through a blocking `<link>` instead of `next/font`.
- `<html class="dark">` is hard-coded and the landing page forces light in an effect. This causes a flash, and it **overwrites the user's saved theme in the app**.
- 268 cases of `text-[8–11px]` break the agreed 12px floor.
- Accessibility: the command palette has no `role="dialog"` or focus trap. The workspace and settings tabs lack `tablist`/`tab` roles. The flashcards handler swallows Space everywhere. The hero video autoplays with sound. Icon-only buttons have only a `title`.
- Colors mix hard-coded slate values with semantic tokens. Suspense fallbacks are dark on one route and white on another.
- Empty states show demo content with no "sample" label. A new user can't tell real from fake.

### 3.7 AI and ML engineer

- **Retrieval is lexical** (FNV-hashed bag of words). It fails on synonyms; `docs/cost-optimization-analysis.md` already says this. Grounded citations are the product's moat, and they currently rest on keyword overlap.
- There is no eval harness for notes, flashcards or quiz quality, no Recall@K benchmark, and no regression set.
- Prompt inputs from the user are not length-capped. `MAX_SOURCE_CHARS` of 30–35k silently cuts long documents, and the user isn't told.
- Model fallback chains (`gpt-oss-120b`, then 20b, then `llama-3.1-8b`) are good, but nothing logs which model actually served a request outside 3 functions.

### 3.8 QA lead

- 6 test files cover about 5 of 110 source files. There is no coverage tooling.
- Untested: quotas, webhook HMAC, auth, ingest, chunking, the RAG chat path, SSE parsing, job lock, RLS, upload, quiz, podcast and settings.
- `seo-metadata.test.ts` checks that strings exist in source files, not how pages behave. The `FlashcardsDeck` test depends on a CSS class.
- The Deno test `generate_podcast/index_test.ts` is never run.
- There are no authenticated end-to-end tests, so the core journey (upload, notes, chat) has never been verified automatically. That is how B1–B4 shipped.

### 3.9 DevOps and SRE

- No `.github/workflows`. Nothing enforces lint, typecheck, test or `deno check`.
- One Supabase project serves dev, preview and prod. Migrations and functions are deployed by hand, with no ordering and no rollback.
- No Sentry, no Vercel Analytics or Speed Insights, no alerts. There are 56 `console.*` calls and nothing collects them.
- `tsconfig.tsbuildinfo` and `supabase/.temp/` are tracked even though they are gitignored.
- Env templates are incomplete: `NEXT_PUBLIC_SITE_URL`, `LEMONSQUEEZY_WEBHOOK_SECRET` and the Gemini/OpenAI keys are missing. `ALLOWED_ORIGIN=http://localhost:8080` is left over from Vite.
- `.codex/hooks.json` calls a script in `.agents/`, which is gitignored, so the hook does nothing on fresh clones.

### 3.10 Data and analytics

- There is no product analytics, so the funnel (visit, signup, onboarding, first upload, first notes, return on day 7, upgrade) can't be measured.
- `ai_usage_logs` is written by only 3 of 7 functions. Podcast (TTS), ingest (Whisper) and embed are missing.
- There is no cost-per-user dashboard, even though the cost of AI calls is the main business risk.

### 3.11 SEO and growth

- **Done well:** canonicals, `noindex` on private routes, FAQPage and Breadcrumb JSON-LD, `llms.txt` and `llms-full.txt`, and a `robots.txt` that allows AI search bots and blocks training bots.
- **Contradictions:** the sitemap lists `/app/doc/demo-*`, but those pages are `noindex` and redirect to `/auth`. `robots.txt` hard-codes the host. Sitemap dates are hard-coded.
- **Small footprint:** 3 indexable pages. There are no use-case pages (by exam, by subject, by file type), no blog, and no "alternatives" cluster beyond one page comparing against NotebookLM.
- Confirm the production domain: the code says `sourceio.app` and history mentions `source-io.vercel.app`.

### 3.12 Technical writer

- `PRODUCT.md` and `docs/architecture.md` describe a Vite app with `src/App.tsx` routing and a Zustand store. None of those exist now.
- `LANDING_PAGE_ROLE_ADAPTIVE_UPGRADE_PLAN.md` and `ROLE_ADAPTIVE_CUSTOMIZATION_ARCHITECTURE.md` are byte-identical at the repo root and in `docs/`.
- `2026-11-01-seo-optimizations.md` shows 0 of 20 boxes checked, but the work shipped.
- `docs/deployment.md` contradicts `config.toml` on `verify_jwt`.

### 3.13 Legal, compliance and finance

- There are no privacy policy, terms or cookie pages. These are required by Lemon Squeezy and GDPR, and the users include students.
- The Edge TTS `TrustedClientToken` and Google Translate TTS scraping very likely break the providers' terms. That is a risk to the podcast feature's availability and a legal risk.
- There is no account-deletion or data-export flow; the existing export returns demo data. That is a GDPR Art. 15/17 gap.
- Billing has no subscription ledger, no event idempotency, no handling for out-of-order events, and `order_created` grants permanent pro. Revenue reconciliation is impossible.

---

## 4. Phased roadmap

Estimates assume 1 full-stack engineer plus AI help. Each phase ends with an exit gate.

### Phase 0: Stop the bleeding (days 1–4)

Goal: the platform can no longer be used for free AI by anyone who wants to.

| Task | Role | Fix |
|---|---|---|
| 0.1 | DBA/Sec | New migration. Revoke UPDATE on `profiles.tier`, `daily_quota_limit`, `daily_tts_quota_limit` and `active_docs_limit` from `authenticated` using column-level `REVOKE`/`GRANT`, or a BEFORE UPDATE trigger that rejects changes to those columns unless the role is `service_role`. |
| 0.2 | Backend | Remove `isByok` that comes from headers. BYOK applies only when a key is actually present in the request **and** is used for the upstream call. Otherwise charge the quota. |
| 0.3 | Backend | Webhook: return 401 when the secret is missing. Validate `userId` as a UUID and use `.eq("user_id", userId)`. Remove the `display_name` fallback. |
| 0.4 | Backend | Quotas and circuit breakers **fail closed** (503 with a retry hint). |
| 0.5 | DBA | Fix the quota RPCs to use `WHERE user_id = p_user_id`. Fix the client `.eq("id")` calls to `.eq("user_id")`. Fix the role policy in `20261017120000:53`. |
| 0.6 | Backend | Get `apiKey` from `authenticateRequest` in `chat` and `ingest`. Move the `isRateLimit` declaration above its use in `generate_notes`. |
| 0.7 | DBA | Migration: `ALTER COLUMN embedding TYPE extensions.halfvec(768)` after deleting the old embeddings. Recreate the HNSW index with `halfvec_cosine_ops`. |
| 0.8 | DBA | `ALTER VIEW daily_ai_usage SET (security_invoker = true)`, or revoke access from `anon` and `authenticated`. |
| 0.9 | DevOps | `git rm --cached -r supabase/.temp tsconfig.tsbuildinfo`. Rotate nothing (no secrets leaked), but confirm that. |
| 0.10 | Sec | Set `ALLOWED_ORIGIN` to the production domain in Supabase secrets. Stop echoing back arbitrary Origins. |

**Exit gate:** a manual pen-test script (a curl collection) shows that self-upgrade, the header bypass and a forged webhook all fail. A free user can complete upload, notes and chat on production.

### Phase 1: Foundations (weeks 1–2)

| Task | Role | Detail |
|---|---|---|
| 1.1 | DevOps | GitHub Actions: `npm ci`, `lint`, `typecheck`, `vitest`, `deno check supabase/functions/**`, `deno test`, and Playwright against the Vercel preview. Make it a required check on `main`. |
| 1.2 | DevOps | Create a staging Supabase project. Add a CI job that runs `supabase db push`, then `functions deploy`, on merge to `main`, with production behind manual approval. |
| 1.3 | SRE | Add Sentry (Next.js and Deno). Add Vercel Analytics and Speed Insights. Write structured JSON logs with a request id. |
| 1.4 | QA | Integration tests against a local Supabase (`supabase start`) for: quota RPCs, RLS (user A can't read B's data or change their own tier), the webhook HMAC, and job lock. |
| 1.5 | QA | An authenticated Playwright journey with a seeded test user: sign up, onboarding, paste text, notes stream, flashcards, quiz, chat with a citation. |
| 1.6 | Backend | Add `AbortSignal.timeout()` to every upstream fetch. Pin a single `supabase-js` version through an import map. |
| 1.7 | Backend | Make `generate_derivatives` transactional (an RPC that replaces cards and quiz in one transaction). Add a top-level try/catch that marks the job `failed`. |
| 1.8 | Backend | Job lock: add a heartbeat `updated_at` during streams. Use a partial unique index `jobs(document_id, kind) WHERE status='running'` instead of check-then-insert. Fail closed. |
| 1.9 | Backend | Refund the quota on failure, using an `idempotency_key` plus a `refund_daily_quota` RPC. Check ownership before charging. |
| 1.10 | DBA | Add `UNIQUE(document_id)` on notes, podcasts and quizzes (dedupe first). Add the missing indexes. Drop duplicate indexes. Set `REPLICA IDENTITY DEFAULT` on documents. |
| 1.11 | Sec | Tighten RLS: the client can't write `documents.status/raw_text/content_hash`, `jobs` or `document_chunks`. Only the service role can. |
| 1.12 | Eng | Turn on `strict: true` step by step: `strictNullChecks` first, then fix the errors. Re-enable `no-unused-vars`. Lint the Deno code too. |
| 1.13 | Telemetry | Call `logAiUsage` in ingest, embed and podcast. |

**Exit gate:** CI is green and required. Staging exists. The core journey has an end-to-end test. Sentry receives events. Coverage of `_shared/` is at least 70%.

### Phase 2: Make it honest and real (weeks 3–5)

| Task | Role | Detail |
|---|---|---|
| 2.1 | PM/FE | **Remove every fabricated number.** Chart, goals, notifications and "continue" copy show real data or a designed empty state. Demo content is labelled "Sample". |
| 2.2 | FE | Make Export return the user's real documents, notes, cards and quizzes. Add account deletion through an edge function that cascades and deletes storage. |
| 2.3 | PM | **One source of truth for plans:** a `plans` config (or DB table) read by the pricing page, `pricing.md`, `llms*.txt` (generated at build time), the quota RPC, the document limit trigger and the settings UI. Remove claims that aren't implemented. |
| 2.4 | Backend/FE | Save learning progress: `flashcard_reviews` (a real SM-2 or Leitner schedule), `quiz_attempts` (the table exists but is unused), and chat history (`chat_messages` exists). |
| 2.5 | FE | Citations that work: fix the `/g` regex bug. Make Ask citations open the source passage by `chunk_id` in a side panel, show the similarity score, and make Notes citations clickable. |
| 2.6 | AI | Replace hashed embeddings with Supabase's built-in `gte-small` (384 dimensions, free; see §6.4). Migrate the column to `halfvec(384)` and re-embed. Build a Recall@K eval of about 50 questions and gate any change to retrieval on it. |
| 2.7 | Billing | Add a `subscriptions` table and a `billing_events` table with a unique `event_id`. Handle `subscription_updated/cancelled/expired/payment_failed`. Make `order_created` time-boxed. Derive `tier` from the subscription state with a server-side trigger. |
| 2.8 | Legal | Publish privacy, terms and refund pages. Link them in the footer and at signup. |
| 2.9 | Backend/FE | TTS: move to in-browser Kokoro, with a `speechSynthesis` fallback, and delete the unofficial Edge and Google TTS code (§6.2). YouTube: label it Beta and add the paste-transcript fallback (§6.3). |
| 2.10 | FE | Make the demo really public. Move `/app/doc/demo-*` to a public `/demo/[slug]` route that reads static data and never calls the backend. Fix `demo-biology`. Update the sitemap to match (§6.5). |
| 2.11 | FE | Settings stored per user (keyed by `user_id`) and cleared on sign-out. BYOK keys stay in the session, or are encrypted server-side with Supabase Vault. Fix the onboarding profile sync so it runs on auth change. |
| 2.12 | PM | Onboarding ends at the first upload: "Paste text or drop a PDF" as the last step. |
| 2.13 | AI/Backend | **Full-document generation, section by section.** (1) Split `raw_text` at headings or page breaks into sections of about 5 pages (about 15k characters). (2) Write notes for each section, running as a background job. Save each result to a new `note_sections` table (document_id, index, markdown, status) so a failure retries only that section. The UI streams section 1 immediately and shows "Section 3 of 8". (3) Make one small call that turns the section summaries into an overview and table of contents. (4) Generate flashcards and quiz questions **from the section notes**, a few per section, so every part of the document is covered and input stays small. (5) Build the podcast script from the overview and key points. (6) Charge one quota action per document, up to the plan's page limit. **Engine:** for sources over 20k characters use the Gemini Flash-Lite free tier (large context and much higher per-minute limits than Groq's free tier; free-tier data may be used by Google, so say so in the privacy policy). Short sources stay on Groq. When either provider rate-limits, fall back to the other per section, and honour `retry-after`. |

**Exit gate:** no hard-coded numbers appear in signed-in UI (checked with grep plus visual QA). The pricing claims match the enforced limits across all 5 surfaces. A test subscription can be bought, upgraded and cancelled end to end on staging.

### Phase 3: Quality, performance, UX (weeks 6–8)

- **FE refactor:** split `DocumentWorkspace` into a route shell plus one component per tab. Mount only one notes view, chosen with a `useMediaQuery`. Split `QuizPlayer` and `OnboardingWizard`. Delete `InteractiveWorkflowDemo`, the unused imports, the second toast system and `next-themes` (or the custom hook).
- **Server auth:** use `@supabase/ssr` plus `proxy.ts` for the `/app` gate. Move dashboard data fetching to Server Components where possible. Read `node_modules/next/dist/docs/` first.
- **Performance:**
  - Load `unpdf` and `mammoth` with a dynamic `import()` on drop.
  - Pre-render the landing KaTeX to HTML at build time.
  - Use `next/font` with the spec fonts (Outfit/Geist).
  - Use `next/image` for hero slides.
  - Delete about 14MB of unused media.
  - Target LCP under 2.0s and JS under 200KB on `/`.
- **Theme:** remove the hard-coded `dark` class. Use a no-flash theme script. The landing page must not overwrite the app preference.
- **Accessibility:**
  - Raise all `text-[<12px]` to at least 12px, or justify each exception.
  - Use Radix `Dialog` for the command palette and Radix `Tabs` for the workspace and settings.
  - Scope the flashcard shortcuts.
  - Stop the hero video autoplaying with sound.
  - Run axe in CI.
- **Mobile:** make the nav drawer work. Give the mobile notes view parity with desktop (copy, export, delete, status states).
- **AI:** cap user prompt fields (for example 500 characters). Show "Source truncated at X pages" when a document is cut off. Build evals for notes and flashcards using an LLM judge on 20 fixed documents.

### Phase 4: Growth (weeks 9–12)

- **Analytics:** set up PostHog (or similar) events for the funnel in §3.10, a dashboard of cost per active user, and a margin alert.
- **SEO:** about 20 programmatic use-case pages (exam, subject, file type) with real sample outputs, an alternatives cluster (Quizlet, Anki, NotebookLM, Knowt), and a changelog page. Use `NEXT_PUBLIC_SITE_URL` in `robots` and the sitemap, with real `lastModified` values.
- **Retention:** spaced-repetition review reminders by email (once 2.4 is done), and a streak based on **real** reviews.
- **Docs:** rewrite `architecture.md`/`PRODUCT.md` for Next.js, delete the duplicate root plans, tick off the finished plan boxes, and add `docs/runbook.md` (incidents, rollback, rotating keys, circuit breakers).

---

## 5. Cross-cutting working agreements

1. **No fabricated data in signed-in surfaces.** Add a lint rule or CI grep for numeric fallbacks in `features/dashboard`.
2. **Every migration gets an RLS test.** Every edge function gets a Deno test, and CI runs both.
3. **Fail closed** on money, quota and auth paths. Fail open only on cosmetic paths.
4. **One commit per logical change.** No commits to `tsbuildinfo`. Squash the agent-generated commit churn when merging.
5. **Plans are living documents.** Tick boxes in the same PR that ships the work.

---

## 6. Decisions (updated 2026-11-26)

Constraint from the owner: **prefer free options everywhere.**

| # | Topic | Decision | Status |
|---|---|---|---|
| 1 | Scholar limits | **200 AI actions/day.** Every surface that says "Unlimited" (`PricingComparisonSection.tsx`, `public/pricing.md`, `llms.txt`, `llms-full.txt`) changes to 200. Document and page caps are still open; until they are decided, keep the current document cap but make the trigger read `tier`. | Decided (actions) |
| 2 | Podcast TTS | **Kokoro-82M running in the user's browser** (`kokoro-js`, Apache-2.0 licence). It's free, has no usage cap, and is legal to use. The server still writes the two-host script. The browser renders the audio once and uploads it to the `podcasts` bucket, so replays are cached. If the device is too weak or the model fails to load, fall back to the browser's built-in `speechSynthesis` for live playback only, with no saved file. Remove the unofficial Edge token and the Google Translate scrape from `generate_podcast/tts.ts`. Optional later: the Azure Speech free tier (about 0.5M characters a month, the same voices as now) as a faster server-side path for Scholar. | Recommended |
| 3 | YouTube import | Today the server fetches captions from `video.google.com/timedtext` (`ingest/index.ts:44`). That is an old, unofficial endpoint that is probably dead or blocked from Supabase's servers. YouTube has no free official API for captions on videos you don't own, and downloading the audio breaks YouTube's terms. Plan: test the endpoint once. If it fails, keep the YouTube tab labelled **Beta**: try the fetch, and on failure show "Open the video, click *…more*, then *Show transcript*, then copy and paste it here", which drops into the existing paste-text flow. Remove YouTube from marketing copy until the fetch works reliably. | Recommended |
| 4 | Embeddings | Current: **not an AI model.** It is home-made keyword hashing (FNV-1a over words and word pairs, `embed_chunks/index.ts:40-63`). It costs nothing but finds only exact word matches. New: **Supabase's built-in `gte-small` model** (`new Supabase.ai.Session('gte-small')` inside edge functions). It's free, needs no API key, and documents never leave Supabase. It produces 384 dimensions, so the column becomes `halfvec(384)` with an HNSW index, and existing documents are re-embedded once. Fallback if quality is too low for non-English documents: Gemini `gemini-embedding-001` free tier at 768 dimensions. Note that Google may use free-tier data to improve its products, which matters for users' documents. | Recommended |
| 5 | Demo mode | A **static public demo** at `/demo/[slug]`, built from the existing `mockDocuments.ts` data. It needs no login, makes zero backend calls, costs nothing and can't be abused. It's indexable, which fixes the sitemap contradiction and helps SEO, and every tab ends with a "Try it with your own document" link to sign-up. Delete `GUEST_USER` and the `demo-*` handling from `/app`. | Recommended |
| 6 | Domain | Keep the current one: `NEXT_PUBLIC_SITE_URL`, with `https://sourceio.app` as the fallback. `robots.txt` should be generated from the same env var. | Decided |

### 6.0 Bring your own key (BYOK): recommended design

Keep it as an optional power-user path. The app must work fully without a key.

- **What a key unlocks:** no daily action cap, the large page limit (300 pages), and model choice. Document and storage caps still apply. A key costs the platform roughly nothing in AI spend.
- **Easiest free key:** a free Gemini key from Google AI Studio takes about 2 minutes to get. Add a step-by-step guide in Settings. With their own key, Google's free-tier data terms apply to the user's own account, not to Source.io.
- **Storage:** encrypt keys server-side per user with Supabase Vault, and never put them in localStorage. This is needed anyway because background jobs (task 2.13) run after the tab is closed. Show only the last 4 characters, and add Test and Delete buttons (`byokTest.ts` exists).
- **Routing:** one adapter per provider (Groq, Gemini, OpenAI; all three have OpenAI-compatible endpoints, so this is a base URL plus model name). Anthropic comes later; remove it from the settings UI until then. Never send a key to a different provider's API.
- **Quota rule:** the server decides. It skips the quota only when a call actually used the user's key. Request headers are never trusted (fixes S2).
- **Failures:** if the user's key is invalid or out of credit, show a clear error. Fall back to the platform key only if the user opts in, and then charge their quota.

### 6.1 Recommended plan limits (single source of truth for task 2.3)

| Limit | Free | Scholar | Why |
|---|---|---|---|
| AI actions per day | 25 | 200 | 25 matches the code now. 200 was decided by the owner. |
| Documents kept | 3 | 100 | 3 matches the code now. 100 is effectively unlimited for a student but puts a ceiling on storage and embedding abuse. Don't advertise "Unlimited". |
| Pages per document (every page used in full) | 25 | 50 at launch, raise to 100+ once costs are measured | Enforce by extracted characters (about 3,000 characters per page) rather than by counting PDF pages, so pasted text and transcripts are covered too. Requires task 2.13. |
| Podcasts per day | 2 | 50 | Matches the code now. In-browser voices cost $0, and the script still counts as one AI action. |
| Upload size | 50 MB | 100 MB | 50 MB matches the code now. |

**How long documents are handled today.** The source is cut down to 20k characters for notes (`generate_notes/index.ts:395`) and 18k for flashcards and quizzes (`generate_derivatives/index.ts:293`). That fits Groq's free-tier limit of roughly 10–12k tokens per minute. For long documents, the code splits the text into 12 equal parts and keeps only the first few lines of each. A 50-page document (about 150k characters) therefore has only about 13% of its text read: every section is touched, but most of the content is skipped. Task 2.13 replaces this.

---

## 7. Success metrics

| Metric | Now | Target at end of Phase 3 |
|---|---|---|
| P0 security findings open | 5+ | 0 |
| CI gates on `main` | 0 | 6 (lint, types, unit, Deno, e2e, axe) |
| Test coverage (`src/lib`, `_shared`) | ~5% | ≥70% |
| Core journey e2e (upload → notes → chat) | none | green on every PR |
| Hard-coded metrics in signed-in UI | ~15 sites | 0 |
| Pricing claim mismatches | 7 | 0 |
| Retrieval Recall@6 on the eval set | unmeasured | ≥0.8 |
| Landing LCP (mobile) | unmeasured | <2.0s |
| Sentry error rate on edge functions | unknown | measured, with alerts |
