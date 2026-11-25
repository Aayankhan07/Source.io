import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Breadcrumbs, CtaBox, FaqList, JsonLd, Section, SeoShell } from "@/features/seo/components";
import { ALTERNATIVE_PAGES, COMPARISON_DISCLAIMER, getAlternative } from "@/features/seo/alternatives";
import { breadcrumbJsonLd, faqJsonLd } from "@/features/seo/schema";

type Props = { params: Promise<{ slug: string }> };

// NotebookLM is covered by /vs-notebooklm (app/alternatives/notebooklm redirects there).
export const dynamicParams = false;

export function generateStaticParams() {
  return ALTERNATIVE_PAGES.map((a) => ({ slug: a.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const alt = getAlternative(slug);
  if (!alt) return {};
  return {
    title: alt.metaTitle,
    description: alt.metaDescription,
    alternates: { canonical: alt.path },
    openGraph: { title: alt.metaTitle, description: alt.metaDescription, url: alt.path, type: "article" },
  };
}

export default async function AlternativePage({ params }: Props) {
  const { slug } = await params;
  const alt = getAlternative(slug);
  if (!alt || alt.path !== `/alternatives/${slug}`) notFound();

  const crumbs = [
    { name: "Home", path: "/" },
    { name: "Alternatives", path: "/alternatives" },
    { name: alt.name, path: alt.path },
  ];

  return (
    <SeoShell>
      <JsonLd data={breadcrumbJsonLd(crumbs)} />
      <JsonLd data={faqJsonLd(alt.faqs)} />
      <Breadcrumbs crumbs={crumbs} />

      <h1 className="text-3xl sm:text-4xl font-bold font-display tracking-tight">{alt.h1}</h1>
      <p className="mt-4 max-w-2xl text-base sm:text-lg leading-relaxed text-muted-foreground">{alt.whatItIs}</p>
      <p className="mt-3 max-w-2xl text-base leading-relaxed text-muted-foreground">
        Source.io turns one source (a PDF, Word file, recording, YouTube link or pasted text) into study notes,
        flashcards with Leitner review scheduling, a practice quiz with explanations, a two-host audio recap and chat
        whose answers list the source passages they used.
      </p>

      <Section title="How they differ">
        <div className="overflow-x-auto rounded-2xl border border-border">
          <table className="w-full text-left text-sm">
            <thead className="bg-muted/40 text-xs uppercase tracking-wider text-muted-foreground">
              <tr>
                <th scope="col" className="p-4 font-semibold"></th>
                <th scope="col" className="p-4 font-semibold">{alt.name}</th>
                <th scope="col" className="p-4 font-semibold">Source.io</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {alt.differences.map((d) => (
                <tr key={d.topic} className="align-top">
                  <th scope="row" className="p-4 font-semibold">{d.topic}</th>
                  <td className="p-4 text-muted-foreground">{d.them}</td>
                  <td className="p-4">{d.sourceio}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Section>

      <div className="mt-12 grid gap-4 sm:grid-cols-2">
        <div className="rounded-2xl border border-border bg-card p-5">
          <h2 className="text-lg font-semibold">Choose {alt.name} if</h2>
          <ul className="mt-3 list-disc pl-5 space-y-2 text-sm leading-relaxed">
            {alt.chooseThem.map((c) => (
              <li key={c}>{c}</li>
            ))}
          </ul>
        </div>
        <div className="rounded-2xl border border-border bg-card p-5">
          <h2 className="text-lg font-semibold">Choose Source.io if</h2>
          <ul className="mt-3 list-disc pl-5 space-y-2 text-sm leading-relaxed">
            {alt.chooseSourceio.map((c) => (
              <li key={c}>{c}</li>
            ))}
          </ul>
        </div>
      </div>

      <FaqList faqs={alt.faqs} />

      <p className="mt-8 text-sm text-muted-foreground">
        {COMPARISON_DISCLAIMER} See also{" "}
        <Link href="/alternatives" className="underline underline-offset-4 hover:text-foreground">
          other comparisons
        </Link>{" "}
        and{" "}
        <Link href="/use-cases" className="underline underline-offset-4 hover:text-foreground">
          use cases
        </Link>
        .
      </p>

      <CtaBox />
    </SeoShell>
  );
}
