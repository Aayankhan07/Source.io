# Evals

Offline-first evals for retrieval (roadmap 2.6) and for notes and flashcards (roadmap Phase 3).
All scripts are Deno and import the production modules in `supabase/functions/_shared/`, so they
measure the code that ships, not a copy.

```
evals/
  data/documents/*.md     20 original educational documents (one is 37k chars / 3 sections)
  data/retrieval.jsonl    63 questions: {doc, question, gold[], paraphrase}; 26 paraphrased
  data/key_facts.json     5 key facts per document (used by the generation judge)
  lib/data.ts             dataset loading and helpers
  retrieval/run.ts        Recall@K eval + gate
  retrieval/embedders.ts  hash (legacy, offline) | edge (gte-small) | openai (any compatible API)
  retrieval/edge-runner.ts  eval-only gte-small endpoint, served by the Supabase edge runtime
  generation/run.ts       notes + flashcards generation, LLM judge, gate
  generation/prompts.ts   production prompts (extracted from the function sources at run time)
  results/                reports (*.md) and raw results (*.json)
```

Type-check everything with `npx -y deno@2 check "evals/**/*.ts"`.

## Datasets

The documents were written for this repo (no copied textbook text) and cover biology, history,
contract law, hash tables, statistics, economics, chemistry, a literature analysis of
*Frankenstein* (1818), physics, cardiovascular physiology, plate tectonics, memory, TCP/IP,
linear algebra, ethics, nutrition, ecology, stellar evolution, music theory and separation of
powers. They are 1.9k-2.4k words each, except `ecology-course-reader` (5.8k words, 37k characters,
7 chapters, page markers), which `splitIntoSections` cuts into 3 sections. Nine documents carry
`--- Page N ---` markers like ingest writes.

`retrieval.jsonl`: each `gold` entry is an exact substring of the document (30-180 characters, so
it always fits inside one 1,400-character chunk with its 200-character overlap). A question is a
hit when a retrieved chunk contains a gold string. `paraphrase: true` questions (41%) avoid the
passage's vocabulary ("How does a gas found in car exhaust stop a cell from producing usable
energy?" for a passage about carbon monoxide binding Complex IV), which is where lexical hashing
failed. The eval refuses to run (exit 2) if a gold string is not found in any chunk.

When adding questions, keep gold strings short and exact, and keep the paraphrased share near 40%.

## Retrieval eval (Recall@K)

```bash
npx -y deno@2 run -A evals/retrieval/run.ts --embedder hash     # offline legacy baseline
npx -y deno@2 run -A evals/retrieval/run.ts --embedder edge     # production gte-small
npx -y deno@2 run -A evals/retrieval/run.ts --embedder openai   # any OpenAI-compatible model
```

Each document is chunked with `_shared/chunking.ts`, chunks and questions are embedded, and chunks
are ranked by cosine similarity, which is what `match_document_chunks` does with top-k 6 (the
chat function's `TOP_K`). Reported per scope and subset (all / literal / paraphrase):
Recall@1, Recall@3, Recall@6 and MRR (mean of 1/rank of the first gold chunk).

Two scopes:

- `doc`: rank only the question's own document (what production does). The documents are short
  (8-30 chunks), so this is lenient: Recall@6 out of 8 chunks is 0.75 by chance.
- `corpus`: rank all 257 chunks of the 20 documents together. This stands in for a long
  (about 100-page) document and is what the gate uses by default.

**Gate:** exits 1 when Recall@6 in `GATE_SCOPE` (default `corpus`) is below `MIN_RECALL6`
(default `0.8`). Use `--no-gate` to only report. Any change to chunking, embeddings, the
embedding model, `match_document_chunks` or `TOP_K` must keep `--embedder edge` passing.
**The hash baseline is expected to fail the gate**; it exists to show the gap.

Outputs: `results/retrieval-<embedder>.md` (table + list of misses) and
`results/retrieval-<embedder>.json` (per-question ranks and top-6 chunks for both scopes).

### Embedders

| Name | Needs | Notes |
|---|---|---|
| `hash` | nothing | The old FNV-1a hashed unigram+bigram embedding (768 dims), copied from `git show 68d7f49:supabase/functions/embed_chunks/index.ts`. |
| `edge` | Supabase CLI + Docker, `SUPABASE_SERVICE_ROLE_KEY` | gte-small through `_shared/embeddings.ts` `embedText()`, the exact production path. |
| `openai` | `EMBED_ENDPOINT`, `EMBED_MODEL`, `EMBED_API_KEY` | Any OpenAI-compatible `/embeddings` API, for comparing candidate models. |

gte-small only runs inside the Supabase edge runtime (`Supabase.ai.Session`), so the `edge`
embedder calls `evals/retrieval/edge-runner.ts` served by the CLI. Install it temporarily as a
local function (do not commit or deploy it):

```bash
mkdir -p supabase/functions/eval-embed
sed 's#../../supabase/functions/_shared/#../_shared/#' evals/retrieval/edge-runner.ts \
  > supabase/functions/eval-embed/index.ts
supabase start
supabase functions serve eval-embed            # leave running
# in another shell (supabase status prints the service role key):
SUPABASE_SERVICE_ROLE_KEY=<local service_role key> \
  npx -y deno@2 run -A evals/retrieval/run.ts --embedder edge
rm -r supabase/functions/eval-embed            # clean up
```

The runner only answers requests whose bearer token equals the runtime's
`SUPABASE_SERVICE_ROLE_KEY`. Env: `EDGE_EMBED_URL` (default
`$SUPABASE_URL/functions/v1/eval-embed`, else `http://127.0.0.1:54321/functions/v1/eval-embed`),
`EDGE_EMBED_KEY` (overrides the key), `EDGE_EMBED_BATCH` (default 8 texts per request).
To use a hosted project instead, deploy it briefly with `supabase functions deploy eval-embed`,
set `SUPABASE_URL` and the project's service role key, then `supabase functions delete eval-embed`.

### Baseline (hash embedder, recorded 2026-11-26)

20 documents, 257 chunks, 63 questions (26 paraphrased). Gate result: **FAIL** (corpus Recall@6
0.476 < 0.8), as expected. Even the lenient doc scope (0.794) misses the threshold.

| Scope | Subset | n | Recall@1 | Recall@3 | Recall@6 | MRR |
|---|---|---|---|---|---|---|
| doc | all | 63 | 0.413 | 0.635 | 0.794 | 0.559 |
| doc | literal | 37 | 0.622 | 0.838 | 0.919 | 0.734 |
| doc | paraphrase | 26 | 0.115 | 0.346 | 0.615 | 0.309 |
| corpus | all | 63 | 0.317 | 0.397 | 0.476 | 0.382 |
| corpus | literal | 37 | 0.514 | 0.649 | 0.703 | 0.592 |
| corpus | paraphrase | 26 | 0.038 | 0.038 | 0.154 | 0.082 |

Paraphrased questions are where lexical hashing collapses (corpus Recall@6 0.154 against 0.703
for literal ones). The gte-small numbers (`--embedder edge`) have not been recorded yet: no
edge runtime was available when this was written. Record them here after the first run; that
run sets the bar for future retrieval changes (raise `MIN_RECALL6` toward it).

## Generation eval (notes + flashcards, LLM judge)

```bash
GROQ_API_KEY=... npx -y deno@2 run -A evals/generation/run.ts
GEMINI_API_KEY=... GROQ_API_KEY=... npx -y deno@2 run -A evals/generation/run.ts --docs cell-respiration,ecology-course-reader
```

With no key set it prints a message and exits 0. For each document it reproduces the production
pipeline:

1. **Notes**: `splitIntoSections`, one call per section with the `generate_notes` system prompt
   and section prompt, then the overview call and contents list when there are several sections.
2. **Flashcards**: the `generate_derivatives` prompt over the section notes (what production does
   once notes exist), with the same part grouping, card allocation, dedupe and 30-card cap.

Calls go through `_shared/engine.ts` `sendChat`, so the providers, models (`PROVIDER_MODELS`),
token limits, temperatures and fallbacks are the production ones; Gemini is preferred for
sources over 20k characters when its key is set. The two large system prompts are read from
`generate_notes/index.ts` and `generate_derivatives/index.ts` at run time (those modules start a
server on import, so they cannot be imported); if a prompt stops being a plain template literal
the eval stops with an error. The small per-call prompt builders are reproduced in
`generation/prompts.ts`, each with a pointer to its source: update them when those functions
change.

A **judge** call (temperature 0, JSON) then grades each document against its source and its 5
facts in `data/key_facts.json`:

| Score | Meaning (1-5) | Threshold env | Default |
|---|---|---|---|
| coverage | notes cover the main ideas of every section and every key fact | `MIN_COVERAGE` | 3.5 |
| faithfulness | no claims in notes or cards absent from or contradicting the source | `MIN_FAITHFULNESS` | 4.0 |
| clarity | organised, readable, useful for revision | `MIN_CLARITY` | 3.5 |
| flashcard_atomicity | each card tests one fact | `MIN_FLASHCARD_ATOMICITY` | 3.5 |
| flashcard_answerability | each front is unambiguous and its back is correct | `MIN_FLASHCARD_ANSWERABILITY` | 3.5 |
| key_fact_recall | share of the 5 key facts the judge found in the notes (0-1) | `MIN_KEY_FACT_RECALL` | 0.7 |

Thresholds apply to the mean over documents. The script exits 1 when any mean is below its
threshold or any document failed to generate or be judged.

Other env: `JUDGE_PROVIDER` (`gemini` or `groq`; default gemini when its key is set),
`JUDGE_MODEL` (default `gemini-2.5-flash` / `openai/gpt-oss-120b`), `GEN_PROVIDER` or
`--provider` (force the generation provider), `GEN_DELAY_MS` (pause between calls, default 1500,
raise it on Groq's free tier). Prefer a judge model different from the generator to limit
self-preference bias.

Outputs: `results/generation.md` (aggregate table, per-document scores, unsupported claims the
judge flagged), `results/generation.json`, and per document `results/generation/<slug>/`
`notes.md`, `flashcards.json`, `judge.json`. Read the flagged claims and bad cards, not just the
means: judge scores are noisy by about half a point, so compare runs on the same judge model and
treat small moves as noise.

No baseline has been recorded yet (no API keys were available when this was written).
