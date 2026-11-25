import type { ReactNode } from "react";
import Link from "next/link";
import { ArrowRight, ChevronRight } from "lucide-react";
import { LandingHeader } from "@/components/landing/LandingHeader";
import { LandingFooter } from "@/components/landing/LandingFooter";
import { serializeJsonLd, type Crumb } from "./schema";
import type { Faq } from "./useCases";

export function JsonLd({ data }: { data: unknown }) {
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: serializeJsonLd(data) }} />;
}

export function SeoShell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-[100dvh] bg-background text-foreground antialiased">
      <LandingHeader />
      <main className="mx-auto max-w-4xl px-4 sm:px-6 pt-28 pb-20">{children}</main>
      <LandingFooter />
    </div>
  );
}

export function Breadcrumbs({ crumbs }: { crumbs: Crumb[] }) {
  return (
    <nav aria-label="Breadcrumb" className="mb-6">
      <ol className="flex flex-wrap items-center gap-1 text-sm text-muted-foreground">
        {crumbs.map((c, i) => {
          const last = i === crumbs.length - 1;
          return (
            <li key={c.path} className="flex items-center gap-1">
              {last ? (
                <span aria-current="page" className="text-foreground">
                  {c.name}
                </span>
              ) : (
                <>
                  <Link href={c.path} className="hover:text-foreground underline-offset-4 hover:underline">
                    {c.name}
                  </Link>
                  <ChevronRight className="size-3.5" aria-hidden="true" />
                </>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

export function Section({ title, children, id }: { title: string; children: ReactNode; id?: string }) {
  return (
    <section id={id} className="mt-12">
      <h2 className="text-xl sm:text-2xl font-semibold tracking-tight">{title}</h2>
      <div className="mt-4 text-base leading-relaxed text-foreground/90">{children}</div>
    </section>
  );
}

export function FaqList({ faqs }: { faqs: Faq[] }) {
  return (
    <Section title="Frequently asked questions" id="faq">
      <div className="space-y-3">
        {faqs.map((f) => (
          <details key={f.question} className="group rounded-2xl border border-border bg-card p-5 open:shadow-sm">
            <summary className="cursor-pointer list-none font-semibold leading-snug">{f.question}</summary>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{f.answer}</p>
          </details>
        ))}
      </div>
    </Section>
  );
}

export function CtaBox({ title = "See it on a real document", body }: { title?: string; body?: string }) {
  return (
    <div className="mt-14 rounded-3xl border border-border bg-muted/30 p-6 sm:p-8 flex flex-col sm:flex-row sm:items-center justify-between gap-5">
      <div>
        <p className="text-lg font-semibold">{title}</p>
        <p className="mt-1 text-sm text-muted-foreground">
          {body ?? "Browse sample workspaces without an account, or sign up free and upload your own material."}
        </p>
      </div>
      <div className="flex flex-wrap gap-3 shrink-0">
        <Link
          href="/demo"
          className="inline-flex items-center justify-center rounded-full border border-border px-5 h-10 text-sm font-semibold hover:bg-muted transition-colors"
        >
          View the demo
        </Link>
        <Link
          href="/auth?mode=signup"
          className="inline-flex items-center justify-center gap-1.5 rounded-full bg-primary text-primary-foreground px-5 h-10 text-sm font-semibold shadow-sm hover:bg-primary/90 transition-colors"
        >
          Start free
          <ArrowRight className="size-4" aria-hidden="true" />
        </Link>
      </div>
    </div>
  );
}

export function LinkCard({ href, eyebrow, title, body }: { href: string; eyebrow?: string; title: string; body: string }) {
  return (
    <Link
      href={href}
      className="group flex h-full flex-col justify-between gap-3 rounded-3xl border border-border bg-card p-5 shadow-sm transition-colors hover:border-foreground/30"
    >
      <div className="space-y-1.5">
        {eyebrow && <span className="text-xs font-mono uppercase tracking-wider text-muted-foreground">{eyebrow}</span>}
        <h3 className="font-semibold leading-snug">{title}</h3>
        <p className="text-sm text-muted-foreground leading-relaxed">{body}</p>
      </div>
      <span className="inline-flex items-center gap-1 text-sm font-semibold">
        Read more
        <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
      </span>
    </Link>
  );
}
