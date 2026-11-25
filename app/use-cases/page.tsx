import type { Metadata } from "next";
import { Breadcrumbs, CtaBox, JsonLd, LinkCard, SeoShell } from "@/features/seo/components";
import { breadcrumbJsonLd } from "@/features/seo/schema";
import { USE_CASES, USE_CASE_AXES, type UseCaseAxis } from "@/features/seo/useCases";

const title = "Use Cases: Study Any Source Your Way | Source.io";
const description =
  "How Source.io fits PDF textbooks, lecture recordings, YouTube lectures, Word handouts, exam revision, certifications, research papers and teaching.";

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: "/use-cases" },
  openGraph: { title, description, url: "/use-cases" },
};

const crumbs = [
  { name: "Home", path: "/" },
  { name: "Use cases", path: "/use-cases" },
];

export default function UseCasesIndexPage() {
  const axes = Object.keys(USE_CASE_AXES) as UseCaseAxis[];
  return (
    <SeoShell>
      <JsonLd data={breadcrumbJsonLd(crumbs)} />
      <Breadcrumbs crumbs={crumbs} />
      <h1 className="text-3xl sm:text-4xl font-bold font-display tracking-tight">Ways to use Source.io</h1>
      <p className="mt-3 max-w-2xl text-base leading-relaxed text-muted-foreground">
        Source.io turns one source into study notes, flashcards with Leitner review scheduling, a practice quiz with
        explanations, a two-host audio recap and chat that shows its source passages. Here is how that works for
        different material, goals and people.
      </p>

      {axes.map((axis) => (
        <section key={axis} className="mt-12">
          <h2 className="text-xl sm:text-2xl font-semibold tracking-tight">{USE_CASE_AXES[axis]}</h2>
          <ul className="mt-4 grid gap-4 sm:grid-cols-2">
            {USE_CASES.filter((u) => u.axis === axis).map((u) => (
              <li key={u.slug}>
                <LinkCard href={`/use-cases/${u.slug}`} title={u.label} body={u.metaDescription} />
              </li>
            ))}
          </ul>
        </section>
      ))}

      <CtaBox />
    </SeoShell>
  );
}
