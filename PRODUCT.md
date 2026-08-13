# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Anyone with a document they need to actually absorb. The product is deliberately
general-purpose and does not privilege one scene: a student working through
lecture PDFs, a professional studying for a certification, and a researcher
metabolizing papers are all first-class. Confirmed by the user: "built for
anyone with a document."

The common situation, not the common demographic, is the design target: a person
sitting with source material that is longer than the time they have, who needs it
turned into something they can work with.

## Product Purpose

Source.io converts arbitrary source material into a set of study assets a person
can actually use. Input: PDF, DOCX, audio, video, YouTube link, or pasted text.
Output, all derived from that one source:

- streamed markdown study notes
- spaced-repetition flashcards
- a mixed-type quiz with explanations
- a two-host conversational audio "podcast recap"
- a chat that answers from the document and cites the passages it used

Success is a user who understands their material faster than they would have by
reading it directly.

## Positioning

The mechanism a neighboring product could not truthfully copy: **one source
becomes five different modes of engagement with the same content, and every
generated answer can be traced back to the passage it came from.** The five
outputs are not five features bolted together — they are five renderings of a
single ingested document, which is why the workspace is organized per-document
rather than per-tool.

Grounding is the trust claim: chat answers carry citations into `document_chunks`
with a similarity score, not free-floating model output.

## Operating Context

- One document at a time. The library is a sidebar; the workspace is one source
  with five tabs. This is the product's spine (see `docs/architecture.md`).
- Generation is asynchronous and visible: ingest → notes (SSE streamed) →
  derivatives / podcast / embeddings. Users watch work happen; waiting states are
  a real and frequent part of the experience, not an edge case.
- Sources arrive in wildly different shapes — a 3-page handout and a 90-minute
  lecture recording enter the same pipeline.

## Capabilities and Constraints

- **Stack:** Vite + React 18 + TypeScript + Tailwind + shadcn/ui (Radix), Supabase
  (Postgres + pgvector, Auth, Storage, Deno edge functions), Groq (llama-3.3-70b
  for notes/derivatives, llama-3.1-8b for chat, whisper-large-v3 for
  transcription), Microsoft Edge TTS for speech.
- Five routes only: `/`, `/auth`, `/app`, `/app/doc/:docId`, and a 404.
- 50MB upload ceiling. PDF/DOCX text is extracted in the browser; audio/video is
  transcribed server-side.
- Realtime subscriptions drive document status and podcast progress.
- Authorization is Postgres RLS, not middleware.
- **No `.env` is currently present**, so the app runs against placeholder Supabase
  credentials; signed-in surfaces cannot be exercised locally without one.

## Brand Commitments

Confirmed binding by the user:

- The name **Source.io** and the existing favicon asset (`public/favicon.png`).
- The **five-tab workspace structure** — Notes, Flashcards, Quiz, Podcast, Chat —
  as the organizing model of a document. Its visual treatment is open.

Explicitly *not* binding: palette, typography, component language, layout system,
motion, and light/dark. The user confirmed everything outside the two items above
is in play.

## Evidence on Hand

- Real, working product with all five generation paths implemented.
- `docs/` contains six accurate technical documents (architecture, data model,
  edge functions, development, deployment, troubleshooting).
- The landing page ships a working interactive simulator using **synthetic**
  quantum-computing demo content. It is illustrative, not a real user document.
- **No real customers, testimonials, benchmarks, pricing, or usage numbers
  exist.** Future work must not fabricate them.

## Product Principles

1. **One source, five renderings.** The document is the unit; the five outputs are
   views of it. Design must not present them as five separate tools.
2. **Show the work.** Ingestion, streaming, and generation are visible processes.
   Waiting is part of the product and deserves designed states, not spinners.
3. **Grounded, not asserted.** Citations back to source passages are the trust
   mechanism and should be legible, not buried.
4. **Reading is the job.** Whatever else the interface does, generated material
   has to be genuinely pleasant to read at length.
5. **Any document, any length.** The interface cannot assume a tidy input.

## Accessibility & Inclusion

No product-specific standard was established by the user. A prior remediation
pass in this repository fixed keyboard access, focus visibility, accessible names,
and a 12px minimum type floor; the redesign must not regress these.
