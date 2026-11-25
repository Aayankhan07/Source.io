"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/features/auth/context/AuthContext";
import { useSettings } from "@/features/settings/context/SettingsContext";
import type { NoteRow } from "@/features/documents/types";
import { streamNotes, type NotesProgress } from "@/lib/services/pipeline";
import { isNotesIncompleteError } from "@/lib/services/functions";
import { accountKeys, queryKeys } from "@/lib/queryKeys";
import { errorMessage } from "@/lib/utils";
import { track } from "@/lib/analytics/track";
import { useToast } from "@/hooks/use-toast";
import type { DocumentAssets } from "./types";

/**
 * Streams notes for a document. The server saves the finished notes itself
 * (generate_notes writes notes.markdown), so the client only shows an optimistic
 * draft while streaming and then refetches the saved assets.
 */
export function useNotesGeneration({
  docId,
  persistedNote,
  canAutoStart,
}: {
  docId: string | undefined;
  persistedNote: NoteRow | null;
  /** True once the document is ready and its assets have loaded. */
  canAutoStart: boolean;
}) {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { settings, notesSettings, userRole, preferences } = useSettings();

  const [streaming, setStreaming] = useState(false);
  const [progress, setProgress] = useState<NotesProgress | null>(null);
  /** Message from a generation that paused part-way (NOTES_INCOMPLETE); null otherwise. */
  const [incomplete, setIncomplete] = useState<string | null>(null);

  // Token deltas are buffered and flushed once per animation frame (KaTeX re-render cost).
  const [draftMarkdown, setDraftMarkdown] = useState<string | null>(null);
  const pendingRef = useRef("");
  const flushRef = useRef<number | null>(null);
  const streamingRef = useRef(false);
  const autoStartedRef = useRef<string | null>(null);
  const sectionsRef = useRef(0);

  useEffect(() => () => {
    if (flushRef.current !== null) cancelAnimationFrame(flushRef.current);
  }, []);

  const generate = useCallback(
    async (opts?: { force?: boolean }) => {
      if (!docId || streamingRef.current) return;
      streamingRef.current = true;
      setStreaming(true);
      setIncomplete(null);
      setProgress(null);
      setDraftMarkdown("");
      pendingRef.current = "";
      sectionsRef.current = 0;
      try {
        const streamed = await streamNotes({
          documentId: docId,
          tone: notesSettings.regenerationTone,
          notesDepth: settings.notesDepth,
          model: settings.preferredModel,
          userRole,
          workspacePreferences: preferences,
          force: opts?.force,
          onProgress: (p) => {
            sectionsRef.current = p.total;
            setProgress(p);
          },
          onDelta: (chunk) => {
            pendingRef.current += chunk;
            if (flushRef.current !== null) return;
            flushRef.current = requestAnimationFrame(() => {
              flushRef.current = null;
              const buffered = pendingRef.current;
              if (!buffered) return;
              pendingRef.current = "";
              setDraftMarkdown((cur) => (cur ?? "") + buffered);
            });
          },
        });

        if (flushRef.current !== null) {
          cancelAnimationFrame(flushRef.current);
          flushRef.current = null;
        }
        const finalMarkdown = (streamed || "").trim();
        pendingRef.current = "";

        if (finalMarkdown) {
          track("notes_generated", { sections: sectionsRef.current || 1 });
          // Optimistic: show the final note immediately (no flicker), then sync with what the server saved.
          queryClient.setQueryData<DocumentAssets>(queryKeys.assets(docId), (prev) => ({
            note: { id: persistedNote?.id ?? "pending", document_id: docId, markdown: finalMarkdown },
            cards: prev?.cards ?? [],
            quiz: prev?.quiz ?? null,
            podcast: prev?.podcast ?? null,
          }));
        }
        setDraftMarkdown(null);
        await Promise.all([
          queryClient.invalidateQueries({ queryKey: queryKeys.assets(docId) }),
          queryClient.invalidateQueries({ queryKey: accountKeys.dailyUsage(user?.id) }),
        ]);
      } catch (e: unknown) {
        if (flushRef.current !== null) {
          cancelAnimationFrame(flushRef.current);
          flushRef.current = null;
        }
        if (isNotesIncompleteError(e)) {
          // Keep the partial draft on screen; finished sections are saved and resume on continue.
          const pending = pendingRef.current;
          pendingRef.current = "";
          if (pending) setDraftMarkdown((cur) => (cur ?? "") + pending);
          setIncomplete(errorMessage(e));
          void queryClient.invalidateQueries({ queryKey: accountKeys.dailyUsage(user?.id) });
        } else {
          pendingRef.current = "";
          setDraftMarkdown(null);
          toast({ title: "Notes generation failed", description: errorMessage(e), variant: "destructive" });
        }
      } finally {
        streamingRef.current = false;
        setStreaming(false);
        setProgress(null);
      }
    },
    [docId, notesSettings.regenerationTone, settings.notesDepth, settings.preferredModel, userRole, preferences, persistedNote?.id, queryClient, user?.id, toast],
  );

  // Auto-generate notes once when the document becomes ready and has no notes yet.
  useEffect(() => {
    if (!docId || !canAutoStart || persistedNote?.markdown || autoStartedRef.current === docId) return;
    autoStartedRef.current = docId;
    void generate();
  }, [docId, canAutoStart, persistedNote?.markdown, generate]);

  const note: NoteRow | null =
    draftMarkdown !== null && (draftMarkdown || !persistedNote?.markdown)
      ? { id: "draft", document_id: docId ?? "", markdown: draftMarkdown }
      : persistedNote;

  return { note, streaming, progress, incomplete, generate };
}
