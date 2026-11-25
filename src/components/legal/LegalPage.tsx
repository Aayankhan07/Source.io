import type { ReactNode } from "react";
import Link from "next/link";
import { LandingHeader } from "@/components/landing/LandingHeader";
import { LandingFooter } from "@/components/landing/LandingFooter";
import { LEGAL_LAST_UPDATED } from "@/lib/site";

export interface LegalSection {
  heading: string;
  body: ReactNode;
}

export function LegalPage({ title, intro, sections }: { title: string; intro: ReactNode; sections: LegalSection[] }) {
  return (
    <div className="min-h-[100dvh] bg-background text-foreground antialiased">
      <LandingHeader />
      <main className="mx-auto max-w-3xl px-4 sm:px-6 pt-28 pb-20">
        <nav aria-label="Legal" className="mb-8 flex flex-wrap gap-4 text-sm text-muted-foreground">
          <Link href="/privacy" className="hover:text-foreground underline-offset-4 hover:underline">Privacy</Link>
          <Link href="/terms" className="hover:text-foreground underline-offset-4 hover:underline">Terms</Link>
          <Link href="/refunds" className="hover:text-foreground underline-offset-4 hover:underline">Refunds &amp; cancellation</Link>
        </nav>
        <h1 className="text-3xl sm:text-4xl font-bold font-display tracking-tight">{title}</h1>
        <p className="mt-2 text-sm text-muted-foreground">Last updated: {LEGAL_LAST_UPDATED}</p>
        <div className="mt-6 text-base leading-relaxed text-foreground/90">{intro}</div>
        {sections.map((s) => (
          <section key={s.heading} className="mt-10">
            <h2 className="text-xl font-semibold tracking-tight">{s.heading}</h2>
            <div className="mt-3 space-y-3 text-base leading-relaxed text-foreground/90 [&_ul]:list-disc [&_ul]:pl-6 [&_ul]:space-y-1.5 [&_a]:underline [&_a]:underline-offset-4">
              {s.body}
            </div>
          </section>
        ))}
      </main>
      <LandingFooter />
    </div>
  );
}
