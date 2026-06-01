# Source.io - AI-Powered Study Workspace

Source.io is an elegant, modern, AI-powered learning companion that transforms any source material—PDFs, DOCX files, audio/video uploads, YouTube links, or plain text—into highly organized study assets including real-time study notes, interactive flashcards, quizzes, and automated audio recap podcasts.

---

## 🛠️ Tech Stack

- **Frontend:** React 18, Vite, TypeScript, Tailwind CSS, shadcn/ui, Zustand
- **Backend:** Supabase (PostgreSQL, Auth, Storage, Edge Functions)
- **AI Integrations:** Gemini Pro (Edge functions), Groq API (Whisper transcription & Llama models), Groq Audio TTS (Podcast recap generation)

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
   Create a `.env` file at the project root and add your Supabase credentials:
   ```env
   VITE_SUPABASE_URL=your-supabase-project-url
   VITE_SUPABASE_PUBLISHABLE_KEY=your-supabase-anon-key
   ```

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
| `npm run lint` | Analyzes code for syntax and style standard violations |
| `npm run test` | Executes automated unit test suite via Vitest |

---

## 🔒 Environment Secrets

Edge functions access these server-side environment secrets configured in your Supabase project:
*   `GROQ_API_KEY`: Required for Whisper speech-to-text transcriptions and host speech synthesis.
