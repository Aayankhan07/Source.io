import type { Metadata } from "next";
import { Breadcrumbs, CtaBox, JsonLd, LinkCard, SeoShell } from "@/features/seo/components";
import { ALTERNATIVES, COMPARISON_DISCLAIMER } from "@/features/seo/alternatives";
import { breadcrumbJsonLd } from "@/features/seo/schema";

const title = "Source.io Alternatives & Comparisons | Source.io";
const description =
  "How Source.io compares with Quizlet, Anki, NotebookLM and Knowt, and when each one is the better fit for the way you study.";

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: "/alternatives" },
  openGraph: { title, description, url: "/alternatives" },
};

const crumbs = [
  { name: "Home", path: "/" },
  { name: "Alternatives", path: "/alternatives" },
];

export default function AlternativesIndexPage() {
  return (
    <SeoShell>
      <JsonLd data={breadcrumbJsonLd(crumbs)} />
      <Breadcrumbs crumbs={crumbs} />
      <h1 className="text-3xl sm:text-4xl font-bold font-display tracking-tight">Comparing Source.io with other study tools</h1>
      <p className="mt-3 max-w-2xl text-base leading-relaxed text-muted-foreground">
        Different tools suit different ways of studying. These pages describe what each product is for and when you
        might choose it, or Source.io, or both.
      </p>

      <ul className="mt-10 grid gap-4 sm:grid-cols-2">
        {ALTERNATIVES.map((a) => (
          <li key={a.slug}>
            <LinkCard href={a.path} eyebrow={`Source.io and ${a.name}`} title={a.name} body={a.summary} />
          </li>
        ))}
      </ul>

      <p className="mt-8 text-sm text-muted-foreground">{COMPARISON_DISCLAIMER}</p>
      <CtaBox />
    </SeoShell>
  );
}
