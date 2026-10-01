# Source.io → Next.js 15 App Router Migration Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Convert the existing Vite + React Router 6 SPA into a Next.js 15 App Router project in-place, preserving all existing functionality, UI, and Supabase integration.

**Architecture:** The app moves from a client-side SPA (Vite + react-router-dom) to Next.js 15 App Router with the `app/` directory convention. All pages remain client-rendered (`"use client"`) since the app is heavily interactive (auth state, real-time Supabase, command palettes, streaming SSE). The Supabase edge functions and database stay untouched. `react-router-dom` is fully replaced by Next.js `<Link>`, `useRouter`, `useParams`, `usePathname`, and file-system routing.

**Tech Stack:** Next.js 15 (App Router), React 18, TypeScript, Tailwind CSS 3, shadcn/ui, Supabase JS, TanStack React Query, Zustand, motion (framer-motion)

**Spec:** This plan is self-contained — the spec is the current Vite project at `d:\PROJECT REPOS\Source.io`.

---

## Global Constraints

- Next.js 15 (latest stable), App Router only — no Pages Router
- React 18 (keep current version, Next 15 supports it)
- Tailwind CSS 3 (keep current config, just adjust `content` paths)
- Environment variables: rename `VITE_*` → `NEXT_PUBLIC_*`
- All components using hooks, browser APIs, or state → `"use client"` directive
- Preserve the `@/` path alias (now maps to `src/` via `tsconfig.json`)
- Keep `src/` directory for non-route code (components, features, hooks, lib, integrations)
- Supabase edge functions and `supabase/` directory are untouched
- `public/` directory contents remain as-is (Next.js serves them the same way)

## Review Focus

1. **`import.meta.env` remnants** — Any file still using `import.meta.env` instead of `process.env` will break at runtime. Must grep and fix every occurrence.
2. **`"use client"` missing on interactive components** — Next.js App Router defaults to server components; any file using `useState`, `useEffect`, `useContext`, `useRouter`, or browser APIs without `"use client"` will error.
3. **`<Link>` behavioral differences** — React Router's `<Link to="">` becomes Next.js `<Link href="">`. The `state` prop (used in `RequireAuth`) doesn't exist in Next.js.
4. **`Outlet` / nested routes pattern** — React Router's `<Outlet>` with `useOutletContext` has no Next.js equivalent; this must become a layout with `children` and React context.
5. **Dynamic route params** — React Router `useParams()` returns `{ docId: string }` synchronously; Next.js `useParams()` from `next/navigation` returns the same shape but imports differ.

---

## File Structure Map

### Files to DELETE (Vite-specific)
- `vite.config.ts`
- `vitest.config.ts`
- `index.html`
- `vercel.json`
- `src/main.tsx`
- `src/App.tsx`
- `src/vite-env.d.ts`
- `tsconfig.app.json` + `tsconfig.node.json` + `tsconfig.app.tsbuildinfo` + `tsconfig.node.tsbuildinfo`

### Files to CREATE (Next.js)
- `next.config.ts` — Next.js config
- `app/layout.tsx` — Root layout (replaces `index.html` + `App.tsx` providers)
- `app/page.tsx` — Landing page (wraps `src/pages/Index.tsx`)
- `app/auth/page.tsx` — Auth page
- `app/app/layout.tsx` — App layout (replaces `AppHome` with `RequireAuth` wrapper)
- `app/app/page.tsx` — App empty state (wraps `AppEmpty`)
- `app/app/doc/[docId]/page.tsx` — Document workspace
- `app/not-found.tsx` — Custom 404 page
- `app/globals.css` — Moved from `src/index.css`

### Files to MODIFY
- `package.json` — Replace scripts, add `next`, remove `vite`, `react-router-dom`, `@vitejs/plugin-react-swc`, `vitest`
- `tsconfig.json` — Rewrite for Next.js conventions
- `tailwind.config.ts` — Update `content` paths to include `app/`
- `postcss.config.js` — Convert to `postcss.config.mjs` (Next.js convention)
- `.env` → `.env.local` — Rename variables to `NEXT_PUBLIC_*`
- `components.json` — Update shadcn CSS path
- `src/integrations/supabase/client.ts` — `import.meta.env` → `process.env`
- `src/features/auth/components/RequireAuth.tsx` — `react-router-dom` → `next/navigation`
- `src/features/auth/pages/Auth.tsx` — `react-router-dom` → `next/navigation`
- `src/features/auth/context/AuthContext.tsx` — No changes needed (already framework-agnostic)
- `src/features/documents/pages/AppHome.tsx` — Remove `Outlet`, accept `children` prop
- `src/features/documents/pages/AppEmpty.tsx` — Replace `useOutletContext` with React context
- `src/features/documents/pages/DocumentWorkspace.tsx` — Replace `useParams`/`useNavigate`/`useOutletContext`
- `src/features/documents/components/AppSidebar.tsx` — Replace `Link`/`useNavigate`/`useParams`
- `src/features/documents/components/UploadDialog.tsx` — Replace `useNavigate`
- `src/features/documents/components/DocumentCardBento.tsx` — Replace `useNavigate`
- `src/features/documents/components/BentoTelemetry.tsx` — Replace `useNavigate`
- `src/pages/Index.tsx` — Replace `Link` from react-router with `next/link`
- `src/pages/NotFound.tsx` — Replace `Link`/`useLocation`
- `src/components/landing/CredibilityAndComparison.tsx` — Replace `Link`
- `src/components/common/NavLink.tsx` — Rewrite for Next.js
- `src/test/supabase-connection.test.ts` — Update env var references

---

## Task 1: Scaffold Next.js and Update Config Files

**Files:**
- Delete: `vite.config.ts`, `vitest.config.ts`, `index.html`, `vercel.json`, `src/main.tsx`, `src/App.tsx`, `src/vite-env.d.ts`, `tsconfig.app.json`, `tsconfig.node.json`, `tsconfig.app.tsbuildinfo`, `tsconfig.node.tsbuildinfo`
- Create: `next.config.ts`
- Modify: `package.json`, `tsconfig.json`, `tailwind.config.ts`, `postcss.config.js`, `components.json`
- Rename: `.env` → `.env.local`

**Interfaces:**
- Consumes: Nothing
- Produces: A valid Next.js project scaffold that can `npm run dev` (will show 404 since no `app/` yet)

- [ ] **Step 1: Install Next.js and remove Vite deps**

```bash
npm install next@latest
npm uninstall vite @vitejs/plugin-react-swc vitest eslint-plugin-react-refresh react-router-dom
```

Also remove `react-router-dom` since we'll replace it with `next/navigation` and `next/link`.

- [ ] **Step 2: Rewrite `package.json` scripts**

Replace the `scripts` block:
```json
{
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint",
    "typecheck": "tsc -b --noEmit"
  }
}
```

Also update `"name"` to `"source-io"` and remove `"type": "module"` (Next.js handles this).

- [ ] **Step 3: Rewrite `tsconfig.json`**

Replace the entire file with:
```json
{
  "compilerOptions": {
    "target": "ES2017",
    "lib": ["dom", "dom.iterable", "esnext"],
    "allowJs": true,
    "skipLibCheck": true,
    "strict": false,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "noImplicitAny": false,
    "noUnusedLocals": false,
    "noUnusedParameters": false,
    "strictNullChecks": false,
    "plugins": [{ "name": "next" }],
    "paths": {
      "@/*": ["./src/*"]
    }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules"]
}
```

- [ ] **Step 4: Create `next.config.ts`**

```ts
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Keep src/ directory for non-route code; app/ is at root for routes
  // No custom webpack needed — Next.js handles React, TS, Tailwind natively
};

export default nextConfig;
```

- [ ] **Step 5: Update `tailwind.config.ts` content paths**

Change the `content` array to:
```ts
content: [
  "./app/**/*.{ts,tsx}",
  "./src/**/*.{ts,tsx}",
],
```

- [ ] **Step 6: Rename and update environment variables**

Rename `.env` to `.env.local` and update:
```
NEXT_PUBLIC_SUPABASE_URL=https://vcevdkggfbhftaegkkkk.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_HzSvFp7uDeoCdgAjYrkD4Q_KBrkDO2P
```

Update `.env.example` similarly:
```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
```

- [ ] **Step 7: Update `components.json` CSS path**

Change `tailwind.css` to point to the new location:
```json
{
  "$schema": "https://ui.shadcn.com/schema.json",
  "style": "default",
  "rsc": false,
  "tsx": true,
  "tailwind": {
    "config": "tailwind.config.ts",
    "css": "app/globals.css",
    "baseColor": "slate",
    "cssVariables": true,
    "prefix": ""
  },
  "aliases": {
    "components": "@/components",
    "utils": "@/lib/utils",
    "ui": "@/components/ui",
    "lib": "@/lib",
    "hooks": "@/hooks"
  }
}
```

- [ ] **Step 8: Delete Vite-specific files**

```bash
del vite.config.ts
del vitest.config.ts
del index.html
del vercel.json
del src\main.tsx
del src\App.tsx
del src\vite-env.d.ts
del tsconfig.app.json
del tsconfig.node.json
del tsconfig.app.tsbuildinfo
del tsconfig.node.tsbuildinfo
```

- [ ] **Step 9: Move CSS to `app/globals.css`**

```bash
mkdir app
copy src\index.css app\globals.css
```

Keep `src/index.css` temporarily (delete after verifying nothing imports it directly).

- [ ] **Step 10: Commit scaffold**

```bash
git add -A
git commit -m "chore: scaffold Next.js 15, remove Vite config"
```

---

## Task 2: Update Supabase Client and Env Var References

**Files:**
- Modify: `src/integrations/supabase/client.ts`
- Modify: `src/test/supabase-connection.test.ts`

**Interfaces:**
- Consumes: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` env vars from Task 1
- Produces: `supabase` client, `SUPABASE_URL`, `SUPABASE_PUBLISHABLE_KEY` exports (same API surface as before)

- [ ] **Step 1: Update `src/integrations/supabase/client.ts`**

Replace `import.meta.env.VITE_*` with `process.env.NEXT_PUBLIC_*`:

```ts
// This file is automatically generated. Do not edit it directly.
import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

const CONFIGURED_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const CONFIGURED_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// Placeholders keep the module importable in test/build environments that have
// no credentials. Any real request against them will fail, so make the cause loud.
if (!CONFIGURED_URL || !CONFIGURED_KEY) {
  console.error(
    "[supabase] NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY are not set. " +
      "Copy .env.example to .env.local and fill them in — every request will fail until you do.",
  );
}

export const SUPABASE_URL = CONFIGURED_URL || "https://placeholder-project.supabase.co";
export const SUPABASE_PUBLISHABLE_KEY = CONFIGURED_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBsYWNlaG9sZGVyIiwicm9sZSI6ImFub24iLCJpYXQiOjE1OTg4NzQ5OTIsImV4cCI6MTkxNDQzNDk5Mn0.placeholder";

// Import the supabase client like this:
// import { supabase } from "@/integrations/supabase/client";

export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: {
    storage: typeof window !== "undefined" ? localStorage : undefined,
    persistSession: true,
    autoRefreshToken: true,
  }
});
```

Note: Added `typeof window !== "undefined"` guard on `localStorage` since the module may be imported during SSR/build.

- [ ] **Step 2: Update test env references**

In `src/test/supabase-connection.test.ts`, replace:
```ts
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL as string | undefined;
const SUPABASE_PUBLISHABLE_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string | undefined;
```

- [ ] **Step 3: Commit**

```bash
git add -A
git commit -m "fix: update Supabase client to use NEXT_PUBLIC env vars"
```

---

## Task 3: Create Root Layout and App Shell Context

**Files:**
- Create: `app/layout.tsx`
- Create: `src/features/documents/context/AppShellContext.tsx` (replaces `useOutletContext`)

**Interfaces:**
- Consumes: `ThemeProvider` from `@/hooks/use-theme`, `AuthProvider` from `@/features/auth/context/AuthContext`, `QueryClientProvider` from `@tanstack/react-query`, shadcn UI toasters
- Produces: `app/layout.tsx` wrapping all pages with providers; `useAppShell()` hook replacing `useOutletContext`

- [ ] **Step 1: Create the AppShell context**

This replaces React Router's `useOutletContext` pattern used by `AppHome`→`AppEmpty`/`DocumentWorkspace`.

Create `src/features/documents/context/AppShellContext.tsx`:

```tsx
"use client";

import { createContext, useContext, useState, ReactNode } from "react";

type AppShellContextType = {
  openUpload: () => void;
  openMobileNav: () => void;
};

const AppShellContext = createContext<AppShellContextType>({
  openUpload: () => {},
  openMobileNav: () => {},
});

export function AppShellProvider({
  children,
  onUpload,
  onMobileNav,
}: {
  children: ReactNode;
  onUpload: () => void;
  onMobileNav: () => void;
}) {
  return (
    <AppShellContext.Provider value={{ openUpload: onUpload, openMobileNav: onMobileNav }}>
      {children}
    </AppShellContext.Provider>
  );
}

export function useAppShell() {
  return useContext(AppShellContext);
}
```

- [ ] **Step 2: Create `app/layout.tsx`**

```tsx
import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "./providers";

export const metadata: Metadata = {
  title: "Source.io: AI study workspace for any content",
  description:
    "Turn PDFs, videos, audio, YouTube and notes into AI-generated study notes, flashcards, quizzes, podcasts and chat.",
  openGraph: {
    title: "Source.io: AI study workspace for any content",
    description:
      "Turn PDFs, videos, audio, YouTube and notes into AI-generated study notes, flashcards, quizzes, podcasts and chat.",
    images: [
      "https://storage.googleapis.com/gpt-engineer-file-uploads/attachments/og-images/d4536bf5-0950-46b4-a3a9-668a58eecb92",
    ],
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Source.io: AI study workspace for any content",
    description:
      "Turn PDFs, videos, audio, YouTube and notes into AI-generated study notes, flashcards, quizzes, podcasts and chat.",
    images: [
      "https://storage.googleapis.com/gpt-engineer-file-uploads/attachments/og-images/d4536bf5-0950-46b4-a3a9-668a58eecb92",
    ],
  },
  icons: { icon: "/favicon.png" },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&family=Inter:wght@300;400;500;600;700&family=Fira+Code:wght@400;500&family=Literata:ital,opsz,wght@0,7..72,400;0,7..72,600;0,7..72,700;1,7..72,400&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
```

- [ ] **Step 3: Create `app/providers.tsx`**

Extract providers into a client component:

```tsx
"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/features/auth/context/AuthContext";
import { ThemeProvider } from "@/hooks/use-theme";
import { useState } from "react";

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            retry: 1,
            staleTime: 30_000,
            refetchOnWindowFocus: false,
          },
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <ThemeProvider>
          <Toaster />
          <Sonner />
          <AuthProvider>{children}</AuthProvider>
        </ThemeProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}
```

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "feat: create Next.js root layout with providers"
```

---

## Task 4: Migrate the Landing Page Route (`/`)

**Files:**
- Create: `app/page.tsx`
- Modify: `src/pages/Index.tsx` — replace `Link` from react-router with `next/link`
- Modify: `src/components/landing/CredibilityAndComparison.tsx` — replace `Link`

**Interfaces:**
- Consumes: `Index` component from `src/pages/Index.tsx`, landing sub-components
- Produces: `/` route rendering the landing page

- [ ] **Step 1: Update `src/pages/Index.tsx`**

At the top of the file, add `"use client";` as the very first line.

Replace:
```tsx
import { Link } from "react-router-dom";
```
With:
```tsx
import Link from "next/link";
```

Then do a find-and-replace throughout the file:
- `<Link to=` → `<Link href=`
- `to="/app"` → `href="/app"`
- `to="/auth"` → `href="/auth"`
- `to="/"` → `href="/"`

The `window.location.href` usage on line 438 can stay as-is (it's a programmatic navigation in a command handler).

- [ ] **Step 2: Update `src/components/landing/CredibilityAndComparison.tsx`**

Add `"use client";` at the top.

Replace:
```tsx
import { Link } from "react-router-dom";
```
With:
```tsx
import Link from "next/link";
```

Replace all `<Link to=` with `<Link href=`.

- [ ] **Step 3: Create `app/page.tsx`**

```tsx
import Index from "@/pages/Index";

export default function HomePage() {
  return <Index />;
}
```

- [ ] **Step 4: Verify the landing page renders**

```bash
npm run dev
```

Open `http://localhost:3000` and verify the landing page loads correctly with all sections, theme toggle, and command palette.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat: migrate landing page to Next.js app router"
```

---

## Task 5: Migrate Auth Page (`/auth`)

**Files:**
- Create: `app/auth/page.tsx`
- Modify: `src/features/auth/pages/Auth.tsx` — replace react-router imports
- Modify: `src/features/auth/components/RequireAuth.tsx` — replace react-router imports

**Interfaces:**
- Consumes: `Auth` component, `useAuth` hook
- Produces: `/auth` route, updated `RequireAuth` component

- [ ] **Step 1: Update `src/features/auth/pages/Auth.tsx`**

Add `"use client";` at the top.

Replace:
```tsx
import { useNavigate, Link } from "react-router-dom";
```
With:
```tsx
import { useRouter } from "next/navigation";
import Link from "next/link";
```

Replace all `useNavigate()` calls:
- `const navigate = useNavigate();` → `const router = useRouter();`
- `navigate("/app")` → `router.push("/app")`
- `navigate("/")` → `router.push("/")`

Replace all `<Link to=` with `<Link href=`.

- [ ] **Step 2: Update `src/features/auth/components/RequireAuth.tsx`**

Add `"use client";` at the top.

Replace:
```tsx
import { Navigate, useLocation } from "react-router-dom";
```
With:
```tsx
import { useRouter, usePathname } from "next/navigation";
```

Replace the redirect logic:
- Remove `const location = useLocation();`
- Add `const router = useRouter();` and `const pathname = usePathname();`
- Replace `<Navigate to="/auth" state={{ from: location }} replace />` with:

```tsx
// Use useEffect for client-side redirect
import { useEffect } from "react";

// Inside the component, replace the Navigate return:
useEffect(() => {
  if (!loading && !user && !error) {
    router.replace("/auth");
  }
}, [loading, user, error, router]);

if (!user && !loading && !error) return <RouteFallback />;
```

Wait — simpler approach. Use `redirect()` isn't possible from a client component. Use router.replace in an effect, but for the immediate render, show a loading state:

```tsx
"use client";

import { useRouter } from "next/navigation";
import { useAuth } from "@/features/auth/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Loader2, Sparkles, ArrowRight } from "lucide-react";
import { useTheme } from "@/hooks/use-theme";
import { cn } from "@/lib/utils";
import { useEffect } from "react";

export default function RequireAuth({ children }: { children: React.ReactNode }) {
  const { user, loading, error, signInAsGuest } = useAuth();
  const router = useRouter();
  const { theme } = useTheme();

  useEffect(() => {
    if (!loading && !user && !error) {
      router.replace("/auth");
    }
  }, [loading, user, error, router]);

  if (loading) {
    return (
      <div className={cn("luminous-app min-h-screen flex items-center justify-center bg-background", theme === "dark" && "dark")}>
        <Loader2 className="h-5 w-5 animate-spin text-foreground" />
      </div>
    );
  }

  if (error && !user) {
    return (
      <div className={cn("luminous-app min-h-screen flex items-center justify-center bg-background px-6 font-sans antialiased", theme === "dark" && "dark")}>
        <div className="bg-card border border-border rounded-3xl p-8 text-center max-w-sm space-y-4 shadow-xl">
          <div className="h-12 w-12 rounded-full bg-muted dark:bg-zinc-800 border border-border flex items-center justify-center text-foreground mx-auto">
            <Sparkles className="h-6 w-6" />
          </div>
          <div className="space-y-1.5">
            <h1 className="font-semibold text-foreground font-display text-base">Explore Source.io Studio</h1>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Use demo mode to explore the full interactive study workspace and sample documents.
            </p>
          </div>
          <Button onClick={signInAsGuest} className="w-full font-semibold text-xs py-2.5 shadow-md">
            <span>Continue in Demo Mode</span>
            <ArrowRight className="h-3.5 w-3.5 ml-1.5" />
          </Button>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className={cn("luminous-app min-h-screen flex items-center justify-center bg-background", theme === "dark" && "dark")}>
        <Loader2 className="h-5 w-5 animate-spin text-foreground" />
      </div>
    );
  }

  return <>{children}</>;
}
```

- [ ] **Step 3: Create `app/auth/page.tsx`**

```tsx
import Auth from "@/features/auth/pages/Auth";

export default function AuthPage() {
  return <Auth />;
}
```

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "feat: migrate auth page and RequireAuth to Next.js"
```

---

## Task 6: Migrate the App Shell Layout (`/app`)

**Files:**
- Create: `app/app/layout.tsx`
- Modify: `src/features/documents/pages/AppHome.tsx` — remove `Outlet`, use `children` + context

**Interfaces:**
- Consumes: `RequireAuth`, `AppShellProvider` (from Task 3), `AppSidebar`, `UploadDialog`, `Sheet`
- Produces: `/app/*` layout wrapping child routes with sidebar, upload dialog, and auth guard

- [ ] **Step 1: Refactor `src/features/documents/pages/AppHome.tsx`**

Replace the `Outlet` pattern with `children` prop + `AppShellProvider`:

```tsx
"use client";

import { useState } from "react";
import AppSidebar from "@/features/documents/components/AppSidebar";
import UploadDialog from "@/features/documents/components/UploadDialog";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { useTheme } from "@/hooks/use-theme";
import { cn } from "@/lib/utils";
import { AppShellProvider } from "@/features/documents/context/AppShellContext";

export default function AppHome({ children }: { children: React.ReactNode }) {
  const [uploadOpen, setUploadOpen] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const { theme } = useTheme();

  return (
    <AppShellProvider
      onUpload={() => setUploadOpen(true)}
      onMobileNav={() => setMobileNavOpen(true)}
    >
      <div className={cn("luminous-app flex h-screen bg-background text-foreground antialiased font-sans", theme === "dark" && "dark")}>
        {/* Desktop sidebar */}
        <div className="hidden md:flex">
          <AppSidebar onNew={() => setUploadOpen(true)} />
        </div>

        {/* Mobile drawer sidebar */}
        <Sheet open={mobileNavOpen} onOpenChange={setMobileNavOpen}>
          <SheetContent side="left" className="p-0 w-[18rem] border-sidebar-border bg-sidebar">
            <AppSidebar
              onNew={() => {
                setMobileNavOpen(false);
                setUploadOpen(true);
              }}
              onNavigate={() => setMobileNavOpen(false)}
            />
          </SheetContent>
        </Sheet>

        <div className="flex-1 overflow-hidden">
          {children}
        </div>

        <UploadDialog open={uploadOpen} onOpenChange={setUploadOpen} />
      </div>
    </AppShellProvider>
  );
}
```

- [ ] **Step 2: Create `app/app/layout.tsx`**

```tsx
import RequireAuth from "@/features/auth/components/RequireAuth";
import AppHome from "@/features/documents/pages/AppHome";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <RequireAuth>
      <AppHome>{children}</AppHome>
    </RequireAuth>
  );
}
```

- [ ] **Step 3: Commit**

```bash
git add -A
git commit -m "feat: migrate app shell layout to Next.js"
```

---

## Task 7: Migrate App Pages (`/app` and `/app/doc/[docId]`)

**Files:**
- Create: `app/app/page.tsx`
- Create: `app/app/doc/[docId]/page.tsx`
- Modify: `src/features/documents/pages/AppEmpty.tsx` — replace `useOutletContext` with `useAppShell`
- Modify: `src/features/documents/pages/DocumentWorkspace.tsx` — replace react-router hooks
- Modify: `src/features/documents/components/AppSidebar.tsx` — replace react-router hooks
- Modify: `src/features/documents/components/UploadDialog.tsx` — replace `useNavigate`
- Modify: `src/features/documents/components/DocumentCardBento.tsx` — replace `useNavigate`
- Modify: `src/features/documents/components/BentoTelemetry.tsx` — replace `useNavigate`

**Interfaces:**
- Consumes: `useAppShell()` from Task 3, all document feature components
- Produces: `/app` and `/app/doc/:docId` routes

- [ ] **Step 1: Update `src/features/documents/pages/AppEmpty.tsx`**

Add `"use client";` at the top.

Replace:
```tsx
import { useNavigate, useOutletContext } from "react-router-dom";
```
With:
```tsx
import { useRouter } from "next/navigation";
import { useAppShell } from "@/features/documents/context/AppShellContext";
```

Replace:
- `const navigate = useNavigate();` → `const router = useRouter();`
- `navigate(...)` → `router.push(...)`
- `const { openUpload, openMobileNav } = useOutletContext<{...}>();` → `const { openUpload, openMobileNav } = useAppShell();`

- [ ] **Step 2: Update `src/features/documents/pages/DocumentWorkspace.tsx`**

Add `"use client";` at the top.

Replace:
```tsx
import { useParams, useNavigate, useOutletContext } from "react-router-dom";
```
With:
```tsx
import { useParams, useRouter } from "next/navigation";
import { useAppShell } from "@/features/documents/context/AppShellContext";
```

Replace:
- `const navigate = useNavigate();` → `const router = useRouter();`
- `navigate("/app")` → `router.push("/app")`
- `const outlet = useOutletContext<{ openMobileNav?: () => void }>();` → `const { openMobileNav } = useAppShell();`
- References to `outlet.openMobileNav` → `openMobileNav`
- `const { docId } = useParams();` stays the same (both return `{ docId: string }`)

- [ ] **Step 3: Update `src/features/documents/components/AppSidebar.tsx`**

Add `"use client";` at the top.

Replace:
```tsx
import { Link, useNavigate, useParams } from "react-router-dom";
```
With:
```tsx
import Link from "next/link";
import { useRouter, useParams } from "next/navigation";
```

Replace:
- `const navigate = useNavigate();` → `const router = useRouter();`
- `navigate(...)` → `router.push(...)`
- `<Link to=` → `<Link href=`

- [ ] **Step 4: Update `src/features/documents/components/UploadDialog.tsx`**

Add `"use client";` at the top.

Replace:
```tsx
import { useNavigate } from "react-router-dom";
```
With:
```tsx
import { useRouter } from "next/navigation";
```

Replace:
- `const navigate = useNavigate();` → `const router = useRouter();`
- `navigate(...)` → `router.push(...)`

- [ ] **Step 5: Update `src/features/documents/components/DocumentCardBento.tsx`**

Add `"use client";` at the top.

Replace:
```tsx
import { useNavigate } from "react-router-dom";
```
With:
```tsx
import { useRouter } from "next/navigation";
```

Replace:
- `const navigate = useNavigate();` → `const router = useRouter();`
- `navigate(...)` → `router.push(...)`

- [ ] **Step 6: Update `src/features/documents/components/BentoTelemetry.tsx`**

Add `"use client";` at the top.

Replace:
```tsx
import { useNavigate } from "react-router-dom";
```
With:
```tsx
import { useRouter } from "next/navigation";
```

Replace:
- `const navigate = useNavigate();` → `const router = useRouter();`
- `navigate(...)` → `router.push(...)`

- [ ] **Step 7: Create `app/app/page.tsx`**

```tsx
import AppEmpty from "@/features/documents/pages/AppEmpty";

export default function AppPage() {
  return <AppEmpty />;
}
```

- [ ] **Step 8: Create `app/app/doc/[docId]/page.tsx`**

```tsx
import DocumentWorkspace from "@/features/documents/pages/DocumentWorkspace";

export default function DocumentPage() {
  return <DocumentWorkspace />;
}
```

- [ ] **Step 9: Commit**

```bash
git add -A
git commit -m "feat: migrate app pages and document components to Next.js routing"
```

---

## Task 8: Migrate NotFound, NavLink, and Cleanup

**Files:**
- Create: `app/not-found.tsx`
- Modify: `src/pages/NotFound.tsx` — replace react-router
- Modify: `src/components/common/NavLink.tsx` — rewrite for Next.js
- Delete: `src/pages/__PreviewWorkspace.tsx` (Vite preview artifact)
- Delete: `src/index.css` (moved to `app/globals.css`)

**Interfaces:**
- Consumes: Nothing external
- Produces: Custom 404 page, cleaned up codebase

- [ ] **Step 1: Update `src/pages/NotFound.tsx`**

Add `"use client";` at the top.

Replace:
```tsx
import { Link, useLocation } from "react-router-dom";
```
With:
```tsx
import Link from "next/link";
import { usePathname } from "next/navigation";
```

Replace:
- `const location = useLocation();` → `const pathname = usePathname();`
- `location.pathname` → `pathname`
- `<Link to=` → `<Link href=`

- [ ] **Step 2: Create `app/not-found.tsx`**

```tsx
import NotFound from "@/pages/NotFound";

export default function NotFoundPage() {
  return <NotFound />;
}
```

- [ ] **Step 3: Rewrite `src/components/common/NavLink.tsx`**

```tsx
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

interface NavLinkProps {
  href: string;
  className?: string | ((props: { isActive: boolean }) => string);
  children: React.ReactNode;
}

export default function NavLink({ href, className, children }: NavLinkProps) {
  const pathname = usePathname();
  const isActive = pathname === href || pathname.startsWith(href + "/");

  const resolvedClass =
    typeof className === "function" ? className({ isActive }) : className;

  return (
    <Link href={href} className={cn(resolvedClass)}>
      {children}
    </Link>
  );
}
```

- [ ] **Step 4: Delete leftover files**

```bash
del src\pages\__PreviewWorkspace.tsx
del src\index.css
```

- [ ] **Step 5: Add `"use client"` to remaining interactive components that need it**

Grep for any component using `useState`, `useEffect`, `useContext` that doesn't yet have `"use client"`:

Files that likely need it (add `"use client";` as the first line if missing):
- `src/components/landing/HeroProductDemo.tsx`
- `src/components/landing/InteractiveWorkflowDemo.tsx`
- `src/components/landing/FeatureMotionCards.tsx`
- `src/components/landing/CredibilityAndComparison.tsx`
- `src/features/chat/components/ChatPanel.tsx`
- `src/features/flashcards/components/FlashcardsDeck.tsx`
- `src/features/quiz/components/QuizPlayer.tsx`
- `src/features/documents/components/WorkspaceCompanion.tsx`
- `src/features/documents/components/WorkspaceOutline.tsx`
- `src/features/documents/components/WorkspaceCommandMenu.tsx`
- `src/features/documents/components/CustomAudioPlayer.tsx`
- `src/components/common/ErrorBoundary.tsx`
- `src/components/common/ThemeToggle.tsx`
- `src/components/common/MarkdownView.tsx`
- `src/components/common/Magnitude.tsx`
- `src/hooks/use-theme.tsx`
- `src/hooks/use-mobile.tsx`
- `src/hooks/use-toast.ts`

Run this verification:
```bash
npx grep-cli "useState\|useEffect\|useContext\|useRef\|useCallback\|useMemo" src/ --include="*.tsx" --include="*.ts" -l
```

Then for each file found, check if `"use client"` is the first line. If not, add it.

- [ ] **Step 6: Full grep to ensure no `react-router-dom` imports remain**

```bash
npx grep-cli "react-router-dom" src/ --include="*.tsx" --include="*.ts"
```

Should return zero results. If any remain, fix them.

- [ ] **Step 7: Full grep to ensure no `import.meta.env` references remain**

```bash
npx grep-cli "import.meta.env" src/ --include="*.tsx" --include="*.ts"
```

Should return zero results.

- [ ] **Step 8: Commit**

```bash
git add -A
git commit -m "feat: migrate NotFound, NavLink, add 'use client' directives, cleanup"
```

---

## Task 9: Verify and Fix Build

**Files:**
- Potentially any file with type errors

**Interfaces:**
- Consumes: Everything from Tasks 1-8
- Produces: A clean `npm run build` and working `npm run dev`

- [ ] **Step 1: Run the dev server**

```bash
npm run dev
```

Check for any console errors or build failures.

- [ ] **Step 2: Run TypeScript check**

```bash
npx tsc --noEmit
```

Fix any type errors found.

- [ ] **Step 3: Test all routes manually**

- `http://localhost:3000` — Landing page loads, all sections visible, theme toggle works, command palette opens
- `http://localhost:3000/auth` — Auth page renders
- `http://localhost:3000/app` — Redirects to auth if not logged in, or shows app shell with empty state
- `http://localhost:3000/app/doc/test-id` — Document workspace loads (may show empty state for fake ID)
- `http://localhost:3000/nonexistent` — Shows custom 404

- [ ] **Step 4: Run production build**

```bash
npm run build
```

Fix any build errors.

- [ ] **Step 5: Final commit**

```bash
git add -A
git commit -m "fix: resolve build errors after Next.js migration"
```

---

## Summary of Route Mapping

| Old Route (React Router) | New Route (Next.js App Router) | Component |
|---|---|---|
| `/` | `app/page.tsx` | `src/pages/Index.tsx` |
| `/auth` | `app/auth/page.tsx` | `src/features/auth/pages/Auth.tsx` |
| `/app` (layout) | `app/app/layout.tsx` | `RequireAuth` + `AppHome` |
| `/app` (index) | `app/app/page.tsx` | `src/features/documents/pages/AppEmpty.tsx` |
| `/app/doc/:docId` | `app/app/doc/[docId]/page.tsx` | `src/features/documents/pages/DocumentWorkspace.tsx` |
| `*` (404) | `app/not-found.tsx` | `src/pages/NotFound.tsx` |

## Key Migration Patterns Reference

| Vite / React Router | Next.js App Router |
|---|---|
| `import.meta.env.VITE_*` | `process.env.NEXT_PUBLIC_*` |
| `<Link to="/path">` | `<Link href="/path">` |
| `useNavigate()` → `navigate("/path")` | `useRouter()` → `router.push("/path")` |
| `useLocation()` → `location.pathname` | `usePathname()` |
| `useParams()` from react-router-dom | `useParams()` from `next/navigation` |
| `<Navigate to="/auth" replace />` | `router.replace("/auth")` in `useEffect` |
| `<Outlet context={...}>` + `useOutletContext()` | `children` prop + React context |
| `<BrowserRouter>` + `<Routes>` | File-system routing (`app/` directory) |
| `index.html` `<head>` metadata | `export const metadata` in `layout.tsx` |
