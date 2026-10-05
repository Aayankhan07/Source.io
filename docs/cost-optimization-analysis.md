# Source.io Cost-Optimization & AI Architecture Analysis

This document audits the AI cost-cutting strategies against Source.io's actual production codebase (Next.js, Supabase, Deno Edge Functions, Groq/Gemini/OpenAI, and pgvector). It breaks down:
1. **What is Already Assembled in Source.io** (Existing implementations).
2. **What is Strongly Recommended to Implement** (High-impact, low-friction optimizations).
3. **What is NOT Recommended / Anti-Patterns for Our Stage** (Premature complexity & poor UX trade-offs).
4. **Actionable Implementation Roadmap & Model Routing Matrix**.

---

## 1. What Already Assembles with Source.io

Source.io already implements several foundational cost-saving mechanisms in its ingestion, edge functions, and client architecture:

| Cost-Cutting Principle | Source.io Implementation | Source File Reference |
| :--- | :--- | :--- |
| **Extract text before LLM (No Vision)** | PDFs are parsed using `unpdf` and Word docs using `mammoth` **directly in the user's browser**. The raw text is saved to `documents.raw_text`. Raw PDF binary is never passed to an expensive vision model. | [`src/lib/services/extract.ts`](file:///d:/PROJECT%20REPOS/Source.io/src/lib/services/extract.ts) |
| **Document Content Deduplication** | `ingest` computes a SHA-256 `content_hash` of the extracted text. If the user previously uploaded the exact same content, it detects `DUPLICATE_OF:<id>` and aborts redundant downstream LLM calls. | [`supabase/functions/ingest/index.ts#L202-L218`](file:///d:/PROJECT%20REPOS/Source.io/supabase/functions/ingest/index.ts#L202-L218) |
| **Batch Derivatives (Flashcards + Quiz)** | Flashcards (10-20) and Quiz questions (6-12) are generated together in **a single structured JSON API call** rather than making separate round-trips for each card or question. | [`supabase/functions/generate_derivatives/index.ts`](file:///d:/PROJECT%20REPOS/Source.io/supabase/functions/generate_derivatives/index.ts) |
| **$0 Cost Embeddings** | Document chunk indexing uses deterministic FNV-1a hashed unigram/bigram embeddings (`embedLocal`, 1536-d). It runs natively in Deno without calling paid external embedding APIs (like OpenAI `text-embedding-3`). | [`supabase/functions/embed_chunks/index.ts#L37-L62`](file:///d:/PROJECT%20REPOS/Source.io/supabase/functions/embed_chunks/index.ts#L37-L62) |
| **RAG Retrieval with Passage Caps** | Copilot Chat doesn't send the full document. It queries `match_document_chunks` for the `TOP_K = 6` most relevant passages and limits conversation context to the last 10 messages. | [`supabase/functions/chat/index.ts`](file:///d:/PROJECT%20REPOS/Source.io/supabase/functions/chat/index.ts) |
| **Tiered Model Routing (Fast vs Heavy)** | Chat uses `llama-3.1-8b-instant` on Groq for sub-second, ultra-cheap chat responses. Comprehensive notes use larger models (`llama-3.3-70b` or `gpt-oss-120b`). | [`supabase/functions/chat/index.ts`](file:///d:/PROJECT%20REPOS/Source.io/supabase/functions/chat/index.ts), [`generate_notes/index.ts`](file:///d:/PROJECT%20REPOS/Source.io/supabase/functions/generate_notes/index.ts) |
| **Transcribe Once & Persist** | Audio/video files are transcribed through Groq Whisper once during ingest. The transcript is stored in `documents.raw_text` and reused across Notes, Flashcards, Quizzes, and Chat. | [`supabase/functions/ingest/index.ts#L173-L195`](file:///d:/PROJECT%20REPOS/Source.io/supabase/functions/ingest/index.ts#L173-L195) |
| **Free TTS & Audio Caching** | Podcast generation uses Microsoft Edge TTS WebSocket synthesis ($0 API fee). Generated MP3 audio is stored in Supabase Storage (`podcasts` bucket) and cached on the document so it is never re-synthesized on replay. | [`supabase/functions/generate_podcast/index.ts`](file:///d:/PROJECT%20REPOS/Source.io/supabase/functions/generate_podcast/index.ts) |
| **Strict Input Character Caps** | Ingestion and generation functions enforce hard character cutoffs (`MAX_SOURCE_CHARS = 30_000` to `35_000`) to prevent runaway token usage and comply with rate limits. | [`supabase/functions/generate_notes/index.ts`](file:///d:/PROJECT%20REPOS/Source.io/supabase/functions/generate_notes/index.ts) |

---

## 2. What is Strongly Recommended to Implement

These are high-impact optimizations that will immediately lower our operational bills, prevent abuse, and improve system reliability:

### A. API-Level Token Ceilings (`max_completion_tokens`)
* **Problem**: Prompts tell the model "keep it under 40 words", but if the model enters a verbose loop or hallucinations occur, output tokens can blow up. Output tokens cost 3x-4x more than input tokens.
* **Recommendation**: Enforce explicit `max_tokens` (or `max_completion_tokens`) on every API request in Supabase Edge Functions:
  - Chat answers: `max_tokens: 800`
  - Flashcards & Quiz: `max_tokens: 2500`
  - Notes generation: `max_tokens: 4096`

### B. Gemini Prompt & Context Caching
* **Problem**: When a student asks 10 questions about a 50-page biology lecture, the system prompt and document context are resent repeatedly.
* **Recommendation**: For documents over ~32k tokens on Gemini (e.g. `gemini-2.0-flash` or `gemini-1.5-flash`), leverage **Gemini Context Caching**:
  - Cached input tokens get a **75% to 80% discount** compared to standard input token pricing.
  - Structure messages with static system instructions and document context first, followed by dynamic query inputs at the end.

### C. Idempotency & Debounce Locks
* **Problem**: Double-clicking "Generate Notes", "Generate Flashcards", or fast network retries can spin up parallel edge function executions for the same document, doubling costs.
* **Recommendation**: 
  - Add an in-progress check in edge functions (`jobs` table lock with status `in_progress`).
  - Pass an idempotency key (e.g. `document_id + action + version_hash`) to reject duplicate concurrent calls.

### D. Per-User Usage Quotas & Credit Limits
* **Problem**: Free-tier users can run unlimited chat questions or repeatedly trigger derivative regeneration, causing unpredictable API spikes.
* **Recommendation**:
  - Store `ai_credits_used` or `monthly_generations_count` in the `profiles` table.
  - Implement a daily cap on Ask Copilot questions (e.g., 25 questions/day for free users).
  - Show a friendly upgrade/credit badge when approaching limits.

### E. AI Request Telemetry Table (`ai_usage_logs`)
* **Problem**: We currently do not record the exact token consumption or cost per user and feature.
* **Recommendation**:
  - Create a lightweight Supabase table `ai_usage_logs`:
    ```sql
    create table ai_usage_logs (
      id uuid primary key default gen_random_uuid(),
      user_id uuid references auth.users(id),
      document_id uuid references documents(id),
      feature text not null, -- 'notes' | 'derivatives' | 'chat' | 'podcast'
      provider text not null, -- 'groq' | 'gemini' | 'openai'
      model text not null,
      prompt_tokens int,
      completion_tokens int,
      cached_tokens int default 0,
      duration_ms int,
      created_at timestamptz default now()
    );
    ```
  - This allows tracking exact cost per feature and spotting anomalous users.

---

## 3. What is NOT Recommended (or Anti-Patterns for Our Stage)

Some recommendations in general cost guides sound good on paper but represent **premature optimization, severe degradation of user experience, or architectural bloat** for Source.io:

### ❌ 1. Using the Batch API for Interactive Study Notes (NOT Recommended)
* **The Claim**: "Use the Batch API because it has a 50% discount."
* **Why NOT for Source.io**: 
  - Batch APIs (OpenAI/Gemini) have turnaround windows of **up to 24 hours**. 
  - When a student uploads lecture slides 30 minutes before class or study group, they expect notes and flashcards within 5 to 15 seconds. Waiting hours for a batch job breaks the core product loop.
  - **Verdict**: Only consider Batch API if offering a background "Bulk Semester Syllabus Ingest" feature for paid university tier uploads.

### ❌ 2. Heavy Multi-Agent / Multi-Pass Hierarchical Summarization (NOT Recommended)
* **The Claim**: "Summarize hierarchically: summarize section 1, summarize section 2, then summarize summaries."
* **Why NOT for Source.io**:
  - Modern LLMs (Llama 3.3 70B with 128k context, Gemini with 1M context) can easily ingest 20k to 50k tokens in a **single pass**.
  - Making 5 to 10 sequential LLM calls to summarize sections and then combining them actually **multiplies total input and output token consumption**, adds latency, and increases failure points.
  - **Verdict**: Keep single-pass structured extraction with strict prompt section templates.

### ❌ 3. Full OCR Pipeline on Every Document (NOT Recommended)
* **The Claim**: "Run OCR on uploaded files."
* **Why NOT for Source.io**:
  - Cloud OCR (Google Cloud Vision or AWS Textract) costs $1.50 per 1,000 pages and adds heavy server latency.
  - 95%+ of student uploads are native digital PDFs, DOCX, or YouTube URLs where text extraction in the browser (`unpdf`/`mammoth`) is **100% free and instantaneous**.
  - **Verdict**: Only trigger client-side Tesseract.js or targeted OCR if extracted text has fewer than 20 characters and the user explicitly confirms the document is scanned.

### ❌ 4. Enterprise Message Queues (Celery / Kafka / RabbitMQ) (NOT Recommended)
* **The Claim**: "Queue requests during high demand with dedicated message brokers."
* **Why NOT for Source.io**:
  - Requires maintaining always-on Redis/Celery/RabbitMQ server infrastructure, increasing fixed hosting costs.
  - Supabase Edge Functions + Postgres `jobs` row status (`pending` → `processing` → `ready`) handle async state transitions serverlessly with zero extra infrastructure cost.
  - **Verdict**: Stick with Supabase Edge Functions and optimistic UI status indicators.

---

## 4. Source.io Model Routing Matrix

To maximize intelligence while keeping inference costs near zero, use this cost-tiered model routing:

| Action / Feature | Recommended Model | Provider | Cost Profile | Latency |
| :--- | :--- | :--- | :--- | :--- |
| **Document Classification & Metadata** | Client regex / `llama-3.1-8b-instant` | Groq / Local | ~$0.00 | < 300ms |
| **Text Extraction (PDF / DOCX)** | Browser native (`unpdf`, `mammoth`) | Local (Client) | $0.00 | Instant |
| **Audio/Video Transcription** | `whisper-large-v3` | Groq | Free tier / $0.0001/min | ~5-15s |
| **Vector Embeddings** | Hashed deterministic n-grams | Local Deno | $0.00 | Instant |
| **Notes Generation (Core)** | `llama-3.3-70b-versatile` or `gemini-2.0-flash` | Groq / Gemini | Minimal | 3-6s (SSE stream) |
| **Flashcards & Quiz Generation** | `llama-3.3-70b-versatile` (Single combined call) | Groq | Minimal | 2-4s |
| **Copilot Chat (RAG Q&A)** | `llama-3.1-8b-instant` (Top 6 passages) | Groq | Near zero | < 500ms |
| **Deep Reasoning & Hard Explanations** | `gemini-2.5-pro` or `gpt-4o-mini` | BYOK / Premium | Higher | 4-8s |
| **Podcast Script Generation** | `llama-3.3-70b-versatile` | Groq | Minimal | ~3s |
| **Podcast Audio Synthesis** | Microsoft Edge TTS WebSocket | Edge TTS | $0.00 | ~8-15s (Cached) |

---

## 5. Summary Scorecard

| Strategy | Status in Source.io | Next Action |
| :--- | :--- | :--- |
| Client-side text extraction | ✅ **Assembled** | Maintain current `extract.ts` implementation |
| Document deduplication | ✅ **Assembled** | Content hash check active in `ingest` |
| Combined Derivative generation | ✅ **Assembled** | Single JSON call for flashcards + quiz |
| Zero-cost vector embeddings | ✅ **Assembled** | Native Deno n-gram hash (`embedLocal`) |
| Free podcast voice generation | ✅ **Assembled** | Edge TTS + Supabase Storage audio cache |
| API-level token limits | 🟡 **Recommended** | Add `max_tokens` param to Groq/Gemini calls |
| Per-user daily chat quota | 🟡 **Recommended** | Add 25 questions/day limit for free users |
| AI token usage telemetry | 🟡 **Recommended** | Create `ai_usage_logs` table in Supabase |
| Gemini Context Caching | 🟡 **Recommended** | Enable for documents >32k tokens |
| Batch API for live study | 🔴 **Not Recommended** | Reject due to 24h turnaround latency |
| Full OCR pipeline on all PDFs | 🔴 **Not Recommended** | Reject to avoid unnecessary cloud vision bills |
| Complex message queue servers | 🔴 **Not Recommended** | Keep serverless Supabase Edge Functions |
