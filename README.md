# Source.io - AI-Powered Study Workspace

Source.io is an elegant, modern, AI-powered learning companion that transforms any source material—PDFs, DOCX files, audio/video uploads, YouTube links, or plain text—into highly organized study assets including real-time study notes, interactive flashcards, quizzes, and automated audio recap podcasts.

---

## 🛠️ Tech Stack

- **Frontend:** React 18, Vite, TypeScript, Tailwind CSS, shadcn/ui, Zustand
- **Backend:** Supabase (PostgreSQL + pgvector, Auth, Storage, Edge Functions on Deno)
- **AI Integrations:** Groq API — `llama-3.3-70b-versatile` for notes and derivatives, `llama-3.1-8b-instant` for chat, `whisper-large-v3` for transcription; Microsoft Edge TTS for podcast speech synthesis

---

## 📚 Documentation

Detailed docs live in [`docs/`](./docs/README.md):

| Page | Covers |
| :--- | :--- |
| [Architecture](./docs/architecture.md) | System shape, document lifecycle, state, streaming, RAG |
| [Data model](./docs/data-model.md) | Tables, enums, RLS policies, storage buckets, migrations |
| [Edge functions](./docs/edge-functions.md) | Request/response contract for all six functions |
| [Development](./docs/development.md) | Setup, scripts, conventions, testing |
| [Deployment](./docs/deployment.md) | Shipping frontend, migrations, and functions |
| [Troubleshooting](./docs/troubleshooting.md) | Symptom-to-cause reference |

---

## 📁 Reorganized Project Structure

The project follows a clean, professional-grade, domain-driven (feature-based) modular architecture:

```
.
├── public/                    # Static assets served as-is (e.g. favicons, robots)
├── src/
│   ├── components/            # Global visual components
│   │   ├── ui/                # shadcn/ui low-level primitives (buttons, dialogs, inputs)
│   │   └── common/            # Shared components (MarkdownView, NavLink)
│   │
│   ├── features/              # Modular self-contained domains
│   │   ├── auth/              # Authentication contexts, login routes, and guards
│   │   ├── chat/              # Grounded RAG dialog chat console
│   │   ├── flashcards/        # Spaced-repetition revision cards
│   │   ├── quiz/              # Learning assessment quiz players
│   │   └── documents/         # Upload engines, sidebars, and workspaces
│   │
│   ├── lib/                   # Platform configurations and utilities
│   │   └── services/          # Client-side background pipelines (extractors, audio triggers)
│   │
│   ├── pages/                 # Top-level route entrypoints (Index, NotFound)
│   ├── App.tsx                # Application routing configuration shell
│   └── main.tsx               # ReactDOM mounting setup
│
├── docs/                      # Project documentation (architecture, data model, deployment)
├── supabase/                  # Supabase database schemas & Deno code
│   ├── functions/             # Server-side Edge Functions
│   │   ├── chat/              # Citation-backed chat responder
│   │   ├── embed_chunks/      # Ingest vector-indexing
│   │   ├── generate_derivatives/  # Flashcards and quizzes compiler
│   │   ├── generate_notes/    # SSE stream markdown notes builder
│   │   ├── generate_podcast/  # Host dialog script builder
│   │   └── ingest/            # Document transcript pipeline
│   ├── migrations/            # SQL database migrations
│   └── config.toml            # Supabase config
├── tailwind.config.ts         # Styling directives extension
├── vite.config.ts             # Vite bundler rules
└── package.json               # Package manifests and runner scripts
```

---

## 🚀 Getting Started

### Local Development

1. **Install Dependencies:**
   ```bash
   npm install
   ```

2. **Configure Environment Variables:**
   Copy the template and fill in your Supabase credentials:
   ```bash
   cp .env.example .env
   ```
   ```env
   VITE_SUPABASE_URL=your-supabase-project-url
   VITE_SUPABASE_PUBLISHABLE_KEY=your-supabase-anon-key
   ```
   Both values are public and browser-safe. Never put a service-role key in a `VITE_`-prefixed
   variable — Vite inlines those into the shipped bundle.

3. **Start the Development Server:**
   ```bash
   npm run dev
   ```
   The application will boot locally at `http://localhost:8080` (or `8081` if port `8080` is occupied).

---

## 📝 Available Scripts

| Command | Action |
| :--- | :--- |
| `npm run dev` | Boots local Vite HMR dev server |
| `npm run build` | Assembles production bundle to `dist/` |
| `npm run preview` | Previews the compiled production build locally |
| `npm run typecheck` | Type-checks the project (`tsc -b --noEmit`) |
| `npm run lint` | Analyzes code for syntax and style standard violations |
| `npm run test` | Executes automated unit test suite via Vitest |

> `npm run build` uses SWC, which strips types **without checking them**. Run `npm run typecheck`
> before committing — the build is not a type gate.

---

## 🔒 Environment Secrets

Edge functions read these server-side secrets from your Supabase project. They are never exposed to the browser:

| Secret | Purpose |
| :--- | :--- |
| `GROQ_API_KEY` | Whisper transcription and llama chat completions |
| `ALLOWED_ORIGIN` | Optional CORS lock-down; defaults to `*` |

`SUPABASE_URL`, `SUPABASE_ANON_KEY`, and `SUPABASE_SERVICE_ROLE_KEY` are injected automatically by the platform.

See [`docs/edge-functions.md`](./docs/edge-functions.md) for the full contract.
