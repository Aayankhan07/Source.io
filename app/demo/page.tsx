import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { LandingHeader } from "@/components/landing/LandingHeader";
import { LandingFooter } from "@/components/landing/LandingFooter";
import { DEMO_SAMPLES } from "@/features/demo/demoData";

export const metadata: Metadata = {
  title: "Sample Study Workspaces — Notes, Flashcards, Quiz | Source.io",
  description:
    "Browse real Source.io output without signing up: cited notes, flashcards, a quiz, an audio recap script and a sample chat generated from three study documents.",
  alternates: { canonical: "/demo" },
  openGraph: {
    title: "Source.io sample study workspaces",
    description: "See the notes, flashcards, quiz, audio script and chat Source.io makes from a document. No sign-up needed.",
    url: "/demo",
  },
};

export default function DemoIndexPage() {
  return (
    <div className="min-h-[100dvh] bg-background text-foreground antialiased">
      <LandingHeader />
      <main className="mx-auto max-w-4xl px-4 sm:px-6 pt-28 pb-20">
        <h1 className="text-3xl sm:text-4xl font-bold font-display tracking-tight">Sample study workspaces</h1>
        <p className="mt-3 max-w-2xl text-base leading-relaxed text-muted-foreground">
          Each sample shows what Source.io makes from one document: notes with citations, flashcards, a quiz, an audio
          recap script and a chat. No account needed.
        </p>

        <ul className="mt-10 grid gap-4 sm:grid-cols-2">
          {DEMO_SAMPLES.map((s) => (
            <li key={s.slug}>
              <Link
                href={`/demo/${s.slug}`}
                className="group flex h-full flex-col justify-between gap-4 rounded-3xl border border-border bg-card p-6 shadow-sm transition-colors hover:border-foreground/30"
              >
                <div className="space-y-2">
                  <span className="text-xs font-mono uppercase tracking-wider text-muted-foreground">
                    {s.data.document.source_type === "pdf" ? "PDF" : "Pasted text"}
                  </span>
                  <h2 className="text-lg font-semibold leading-snug">{s.data.document.title}</h2>
                  <p className="text-sm text-muted-foreground leading-relaxed">{s.summary}</p>
                </div>
                <span className="inline-flex items-center gap-1.5 text-sm font-semibold">
                  Open sample
                  <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
                </span>
              </Link>
            </li>
          ))}
        </ul>

        <div className="mt-12 rounded-3xl border border-border bg-muted/30 p-6 sm:p-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <p className="font-semibold">Try it with your own document</p>
            <p className="text-sm text-muted-foreground">Upload a PDF or paste text and get the same five study modes.</p>
          </div>
          <Link
            href="/auth?mode=signup"
            className="inline-flex items-center justify-center gap-1.5 rounded-full bg-primary text-primary-foreground px-5 h-10 text-sm font-semibold shadow-sm hover:bg-primary/90 transition-colors shrink-0"
          >
            Try it with your own document
            <ArrowRight className="size-4" />
          </Link>
        </div>
      </main>
      <LandingFooter />
    </div>
  );
}
