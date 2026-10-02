# Client vs Server Component Classification

**Decision**: Hybrid rendering — Server Components by default, Client Components only where necessary.

---

## MUST BE CLIENT COMPONENTS ("use client")

These use browser APIs, hooks, or interactivity that **cannot** run on the server:

### Auth & Session (Entirely client)
- `src/features/auth/context/AuthContext.tsx` — `useState`, `useEffect`, `onAuthStateChange`, `localStorage`
- `src/features/auth/components/RequireAuth.tsx` — `useRouter`, `useEffect` redirect, conditional render
- `src/features/auth/pages/Auth.tsx` — `useRouter`, form state, `useState`, `useEffect`, toast

### Document Workspace (Entirely client)
- `src/features/documents/pages/DocumentWorkspace.tsx` — 784 lines; `useState`, `useEffect`, `useRef`, `useCallback`, `useParams`, `useRouter`, realtime subscriptions, SSE streaming, `react-resizable-panels`
- `src/features/documents/components/WorkspaceCompanion.tsx` — 4 tabs with chat/podcast/flashcards/quiz, all interactive
- `src/features/documents/components/WorkspaceOutline.tsx` — `useState`, `useEffect`, scroll sync
- `src/features/documents/components/WorkspaceCommandMenu.tsx` — ⌘K palette, `useState`, `useEffect`, keyboard events
- `src/features/documents/components/CustomAudioPlayer.tsx` — `<audio>`, waveform canvas, transcript sync, `useRef`
- `src/features/documents/components/UploadDialog.tsx` — `useState`, `useRef` (dropzone), `useRouter`, file handling
- `src/features/documents/components/DocumentCardBento.tsx` — `useRouter`, dropdown state
- `src/features/documents/components/BentoTelemetry.tsx` — `useRouter`, dropzone, `useState`
- `src/features/documents/components/AppSidebar.tsx` — `useRouter`, `useParams`, realtime subscription, `useState`
- `src/features/documents/pages/AppEmpty.tsx` — `useRouter`, `useAppShell` context, `useState` (filters, search)
- `src/features/documents/pages/AppHome.tsx` — `useState` (mobile drawer, upload dialog), context provider

### Landing Page Interactive Sections
- `src/components/landing/HeroProductDemo.tsx` — Framer Motion animations, `useState`, `useEffect`
- `src/components/landing/InteractiveWorkflowDemo.tsx` — 5 tabs, Framer Motion, `useState`, custom audio player logic
- `src/components/landing/FeatureMotionCards.tsx` — Framer Motion scroll animations, `useState`
- `src/components/landing/CredibilityAndComparison.tsx` — Tabs, accordion, `useState`
- `src/pages/Index.tsx` — Global ⌘K `CommandDialog`, mobile menu, theme toggle, `useState`, `useEffect`

### Shared Interactive Components
- `src/components/common/NavLink.tsx` — `usePathname` (Next.js)
- `src/components/common/ThemeToggle.tsx` — `useTheme` context, `useEffect`
- `src/components/common/ErrorBoundary.tsx` — Class component with `componentDidCatch` (must be client)
- `src/components/common/MarkdownView.tsx` — `useEffect` for KaTeX rendering
- `src/components/common/Magnitude.tsx` — `useState`, `useEffect` for animated dots
- `src/hooks/use-theme.tsx` — Context provider, `useEffect` for localStorage + DOM class
- `src/hooks/use-mobile.tsx` — `useEffect` with `matchMedia`
- `src/hooks/use-toast.ts` — Custom toast state machine (if keeping)

### Providers (Client wrappers)
- `src/features/auth/context/AuthContext.tsx` — Provider component
- `src/hooks/use-theme.tsx` — `ThemeProvider`
- `app/providers.tsx` — `QueryClientProvider`, `TooltipProvider`, `Toaster`, `Sonner`, `AuthProvider`, `ThemeProvider`

### TanStack Query & Supabase
- `src/integrations/supabase/client.ts` — **Conditional**: Uses `typeof window !== "undefined"` guard; can be shared but imports `localStorage` — mark as client-safe module
- All query hooks (`useQuery`, `useMutation`) — Must be in client components

---

## CAN BE SERVER COMPONENTS (No "use client")

These are pure render, no browser APIs, no hooks, no interactivity:

### Layout & Shell (Server)
- `app/layout.tsx` — Root layout, metadata, font preloads, **Providers wrapper is client**
- `app/auth/layout.tsx` — Auth layout (if created), just wraps page
- `app/app/layout.tsx` — App shell layout, just composes `RequireAuth` + `AppHome` (both client)

### Static Landing Sections (Server)
- `src/components/landing/Hero.tsx` — **Extract** static copy/headline from `HeroProductDemo`
- `src/components/landing/SourcesRibbon.tsx` — Static chips (8 sources)
- `src/components/landing/PipelineSection.tsx` — Static 4-stage cards
- `src/components/landing/Testimonials.tsx` — Static testimonial cards
- `src/components/landing/AudienceSelector.tsx` — Static radio group (if no state)
- `src/components/landing/ComparisonTable.tsx` — Static table
- `src/components/landing/Pricing.tsx` — Static pricing cards
- `src/components/landing/FAQ.tsx` — Static accordion (if using `<details>` or CSS-only)
- `src/components/landing/Footer.tsx` — Static links

### Static Document UI (Server)
- `src/features/documents/components/DocumentCardStatic.tsx` — **Extract** static card from `DocumentCardBento` (remove dropdown, navigation)
- `src/features/documents/components/EmptyState.tsx` — Static empty state illustration
- `src/features/documents/components/LoadingSkeleton.tsx` — Static skeletons

### Auth Marketing Side (Server)
- `src/features/auth/components/AuthMarketing.tsx` — **Extract** left marketing panel from `Auth.tsx`
- `src/features/auth/components/AuthForms.tsx` — **Keep client** (forms, validation, submission)

### Not Found (Server)
- `app/not-found.tsx` — Custom 404, static content
- `src/pages/NotFound.tsx` — Can be server if no `usePathname`; currently uses it → **client**

---

## CLASSIFICATION STRATEGY

### Pattern: "Shell Client, Content Server"

| Route | Shell (Client) | Content (Server) |
|-------|---------------|------------------|
| `/` | `Index.tsx` (nav, ⌘K, theme, mobile menu) | Hero copy, Sources, Pipeline, Testimonials, Comparison, Pricing, FAQ, Footer |
| `/auth` | `Auth.tsx` (forms, submission, toasts) | Marketing panel (left side) |
| `/app` | `AppHome.tsx` (sidebar, drawer, upload dialog) | — |
| `/app/doc/[docId]` | `DocumentWorkspace.tsx` (all interactive) | — |
| `/app` (empty) | `AppEmpty.tsx` (filters, search, cards) | Card static content |

### Code-Splitting Targets (Dynamic Imports + `ssr: false`)

1. `DocumentWorkspace` → `dynamic(() => import('@/features/documents/pages/DocumentWorkspace'), { ssr: false })`
2. `WorkspaceCompanion` → Lazy-load per tab (Chat, Podcast, Cards, Quiz)
3. `WorkspaceCommandMenu` → `dynamic(..., { ssr: false })`
4. `CustomAudioPlayer` → `dynamic(..., { ssr: false })`
5. `HeroProductDemo` → `dynamic(..., { ssr: false })`
6. `InteractiveWorkflowDemo` → `dynamic(..., { ssr: false })`
7. `FeatureMotionCards` → `dynamic(..., { ssr: false })`

---

## MIGRATION ORDER

1. **Server-first**: Create `app/layout.tsx`, `app/page.tsx` with server-rendered landing sections
2. **Client shells**: Wrap interactive roots with `"use client"` (`Index`, `Auth`, `AppHome`, `DocumentWorkspace`)
3. **Extract static components**: Split landing page into server-rendered pieces
4. **Dynamic import heavy clients**: Workspace, demos, command menu
5. **Unify toasts**: Replace `useToast` → `sonner` in all client components
6. **Fix JWT**: Update `supabase/config.toml` + client calls

---

## FILES TO CREATE (Server Components)

| New File | Source | Notes |
|----------|--------|-------|
| `app/components/landing/HeroContent.tsx` | `HeroProductDemo` static copy | Headline, subtext, CTA |
| `app/components/landing/SourcesRibbon.tsx` | `Index.tsx` lines 150-170 | 8 chips |
| `app/components/landing/PipelineSection.tsx` | `Index.tsx` lines 350-400 | 4 stages |
| `app/components/landing/CredibilitySection.tsx` | `CredibilityAndComparison` static parts | Testimonials, audience, comparison, pricing, FAQ |
| `app/components/landing/Footer.tsx` | `Index.tsx` footer | Links, copyright |
| `app/auth/components/AuthMarketing.tsx` | `Auth.tsx` left panel | Marketing copy |
| `app/components/documents/DocumentCardStatic.tsx` | `DocumentCardBento` minus actions | Title, source, status, date |
| `app/components/documents/EmptyState.tsx` | `AppEmpty` empty state | Illustration + copy |

---

## FILES THAT STAY CLIENT (Add "use client")

All files listed in **MUST BE CLIENT COMPONENTS** above — approximately 35 files.

---

## VERIFICATION CHECKLIST

After migration, verify:
- [ ] No Server Component imports Client Component directly (only via dynamic import or children prop)
- [ ] All `"use client"` directives are at line 1
- [ ] No `useState`/`useEffect`/`useRouter`/`useParams`/`usePathname` in Server Components
- [ ] No `localStorage`/`window`/`document` in Server Components
- [ ] Dynamic imports use `{ ssr: false }` for SSR-incompatible libraries
- [ ] `next/link` used in Server Components (works), `useRouter` only in Client Components