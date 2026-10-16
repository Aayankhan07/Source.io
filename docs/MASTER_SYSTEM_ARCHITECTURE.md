# Source.io — Master Technical Architecture & System Design Document
*Version: 3.0.0 • Academic Production Standard • Last Updated: October 2026*

---

## 1. Executive Summary & Core Product Mission

**Source.io** is an enterprise-grade academic research workstation and active study intelligence platform. It converts unstructured, dense learning materials—monographs, peer-reviewed PDF papers, textbook scans, recorded video/audio lectures, and research archives—into five deeply grounded, interconnected study primitives:

1. **Structured Executive Study Notes** with KaTeX mathematical formulas and direct source coordinate references.
2. **Spaced-Repetition Active Recall Flashcards** based on an enhanced Leitner 5-box memory retention algorithm.
3. **Diagnostic Evaluative Quizzes** with distractor analysis, dynamic difficulty grading, and coordinate-anchored rationale.
4. **Bimodal Conversational Audio Podcasts** featuring synthesized dual-host discourse (Host A: Analytical/Theorist; Host B: Pragmatic/Skeptic) with interactive audio scrubbing and transcript sync.
5. **Grounded Source Chat & Citation Retrieval (RAG)** streaming sub-second answers with cryptographic-grade page, line, and bounding-box citations that eliminate AI hallucination.

The platform is designed under two non-negotiable architectural mandates:
- **Zero-Hallucination Grounding:** Every claim, equation, card, or note generated is backed by source coordinates (file hash, page index, paragraph offset, and character span).
- **Editorial Paper & Obsidian Ink Aesthetic:** A 100% pure monochrome, distraction-free visual language prioritizing typographical hierarchy, paper textures, hairlines, and mechanical spring physics over decorative gradients.

---

## 2. Complete Technology Stack & Dependency Inventory

Source.io is built as a cloud-native, modern TypeScript application utilizing edge-ready execution runtimes:

### 2.1 Core Framework & Language Layer
| Technology | Version | Purpose | Architectural Rationale |
| :--- | :--- | :--- | :--- |
| **Next.js** | `16.3.8` (App Router) | Full-stack application container & server actions | Server-rendered initial load, static asset optimization, edge middleware routing, and zero-bundle server logic. |
| **React** | `18.3.1` | View composition & component lifecycle | Concurrent mode, selective hydration, fine-grained state hooks, and virtual DOM efficiency. |
| **TypeScript** | `5.x` | Strict type validation | End-to-end interface contracts, compile-time safety across ingestion pipelines and RAG vector payloads. |
| **Node.js Environment** | `v20 LTS+` | Server runtime | High-performance asynchronous I/O for buffer streaming and multi-part upload handling. |

### 2.2 Client-Side UI, Motion & Design System
| Technology | Version | Purpose | Architectural Rationale |
| :--- | :--- | :--- | :--- |
| **Tailwind CSS** | `3.4.17` | Utility-first CSS styling engine | Zero runtime CSS overhead, custom design token system mapped to pure monochrome variables (`#FAF9F6`, `#0F172A`, `#E2E8F0`). |
| **Motion (Framer Motion)** | `13.x` | Hardware-accelerated UI physics | Custom mechanical springs (`stiffness: 400`, `damping: 28`) for tactile buttons, interactive sliders, drawer sheets, and flip transitions without UI layout shifts. |
| **Radix UI Primitives** | Various (`@radix-ui/*`) | Unstyled headless accessible components | WAI-ARIA compliant dialogs, tabs, popovers, dropdowns, tooltips, accordions, and focus-trapped modals. |
| **Lucide React** | `0.454.0` | Vector stroke iconography | Pixel-aligned 24x24 stroke icons styled consistently across light and dark obsidian palettes. |
| **Vaul** | `0.9.9` | Mobile & desktop drawer sheets | Physics-based fluid bottom-sheet drawers for mobile source-reference inspection. |
| **Sonner** | `1.7.4` | Micro-notification toast system | High-performance stacked notification toasts for pipeline progress and quota updates. |
| **React Resizable Panels** | `2.1.7` | Multi-pane workspace splitting | Smooth split-screen adjustments allowing side-by-side PDF reading and active note-taking. |
| **Recharts** | `2.15.1` | Data visualization & telemetry charts | SVG-rendered mastery progression charts, retention curve analytics, and quiz scoring graphs. |

### 2.3 Mathematical Typography & Document Parsing
| Technology | Version | Purpose | Architectural Rationale |
| :--- | :--- | :--- | :--- |
| **KaTeX** | `0.16.27` | LaTeX formula typesetting engine | Ultra-fast mathematical formula rendering directly into semantic HTML/MathML without client reflows. |
| **remark-math & rehype-katex** | Latest | Markdown AST transformation | Converts inline (`$...$`) and block (`$$...$$`) LaTeX syntax into KaTeX nodes during markdown parsing. |
| **react-markdown** | `10.1.0` | Safe markdown rendering | Sanitized DOM generation for LLM output with custom node overrides for citations, headings, and code blocks. |
| **unpdf** | `0.12.1` | Client/Edge PDF text extraction | High-throughput, cross-runtime PDF extraction without native C++ compilation dependencies. |
| **mammoth** | `1.11.0` | Word (.docx) document ingestion | Extracts clean semantic HTML/Markdown from legacy office documents without document styling pollution. |

### 2.4 State Management & Data Fetching
| Technology | Version | Purpose | Architectural Rationale |
| :--- | :--- | :--- | :--- |
| **Zustand** | `5.0.3` | Lightweight client state store | Unopinionated, selector-based state management for active document tabs, drawer states, audio playback positions, and BYOK keys. |
| **TanStack React Query** | `5.64.2` | Server state caching & mutations | Intelligent caching, background refetching, optimistic UI updates, and query invalidation on mutation events. |

### 2.5 Backend, Database & Edge Compute
| Technology | Version | Purpose | Architectural Rationale |
| :--- | :--- | :--- | :--- |
| **Supabase** | `@supabase/supabase-js 2.48.0` | PostgreSQL DB, Auth, Storage, Edge Functions | Managed PostgreSQL with native `pgvector`, Row-Level Security (RLS), S3-compatible file storage, and Deno edge workers. |
| **pgvector** | PostgreSQL extension | Vector similarity database | HNSW indexing for high-dimensional cosine similarity queries over document chunk embeddings. |
| **Deno Edge Functions** | Serverless Edge | Pipeline orchestration & LLM gateways | Sub-millisecond cold starts, streaming response forwarding, and secure BYOK header pass-through. |

### 2.6 LLM & AI Acceleration Engine
| Provider / Model | Protocol / API | Primary Task |
| :--- | :--- | :--- |
| **Google Gemini 1.5 Pro / Flash** | REST / SSE Streaming | Deep contextual analysis, 1M+ token context window processing for entire textbooks, multimodal parsing, and podcast script authoring. |
| **Groq (Llama 3.3 70B / Mixtral 8x7B)** | Low-latency inference API | Real-time interactive source chat queries with sub-200ms Time-To-First-Token (TTFT). |
| **Bring-Your-Own-Key (BYOK)** | Dynamic Client Header Injection | User-supplied API keys for Gemini and Groq, granting infinite daily quotas and zero server-side key retention. |

---

## 3. High-Level System Architecture & Component Topology

The system is architected around an event-driven, decoupled client-edge-database topology:

```
[ User Browser / Client ]
    │
    ├── Local Document Parsing (unpdf / mammoth)
    ├── Zustand Store (Active View, Player State, BYOK Keys)
    ├── TanStack Query (Server State Cache & Invalidation)
    │
    ▼ (HTTPS / WSS / SSE)
[ Supabase Edge Functions Gateway ]
    │
    ├── Auth & RLS Guard (JWT Verification)
    ├── BYOK Key Header Injector (x-byok-gemini / x-byok-groq)
    ├── Quota / Rate Limiter (Fallback for non-BYOK users)
    │
    ├───► [ Ingestion & OCR Pipeline ] ──► PyMuPDF / Edge Chunker
    │                                             │
    │                                             ▼
    ├───► [ Vector Engine ] ─────────────► pgvector (HNSW Index)
    │                                             │
    │                                             ▼
    ├───► [ LLM Generation Orchestrator ] ──► Gemini 1.5 / Groq
    │                                             │
    │                                             ▼
    └───► [ SSE Stream Controller ] ─────► Real-time Chunk & Citation Emitter
```

### 3.1 Directory & Module Organization
The codebase adheres to a strict feature-driven domain architecture:
```
src/
├── app/                              # Next.js App Router (Layouts, Routing, Metadata)
│   ├── globals.css                   # Obsidian Monochrome Design System & CSS Variables
│   ├── layout.tsx                    # Root HTML document, Providers (Query, Auth)
│   ├── page.tsx                      # High-converting Monochrome Editorial Landing Page
│   └── (dashboard)/                  # Authenticated application workspace routes
├── components/                       # Shared UI & Domain Components
│   ├── common/                       # App Shell, Header, Navigation, Footer, Quota Badge
│   ├── landing/                      # Landing page sections, Motion primitives, Hero demos
│   └── ui/                           # Radix-backed Atomic UI (Buttons, Modals, Sliders, Cards)
├── features/                         # Independent Domain Features
│   ├── auth/                         # Supabase Auth, Login/Register modal, Session state
│   ├── dashboard/                    # Tactile Source Cards, Document Ingest modal, Quota status
│   ├── documents/                    # Core 5-Study-Mode Workspace Engine
│   │   ├── components/               # PDF Viewer, Citation Popovers, Leitner Controls
│   │   ├── pages/                    # DocumentWorkspace.tsx (Workspace container)
│   │   └── views/                    # The 5 Study Primitives:
│   │       ├── NotesView.tsx         # Executive study notes with KaTeX & coordinates
│   │       ├── FlashcardsDeck.tsx    # 3D Flip Flashcards with Leitner spaced repetition
│   │       ├── QuizPlayer.tsx        # Timed diagnostic assessment engine
│   │       ├── PodcastPlayer.tsx     # 2-host audio player & synchronized transcript
│   │       └── AskPanel.tsx          # Real-time grounded RAG chat with streaming citations
│   └── settings/                     # User preferences, BYOK key vault, Account telemetry
├── hooks/                            # Custom React Hooks (useMediaQuery, useDebounce, etc.)
├── lib/                              # Infrastructure & Core Utilities
│   ├── services/                     # Edge Function & Backend Service Clients
│   │   ├── pipeline.ts               # Ingestion triggers, SSE parser, Generation callers
│   │   ├── functions.ts              # Authenticated fetch wrapper with BYOK header injector
│   │   ├── byokTest.ts               # In-browser zero-latency validation for API keys
│   │   ├── extract.ts                # Client-side fallback text/pdf parsing
│   │   └── podcast.ts                # Audio synthesis & dual-voice orchestrator
│   ├── supabase/                     # Supabase client instantiation & typed DB schemas
│   └── utils.ts                      # Class variance authority (cn), date & text formatters
└── types/                            # Global TypeScript contracts (Document, Citation, Card, etc.)
```

---

## 4. Deep-Dive Feature Breakdown & Business Logic

### 4.1 Document Ingestion & Coordinate Mapping Engine
- **Multi-Format Ingestion:** Accepts PDF documents, Word `.docx`, plain text `.txt`, `.md`, and YouTube/Audio lecture transcripts.
- **Client & Edge Dual Extraction:** Small documents are parsed instantly in the browser using `unpdf` and `mammoth` for zero server processing lag. Massive textbooks (>50MB, >500 pages) trigger Supabase background worker extraction.
- **Micro-Coordinate Preservation:** Unlike standard text strippers, Source.io retains positional metadata:
  ```json
  {
    "chunk_id": "chk_8f92a10",
    "document_id": "doc_9381a",
    "page_number": 42,
    "paragraph_index": 3,
    "char_start": 1240,
    "char_end": 1680,
    "section_title": "3.2 Variational Autoencoders & Latent Priors",
    "content": "The evidence lower bound (ELBO) satisfies the Jensen inequality..."
  }
  ```
- **Semantic Text Chunking:** Employs sliding-window semantic chunking with a 512-token target window and a 64-token overlap, ensuring no mathematical derivation or sentence boundary is sliced mid-definition.

---

### 4.2 Study Primitive 1: Executive Study Notes (`NotesView.tsx`)
- **Hierarchical Structuring:** Automatically formats raw source data into:
  - High-level Conceptual Executive Overview.
  - Core Axioms & Mathematical Proofs (fully typeset in KaTeX).
  - Comparative Contrast Tables for competing theoretical paradigms.
  - Critical Edge Cases & Common Misconceptions.
- **Source-Anchored Badges:** Every paragraph contains interactive citation pills `[p. 14]`. Clicking a badge instantly splits the viewport and highlights the exact paragraph in the original document viewer.
- **Export Engine:** One-click zero-loss export to Markdown, Print-Ready Clean PDF, or copy-to-clipboard for Obsidian and Notion integration.

---

### 4.3 Study Primitive 2: Spaced-Repetition Active Recall Flashcards (`FlashcardsDeck.tsx`)
- **Algorithmic Foundation:** Implements an adapted **Leitner 5-Box Spaced Repetition Algorithm**:
  $$\text{Interval}(B) = I_0 \times F^{(B - 1)}$$
  Where $B$ is the current box level ($1 \le B \le 5$), $I_0 = 1\text{ day}$, and $F = 2.4$ (Ebbinghaus decay multiplier).
- **Box Progression Matrix:**
  - **Box 1 (New / Failed):** Reviewed daily.
  - **Box 2 (Developing):** Reviewed every 3 days.
  - **Box 3 (Consolidating):** Reviewed every 7 days.
  - **Box 4 (Mastered):** Reviewed every 16 days.
  - **Box 5 (Permanent Memory):** Reviewed every 35 days.
- **Failure Demotion Rule:** If a user grades a card as **"Hard / Failed"**, the card is immediately demoted to **Box 1**, resetting the review cadence to arrest the forgetting curve.
- **Interaction Mechanics:** Tactile 3D card flipping via Framer Motion perspective transforms (`transform-style: preserve-3d`), keyboard hotkeys (`Space` to flip, `1` for Again, `2` for Good, `3` for Easy).
- **Coordinate Grounding:** The reverse side of each card includes a collapsible *"Show Source Excerpt"* trigger revealing the exact original textbook sentence that verifies the card's answer.

---

### 4.4 Study Primitive 3: Diagnostic Evaluative Quizzes (`QuizPlayer.tsx`)
- **Pedagogical Distractor Generation:** Generates multiple-choice and multi-select questions where distractors (wrong answers) represent authentic cognitive misattributions, not random false statements.
- **Dynamic Grading & Instant Feedback:**
  - Real-time score calculation with partial-credit weighting.
  - Detailed Rationale Breakdown: Explains not only why the correct answer is right, but specifically why each distractor is incorrect.
  - Direct Citation Link: Jumps to the exact proof or dataset in the source.
- **Performance Analytics:** Feeds into a longitudinal mastery index tracking knowledge retention by topic and taxonomy (Bloom's Taxonomy levels: Recall, Comprehension, Application, Synthesis).

---

### 4.5 Study Primitive 4: Dual-Host Conversational Audio Podcasts (`PodcastPlayer.tsx`)
- **Concept & Pedagogy:** Transforms dense, dry scientific papers into engaging, collegiate audio discussions between two specialized synthetic AI personas:
  - **Host A (The Analytical Theorist):** Focuses on formal definitions, empirical evidence, historical context, and mathematical rigor.
  - **Host B (The Pragmatic Inquirer):** Interjects with intuitive real-world analogies, edge-case challenges, practical applications, and clarifying questions.
- **Dual-Voice Audio Pipeline:**
  - Generation of structured multi-speaker JSON script with emotion cues and conversational interruptions (`[laughs]`, `[sighs]`, `[emphasizes]`).
  - Text-To-Speech (TTS) voice assignment with balanced pitch and pacing.
- **Interactive Audio Scrubber & Synchronized Transcript:**
  - Dual-speed playback controls (`0.8x`, `1.0x`, `1.2x`, `1.5x`, `2.0x`).
  - Interactive transcript panel: Highlights the spoken dialogue line in real time as the audio waveform advances. Clicking any transcript sentence seeks the audio directly to that exact millisecond.

---

### 4.6 Study Primitive 5: Grounded Source Chat & Citation Retrieval (`AskPanel.tsx`)
- **True RAG Retrieval Engine:**
  - User query generates a dense vector embedding.
  - Cosine similarity search against the document's HNSW vector index in PostgreSQL (`1 - (embedding <=> query_embedding)`).
  - Top $K = 5$ semantic chunks are retrieved and constructed into a structured system prompt.
- **Sub-Second Server-Sent Events (SSE) Streaming:** Uses a custom zero-allocation stream parser (`consumeSse`) to pipe tokens directly from edge LLMs to the client screen.
- **Interactive Inline Citations:** Tokens containing reference tags like `[p. 23, §2]` are dynamically transformed on the fly into clickable obsidian badges that display interactive snippet previews when hovered or clicked.

---

## 5. Grounded RAG & Citation Coordinate Architecture

Hallucination prevention is the central technical achievement of Source.io. The diagram below illustrates the exact lifecycle of a citation from raw document to interactive UI popover:

```
┌────────────────────────────────────────────────────────────────────────┐
│                        1. Ingestion Phase                              │
│                                                                        │
│   PDF Document  ───►  unpdf / PyMuPDF  ───► Text Extraction with       │
│                                             Coordinates:               │
│                                             • page_number: 14          │
│                                             • paragraph_index: 2       │
│                                             • bounding_box: [x,y,w,h]  │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│                      2. Vectorization & Storage                        │
│                                                                        │
│   Semantic Chunking (512 tokens)  ───► text-embedding-3 / Gemini-embed  │
│                                                   │                    │
│                                                   ▼                    │
│   Stored in Supabase PostgreSQL:              pgvector Table           │
│   [ id | doc_id | embedding | page | para | text_content | bbox_json ] │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│                         3. Retrieval & Synthesis                       │
│                                                                        │
│   User Prompt: "What is the ELBO lower bound?"                         │
│                    │                                                   │
│                    ▼                                                   │
│   PostgreSQL Vector Search:                                            │
│   SELECT * FROM doc_chunks ORDER BY embedding <=> query_vec LIMIT 5;   │
│                    │                                                   │
│                    ▼                                                   │
│   LLM Prompt Injection:                                                │
│   "Answer strictly using these sources. Tag citations with:            │
│    <cite page='14' para='2' chunk='chk_9a'>[p. 14]</cite>"             │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│                      4. Client-Side Rendering                          │
│                                                                        │
│   SSE Stream  ───►  consumeSse()  ───►  Custom React-Markdown Parser   │
│                                                   │                    │
│                                                   ▼                    │
│   Rendered Badge: [p. 14] ──(Click)──► Opens Source Viewer &           │
│                                        Highlights Exact Line Bounds    │
└────────────────────────────────────────────────────────────────────────┘
```

### 5.1 The Citation Coordinate Contract
Every citation rendered in the frontend implements the following TypeScript schema:
```typescript
export interface CitationCoordinate {
  id: string;
  documentId: string;
  documentTitle: string;
  pageNumber: number;
  paragraphIndex?: number;
  charStart?: number;
  charEnd?: number;
  rawSnippet: string;
  confidenceScore: number;
  boundingBox?: {
    x1: number;
    y1: number;
    x2: number;
    y2: number;
  };
}
```

---

## 6. Real-Time Streaming Infrastructure (SSE Parser & Resilience)

Source.io features a custom, zero-dependency SSE stream processor (`src/lib/services/pipeline.ts`) designed to handle intermittent edge disconnects, mid-sentence chunk splitting, and cross-platform line ending variations (`\r\n` vs `\n`).

### 6.1 Stream Chunk Assembly Mechanics
```typescript
export async function consumeSse(
  stream: ReadableStream<Uint8Array>,
  onToken: (token: string) => void,
  onCitation?: (citation: CitationCoordinate) => void
): Promise<void> {
  const reader = stream.getReader();
  const decoder = new TextDecoder('utf-8');
  let buffer = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split(/\r?\n/);
    buffer = lines.pop() || ''; // Preserve incomplete trailing payload

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith(':')) continue; // Ignore keep-alive comments

      if (trimmed.startsWith('data: ')) {
        const payload = trimmed.slice(6);
        if (payload === '[DONE]') return;

        try {
          const parsed = JSON.parse(payload);
          if (parsed.token) onToken(parsed.token);
          if (parsed.citation && onCitation) onCitation(parsed.citation);
        } catch {
          // If the payload is raw text token rather than JSON
          onToken(payload);
        }
      }
    }
  }
}
```

---

## 7. Bring-Your-Own-Key (BYOK) Architecture & Zero-Retention Security

Source.io provides a dual access model:
1. **Free / Hosted Tier:** 25 daily AI generation actions (notes distillation, flashcards, quiz generation, podcast dialogue) and 3 active document slots, rate-limited via edge quotas.
2. **BYOK Supercharged Mode:** Complete bypass of daily limits, unlimited multi-modal chat queries, and instantaneous priority queues using student Gemini or Groq API keys.

```
┌────────────────────────────────────────────────────────┐
│             Client LocalStorage / Zustand Vault        │
│                                                        │
│   • Gemini API Key: AIzaSy... (Client-only)            │
│   • Groq API Key:   gsk_...   (Client-only)            │
└───────────────────────────┬────────────────────────────┘
                            │
                            ▼ (HTTPS Request Headers)
┌────────────────────────────────────────────────────────┐
│             Edge Function Request Pipeline             │
│                                                        │
│   Headers:                                             │
│   • Authorization: Bearer <supabase_jwt>               │
│   • x-byok-gemini: AIzaSy...                           │
│   • x-byok-groq:   gsk_...                             │
└───────────────────────────┬────────────────────────────┘
                            │
                            ▼
┌────────────────────────────────────────────────────────┐
│                  Edge Function Gateway                 │
│                                                        │
│   if (req.headers.has('x-byok-gemini')) {              │
│      Use BYOK client;                                  │
│      Skip database quota decrement;                    │
│   } else {                                             │
│      Check user daily quota balance;                   │
│      Use system managed API keys;                      │
│   }                                                    │
│                                                        │
│   *CRITICAL: Keys are NEVER written to DB or logs.*   │
└────────────────────────────────────────────────────────┘
```

### 7.1 Client-Side Instant Key Validation (`byokTest.ts`)
To prevent broken workspaces caused by expired or invalid keys, the application executes a zero-latency test call directly from the browser before saving keys to local storage:
- **Gemini Validation:** Executes a 1-token model discovery probe (`models.get` or ping generation).
- **Groq Validation:** Sends an ultra-fast completion request (`temperature: 0, max_tokens: 1`) to `llama-3.1-8b-instant`.
- Result: Instant visual checkmark with response latency metrics displayed in milliseconds.

---

## 8. "Editorial Paper & Obsidian Ink" Design System

The visual design system of Source.io rejects SaaS template trends (neon purple gradients, colored glow blobs, low-contrast washed-out text) in favor of an **academic, high-density editorial instrument**.

### 8.1 Palette & Material Specifications
| Token Name | Hex Code | HSL Equivalent | Conceptual Role |
| :--- | :--- | :--- | :--- |
| **Warm Editorial Paper** | `#FAF9F6` | `hsl(40, 20%, 97%)` | Primary application canvas background, simulating archival acid-free paper. |
| **Pure Pure Card Surface**| `#FFFFFF` | `hsl(0, 0%, 100%)` | Elevated document surfaces, card decks, and reading panes. |
| **Obsidian Ink Text** | `#0F172A` | `hsl(222, 47%, 11%)` | Primary typographic ink for maximum legibility and contrast ratio (16.2:1). |
| **Secondary Slate Ink** | `#334155` | `hsl(215, 25%, 27%)` | Subheadings, metadata labels, and author citations. |
| **Muted Hairline Gray** | `#64748B` | `hsl(215, 16%, 47%)` | Minor coordinates, timestamps, and page indices. |
| **Crisp Slate Hairline** | `#E2E8F0` | `hsl(214, 32%, 91%)` | Mechanical structural borders separating panels and tables. |
| **Hover Slate Border** | `#CBD5E1` | `hsl(216, 28%, 84%)` | Interactive hover borders indicating tactile affordance. |

### 8.2 Mechanical Precision Motion Physics
All UI transitions follow physical instrument mechanics using Spring physics rather than linear ease-in-out curves:

```typescript
// src/components/landing/motion.ts
export const SPRING_TACTILE = {
  type: "spring",
  stiffness: 400,
  damping: 28,
  mass: 0.8
};

export const SPRING_SNAPPY = {
  type: "spring",
  stiffness: 450,
  damping: 32,
  mass: 0.6
};

export const SPRING_GENTLE = {
  type: "spring",
  stiffness: 300,
  damping: 24,
  mass: 1.0
};
```

### 8.3 The Typography Invariant Rule
> **MANDATORY ARCHITECTURAL RULE:** Never animate `opacity: 0` on headings (`<h1>`, `<h2>`, `<h3>`) or primary reading copy during scroll events. All typographic elements remain at `opacity: 1` permanently to prevent text washed-out defects or visual popping during fast scrolling. Motion is restricted strictly to interactive sliders, button depressions, modal scales, and card flip geometries.

---

## 9. Comprehensive Database Schema (Supabase PostgreSQL)

The backend schema leverages PostgreSQL's relational integrity and the `pgvector` extension for semantic retrieval:

```sql
-- 1. Enable pgvector extension
CREATE EXTENSION IF NOT EXISTS vector WITH SCHEMA extensions;

-- 2. User Profiles & Daily Quota Management (Hardened with Midnight UTC Lazy Rollover)
CREATE TABLE public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT,
    display_name TEXT,
    avatar_url TEXT,
    tier TEXT DEFAULT 'free' CHECK (tier IN ('free', 'pro')),
    active_docs_limit INTEGER DEFAULT 3,
    daily_quota_used INTEGER DEFAULT 0,
    daily_quota_limit INTEGER DEFAULT 25,
    daily_tts_quota_used INTEGER DEFAULT 0,
    daily_tts_quota_limit INTEGER DEFAULT 2,
    quota_reset_date DATE DEFAULT CURRENT_DATE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Atomic Quota Consumption RPC (Single atomic update + Negative-cost guard + Fixed column reference)
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
  IF p_cost <= 0 THEN
    RAISE EXCEPTION 'Quota cost must be a positive integer';
  END IF;

  -- Atomic lazy rollover and quota deduction in a single lock acquisition
  UPDATE public.profiles
  SET 
    daily_quota_used = CASE 
      WHEN quota_reset_date IS NULL OR quota_reset_date < CURRENT_DATE THEN p_cost 
      ELSE daily_quota_used + p_cost 
    END,
    daily_tts_quota_used = CASE 
      WHEN quota_reset_date IS NULL OR quota_reset_date < CURRENT_DATE THEN 0 
      ELSE daily_tts_quota_used 
    END,
    quota_reset_date = CURRENT_DATE,
    updated_at = NOW()
  WHERE id = p_user_id
    AND (
      ( (quota_reset_date IS NULL OR quota_reset_date < CURRENT_DATE) AND p_cost <= daily_quota_limit )
      OR 
      ( quota_reset_date = CURRENT_DATE AND (daily_quota_used + p_cost) <= daily_quota_limit )
    )
  RETURNING TRUE INTO v_updated;

  RETURN COALESCE(v_updated, FALSE);
END;
$$;

-- Atomic Studio Audio TTS Quota Consumption RPC (Single atomic update + Negative-cost guard)
CREATE OR REPLACE FUNCTION public.consume_daily_tts_quota(
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
  IF p_cost <= 0 THEN
    RAISE EXCEPTION 'TTS quota cost must be a positive integer';
  END IF;

  UPDATE public.profiles
  SET 
    daily_quota_used = CASE 
      WHEN quota_reset_date IS NULL OR quota_reset_date < CURRENT_DATE THEN 0 
      ELSE daily_quota_used 
    END,
    daily_tts_quota_used = CASE 
      WHEN quota_reset_date IS NULL OR quota_reset_date < CURRENT_DATE THEN p_cost 
      ELSE daily_tts_quota_used + p_cost 
    END,
    quota_reset_date = CURRENT_DATE,
    updated_at = NOW()
  WHERE id = p_user_id
    AND (
      ( (quota_reset_date IS NULL OR quota_reset_date < CURRENT_DATE) AND p_cost <= daily_tts_quota_limit )
      OR 
      ( quota_reset_date = CURRENT_DATE AND (daily_tts_quota_used + p_cost) <= daily_tts_quota_limit )
    )
  RETURNING TRUE INTO v_updated;

  RETURN COALESCE(v_updated, FALSE);
END;
$$;

-- Lock down RPC execution strictly to backend service_role (Edge Functions)
REVOKE EXECUTE ON FUNCTION public.consume_daily_quota(UUID, INT) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.consume_daily_quota(UUID, INT) TO service_role;

REVOKE EXECUTE ON FUNCTION public.consume_daily_tts_quota(UUID, INT) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.consume_daily_tts_quota(UUID, INT) TO service_role;

-- 3. Document Storage & Metadata
CREATE TABLE public.documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    original_filename TEXT NOT NULL,
    file_path TEXT NOT NULL,
    file_size_bytes BIGINT NOT NULL,
    file_type TEXT NOT NULL,
    total_pages INTEGER DEFAULT 1,
    extraction_status TEXT DEFAULT 'pending' CHECK (extraction_status IN ('pending', 'processing', 'completed', 'failed')),
    summary TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Active Document Slot Constraint Trigger (Enforces tier limits at DB layer)
CREATE OR REPLACE FUNCTION public.check_active_document_limit()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_current_count INT;
  v_max_allowed INT;
BEGIN
  SELECT count(*) INTO v_current_count FROM public.documents WHERE user_id = NEW.user_id;
  SELECT COALESCE(active_docs_limit, 3) INTO v_max_allowed FROM public.profiles WHERE id = NEW.user_id;

  IF v_current_count >= v_max_allowed THEN
    RAISE EXCEPTION 'Active document slot limit reached (%). Upgrade to Pro for unlimited storage.', v_max_allowed;
  END IF;

  RETURN NEW;
END;
$$;

CREATE OR REPLACE TRIGGER trg_check_document_limit
BEFORE INSERT ON public.documents
FOR EACH ROW EXECUTE FUNCTION public.check_active_document_limit();

-- 4. Document Chunks & Optimized Vector Embeddings (halfvec 768d + Direct user_id for RLS)
CREATE TABLE public.document_chunks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    document_id UUID NOT NULL REFERENCES public.documents(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    page_number INTEGER NOT NULL,
    paragraph_index INTEGER NOT NULL,
    char_start INTEGER,
    char_end INTEGER,
    content TEXT NOT NULL,
    embedding extensions.halfvec(768), -- 75% RAM reduction over standard 1536 float32
    bounding_box JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- High-performance indices optimizing per-document and per-user RLS similarity retrieval
CREATE INDEX IF NOT EXISTS idx_document_chunks_document_id 
ON public.document_chunks(document_id);

CREATE INDEX IF NOT EXISTS idx_document_chunks_user_id 
ON public.document_chunks(user_id);

-- HNSW Vector Index on halfvec(768) (Safe on empty migration tables)
CREATE INDEX IF NOT EXISTS idx_document_chunks_embedding
ON public.document_chunks 
USING hnsw (embedding extensions.halfvec_cosine_ops)
WITH (m = 16, ef_construction = 64);

-- 5. Spaced Repetition Flashcards & Leitner State
CREATE TABLE public.flashcards (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    document_id UUID NOT NULL REFERENCES public.documents(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    front TEXT NOT NULL,
    back TEXT NOT NULL,
    box_level INTEGER DEFAULT 1 CHECK (box_level BETWEEN 1 AND 5),
    interval_days INTEGER DEFAULT 1,
    repetition_count INTEGER DEFAULT 0,
    ease_factor NUMERIC(3, 2) DEFAULT 2.50,
    next_review_at TIMESTAMPTZ DEFAULT NOW(),
    last_reviewed_at TIMESTAMPTZ,
    source_citation JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Evaluative Quizzes & Assessment Records
CREATE TABLE public.quizzes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    document_id UUID NOT NULL REFERENCES public.documents(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    questions JSONB NOT NULL, -- Array of questions, options, correct_index, rationale
    last_score NUMERIC(5, 2),
    attempts_count INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. Dual-Host Audio Podcasts
CREATE TABLE public.podcasts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    document_id UUID NOT NULL REFERENCES public.documents(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    audio_url TEXT,
    duration_seconds INTEGER,
    transcript JSONB NOT NULL, -- Array of dialogue turns: {speaker: 'Host A', text: '...', timestamp_ms: 1200}
    generation_status TEXT DEFAULT 'pending' CHECK (generation_status IN ('pending', 'processing', 'completed', 'failed')),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. Grounded Synthesized Notes
CREATE TABLE public.notes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    document_id UUID NOT NULL REFERENCES public.documents(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    version INTEGER DEFAULT 1,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 9. Conversational Grounded Copilot Messages (With persisted structured citations)
CREATE TABLE public.chat_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    document_id UUID NOT NULL REFERENCES public.documents(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
    content TEXT NOT NULL,
    citations JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Row-Level Security (RLS) Policy Specifications
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own profile"
ON public.profiles FOR SELECT
USING (auth.uid() = id);

ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can only read their own documents"
ON public.documents FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can only modify their own documents"
ON public.documents FOR ALL
USING (auth.uid() = user_id);

ALTER TABLE public.document_chunks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can only read their own document chunks"
ON public.document_chunks FOR SELECT
USING (auth.uid() = user_id);

ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can read own chat messages"
ON public.chat_messages FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own chat messages"
ON public.chat_messages FOR INSERT
WITH CHECK (auth.uid() = user_id);
```

---

## 10. API Specifications & Edge Service Contracts

All operations communicate via Supabase Edge Functions. Request headers automatically bundle user tokens and optional BYOK headers:

### 10.1 Ingestion Pipeline Endpoint: `POST /functions/v1/ingest`
- **Request Headers:**
  - `Authorization: Bearer <JWT>`
  - `x-byok-gemini: <KEY>` (Optional)
- **Request Body (Multipart Form or JSON):**
  ```json
  {
    "document_id": "9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d",
    "source_url": "https://storage.supabase.co/raw_pdfs/physics_vol1.pdf",
    "title": "University Physics: Quantum Electrodynamics"
  }
  ```
- **Response:**
  ```json
  {
    "status": "success",
    "chunks_created": 412,
    "total_pages": 78,
    "processing_time_ms": 1420
  }
  ```

---

### 10.2 Grounded Chat Streaming Endpoint: `POST /functions/v1/chat`
- **Request Headers:**
  - `Accept: text/event-stream`
  - `Authorization: Bearer <JWT>`
  - `x-byok-groq: <KEY>` (Optional)
- **Request Body:**
  ```json
  {
    "document_id": "9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d",
    "query": "Explain how gauge symmetry implies charge conservation.",
    "history": [
      { "role": "user", "content": "What is Noether's first theorem?" },
      { "role": "assistant", "content": "Noether's first theorem establishes..." }
    ]
  }
  ```
- **Stream Output (`text/event-stream`):**
  ```
  data: {"token":"Gauge "}
  data: {"token":"invariance "}
  data: {"token":"under "}
  data: {"token":"U(1) "}
  data: {"token":"transformations..."}
  data: {"citation":{"id":"chk_92","pageNumber":18,"paragraphIndex":2,"rawSnippet":"The U(1) phase invariance of the Dirac field requires the introduction of a gauge field A_mu..."}}
  data: [DONE]
  ```

---

### 10.3 Generation Endpoints: Notes, Flashcards, Quiz & Podcast
- `POST /functions/v1/generate_notes`: Generates executive study notes with embedded LaTeX math blocks and citation pills. Protected by atomic `consume_daily_quota` RPC.
- `POST /functions/v1/generate_derivatives`: Synthesizes flashcards and quiz questions with atomic quota protection.
- `POST /functions/v1/generate_podcast`: Generates 2-host Socratic scripts; decouples script synthesis from TTS audio binaries, capping free-tier studio audio to 2 renders/day via `consume_daily_tts_quota` RPC while keeping BYOK / Scholar Pass unlimited.
- `POST /functions/v1/embed_chunks`: Progressive 50-chunk batched embedding engine (`batch_index`, `batch_size`), preventing Edge Function CPU/memory timeouts on 300+ page books.

---

### 10.4 Merchant of Record Billing Webhook: `POST /functions/v1/billing-webhook`
- **Request Headers:**
  - `x-signature: <HMAC_SHA256_HEX>`
  - `Content-Type: application/json`
- **Security:**
  - Cryptographic validation via Web Crypto API (`crypto.subtle.verify`) using `LEMONSQUEEZY_WEBHOOK_SECRET`.
  - Forged or unsigned payloads are immediately rejected with HTTP 401 before any database mutation.
- **Event Handling:**
  - `subscription_created`, `order_created`, `subscription_resumed`:
    Atomically updates `profiles.tier = 'pro'`, `daily_quota_limit = 200`, `daily_tts_quota_limit = 50`.
  - `subscription_cancelled`, `subscription_expired`:
    Reverts `profiles.tier = 'free'`, `daily_quota_limit = 25`, `daily_tts_quota_limit = 2`.
- **Response:**
  ```json
  { "received": true, "event": "subscription_created" }
  ```

---

## 11. State Management Architecture

Source.io divides state into three distinct layers to eliminate redundant re-renders and unnecessary network round-trips:

```
┌────────────────────────────────────────────────────────────────────────┐
│                        Layer 1: Server State                           │
│                     (TanStack React Query v5)                          │
│                                                                        │
│   • Document metadata & upload states                                  │
│   • Active study notes, flashcard decks, quiz records                  │
│   • Query key caching: ['document', id, 'notes']                       │
│   • Automatic cache invalidation on generation mutations               │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│                        Layer 2: Client Global State                    │
│                               (Zustand)                                │
│                                                                        │
│   • Active Document Workspace Tab ('notes' | 'cards' | 'quiz' | ...)   │
│   • Podcast Audio Player State (playing, currentTime, playbackRate)    │
│   • Active Citation Drawer (selected citation, coordinate bbox)        │
│   • BYOK Key Vault (persisted to LocalStorage with encryption salt)    │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│                        Layer 3: Ephemeral Component State              │
│                       (React Hooks / Context)                          │
│                                                                        │
│   • Flashcard 3D flip rotation angle                                   │
│   • Split-panel resizer drag percentages                               │
│   • Local search query inputs & filter toggles                         │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 12. Security, Compliance & Data Privacy Architecture

### 12.1 The Zero-Data-Retention Guarantee
Academic documents, proprietary manuscripts, and unpublished research papers demand absolute privacy:
- **No Model Training:** Under zero circumstances are user uploads or queries utilized for foundation model training (governed by Google Cloud Vertex AI & Groq Enterprise API policies).
- **Client-Side Key Isolation:** BYOK keys stored in the user's browser never touch Supabase databases or persistent logging layers. They are forwarded as transient request headers directly to edge inference endpoints.
- **Row-Level Security (RLS):** Every database row in PostgreSQL is cryptographically partitioned by the user's Supabase authentication UUID. Even in the event of an edge compute logic flaw, users cannot read or query chunks belonging to another user.

### 12.2 Content Sanitization & XSS Defense
All LLM-generated output (study notes, flashcard answers, and chat responses) passes through a multi-stage sanitizer:
- Mathematical blocks are validated against KaTeX's strict whitelist parser, stripping malicious `<script>` or CSS expression tags before DOM injection.
- Markdown rendering via `react-markdown` strictly enforces HTML entity escaping.

---

## 13. System Design Best Practices & Production Guidelines

1. **Optimistic Updates:** When a student grades a flashcard (e.g., clicking "Easy"), the UI updates the Leitner progress bar instantly without waiting for the server mutation to complete. If the network call fails, the state gracefully rolls back with an informative toast.
2. **Dynamic Polyfills:** Heavy scientific rendering libraries (`katex.min.js`, PDF text scrapers) are dynamically imported via `React.lazy()` / `next/dynamic` only when the user enters the relevant study tab, ensuring landing page performance scores exceed 98 on Google Lighthouse.
3. **Graceful Degraded Audio:** In environments with strict web audio policies or weak mobile networks, the podcast engine automatically falls back to an interactive "Read-Along Script" mode without throwing media player errors.
4. **Accessible Keyboard First Architecture:** All primary study workflows can be executed without touching a mouse (`Tab` for navigation, `Space` for flip, `1-4` for ratings, `/` to focus grounded chat).

---

## 14. Document Revision & Verification Record

| Version | Date | Changes & Additions | Author / Reviewer |
| :--- | :--- | :--- | :--- |
| **1.0.0** | 2026-08-10 | Initial product specification & Supabase schema | Core Architecture Team |
| **2.0.0** | 2026-09-15 | Addition of 5-Box Leitner spaced repetition engine and Groq RAG streaming | Lead Systems Architect |
| **2.3.0** | 2026-10-02 | Transition to 100% Monochrome Editorial Paper & Obsidian Ink design system | Design Systems Lead |
| **2.4.0** | 2026-10-15 | Complete master architectural specification, SSE resilience parser, BYOK zero-retention security protocols | Antigravity AI Engineering |
| **3.0.0** | 2026-10-16 | Production-scale hardening: atomic `consume_daily_quota` RPC (TOCTOU protection), `halfvec(768)` 75% vector RAM compression, progressive 50-chunk ingestion, decoupled podcast TTS quotas, and Lemon Squeezy HMAC MoR webhook fulfillment | Antigravity AI Engineering |

---
*End of Master Technical Architecture Document • Source.io Engineering*
