# Source.io Cost-Optimization & AI Architecture Analysis

> **Document Version**: 2.0 (Post-Architectural Audit & Corrections)  
> **Status**: Verified Production Blueprint  
> **Target Stack**: Next.js, Supabase, Deno Edge Functions, pgvector, Groq / Google Gemini / OpenAI

This document provides a production-grade cost-optimization blueprint for **Source.io**. It incorporates senior-architectural corrections regarding semantic vs. lexical retrieval, true provider pricing, context-caching break-even math, server-side security, and a phased implementation roadmap.

---

## 1. What Already Assembles with Source.io

Source.io already implements several foundational cost-saving mechanisms in its active ingestion, edge functions, and client architecture:

| Cost-Cutting Principle | Source.io Implementation | Source File Reference |
| :--- | :--- | :--- |
| **Extract text before LLM (No Vision)** | PDFs are parsed using `unpdf` and Word docs using `mammoth` **directly in the user's browser**. The raw text is saved to `documents.raw_text`. Raw PDF binary is never passed to an expensive vision model. | [`src/lib/services/extract.ts`](file:///d:/PROJECT%20REPOS/Source.io/src/lib/services/extract.ts) |
| **Document Content Deduplication** | `ingest` computes a SHA-256 `content_hash` of the normalized extracted text. If the user previously uploaded the exact same content, it detects `DUPLICATE_OF:<id>` and aborts redundant downstream LLM calls. | [`supabase/functions/ingest/index.ts#L202-L218`](file:///d:/PROJECT%20REPOS/Source.io/supabase/functions/ingest/index.ts#L202-L218) |
| **Single-Call Derivative Generation** | Flashcards (10–20) and practice quiz questions (6–12) are generated together in **a single structured JSON API call** rather than making separate round-trips for each card or question. | [`supabase/functions/generate_derivatives/index.ts`](file:///d:/PROJECT%20REPOS/Source.io/supabase/functions/generate_derivatives/index.ts) |
| **RAG Retrieval with Passage Caps** | Copilot Chat doesn't send the entire document. It queries `match_document_chunks` for the `TOP_K = 6` most relevant passages and limits conversation context to the last 10 messages. | [`supabase/functions/chat/index.ts`](file:///d:/PROJECT%20REPOS/Source.io/supabase/functions/chat/index.ts) |
| **Tiered Model Routing (Fast vs Heavy)** | Chat uses `llama-3.1-8b-instant` on Groq for sub-second, cheap chat responses. Comprehensive notes use larger models (`llama-3.3-70b-versatile` or `gpt-oss-120b`). | [`supabase/functions/chat/index.ts`](file:///d:/PROJECT%20REPOS/Source.io/supabase/functions/chat/index.ts), [`generate_notes/index.ts`](file:///d:/PROJECT%20REPOS/Source.io/supabase/functions/generate_notes/index.ts) |
| **Transcribe Once & Persist** | Audio/video files are transcribed through Groq Whisper once during ingest. The transcript is stored in `documents.raw_text` and reused across Notes, Flashcards, Quizzes, and Chat. | [`supabase/functions/ingest/index.ts#L173-L195`](file:///d:/PROJECT%20REPOS/Source.io/supabase/functions/ingest/index.ts#L173-L195) |
| **Free TTS & Audio Caching** | Podcast generation uses Microsoft Edge TTS WebSocket synthesis ($0 API fee). Generated MP3 audio is stored in Supabase Storage (`podcasts` bucket) and cached on the document so it is never re-synthesized on replay. | [`supabase/functions/generate_podcast/index.ts`](file:///d:/PROJECT%20REPOS/Source.io/supabase/functions/generate_podcast/index.ts) |
| **Hard Input Character Caps** | Ingestion and generation functions enforce hard character cutoffs (`MAX_SOURCE_CHARS = 30_000` to `35_000`) to prevent runaway token usage and comply with rate limits. | [`supabase/functions/generate_notes/index.ts`](file:///d:/PROJECT%20REPOS/Source.io/supabase/functions/generate_notes/index.ts) |

---

## 2. Critical Technical Corrections & Nuances

### ⚠️ A. Local Hashed Embeddings are Lexical, NOT True Semantic Embeddings
* **The Reality**: The FNV-1a hashed unigram/bigram vectors in `embed_chunks` (`embedLocal`) are **deterministic lexical hashes**. They are essentially an in-vector BM25-style keyword overlap system.
* **Failure Modes**: Lexical hashing fails completely when student questions use different vocabulary than the notes:
  - *"Heart attack"* will NOT match a passage about *"myocardial infarction"*.
  - *"Supply and demand"* will NOT match *"market equilibrium"*.
  - *"Photosynthesis creates glucose"* will NOT match *"plants convert light energy into chemical energy"*.
* **Required Action**:
  1. **Benchmark First**: Measure `Recall@K` using 50–100 representative student exam questions with manually labeled gold passages.
  2. **Upgrade Path if Retrieval Quality Fails**:
     - Use a low-cost, high-performing semantic embedding API (e.g. OpenAI `text-embedding-3-small` at **$0.02 / 1M tokens**, or Google Gemini Embedding at **$0.00 / free tier** or fractions of a cent). For an average 10-page lecture (~3,000 words), generating true semantic embeddings costs **$0.00008** — practically negligible compared to LLM generation costs.

---

### ⚠️ B. Do Not Assume Output Tokens Cost 3x–4x More Across All Models
* **The Reality**: Output token ratios vary dramatically by provider and model.
  - On OpenAI `gpt-4o-mini`: Input is $0.15/1M, Output is $0.60/1M (4x ratio).
  - On Google `gemini-2.0-flash`: Input is $0.10/1M, Output is $0.40/1M (4x ratio).
  - On Groq `llama-3.1-8b-instant`: Input is $0.05/1M, Output is $0.08/1M (only 1.6x ratio!).
  - On Groq `llama-3.3-70b-versatile`: Input is $0.59/1M, Output is $0.79/1M (only 1.34x ratio!).
* **Required Action**: Calculate cost from **exact logged token counts multiplied by model-specific pricing**, not an assumed fixed ratio.

---

### ⚠️ C. Context Caching Break-Even Equation: Do Not Blindly Cache at 32k Tokens
* **The Reality**: Context caching is **only cost-effective if multiple queries hit the cache within its Time-To-Live (TTL)**.
* **The Math**:
  $$\text{Net Savings} = (\text{Queries} \times \text{Input Token Discount}) - (\text{Cache Creation Fee} + \text{Storage Fee per Hour})$$
* **Rule**:
  - If a student asks **only 1 question** about a 40k-token PDF, **standard RAG retrieval (top 6 chunks) is significantly cheaper** than creating a context cache.
  - If a student opens an active study session and asks **5+ follow-up tutor questions**, context caching becomes dramatically cheaper.
* **Required Action**: Conditionally enable context caching only when session query frequency indicates a multi-turn deep study session.

---

### ⚠️ D. Microsoft Edge TTS Commercial & Reliability Warning
* **The Reality**: The Edge TTS WebSocket implementation (`en-US-ChristopherNeural`, `en-US-AriaNeural`) relies on Microsoft Edge's browser read-aloud endpoint.
  - It has **no commercial SLA**, is subject to silent rate-limiting or blocking, and can change protocol without notice.
* **Required Action**:
  - Keep Edge TTS for free prototyping/development.
  - Implement a graceful fallback to a standard commercial TTS API (e.g. OpenAI TTS `$0.015/1k chars` or ElevenLabs), or allow the student to use client-side browser `window.speechSynthesis`.
  - Gate audio downloads and status updates strictly on successful synthesis completion.

---

## 3. High-Priority Implementation Roadmap

### Phase 1: Protect the Budget (Immediate Execution)

1. **Enforce `max_completion_tokens` at API Call Level**:
   - `chat`: `max_tokens: 800`
   - `generate_derivatives`: `max_tokens: 2500`
   - `generate_notes`: `max_tokens: 4096`
   - `generate_podcast`: `max_tokens: 1800`

2. **Database-Level Idempotency Keys**:
   - Add a unique index to prevent duplicate in-flight requests from double-clicks or network retries:
     ```sql
     create unique index if not exists ai_jobs_idempotency_key_idx 
     on jobs (idempotency_key);
     ```

3. **In-Flight Job Locks**:
   - If a document has an active `jobs` row with `status = 'processing'` for `action = 'generate_notes'`, reject duplicate trigger attempts with HTTP 409 Conflict.

4. **Server-Side Quotas & Credit Guardrails**:
   - Enforce usage limits in Supabase Edge Functions before calling upstream AI APIs:
     - Free tier: 25 Copilot questions/day, 10 notes generations/month.
     - Paid tier: Expanded or BYOK (Bring Your Own Key).

5. **Cache Generated Assets**:
   - If `notes`, `flashcards`, or `podcasts` already exist for a document version, return existing data unless the user explicitly requests regeneration.

---

### Phase 2: Improve Cost Visibility & Telemetry

#### A. Secure Telemetry Schema (`ai_usage_logs`)
> [!IMPORTANT]
> This table must **NEVER** be writable directly by client applications. All writes must originate from trusted Supabase Edge Functions using the service-role client.

```sql
create table public.ai_usage_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  document_id uuid references public.documents(id) on delete cascade,
  request_id text not null,
  idempotency_key text,
  feature text not null,               -- 'notes' | 'derivatives' | 'chat' | 'podcast' | 'transcribe'
  provider text not null,              -- 'groq' | 'gemini' | 'openai' | 'edge-tts'
  model text not null,
  input_tokens int default 0,
  output_tokens int default 0,
  cached_input_tokens int default 0,
  estimated_cost_usd numeric(12,8) default 0,
  status text not null,                -- 'succeeded' | 'failed' | 'rate_limited'
  duration_ms int,
  error_message text,
  created_at timestamptz default now()
);

-- Secure Row Level Security: Users can read their own logs; only service-role can insert
alter table public.ai_usage_logs enable row level security;

create policy "Users can view own usage logs"
  on public.ai_usage_logs for select
  using (auth.uid() = user_id);
```

#### B. Weighted Credit Accounting
Rather than treating all operations as "1 credit", use an internal weighted consumption model while presenting a unified credit balance to the student:

| Operation | Internal Credit Weight | Real Estimated Cost |
| :--- | :--- | :--- |
| **Short Copilot Chat Answer** | 1 credit | ~$0.0001 |
| **Long Document Deep Reasoning** | 3–5 credits | ~$0.002 |
| **Notes Generation (Standard Lecture)** | 8 credits | ~$0.004 |
| **Flashcards + Quiz Generation** | 8 credits | ~$0.005 |
| **Audio Transcription (Whisper)** | 2 credits per minute | Free tier / $0.0001/min |
| **Podcast Recap Generation** | 10 credits | ~$0.005 |

#### C. Operational Metrics to Monitor
1. **Cost per Uploaded Document** (End-to-end ingest to derivatives).
2. **Cost per Daily Active User (DAU)**.
3. **Duplicate Request Rate** (Requests caught by idempotency keys).
4. **Cache Hit Rate** (Storage audio cache, derivative cache).
5. **Top 1% Highest-Cost Users** (Identify abuse or bot patterns).
6. **RAG Recall@K & Citation Accuracy**.

---

## 4. What is NOT Recommended (Avoid Over-Engineering)

| Anti-Pattern | Why It Should NOT Be Used in Source.io |
| :--- | :--- |
| ❌ **Batch API for Live Study Sessions** | Batch APIs (OpenAI/Gemini) have turnaround times of **up to 24 hours**. Students uploading slides before class expect notes in **5–15 seconds**. A 24-hour delay destroys the product's core value proposition. |
| ❌ **Hierarchical Map-Reduce Summarization** | Modern models (Llama 70B 128k, Gemini 1M) easily process 30k–100k characters in a **single pass**. Splitting into 5–10 sections and running iterative summaries multiplies total token usage and latency. |
| ❌ **Full Cloud OCR on Every Document** | Cloud OCR (AWS Textract / Google Cloud Vision) costs $1.50 per 1,000 pages. 95%+ of student uploads are digital PDFs/DOCX where client-side parsing (`unpdf`) is **100% free and instant**. OCR should only be a manual fallback toggle for scanned images. |
| ❌ **Dedicated Queue Servers (Celery / Kafka / RabbitMQ)** | Requires maintaining always-on server infrastructure with monthly hosting fees. Supabase Edge Functions with Postgres `jobs` rows provide serverless async state transitions at **$0 extra hosting cost**. |

---

## 5. Dynamic Model Routing Matrix

| Feature | Recommended Model | Provider | Cost Profile | Latency | Policy |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Document Classification** | Client Regex / `llama-3.1-8b-instant` | Local / Groq | Near zero | < 200ms | Parse in browser where possible |
| **Text Extraction (PDF / DOCX)** | `unpdf` / `mammoth` | Browser Client | $0.00 | Instant | Digital extraction first |
| **Audio/Video Transcription** | `whisper-large-v3` | Groq | Cheap | ~10s | Transcribe once, persist in DB |
| **Passage Embeddings** | Deterministic n-grams → `text-embedding-3-small` | Deno / OpenAI | $0.00 to $0.02/1M | Instant | Benchmark Recall@K first |
| **Study Notes Generation** | `llama-3.3-70b-versatile` or `gemini-2.0-flash` | Groq / Google | Minimal | 3–6s (SSE) | Single-pass structured output |
| **Flashcards & Practice Quiz** | `llama-3.3-70b-versatile` | Groq | Minimal | 2–4s | Single combined JSON call |
| **Copilot Chat (RAG)** | `llama-3.1-8b-instant` | Groq | Near zero | < 500ms | Top-6 chunks, last 10 messages |
| **Deep Tutoring / Complex Math** | `gemini-2.5-pro` or `gpt-4o-mini` | Google / OpenAI | Higher | 4–8s | Premium / BYOK feature |
| **Podcast Script Generation** | `llama-3.3-70b-versatile` | Groq | Minimal | ~3s | Single pass dialogue generation |
| **Podcast Audio Synthesis** | Microsoft Edge TTS (with paid fallback) | WebSocket | $0.00 | ~10s | Cache MP3 in Supabase Storage |

---

## 6. Actionable Summary Scorecard

| Initiative | Status | Action Item |
| :--- | :--- | :--- |
| Client-side text extraction | ✅ **Assembled** | Maintain current `extract.ts` implementation |
| Document deduplication | ✅ **Assembled** | SHA-256 content hash check active in `ingest` |
| Combined Derivative generation | ✅ **Assembled** | Single JSON call for flashcards + quiz |
| RAG retrieval with passage limits | ✅ **Assembled** | Top-6 chunks, last 10 messages |
| Free podcast voice generation | ✅ **Assembled** | Edge TTS + Supabase Storage audio cache |
| API-level `max_completion_tokens` | 🚀 **Phase 1** | Add explicit token limits to all edge function calls |
| Unique DB Idempotency Key Index | 🚀 **Phase 1** | Add unique index on `jobs.idempotency_key` |
| Server-side Quotas & Daily Limits | 🚀 **Phase 1** | Add daily chat limits (25/day) on free profiles |
| Secure `ai_usage_logs` telemetry | 🚀 **Phase 2** | Deploy usage table with RLS and cost estimation |
| Retrieval Benchmark (Recall@K) | 🚀 **Phase 2** | Test local hashed vectors vs semantic embeddings |
| Conditional Gemini Context Caching | 🚀 **Phase 2** | Enable only for multi-query deep study sessions |
| Batch API for live study flow | 🔴 **Rejected** | Avoid 24h turnaround latency in study sessions |
| Full OCR pipeline on all PDFs | 🔴 **Rejected** | Keep digital extraction free in browser |
| Enterprise message queues | 🔴 **Rejected** | Keep serverless Supabase Edge Functions |
