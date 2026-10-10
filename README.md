# Source.io - AI-Powered Study Workspace

Source.io is an elegant, modern, AI-powered learning companion that transforms any source material—PDFs, DOCX files, audio/video uploads, YouTube links, or plain text—into highly organized study assets including real-time study notes, interactive flashcards, quizzes, and automated audio recap podcasts.

---

## 🛠️ Tech Stack

- **Frontend:** Next.js 16 (App Router + Turbopack), React 18, TypeScript, Tailwind CSS, shadcn/ui, TanStack Query, Zustand, Lucide React
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
├── app/                       # Next.js App Router pages and layouts
│   ├── app/                   # /app workspace, settings, and document routes
│   │   ├── doc/[docId]/       # /app/doc/:docId workspace route
│   │   ├── settings/          # /app/settings preferences route
│   │   ├── layout.tsx         # App layout with authentication guard
│   │   └── page.tsx           # Dashboard route entry
│   ├── auth/                  # /auth authentication route
│   ├── globals.css            # Global CSS, theme variables & 3D animations
│   ├── layout.tsx             # Root HTML layout & fonts
│   ├── page.tsx               # Marketing landing page
│   └── providers.tsx          # TanStack Query & theme providers
│
├── public/                    # Static assets (images, previews, icons, videos)
│
├── src/
│   ├── components/            # UI components
│   │   ├── common/            # Shared components (MarkdownView, ThemeToggle, DailyQuotaPill)
│   │   ├── landing/           # Landing page sections & interactive demos
│   │   └── ui/                # shadcn/ui primitive design tokens
│   │
│   ├── features/              # Feature domains
│   │   ├── auth/              # Auth context, RequireAuth guard & login views
│   │   ├── dashboard/         # Tactile dashboard metrics, goals & cards
│   │   ├── documents/         # Document workspace, outline, 3D flashcards & quiz runner
│   │   └── settings/          # Model, storage, audio & theme settings
│   │
│   ├── hooks/                 # Custom React hooks (use-toast, use-theme, use-mobile)
│   ├── integrations/          # Supabase client and schema types
│   └── lib/                   # Utility helpers & API client services
│
├── docs/                      # Architectural and technical documentation
└── supabase/                  # Supabase migrations, config & edge functions
```

---

## 🚀 Getting Started

### Local Development

1. **Install Dependencies:**
   ```bash
   npm install
   ```

2. **Configure Environment Variables:**
   Copy the template and fill in your Supabase credentials in `.env.local`:
   ```bash
   cp .env.example .env.local
   ```
   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-publishable-key
   ```
   Both values are public and browser-safe. Never put a service-role key in a `NEXT_PUBLIC_`-prefixed variable.

3. **Start the Development Server:**
   ```bash
   npm run dev
   ```
   The application will boot locally at `http://localhost:3000`.

---

## 📝 Available Scripts

| Command | Action |
| :--- | :--- |
| `npm run dev` | Boots local Next.js dev server with Turbopack |
| `npm run build` | Builds optimized production bundle |
| `npm run start` | Starts Next.js production server |
| `npm run typecheck` | Type-checks the project (`tsc -b --noEmit`) |
| `npm run lint` | Analyzes code for syntax and style standards via ESLint |

---

## 🔒 Environment Secrets

Edge functions read these server-side secrets from your Supabase project. They are never exposed to the browser:

| Secret | Purpose |
| :--- | :--- |
| `GROQ_API_KEY` | Whisper transcription and llama chat completions |
| `ALLOWED_ORIGIN` | Optional CORS lock-down; defaults to `*` |

`SUPABASE_URL`, `SUPABASE_ANON_KEY`, and `SUPABASE_SERVICE_ROLE_KEY` are injected automatically by the platform.

See [`docs/edge-functions.md`](./docs/edge-functions.md) for the full contract.
