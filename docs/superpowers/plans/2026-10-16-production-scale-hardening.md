# Production-Scale Hardening & High-Concurrency Architecture Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Harden Source.io from early-adopter V1 launch (~500–1,000 active users) to heavy concurrent production scale (5,000–50,000+ active students) by eliminating 5 specific architectural bottlenecks: memory-saturated `pgvector` HNSW indexes, Edge Function timeouts on 300-page textbooks, TOCTOU quota race conditions, unthrottled podcast TTS costs, and missing billing webhook fulfillment.

**Architecture:** 
1. Database layer: Enforce atomic row-level locking via PostgreSQL RPC (`consume_daily_quota`) to stop concurrency exploits, and optimize `pgvector` from 1536d `float32` to 768d `halfvec` to cut index RAM usage by 75%.
2. Ingestion layer: Decouple monolithic 300-page ingestion into progressive 50-paragraph batch embedding jobs tracked through `public.jobs`.
3. Audio layer: Decouple cheap podcast script synthesis from expensive audio TTS binaries, enforcing a 1–2 studio render cap per day on free tier while keeping BYOK unlimited.
4. Billing layer: Deploy a secure Lemon Squeezy / Paddle webhook handler (`/functions/v1/billing-webhook`) with HMAC signature verification to automate $9/mo Scholar Pass provisioning.

**Tech Stack:** Next.js 16 (Turbopack), Supabase PostgreSQL 15, `pgvector` 0.7+ (`halfvec`), Deno Edge Functions, Lemon Squeezy Webhooks, Tailwind CSS (Paper & Obsidian Ink).

**Spec Reference:** [`docs/MASTER_SYSTEM_ARCHITECTURE.md`](file:///d:/PROJECT%20REPOS/Source.io/docs/MASTER_SYSTEM_ARCHITECTURE.md)

---

## Global Constraints

- **Design System:** Maintain 100% monochrome "Editorial Paper & Obsidian Ink" aesthetic across all new UI components. No cartoon colors, no gradients, no emojis.
- **Zero-Retention BYOK Contract:** Never write user BYOK keys (`x-byok-gemini`, `x-byok-groq`) to PostgreSQL, Redis, or server logs.
- **Backwards Compatibility:** Keep existing free tier defaults (25 daily AI generation actions, 3 active document slots) fully functional without requiring user migration.
- **Type Safety:** Maintain zero TypeScript and Turbopack compiler errors across both Next.js frontend and Deno Edge Functions.

## Review Focus

1. **TOCTOU Concurrency Burst:** 20 parallel `fetch` calls to `/functions/v1/generate_notes` by the same user with `daily_quota_used = 24` must allow exactly 1 request to proceed and immediately reject the remaining 19 with HTTP 429.
2. **Textbook Ingestion Boundary:** A 300-page PDF (~450 passages) must not exceed Deno Edge's 150 MB memory ceiling or 2-second CPU cap.
3. **Vector Dimension Mismatch:** Any change to `document_chunks.embedding` must ensure `embedLocal` / `match_document_chunks` use identical vector dimension signatures (768d).
4. **Forged Billing Webhooks:** Webhook payloads without a valid Lemon Squeezy HMAC SHA256 signature must be rejected with HTTP 401 before any database modification.
5. **TTS Audio Cost Runaway:** Free users must be prevented from spamming dual-voice TTS binary generation while retaining full access to read and regenerate text transcripts.

---

## File Structure & Responsibilities

| File Path | Responsibility |
| :--- | :--- |
| `supabase/migrations/20260421000000_atomic_quota_rpc.sql` | PostgreSQL RPC function `consume_daily_quota` with atomic row-level update locking. |
| `supabase/migrations/20260421000001_halfvec_optimization.sql` | Schema migration optimizing `document_chunks.embedding` to `halfvec(768)` and composite document index. |
| `supabase/functions/generate_notes/index.ts` | Wire atomic `consume_daily_quota` RPC call before LLM invocation. |
| `supabase/functions/generate_derivatives/index.ts` | Wire atomic `consume_daily_quota` RPC call for flashcards and quizzes. |
| `supabase/functions/embed_chunks/index.ts` | Update deterministic embedding generator to 768 dimensions matching `halfvec(768)`. |
| `supabase/functions/billing-webhook/index.ts` | Lemon Squeezy webhook handler verifying HMAC signatures and upgrading `profiles.tier`. |
| `src/features/documents/components/UploadDialog.tsx` | Progressive batching coordinator for large textbooks (50-chunk batches). |
| `src/features/dashboard/components/TactileLeftDock.tsx` | Upgrade button linking to Lemon Squeezy checkout. |
| `docs/MASTER_SYSTEM_ARCHITECTURE.md` | Master technical specification synchronized with hardened scaling contracts. |

---

## Phased Implementation Tasks

### Phase 1: Atomic Quota Concurrency Protection (P0 - Immediate)

#### Task 1: Create Atomic `consume_daily_quota` PostgreSQL Migration
**Files:**
- Create: `supabase/migrations/20260421000000_atomic_quota_rpc.sql`
- Test: Execute SQL via Supabase Management API or local migration test

**Interfaces:**
- Consumes: `auth.uid()` or `p_user_id UUID`, `p_cost INT DEFAULT 1`
- Produces: `BOOLEAN` (`TRUE` if quota was available and successfully decremented, `FALSE` if limit reached)

- [x] **Step 1: Write SQL migration file**
```sql
-- Atomic daily quota consumption with row-level locking
CREATE OR REPLACE FUNCTION public.consume_daily_quota(
  p_user_id UUID,
  p_cost INT DEFAULT 1
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_updated BOOLEAN;
BEGIN
  -- Perform atomic update with condition check in a single statement
  UPDATE public.profiles
  SET daily_quota_used = daily_quota_used + p_cost,
      updated_at = NOW()
  WHERE id = p_user_id
    AND (daily_quota_used + p_cost) <= daily_quota_limit
  RETURNING TRUE INTO v_updated;

  RETURN COALESCE(v_updated, FALSE);
END;
$$;
```

- [x] **Step 2: Run verification query in Supabase SQL editor**
```sql
SELECT public.consume_daily_quota('guest-user-01', 1);
```
Expected: Returns `TRUE` when quota remains, `FALSE` once `daily_quota_used >= daily_quota_limit`.

- [x] **Step 3: Commit migration**
```bash
git add supabase/migrations/20260421000000_atomic_quota_rpc.sql
git commit -m "feat(db): add atomic consume_daily_quota rpc function"
```

---

#### Task 2: Wire Edge Functions to Atomic Quota RPC
**Files:**
- Modify: `supabase/functions/generate_notes/index.ts`
- Modify: `supabase/functions/generate_derivatives/index.ts`

**Interfaces:**
- Consumes: `admin.rpc("consume_daily_quota", { p_user_id: user.id, p_cost: 1 })`
- Produces: HTTP 429 response if `false`, proceeds with streaming if `true`

- [x] **Step 1: Update `generate_notes/index.ts`**
Replace naive `SELECT daily_quota_used` check with atomic RPC call:
```typescript
if (!isByok) {
  const { data: allowed, error: quotaErr } = await admin.rpc("consume_daily_quota", {
    p_user_id: user.id,
    p_cost: 1,
  });

  if (quotaErr || !allowed) {
    return new Response(
      JSON.stringify({
        error: "Daily AI generation limit reached (25/25 actions). Upgrade to Scholar Pass or provide personal BYOK keys.",
        code: "QUOTA_EXCEEDED",
      }),
      { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
}
```

- [x] **Step 2: Update `generate_derivatives/index.ts` with identical atomic check**

- [x] **Step 3: Deploy updated Edge Functions to Supabase**
```bash
supabase functions deploy generate_notes --project-ref vcevdkggfbhftaegkkkk
supabase functions deploy generate_derivatives --project-ref vcevdkggfbhftaegkkkk
```

- [x] **Step 4: Commit Edge Function updates**
```bash
git add supabase/functions/
git commit -m "fix(edge): enforce atomic rpc quota consumption across notes and derivatives"
```

---

### Phase 2: `pgvector` HNSW Memory Optimization (`halfvec(768)`)

#### Task 3: Vector Dimension & Index Compression Migration
**Files:**
- Create: `supabase/migrations/20260421000001_halfvec_optimization.sql`
- Modify: `supabase/functions/embed_chunks/index.ts`
- Modify: `supabase/functions/chat/index.ts`

**Interfaces:**
- Consumes: `EMBED_DIMS = 768` (down from 1536)
- Produces: 75% reduction in HNSW index RAM footprint with composite index on `(document_id, embedding)`

- [x] **Step 1: Write SQL migration for `halfvec(768)`**
```sql
-- Ensure pgvector extension version supports halfvec
CREATE EXTENSION IF NOT EXISTS vector;

-- Alter column to halfvec(768)
ALTER TABLE public.document_chunks 
  ALTER COLUMN embedding TYPE extensions.halfvec(768);

-- Drop legacy unpartitioned index if exists
DROP INDEX IF EXISTS public.idx_document_chunks_embedding;
DROP INDEX IF EXISTS public.document_chunks_embedding_idx;

-- Create composite index optimizing per-document similarity retrieval
CREATE INDEX idx_document_chunks_doc_halfvec 
ON public.document_chunks (document_id, embedding);

-- Update match_document_chunks RPC signature to accept halfvec(768)
CREATE OR REPLACE FUNCTION public.match_document_chunks(
  _document_id uuid,
  _query_embedding extensions.halfvec(768),
  _match_count int DEFAULT 6
)
RETURNS TABLE (id uuid, chunk_text text, order_index int, similarity float)
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = public, extensions
AS $$
  SELECT id, chunk_text, order_index,
         1 - (embedding <=> _query_embedding) AS similarity
  FROM public.document_chunks
  WHERE document_id = _document_id
    AND embedding IS NOT NULL
  ORDER BY embedding <=> _query_embedding
  LIMIT _match_count;
$$;
```

- [x] **Step 2: Update `embed_chunks/index.ts` dimension constant**
Change `const EMBED_DIMS = 1536;` to `const EMBED_DIMS = 768;`.

- [x] **Step 3: Update `chat/index.ts` query embedding constant**
Ensure query embedding vector matches 768 dimensions.

- [x] **Step 4: Deploy and commit**
```bash
git add supabase/migrations/ supabase/functions/
git commit -m "perf(rag): migrate vector storage to halfvec(768) for 75% ram reduction"
```

---

### Phase 3: Progressive Batched Ingestion for 300-Page Books

#### Task 4: Client-Side Batch Chunking Coordinator
**Files:**
- Modify: `src/features/documents/components/UploadDialog.tsx`
- Modify: `supabase/functions/embed_chunks/index.ts`

**Interfaces:**
- Consumes: Extracted document text, splits into batches of 50 chunks
- Produces: Batched POST requests to `/functions/v1/embed_chunks` with progressive progress bar feedback

- [x] **Step 1: Implement batch chunking helper in `UploadDialog.tsx`**
```typescript
const CHUNK_BATCH_SIZE = 50;

async function ingestInBatches(documentId: string, chunks: string[], onProgress: (pct: number) => void) {
  const totalBatches = Math.ceil(chunks.length / CHUNK_BATCH_SIZE);
  
  for (let b = 0; b < totalBatches; b++) {
    const batch = chunks.slice(b * CHUNK_BATCH_SIZE, (b + 1) * CHUNK_BATCH_SIZE);
    
    const res = await fetch(`${SUPABASE_URL}/functions/v1/embed_chunks`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${sessionToken}`,
      },
      body: JSON.stringify({
        document_id: documentId,
        chunks: batch,
        batch_index: b,
        total_batches: totalBatches,
      }),
    });

    if (!res.ok) throw new Error(`Batch ${b + 1} ingestion failed`);
    onProgress(Math.round(((b + 1) / totalBatches) * 100));
  }
}
```

- [x] **Step 2: Update `embed_chunks/index.ts` to accept pre-chunked batches**
Append chunks without clearing existing batches until the final batch index completes.

- [x] **Step 3: Verify build**
Run `npm run build` to verify zero frontend compilation errors.

- [x] **Step 4: Commit**
```bash
git add src/features/documents/components/UploadDialog.tsx supabase/functions/embed_chunks/
git commit -m "feat(ingest): add progressive batched ingestion for 300+ page documents"
```

---

### Phase 4: Podcast TTS Cost Protection & Asynchronous Jobs

#### Task 5: Decouple Podcast Script from Audio Binaries
**Files:**
- Modify: `supabase/functions/generate_derivatives/index.ts`
- Modify: `src/features/documents/components/AudioPodcastPlayer.tsx`
- Modify: `supabase/migrations/20260421000002_podcast_tts_quota.sql`

**Interfaces:**
- Script generation: Free (up to 25 daily actions).
- Studio Audio TTS: Restricted to 2 generations/day on free tier; unlimited on BYOK / Scholar Pass.

- [x] **Step 1: Add TTS audio quota tracking column**
```sql
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS daily_tts_quota_used INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS daily_tts_quota_limit INTEGER DEFAULT 2;
```

- [x] **Step 2: Guard studio audio generation in Edge Function**
Allow script creation unconditionally within the 25 general quota; verify TTS audio quota before synthesizing voice binaries.

- [x] **Step 3: Commit**
```bash
git add supabase/
git commit -m "feat(podcast): decouple script generation from tts audio and enforce free-tier quota"
```

---

### Phase 5: Lemon Squeezy Merchant of Record Webhook Fulfillment

#### Task 6: Deploy Billing Webhook Edge Function
**Files:**
- Create: `supabase/functions/billing-webhook/index.ts`
- Modify: `src/features/dashboard/components/TactileLeftDock.tsx`
- Modify: `src/features/settings/WorkspaceSettings.tsx`

**Interfaces:**
- Consumes: Lemon Squeezy webhook payloads with `x-signature` HMAC verification
- Produces: Updates `profiles.tier = 'pro'` and `profiles.daily_quota_limit = 200` on active subscription

- [x] **Step 1: Write `billing-webhook/index.ts` with HMAC signature check**
```typescript
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.4";
import { crypto } from "https://deno.land/std@0.168.0/crypto/mod.ts";

const WEBHOOK_SECRET = Deno.env.get("LEMONSQUEEZY_WEBHOOK_SECRET") ?? "";

serve(async (req) => {
  if (req.method !== "POST") return new Response("Method not allowed", { status: 405 });

  const rawBody = await req.text();
  const signature = req.headers.get("x-signature") ?? "";

  // Verify HMAC SHA-256 signature
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(WEBHOOK_SECRET),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["verify"]
  );

  const isValid = await crypto.subtle.verify(
    "HMAC",
    key,
    hexToBytes(signature),
    new TextEncoder().encode(rawBody)
  );

  if (!isValid) {
    return new Response(JSON.stringify({ error: "Invalid signature" }), { status: 401 });
  }

  const payload = JSON.parse(rawBody);
  const eventName = payload.meta?.event_name;
  const customData = payload.meta?.custom_data;
  const userId = customData?.user_id;

  if (!userId) return new Response("Missing user_id", { status: 400 });

  const admin = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  if (eventName === "subscription_created" || eventName === "order_created") {
    await admin.from("profiles").update({
      tier: "pro",
      daily_quota_limit: 200,
      updated_at: new Date().toISOString(),
    }).eq("id", userId);
  } else if (eventName === "subscription_cancelled" || eventName === "subscription_expired") {
    await admin.from("profiles").update({
      tier: "free",
      daily_quota_limit: 25,
      updated_at: new Date().toISOString(),
    }).eq("id", userId);
  }

  return new Response(JSON.stringify({ received: true }), { status: 200 });
});

function hexToBytes(hex: string): Uint8Array {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < bytes.length; i++) {
    bytes[i] = parseInt(hex.substr(i * 2, 2), 16);
  }
  return bytes;
}
```

- [x] **Step 2: Add Scholar Pass checkout trigger in `TactileLeftDock.tsx` & Settings**
Render monochrome "Scholar Pass ($9/mo)" trigger passing `user.id` as custom checkout parameter.

- [x] **Step 3: Commit billing infrastructure**
```bash
git add supabase/functions/billing-webhook/ src/features/
git commit -m "feat(billing): add lemon squeezy webhook handler and scholar pass checkout trigger"
```

---

### Phase 6: Architecture Document Synchronization

#### Task 7: Update `MASTER_SYSTEM_ARCHITECTURE.md`
**Files:**
- Modify: `docs/MASTER_SYSTEM_ARCHITECTURE.md`

- [x] **Step 1: Document `consume_daily_quota` atomic RPC in Section 7**
- [x] **Step 2: Update Section 9 with `halfvec(768)` vector type and indexing strategy**
- [x] **Step 3: Add Section 10.4 defining Lemon Squeezy MoR Webhook Contract**
- [x] **Step 4: Commit architecture doc**
```bash
git add docs/MASTER_SYSTEM_ARCHITECTURE.md
git commit -m "docs: document production scaling architecture, halfvec rag, and billing webhook"
```

---

## Scalability Roadmap by Concurrent User Milestones

| Stage | Concurrent Volume | Architecture Status | Core Operations |
| :--- | :--- | :--- | :--- |
| **V1 Launch** | 1 – 1,000 Users (<50k chunks) | **100% Ready** | Client-side `unpdf` parsing, BYOK offload, atomic RPC quota decrementing. |
| **Stage 2: Growth** | 1,000 – 10,000 Users (500k chunks) | **Hardened via this Plan** | `halfvec(768)` vector storage, 50-chunk batched ingestion, Lemon Squeezy MoR billing. |
| **Stage 3: Enterprise Scale** | 10,000 – 100,000+ Users (5M+ chunks) | **Queue / Read Replica Upgrade** | Supavisor pooler `:6543`, `pgmq` async worker queue for audio/embeddings, automated 30d chunk archival. |
