import { Suspense } from "react";
import { permanentRedirect } from "next/navigation";
import DocumentWorkspace from "@/features/documents/pages/DocumentWorkspace";
import { demoTabFromQuery, demoUrlForLegacyId } from "@/features/demo/demoData";

export default async function DocumentPage({
  params,
  searchParams,
}: {
  params: Promise<{ docId: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { docId } = await params;

  // The old guest demo lived at /app/doc/demo-*. It is now a public, static page at /demo/<slug>.
  if (docId.startsWith("demo-")) {
    const { tab } = await searchParams;
    permanentRedirect(demoUrlForLegacyId(docId, demoTabFromQuery(Array.isArray(tab) ? tab[0] : tab)));
  }

  return (
    <Suspense fallback={<div className="min-h-screen bg-slate-900" />}>
      <DocumentWorkspace />
    </Suspense>
  );
}
