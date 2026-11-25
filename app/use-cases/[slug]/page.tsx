import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Breadcrumbs, CtaBox, FaqList, JsonLd, LinkCard, Section, SeoShell } from "@/features/seo/components";
import { STUDY_MODES } from "@/features/seo/modes";
import { breadcrumbJsonLd, faqJsonLd } from "@/features/seo/schema";
import { USE_CASES, getUseCase } from "@/features/seo/useCases";

type Props = { params: Promise<{ slug: string }> };

// Only the use cases in the content file exist; anything else is a 404.
export const dynamicParams = false;

export function generateStaticParams() {
  return USE_CASES.map((u) => ({ slug: u.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const uc = getUseCase(slug);
  if (!uc) return {};
  const url = `/use-cases/${uc.slug}`;
  return {
    title: uc.metaTitle,
    description: uc.metaDescription,
    alternates: { canonical: url },
    openGraph: { title: uc.metaTitle, description: uc.metaDescription, url, type: "article" },
  };
}

export default async function UseCasePage({ params }: Props) {
  const { slug } = await params;
  const uc = getUseCase(slug);
  if (!uc) notFound();

  const crumbs = [
    { name: "Home", path: "/" },
    { name: "Use cases", path: "/use-cases" },
    { name: uc.label, path: `/use-cases/${uc.slug}` },
  ];
  const related = uc.related.map(getUseCase).filter((r) => r !== undefined);

  return (
    <SeoShell>
      <JsonLd data={breadcrumbJsonLd(crumbs)} />
      <JsonLd data={faqJsonLd(uc.faqs)} />
      <Breadcrumbs crumbs={crumbs} />

      <h1 className="text-3xl sm:text-4xl font-bold font-display tracking-tight">{uc.h1}</h1>
      <p className="mt-4 max-w-2xl text-base sm:text-lg leading-relaxed text-muted-foreground">{uc.intro}</p>

      <Section title="How it works">
        <ol className="list-decimal pl-6 space-y-2">
          {uc.steps.map((s) => (
            <li key={s}>{s}</li>
          ))}
        </ol>
      </Section>

      <Section title="Which study modes help">
        <ul className="grid gap-3 sm:grid-cols-2">
          {uc.modes.map(({ mode, why }) => (
            <li key={mode} className="rounded-2xl border border-border bg-card p-4">
              <p className="font-semibold">
                {STUDY_MODES[mode].name}{" "}
                <span className="text-xs font-normal text-muted-foreground">({STUDY_MODES[mode].where})</span>
              </p>
              <p className="mt-1 text-sm text-muted-foreground">{why}</p>
            </li>
          ))}
        </ul>
      </Section>

      <Section title="Limits to know about">
        <ul className="list-disc pl-6 space-y-2">
          {uc.limits.map((l) => (
            <li key={l}>{l}</li>
          ))}
        </ul>
        <p className="mt-3 text-sm text-muted-foreground">
          Full plan details are on the{" "}
          <Link href="/pricing" className="underline underline-offset-4 hover:text-foreground">
            pricing page
          </Link>
          .
        </p>
      </Section>

      <FaqList faqs={uc.faqs} />

      <CtaBox />

      <Section title="Related use cases">
        <ul className="grid gap-4 sm:grid-cols-3">
          {related.map((r) => (
            <li key={r.slug}>
              <LinkCard href={`/use-cases/${r.slug}`} title={r.label} body={r.intro.split(". ")[0] + "."} />
            </li>
          ))}
        </ul>
      </Section>
    </SeoShell>
  );
}
