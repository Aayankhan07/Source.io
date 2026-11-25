import type { Metadata } from "next";
import Link from "next/link";
import { Breadcrumbs, CtaBox, JsonLd, SeoShell } from "@/features/seo/components";
import { CHANGELOG } from "@/features/seo/changelog";
import { breadcrumbJsonLd } from "@/features/seo/schema";

const title = "Changelog: What's New in Source.io | Source.io";
const description = "Recent changes to Source.io: source passages in chat, in-browser audio recaps, clear plan limits, a public demo and more.";

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: "/changelog" },
  openGraph: { title, description, url: "/changelog" },
};

const crumbs = [
  { name: "Home", path: "/" },
  { name: "Changelog", path: "/changelog" },
];

const formatDate = (iso: string) =>
  new Date(`${iso}T00:00:00Z`).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" });

export default function ChangelogPage() {
  return (
    <SeoShell>
      <JsonLd data={breadcrumbJsonLd(crumbs)} />
      <Breadcrumbs crumbs={crumbs} />
      <h1 className="text-3xl sm:text-4xl font-bold font-display tracking-tight">Changelog</h1>
      <p className="mt-3 max-w-2xl text-base leading-relaxed text-muted-foreground">What we have changed in Source.io recently.</p>

      <ol className="mt-10 space-y-6 border-l border-border pl-6">
        {CHANGELOG.map((e) => (
          <li key={e.title} className="relative">
            <span className="absolute -left-[29px] top-2 size-2.5 rounded-full bg-foreground/60" aria-hidden="true" />
            <p className="text-xs font-mono uppercase tracking-wider text-muted-foreground">
              <time dateTime={e.date}>{formatDate(e.date)}</time>
              {e.status === "rolling-out" && (
                <span className="ml-2 rounded-full border border-border px-2 py-0.5 normal-case tracking-normal">Rolling out</span>
              )}
            </p>
            <h2 className="mt-1 text-lg font-semibold">{e.title}</h2>
            <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{e.body}</p>
            {e.link && (
              <Link href={e.link.href} className="mt-2 inline-block text-sm font-semibold underline underline-offset-4">
                {e.link.label}
              </Link>
            )}
          </li>
        ))}
      </ol>

      <CtaBox />
    </SeoShell>
  );
}
