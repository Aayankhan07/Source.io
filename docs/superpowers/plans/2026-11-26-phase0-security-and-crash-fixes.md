# Phase 0: Security and Crash Fixes — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [x]`) syntax for tracking.

**Goal:** Close the exploits that allow unlimited free AI use or a free "pro" upgrade, and fix the code-level crashes in chat, ingest, notes and quotas. This is Phase 0 of `2026-11-26-company-audit-and-roadmap.md`.

**Architecture:** One new SQL migration fixes database authorization and data-shape bugs. Small pure helper modules in `supabase/functions/_shared/` (CORS, BYOK key resolution, webhook signature) are unit-tested with Vitest and then used by each edge function. The client-side profile queries change to key on `user_id`.

**Tech Stack:** Supabase Postgres 15+ (pgvector), Deno edge functions, Next.js 16 / React 18 client, Vitest 5.

## Global Constraints

- There is no local Postgres, Deno or Supabase CLI on this machine. SQL can't run here: it is applied by the owner with `supabase db push`, **to a staging project first** when one exists.
- `_shared` modules that Vitest tests must have **no runtime URL imports**. Use `import type` for the supabase-js types.
- Don't commit unless the owner asks. Work on branch `fix/phase0-security`.
- The Free plan stays at 25 actions and 2 TTS. Scholar is 200 actions and 50 TTS (roadmap §6.1).
- Circuit breakers **stay fail-open on purpose**. They are a manual kill switch, and if the DB can't be reached, the now fail-closed quota RPC blocks spending anyway.

---

### Task 1: Security migration

**Files:**
- Create: `supabase/migrations/20261126090000_phase0_security_fixes.sql`

Fixes S1 (self-upgrade), B2 (quota RPC uses `id`), the role policy that uses `id`, S5 (view bypasses RLS), the public SELECT on profiles, and B3 (vector dimension).

- [x] **Step 1: Write the migration**

```sql
-- Phase 0 security & correctness fixes (see docs/superpowers/plans/2026-11-26-phase0-security-and-crash-fixes.md)

-- 1. Billing/quota columns on profiles are server-owned.
CREATE OR REPLACE FUNCTION public.protect_profile_billing_columns()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF coalesce(auth.role(), '') NOT IN ('authenticated', 'anon') THEN
    RETURN NEW; -- service_role, postgres, migrations
  END IF;

  IF TG_OP = 'INSERT' THEN
    NEW.tier := 'free';
    NEW.daily_quota_limit := 25;
    NEW.daily_tts_quota_limit := 2;
    NEW.daily_quota_used := 0;
    NEW.daily_tts_quota_used := 0;
    NEW.active_docs_limit := 3;
    NEW.quota_reset_date := CURRENT_DATE;
    RETURN NEW;
  END IF;

  IF NEW.tier IS DISTINCT FROM OLD.tier
     OR NEW.daily_quota_limit IS DISTINCT FROM OLD.daily_quota_limit
     OR NEW.daily_tts_quota_limit IS DISTINCT FROM OLD.daily_tts_quota_limit
     OR NEW.daily_quota_used IS DISTINCT FROM OLD.daily_quota_used
     OR NEW.daily_tts_quota_used IS DISTINCT FROM OLD.daily_tts_quota_used
     OR NEW.active_docs_limit IS DISTINCT FROM OLD.active_docs_limit
     OR NEW.quota_reset_date IS DISTINCT FROM OLD.quota_reset_date
     OR NEW.user_id IS DISTINCT FROM OLD.user_id THEN
    RAISE EXCEPTION 'billing and quota fields are read-only' USING ERRCODE = '42501';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS protect_profile_billing_columns ON public.profiles;
CREATE TRIGGER protect_profile_billing_columns
  BEFORE INSERT OR UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.protect_profile_billing_columns();

-- 2. Profiles are private to their owner (was: viewable by everyone).
DROP POLICY IF EXISTS "Profiles viewable by everyone" ON public.profiles;
DROP POLICY IF EXISTS "Users view own profile" ON public.profiles;
CREATE POLICY "Users view own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = user_id);

-- 3. Role-customization policy compared auth.uid() to the random profiles.id.
DROP POLICY IF EXISTS "Users can update their own profile and preferences" ON public.profiles;
DROP POLICY IF EXISTS "Users update own profile" ON public.profiles;
CREATE POLICY "Users update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- 4. Quota RPCs must match on user_id (profiles.id is a random UUID).
CREATE OR REPLACE FUNCTION public.consume_daily_quota(p_user_id UUID, p_cost INT DEFAULT 1)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_updated BOOLEAN;
BEGIN
  IF p_cost <= 0 THEN
    RAISE EXCEPTION 'Quota cost must be a positive integer';
  END IF;

  UPDATE public.profiles
  SET
    daily_quota_used = CASE
      WHEN quota_reset_date IS NULL OR quota_reset_date < CURRENT_DATE THEN p_cost
      ELSE coalesce(daily_quota_used, 0) + p_cost
    END,
    daily_tts_quota_used = CASE
      WHEN quota_reset_date IS NULL OR quota_reset_date < CURRENT_DATE THEN 0
      ELSE coalesce(daily_tts_quota_used, 0)
    END,
    quota_reset_date = CURRENT_DATE,
    updated_at = NOW()
  WHERE user_id = p_user_id
    AND (
      ((quota_reset_date IS NULL OR quota_reset_date < CURRENT_DATE) AND p_cost <= coalesce(daily_quota_limit, 25))
      OR
      (quota_reset_date = CURRENT_DATE AND (coalesce(daily_quota_used, 0) + p_cost) <= coalesce(daily_quota_limit, 25))
    )
  RETURNING TRUE INTO v_updated;

  RETURN COALESCE(v_updated, FALSE);
END;
$$;

CREATE OR REPLACE FUNCTION public.consume_daily_tts_quota(p_user_id UUID, p_cost INT DEFAULT 1)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_updated BOOLEAN;
BEGIN
  IF p_cost <= 0 THEN
    RAISE EXCEPTION 'TTS quota cost must be a positive integer';
  END IF;

  UPDATE public.profiles
  SET
    daily_quota_used = CASE
      WHEN quota_reset_date IS NULL OR quota_reset_date < CURRENT_DATE THEN 0
      ELSE coalesce(daily_quota_used, 0)
    END,
    daily_tts_quota_used = CASE
      WHEN quota_reset_date IS NULL OR quota_reset_date < CURRENT_DATE THEN p_cost
      ELSE coalesce(daily_tts_quota_used, 0) + p_cost
    END,
    quota_reset_date = CURRENT_DATE,
    updated_at = NOW()
  WHERE user_id = p_user_id
    AND (
      ((quota_reset_date IS NULL OR quota_reset_date < CURRENT_DATE) AND p_cost <= coalesce(daily_tts_quota_limit, 2))
      OR
      (quota_reset_date = CURRENT_DATE AND (coalesce(daily_tts_quota_used, 0) + p_cost) <= coalesce(daily_tts_quota_limit, 2))
    )
  RETURNING TRUE INTO v_updated;

  RETURN COALESCE(v_updated, FALSE);
END;
$$;

REVOKE EXECUTE ON FUNCTION public.consume_daily_quota(UUID, INT) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.consume_daily_quota(UUID, INT) TO service_role;
REVOKE EXECUTE ON FUNCTION public.consume_daily_tts_quota(UUID, INT) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.consume_daily_tts_quota(UUID, INT) TO service_role;

-- 5. Usage view must respect RLS of ai_usage_logs.
ALTER VIEW public.daily_ai_usage SET (security_invoker = true);
REVOKE ALL ON public.daily_ai_usage FROM anon;

-- 6. Embedding column: code writes 768-d vectors, column was vector(1536).
DROP INDEX IF EXISTS public.idx_document_chunks_embedding;
DROP INDEX IF EXISTS public.document_chunks_embedding_idx;
ALTER TABLE public.document_chunks
  ALTER COLUMN embedding TYPE extensions.vector(768)
  USING CASE
    WHEN embedding IS NOT NULL AND extensions.vector_dims(embedding) = 768
      THEN embedding::extensions.vector(768)
    ELSE NULL
  END;
CREATE INDEX IF NOT EXISTS document_chunks_embedding_hnsw
  ON public.document_chunks
  USING hnsw (embedding extensions.vector_cosine_ops)
  WITH (m = 16, ef_construction = 64);
```

- [x] **Step 2: Static check.** Run `grep -n "WHERE id = p_user_id" supabase/migrations/20261126090000_phase0_security_fixes.sql`. Expected: no matches.
- [ ] **Step 3: Owner applies the migration to staging** (`supabase db push`). Then run in the SQL editor as an authenticated user: `update profiles set tier='pro' where user_id = auth.uid();`. Expected: `ERROR: billing and quota fields are read-only`.

---

### Task 2: Shared CORS helper

**Files:**
- Create: `supabase/functions/_shared/cors.ts`
- Test: `supabase/functions/_shared/cors.test.ts`
- Modify: `vitest.config.mts` (add `supabase/functions/_shared/**/*.test.ts` to `include`)
- Modify: `chat`, `generate_notes`, `generate_derivatives`, `generate_podcast`, `ingest` and `embed_chunks` `index.ts` (replace the local CORS constants or functions)

**Interfaces:**
- Produces: `buildCorsHeaders(requestOrigin: string | null, allowedOriginEnv: string | undefined): Record<string,string>` and `corsHeadersFor(req: Request): Record<string,string>`. The second reads `Deno.env` lazily through `globalThis`.

Rules: if the env var is unset or `*`, return `"*"` and **never echo** the request origin. If the env var is a comma list, echo the origin when it is in the list, otherwise return the first entry. Always add `Vary: Origin`.

- [x] **Step 1: Failing test**

```ts
import { describe, it, expect } from "vitest";
import { buildCorsHeaders } from "./cors";

describe("buildCorsHeaders", () => {
  it("uses * when env unset and never echoes origin", () => {
    expect(buildCorsHeaders("https://evil.com", undefined)["Access-Control-Allow-Origin"]).toBe("*");
    expect(buildCorsHeaders("https://evil.com", "*")["Access-Control-Allow-Origin"]).toBe("*");
  });
  it("echoes an allow-listed origin", () => {
    const h = buildCorsHeaders("https://sourceio.app", "https://sourceio.app,http://localhost:3000");
    expect(h["Access-Control-Allow-Origin"]).toBe("https://sourceio.app");
  });
  it("returns first allowed origin for unknown origins", () => {
    const h = buildCorsHeaders("https://evil.com", "https://sourceio.app,http://localhost:3000");
    expect(h["Access-Control-Allow-Origin"]).toBe("https://sourceio.app");
  });
  it("does not allow x-byok headers", () => {
    expect(buildCorsHeaders(null, undefined)["Access-Control-Allow-Headers"]).not.toContain("x-byok");
  });
});
```

- [x] **Step 2:** `npx vitest run supabase/functions/_shared/cors.test.ts`. Expected: FAIL (module missing).
- [x] **Step 3: Implement**

```ts
const ALLOW_HEADERS =
  "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version";

export function buildCorsHeaders(
  requestOrigin: string | null,
  allowedOriginEnv: string | undefined,
): Record<string, string> {
  const list = (allowedOriginEnv ?? "*").split(",").map((s) => s.trim()).filter(Boolean);
  let allowOrigin = "*";
  if (list.length > 0 && !list.includes("*")) {
    allowOrigin = requestOrigin && list.includes(requestOrigin) ? requestOrigin : list[0];
  }
  return {
    "Access-Control-Allow-Origin": allowOrigin,
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": ALLOW_HEADERS,
    Vary: "Origin",
  };
}

export function corsHeadersFor(req: Request): Record<string, string> {
  // deno-lint-ignore no-explicit-any
  const env = (globalThis as any).Deno?.env?.get?.("ALLOWED_ORIGIN") as string | undefined;
  return buildCorsHeaders(req.headers.get("Origin"), env);
}
```

- [x] **Step 4:** Rerun. Expected: PASS.
- [x] **Step 5: Wire it in.** In each function, delete the local `ALLOWED_ORIGIN`/`corsHeaders`/`getCorsHeaders`. Add `import { corsHeadersFor } from "../_shared/cors.ts";` and, as the first line inside `Deno.serve(async (req) => {`, `const corsHeaders = corsHeadersFor(req);`. Any helper outside the handler that uses `corsHeaders` must take it as a parameter.

---

### Task 3: BYOK key resolution (S2, S7 key mix-up)

**Files:**
- Create: `supabase/functions/_shared/byok.ts`
- Test: `supabase/functions/_shared/byok.test.ts`
- Modify: `chat/index.ts:155`, `generate_notes/index.ts:184,255`, `generate_derivatives/index.ts:133,193`, `generate_podcast/index.ts:140`
- Modify: `src/features/documents/pages/DocumentWorkspace.tsx:305,421`

**Interfaces:**
- Produces: `resolveGroqKey(bodyKey: string | undefined | null, platformKey: string | undefined): { apiKey: string | undefined; isByok: boolean }`

- [x] **Step 1: Failing test**

```ts
import { describe, it, expect } from "vitest";
import { resolveGroqKey } from "./byok";

describe("resolveGroqKey", () => {
  it("is BYOK only when the user's key is actually used", () => {
    expect(resolveGroqKey("gsk_user", "gsk_platform")).toEqual({ apiKey: "gsk_user", isByok: true });
  });
  it("falls back to platform key and charges quota", () => {
    expect(resolveGroqKey(undefined, "gsk_platform")).toEqual({ apiKey: "gsk_platform", isByok: false });
    expect(resolveGroqKey("   ", "gsk_platform")).toEqual({ apiKey: "gsk_platform", isByok: false });
  });
  it("rejects non-Groq keys instead of forwarding them to Groq", () => {
    expect(resolveGroqKey("AIzaSyGeminiKey", "gsk_platform")).toEqual({ apiKey: "gsk_platform", isByok: false });
  });
  it("returns undefined when nothing configured", () => {
    expect(resolveGroqKey(undefined, undefined)).toEqual({ apiKey: undefined, isByok: false });
  });
});
```

- [x] **Step 2:** Run it. Expected: FAIL.
- [x] **Step 3: Implement**

```ts
/** Server decides BYOK: true only when the caller's own Groq key will be used upstream. Headers are never trusted. */
export function resolveGroqKey(
  bodyKey: string | undefined | null,
  platformKey: string | undefined,
): { apiKey: string | undefined; isByok: boolean } {
  const user = bodyKey?.trim();
  if (user && user.startsWith("gsk_")) return { apiKey: user, isByok: true };
  return { apiKey: platformKey || undefined, isByok: false };
}
```

- [x] **Step 4:** Rerun. Expected: PASS.
- [x] **Step 5: Wire it in**
  - In `generate_notes` and `generate_derivatives`, replace `const groqApiKey = body.api_key?.trim() || Deno.env.get("GROQ_API_KEY");` with `const { apiKey: groqApiKey, isByok } = resolveGroqKey(body.api_key, Deno.env.get("GROQ_API_KEY"));`. Then delete the later `const isByok = …` line and keep `enforceDailyQuota(admin, userId, corsHeaders, { isByok })`.
  - In `chat`, replace line 155 with `const isByok = false; // chat always uses the platform key`.
  - In `generate_podcast`, replace line 140 with `const isByok = false; // podcast always uses the platform key`.
  - In `DocumentWorkspace.tsx`, at both sites change `apiKey: settings.apiKeys.gemini || settings.apiKeys.groq,` to `apiKey: settings.apiKeys.groq || undefined,`.

---

### Task 4: Quotas fail closed (B5)

**Files:**
- Modify: `supabase/functions/_shared/quotas.ts`
- Test: `supabase/functions/_shared/quotas.test.ts`

**Interfaces:**
- Produces: `consumeDailyQuota(admin, userId, cost?) → Promise<{ allowed: boolean; unavailable?: boolean }>` (the same shape for `consumeDailyTtsQuota`). `enforceDailyQuota` returns 503 `QUOTA_UNAVAILABLE` when the check is unavailable and 429 `QUOTA_EXCEEDED` when the user is over quota.

- [x] **Step 1: Failing test**

```ts
import { describe, it, expect } from "vitest";
import { consumeDailyQuota, enforceDailyQuota, consumeDailyTtsQuota } from "./quotas";

const fakeAdmin = (rpc: () => Promise<unknown>) => ({ rpc }) as never;

describe("quotas fail closed", () => {
  it("denies when RPC errors", async () => {
    const r = await consumeDailyQuota(fakeAdmin(async () => ({ data: null, error: { message: "boom" } })), "u");
    expect(r).toEqual({ allowed: false, unavailable: true });
  });
  it("denies when RPC throws", async () => {
    const r = await consumeDailyTtsQuota(fakeAdmin(async () => { throw new Error("net"); }), "u");
    expect(r).toEqual({ allowed: false, unavailable: true });
  });
  it("allows when RPC returns true", async () => {
    const r = await consumeDailyQuota(fakeAdmin(async () => ({ data: true, error: null })), "u");
    expect(r).toEqual({ allowed: true });
  });
  it("enforce returns 503 when unavailable, 429 when exceeded, null when BYOK", async () => {
    const err = await enforceDailyQuota(fakeAdmin(async () => ({ data: null, error: { message: "x" } })), "u", {}, { isByok: false });
    expect(err?.status).toBe(503);
    const over = await enforceDailyQuota(fakeAdmin(async () => ({ data: false, error: null })), "u", {}, { isByok: false });
    expect(over?.status).toBe(429);
    expect(await enforceDailyQuota(fakeAdmin(async () => ({ data: false, error: null })), "u", {}, { isByok: true })).toBeNull();
  });
});
```

- [x] **Step 2:** Run it. Expected: FAIL (`allowed: true` on error).
- [x] **Step 3: Implement.** Change the import to `import type { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2.57.4";`. Both consume functions: on `error` or a thrown exception, `console.error(...)` and return `{ allowed: false, unavailable: true }`. Remove the fallback to `checkDailyQuota`. In `enforceDailyQuota`, if `quota.unavailable`, return a 503 JSON `{ error: "Usage limits are temporarily unavailable. Please retry in a minute.", code: "QUOTA_UNAVAILABLE", retryable: true }`. In `checkDailyQuota`, return `{ allowed: false, used: 0, remaining: 0 }` on error.
- [x] **Step 4:** Rerun. Expected: PASS.

---

### Task 5: Billing webhook hardening (S3, S4)

**Files:**
- Create: `supabase/functions/_shared/webhookSignature.ts`
- Test: `supabase/functions/_shared/webhookSignature.test.ts`
- Modify: `supabase/functions/billing-webhook/index.ts`
- Modify: `supabase/config.toml` (add `[functions.billing-webhook] verify_jwt = false`)

**Interfaces:**
- Produces: `verifyHmacSha256Hex(secret: string, signatureHex: string, body: string): Promise<boolean>` and `isUuid(v: unknown): v is string`

- [x] **Step 1: Failing test**

```ts
import { describe, it, expect } from "vitest";
import { createHmac } from "node:crypto";
import { verifyHmacSha256Hex, isUuid } from "./webhookSignature";

const body = JSON.stringify({ meta: { event_name: "order_created" } });
const sig = createHmac("sha256", "s3cret").update(body).digest("hex");

describe("webhook signature", () => {
  it("accepts valid signature", async () => { expect(await verifyHmacSha256Hex("s3cret", sig, body)).toBe(true); });
  it("rejects wrong secret, empty secret, empty or malformed signature", async () => {
    expect(await verifyHmacSha256Hex("other", sig, body)).toBe(false);
    expect(await verifyHmacSha256Hex("", sig, body)).toBe(false);
    expect(await verifyHmacSha256Hex("s3cret", "", body)).toBe(false);
    expect(await verifyHmacSha256Hex("s3cret", "zz", body)).toBe(false);
  });
  it("validates uuids", () => {
    expect(isUuid("1b4e28ba-2fa1-11d2-883f-0016d3cca427")).toBe(true);
    expect(isUuid("x,user_id.neq.0")).toBe(false);
  });
});
```

- [x] **Step 2:** Run it. Expected: FAIL.
- [x] **Step 3: Implement**

```ts
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
export function isUuid(v: unknown): v is string {
  return typeof v === "string" && UUID_RE.test(v);
}

export async function verifyHmacSha256Hex(secret: string, signatureHex: string, body: string): Promise<boolean> {
  if (!secret || !signatureHex || !/^[0-9a-f]+$/i.test(signatureHex) || signatureHex.length % 2 !== 0) return false;
  try {
    const bytes = new Uint8Array(signatureHex.length / 2);
    for (let i = 0; i < bytes.length; i++) bytes[i] = parseInt(signatureHex.slice(i * 2, i * 2 + 2), 16);
    const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["verify"]);
    return await crypto.subtle.verify("HMAC", key, bytes, new TextEncoder().encode(body));
  } catch {
    return false;
  }
}
```

- [x] **Step 4:** Rerun. Expected: PASS.
- [x] **Step 5: Rewrite the handler head**
  - If `!WEBHOOK_SECRET`, return 500 `{ error: "Webhook not configured" }`. Lemon Squeezy then retries until the secret is set.
  - Always verify the signature and return 401 if it fails.
  - Take `userId` only from `meta.custom_data.user_id` and require `isUuid`, else return 400. Delete the `display_name` email fallback. The checkout URL in `PlanBillingSettings.tsx:73` already passes `checkout[custom][user_id]`.
  - Replace both `.or(\`id.eq.${userId},user_id.eq.${userId}\`)` with `.eq("user_id", userId)`.

---

### Task 6: Crash fixes (B1, B4)

**Files:**
- Modify: `supabase/functions/chat/index.ts:119`
- Modify: `supabase/functions/ingest/index.ts` (before line 181)
- Modify: `supabase/functions/generate_notes/index.ts:484-497`

- [x] **Step 1:** In chat, change `const { admin, userClient, userId } = auth;` to `const { admin, userClient, userId, apiKey: GROQ_API_KEY } = auth;`.
- [x] **Step 2:** In ingest, at the top of the `Deno.serve` handler body, add `const GROQ_API_KEY = Deno.env.get("GROQ_API_KEY");`.
- [x] **Step 3:** In generate_notes, move `const isRateLimit = status === 429 || errorDetail.includes("TPM") || errorDetail.includes("rate limit");` above the `logAiUsage({...})` call that reads it.
- [x] **Step 4:** Run `grep -n "GROQ_API_KEY" supabase/functions/chat/index.ts supabase/functions/ingest/index.ts`. Every use must have a declaration in scope.

---

### Task 7: Client profile lookups use `user_id`

**Files:**
- Modify: `src/features/settings/context/SettingsContext.tsx:80,155,180,219,245`
- Modify: `src/features/settings/components/PlanBillingSettings.tsx:63`

- [x] **Step 1:** Replace each `.eq("id", session.user.id)` with `.eq("user_id", session.user.id)`. Replace `.or(\`id.eq.${user!.id},user_id.eq.${user!.id}\`)` with `.eq("user_id", user!.id)`.
- [x] **Step 2:** Check that the client never writes the protected columns. `grep -n "tier\|daily_quota\|active_docs_limit" src --include=*.tsx -r | grep -i "update\|upsert"` should return no writes.
- [x] **Step 3:** `npm run typecheck && npm test`. Expected: PASS.

---

### Task 8: Repo hygiene and docs

**Files:**
- Untrack: `supabase/.temp/`, `tsconfig.tsbuildinfo`
- Modify: `supabase/functions/.env.example`, `docs/deployment.md` (verify_jwt section)

- [x] **Step 1:** `git rm --cached -r supabase/.temp tsconfig.tsbuildinfo`. The files stay on disk and are already gitignored.
- [x] **Step 2:** In `supabase/functions/.env.example`, set `ALLOWED_ORIGIN=https://sourceio.app,http://localhost:3000` and add `LEMONSQUEEZY_WEBHOOK_SECRET=`.
- [x] **Step 3:** In `docs/deployment.md`, state that the functions set `verify_jwt = false` on purpose and verify the JWT in code with `authenticateRequest` (`_shared/auth.ts`). Note that `billing-webhook` uses HMAC instead.

---

### Final verification

- [x] `npm run lint && npm run typecheck && npm test`: all pass.
- [x] If available, `npx -y deno@2 check supabase/functions/*/index.ts`. Otherwise record it as a CI item for Phase 1.
- [ ] Hand the owner the staging checklist: push the migration, deploy all functions, set the `ALLOWED_ORIGIN` and `LEMONSQUEEZY_WEBHOOK_SECRET` secrets, then run the pen-test curls (self-upgrade fails, forged webhook gets 401, `x-byok-groq` header still charges quota, free user can chat).

---

## Execution notes (2026-11-26)

Extra issues found and fixed while executing:

- `_shared/auth.ts` imported supabase-js **2.48.1**, which has no `auth.getClaims`. `deno check` failed with TS2339, which means every function using `authenticateRequest` threw at auth time. It is now pinned to 2.57.4, the same as everything else.
- `generate_podcast` skipped the action quota and the TTS quota entirely for `tier = 'pro'`. It now always calls the RPCs, and the per-tier limits live in `profiles`. The ownership check now runs **before** any quota is charged (B8).
- `AIModelSettings.tsx` had the same `.or(id…,user_id…)` profile lookup. It now uses `.eq("user_id", …)`.
- The body types in `generate_derivatives` and `generate_podcast` were missing fields the code reads. With those added, `deno check` passes for all 7 functions.

Verification results:

- `npm test`: 44 tests pass in 9 files, including 16 new ones in `_shared`.
- `npm run typecheck`: passes.
- `npx deno@2 check` on the 7 edited function entry points: 0 errors.
- `deno test generate_podcast/index_test.ts`: 3 tests pass.
- `npm run lint`: 4 errors and 7 warnings, all present before this change. No new problems.
- **Not verified here:** the SQL migration, because no Postgres is available locally. It must be applied to staging and tested there.
