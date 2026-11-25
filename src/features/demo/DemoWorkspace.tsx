"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, FileText, Headphones, Layers, ListChecks, MessageSquare, Quote } from "lucide-react";
import MarkdownView from "@/components/common/MarkdownView";
import { FlashcardsDeck } from "@/features/documents/components/FlashcardsDeck";
import { QuizPlayer } from "@/features/documents/components/QuizPlayer";
import { cn } from "@/lib/utils";
import {
  DEMO_TABS,
  DEMO_TAB_LABELS,
  demoTabFromQuery,
  getDemoSample,
  parseDemoScript,
  type DemoTab,
} from "./demoData";

const SIGNUP_HREF = "/auth?mode=signup";

const TAB_ICONS: Record<DemoTab, typeof FileText> = {
  notes: FileText,
  flashcards: Layers,
  quiz: ListChecks,
  audio: Headphones,
  chat: MessageSquare,
};

function TryItCta({ children }: { children?: React.ReactNode }) {
  return (
    <div className="mt-8 rounded-3xl border border-border bg-card p-6 sm:p-7 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm">
      <div className="space-y-1">
        <p className="font-semibold text-foreground">Try it with your own document</p>
        <p className="text-sm text-muted-foreground">
          {children ?? "Upload a PDF or paste your notes. The free plan needs no card."}
        </p>
      </div>
      <Link
        href={SIGNUP_HREF}
        className="inline-flex items-center justify-center gap-1.5 rounded-full bg-primary text-primary-foreground px-5 h-10 text-sm font-semibold shadow-sm hover:bg-primary/90 transition-colors shrink-0"
      >
        Try it with your own document
        <ArrowRight className="size-4" />
      </Link>
    </div>
  );
}

function CitationList({ citations }: { citations: { n: number; text: string }[] }) {
  if (citations.length === 0) return null;
  return (
    <section aria-label="Source passages" className="mt-6 space-y-2">
      <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Source passages</h3>
      <ol className="space-y-2">
        {citations.map((c) => (
          <li key={c.n} className="flex gap-3 rounded-2xl border border-border bg-muted/30 p-3 text-sm text-foreground/90">
            <span className="font-mono text-xs font-bold text-muted-foreground shrink-0">[{c.n}]</span>
            <span>{c.text}</span>
          </li>
        ))}
      </ol>
    </section>
  );
}

export function DemoWorkspace({ slug }: { slug: string }) {
  const router = useRouter();
  const sample = getDemoSample(slug);
  const [tab, setTab] = useState<DemoTab>("notes");

  // Honour ?tab= links (e.g. from the landing page) without making the page dynamic.
  useEffect(() => {
    const requested = demoTabFromQuery(new URLSearchParams(window.location.search).get("tab"));
    if (requested) setTab(requested);
  }, []);

  const selectTab = useCallback((next: DemoTab) => {
    setTab(next);
    const url = next === "notes" ? window.location.pathname : `${window.location.pathname}?tab=${next}`;
    window.history.replaceState(null, "", url);
  }, []);

  const goToSignup = useCallback(() => router.push(SIGNUP_HREF), [router]);

  if (!sample) return null;
  const { data } = sample;
  const scriptLines = parseDemoScript(data.podcast?.script);

  return (
    <div className="space-y-6">
      <div
        role="tablist"
        aria-label="Study modes"
        className="inline-flex max-w-full items-center gap-1 p-1.5 rounded-full bg-card border border-border shadow-sm overflow-x-auto"
      >
        {DEMO_TABS.map((t) => {
          const Icon = TAB_ICONS[t];
          const active = t === tab;
          return (
            <button
              key={t}
              id={`demo-tab-${t}`}
              role="tab"
              type="button"
              aria-selected={active}
              aria-controls={`demo-panel-${t}`}
              onClick={() => selectTab(t)}
              className={cn(
                "h-9 px-4 rounded-full text-sm font-semibold flex items-center gap-2 shrink-0 transition-colors cursor-pointer",
                active ? "bg-primary text-primary-foreground shadow-xs" : "text-muted-foreground hover:text-foreground hover:bg-muted",
              )}
            >
              <Icon className="size-4" aria-hidden="true" />
              {DEMO_TAB_LABELS[t]}
            </button>
          );
        })}
      </div>

      <div id={`demo-panel-${tab}`} role="tabpanel" aria-labelledby={`demo-tab-${tab}`}>
        {tab === "notes" && (
          <article className="rounded-3xl border border-border bg-card p-5 sm:p-8 shadow-sm">
            <MarkdownView>{data.note.markdown}</MarkdownView>
            <TryItCta>Get cited notes like these from your own PDF, lecture or pasted text.</TryItCta>
          </article>
        )}

        {tab === "flashcards" && (
          <div>
            <FlashcardsDeck documentId={data.document.id} cards={data.cards} onRegenerate={goToSignup} />
            <TryItCta>Generate a full flashcard deck from your own material.</TryItCta>
          </div>
        )}

        {tab === "quiz" && (
          <div>
            <QuizPlayer documentId={data.document.id} quiz={data.quiz} onRegenerate={goToSignup} />
            <TryItCta>Practice with quizzes written from your own document.</TryItCta>
          </div>
        )}

        {tab === "audio" && (
          <section className="rounded-3xl border border-border bg-card p-5 sm:p-8 shadow-sm space-y-5">
            <div className="flex items-start gap-3 rounded-2xl bg-muted/40 border border-border p-4 text-sm text-muted-foreground">
              <Headphones className="size-4 mt-0.5 shrink-0 text-foreground" aria-hidden="true" />
              <p>
                This is the script of an audio recap. Audio is generated for your own documents; the sample shows the
                script only.
              </p>
            </div>
            {scriptLines.length > 0 ? (
              <>
                {data.podcast?.title && <h2 className="text-lg font-semibold text-foreground">{data.podcast.title}</h2>}
                <ol className="space-y-4">
                  {scriptLines.map((line, i) => (
                    <li key={i} className="space-y-1">
                      <p className="text-xs font-semibold text-muted-foreground">
                        {line.speaker}
                        {line.timestamp && <span className="ml-2 font-mono font-normal">{line.timestamp}</span>}
                      </p>
                      <p className="text-sm leading-relaxed text-foreground">{line.text}</p>
                    </li>
                  ))}
                </ol>
              </>
            ) : (
              <p className="text-sm text-muted-foreground">
                This sample has no audio recap script. Create one from any of your documents in the Audio tab.
              </p>
            )}
            <TryItCta>Turn your own reading into a two-host audio recap.</TryItCta>
          </section>
        )}

        {tab === "chat" && (
          <section className="rounded-3xl border border-border bg-card p-5 sm:p-8 shadow-sm">
            <p className="text-sm text-muted-foreground mb-5">
              A sample conversation. In your workspace, chat answers questions using only your document and cites the
              passages it used.
            </p>
            {data.sampleChat.length > 0 ? (
              <ol className="space-y-5">
                {data.sampleChat.map((qa, i) => (
                  <li key={i} className="space-y-3">
                    <div className="flex justify-end">
                      <p className="max-w-[85%] rounded-2xl rounded-br-md bg-primary text-primary-foreground px-4 py-2.5 text-sm">
                        {qa.question}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Quote className="size-4 mt-2.5 shrink-0 text-muted-foreground" aria-hidden="true" />
                      <p className="max-w-[85%] rounded-2xl rounded-bl-md bg-muted/60 border border-border px-4 py-2.5 text-sm leading-relaxed text-foreground">
                        {qa.answer}
                      </p>
                    </div>
                  </li>
                ))}
              </ol>
            ) : (
              <p className="text-sm text-muted-foreground">
                Chat lets you ask questions about your document and get answers that cite the exact passages they come
                from.
              </p>
            )}
            <CitationList citations={data.citations} />
            <TryItCta>Ask questions about your own document and get cited answers.</TryItCta>
          </section>
        )}
      </div>
    </div>
  );
}
