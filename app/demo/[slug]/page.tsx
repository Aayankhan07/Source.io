import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { LandingHeader } from "@/components/landing/LandingHeader";
import { LandingFooter } from "@/components/landing/LandingFooter";
import { DEMO_SAMPLES, getDemoSample } from "@/features/demo/demoData";
import { DemoWorkspace } from "@/features/demo/DemoWorkspace";

type Props = { params: Promise<{ slug: string }> };

// Only the bundled samples exist; any other slug is a 404 rather than an on-demand render.
export const dynamicParams = false;

export function generateStaticParams() {
  return DEMO_SAMPLES.map((s) => ({ slug: s.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const sample = getDemoSample(slug);
  if (!sample) return {};
  const title = `${sample.data.document.title} — Sample Notes, Flashcards & Quiz | Source.io`;
  const description = `A read-only Source.io sample: ${sample.summary} See the cited notes, flashcards, quiz, audio script and chat.`;
  return {
    title,
    description,
    alternates: { canonical: `/demo/${slug}` },
    robots: { index: true, follow: true },
    openGraph: { title, description, url: `/demo/${slug}`, type: "article" },
  };
}

export default async function DemoSamplePage({ params }: Props) {
  const { slug } = await params;
  const sample = getDemoSample(slug);
  if (!sample) notFound();

  return (
    <div className="min-h-[100dvh] bg-background text-foreground antialiased">
      <LandingHeader />
      <main className="mx-auto max-w-4xl px-4 sm:px-6 pt-28 pb-20">
        <Link
          href="/demo"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ChevronLeft className="size-4" />
          All samples
        </Link>
        <p className="mt-6 text-xs font-mono uppercase tracking-wider text-muted-foreground">Sample document · read-only</p>
        <h1 className="mt-1 text-3xl sm:text-4xl font-bold font-display tracking-tight">{sample.data.document.title}</h1>
        <p className="mt-3 max-w-2xl text-base leading-relaxed text-muted-foreground">{sample.summary}</p>
        <div className="mt-8">
          <DemoWorkspace slug={slug} />
        </div>
      </main>
      <LandingFooter />
    </div>
  );
}
