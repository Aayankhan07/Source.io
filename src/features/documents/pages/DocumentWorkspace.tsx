"use client";

import { useCallback, useMemo, useState } from "react";
import { useParams, usePathname, useRouter, useSearchParams } from "next/navigation";
import { Tabs, TabsContent } from "@/components/ui/tabs";
import { useAppShell } from "@/features/documents/context/AppShellContext";
import { extractHeadings } from "@/features/documents/components/WorkspaceOutline";
import { useSettings } from "@/features/settings/context/SettingsContext";
import { TAB_LABELS } from "@/types/customization";
import { errorMessage } from "@/lib/utils";
import { useWorkspaceData } from "@/features/documents/workspace/useWorkspaceData";
import { useNotesGeneration } from "@/features/documents/workspace/useNotesGeneration";
import { useStudyActions } from "@/features/documents/workspace/useStudyActions";
import { WorkspaceHeader, type WorkspaceTab } from "@/features/documents/workspace/WorkspaceHeader";
import { NotesTab } from "@/features/documents/workspace/NotesTab";
import { FlashcardsTab } from "@/features/documents/workspace/FlashcardsTab";
import { QuizTab } from "@/features/documents/workspace/QuizTab";
import { PodcastTab } from "@/features/documents/workspace/PodcastTab";
import { DeleteDocumentDialog } from "@/features/documents/workspace/DeleteDocumentDialog";
import { DocumentLoadError, DocumentNotFound, WorkspaceLoading } from "@/features/documents/workspace/StatusStates";
import { tabFromQuery, type TabId } from "@/features/documents/workspace/types";

const PANEL_CLASS = "flex-1 overflow-hidden relative mt-0 focus-visible:ring-0 focus-visible:ring-offset-0";

/** Route shell for /app/doc/[docId]: loads the document and hosts one panel per study mode. */
export default function DocumentWorkspace() {
  const params = useParams();
  const docId = Array.isArray(params.docId) ? params.docId[0] : params.docId;
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { openMobileNav } = useAppShell();
  const { userRole, preferences } = useSettings();

  const { docQuery, assetsQuery } = useWorkspaceData(docId);
  const doc = docQuery.data ?? undefined;
  const assets = assetsQuery.data;
  const persistedNote = assets?.note ?? null;
  const cards = useMemo(() => assets?.cards ?? [], [assets?.cards]);

  const notes = useNotesGeneration({
    docId,
    persistedNote,
    canAutoStart: doc?.status === "ready" && !assetsQuery.isLoading,
  });
  const actions = useStudyActions({
    docId,
    podcast: assets?.podcast ?? null,
    canAutoPodcast: doc?.status === "ready" && !assetsQuery.isLoading && !!notes.note?.markdown && !notes.streaming,
  });
  const [deleteOpen, setDeleteOpen] = useState(false);

  const headings = useMemo(() => extractHeadings(notes.note?.markdown), [notes.note?.markdown]);

  const visibleTabs: WorkspaceTab[] = useMemo(() => {
    const labels = TAB_LABELS[userRole || "undergrad"] || TAB_LABELS["undergrad"];
    const enabled = (preferences?.enabledModes || ["notes", "cards", "quiz", "podcast"]) as readonly string[];
    const all: WorkspaceTab[] = [
      { id: "notes", label: labels.notes || "Notes" },
      { id: "cards", label: labels.cards || labels.flashcards || "Flashcards", count: cards.length },
      { id: "quiz", label: labels.quiz || "Quiz" },
      { id: "podcast", label: labels.podcast || "Podcast" },
    ];
    const filtered = all.filter((t) =>
      t.id === "cards" ? enabled.includes("cards") || enabled.includes("flashcards") : enabled.includes(t.id),
    );
    return filtered.length > 0 ? filtered : all;
  }, [userRole, preferences?.enabledModes, cards.length]);

  // The active tab lives in the URL (?tab=quiz) so it survives reloads and can be deep-linked.
  const requestedTab = tabFromQuery(searchParams?.get("tab")) ?? "notes";
  const currentTab: TabId = visibleTabs.some((t) => t.id === requestedTab) ? requestedTab : visibleTabs[0].id;
  const selectTab = useCallback(
    (value: string) => {
      const next = new URLSearchParams(searchParams?.toString());
      next.set("tab", value);
      window.history.replaceState(null, "", `${pathname}?${next.toString()}`);
    },
    [pathname, searchParams],
  );

  const goToLibrary = () => router.push("/app");

  if (docQuery.isLoading) return <WorkspaceLoading />;
  if (docQuery.isError) {
    return <DocumentLoadError message={errorMessage(docQuery.error)} onRetry={() => docQuery.refetch()} onBack={goToLibrary} />;
  }
  if (!doc) return <DocumentNotFound onBack={goToLibrary} />;

  const rerunDerivatives = () => actions.runDerivatives({ force: true });

  return (
    <Tabs value={currentTab} onValueChange={selectTab} className="h-full flex flex-col bg-tactile-canvas overflow-hidden">
      <WorkspaceHeader tabs={visibleTabs} documentTitle={doc.title} onOpenMobileNav={openMobileNav} />

      <TabsContent value="notes" className={PANEL_CLASS}>
        <NotesTab
          doc={doc}
          note={notes.note}
          assetsLoading={assetsQuery.isLoading}
          streaming={notes.streaming}
          progress={notes.progress}
          incomplete={notes.incomplete}
          onGenerate={notes.generate}
          onRequestDelete={() => setDeleteOpen(true)}
          headings={headings}
        />
      </TabsContent>
      <TabsContent value="cards" className={PANEL_CLASS}>
        <FlashcardsTab documentId={doc.id} cards={cards} loading={actions.derivLoading} onRegenerate={rerunDerivatives} />
      </TabsContent>
      <TabsContent value="quiz" className={PANEL_CLASS}>
        <QuizTab documentId={doc.id} quiz={assets?.quiz ?? null} loading={actions.derivLoading} onRegenerate={rerunDerivatives} />
      </TabsContent>
      <TabsContent value="podcast" className={PANEL_CLASS}>
        <PodcastTab podcast={assets?.podcast ?? null} loading={actions.podcastLoading} onGenerate={actions.runPodcast} />
      </TabsContent>

      <DeleteDocumentDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title={doc.title}
        onConfirm={() => {
          setDeleteOpen(false);
          void actions.deleteDocument();
        }}
      />
    </Tabs>
  );
}
