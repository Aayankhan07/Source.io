import { Suspense } from "react";
import DocumentWorkspace from "@/features/documents/pages/DocumentWorkspace";

export default function DocumentPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-slate-900" />}>
      <DocumentWorkspace />
    </Suspense>
  );
}