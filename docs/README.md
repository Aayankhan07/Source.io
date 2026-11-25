# Source.io Documentation

Reference documentation for the Source.io codebase. Start with the root [`README.md`](../README.md) for an overview and quick start; these pages go deeper.

| Page | What it covers |
| :--- | :--- |
| [Architecture](./architecture.md) | System diagram, document lifecycle, plans and quotas, BYOK vault, billing ledger, auth, state, realtime, SSE events, retrieval |
| [Data model](./data-model.md) | Every table, constraint, trigger, RPC, RLS rule, storage bucket and migration |
| [Edge functions](./edge-functions.md) | Contract for all 10 Deno functions, secrets, and the full error `code` catalogue |
| [Development](./development.md) | Environment setup, scripts, Deno and pgTAP checks, conventions |
| [Deployment](./deployment.md) | Vercel env, Supabase secrets, migration order, CI/CD, first-deploy checklist |
| [Runbook](./runbook.md) | Incidents: provider outages, quota failures, webhooks, stuck jobs, re-indexing, circuit breakers, key rotation, rollbacks, data deletion |
| [Troubleshooting](./troubleshooting.md) | Symptom-to-cause reference |

## Plans

| Plan | Status |
| :--- | :--- |
| [Company audit and roadmap (2026-11-26)](./superpowers/plans/2026-11-26-company-audit-and-roadmap.md) | Current roadmap, with implementation status at the top |
| [Phase 0 security and crash fixes (2026-11-26)](./superpowers/plans/2026-11-26-phase0-security-and-crash-fixes.md) | Code done; staging apply and pen-test still pending (owner) |
| [SEO optimizations (2026-11-01)](./superpowers/plans/2026-11-01-seo-optimizations.md) | Shipped |
| [AI SEO and GEO enhancements (2026-11-01)](./superpowers/plans/2026-11-01-ai-seo-geo-enhancements.md) | Shipped |

## Historical snapshots

Kept for context; superseded by the roadmap above and not maintained: [Master system architecture](./MASTER_SYSTEM_ARCHITECTURE.md), [cost optimization analysis](./cost-optimization-analysis.md), [SEO audit](./seo-audit-report.md), [AI SEO audit](./ai-seo-audit-report.md), [landing page role-adaptive plan](./LANDING_PAGE_ROLE_ADAPTIVE_UPGRADE_PLAN.md), [role-adaptive customization architecture](./ROLE_ADAPTIVE_CUSTOMIZATION_ARCHITECTURE.md).

## Conventions used in these docs

- Code references are written as `path/to/file.ts` (with `:line` where useful) so they can be opened directly.
- "Edge function" always means a Deno function under `supabase/functions/`, deployed to Supabase.
- Anything described as a *secret* is server-side only and must never appear in a `NEXT_PUBLIC_`-prefixed variable — Next.js exposes those to the browser bundle.
