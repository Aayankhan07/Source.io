"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/features/auth/context/AuthContext";
import { useSettings } from "@/features/settings/context/SettingsContext";
import { generateDerivatives } from "@/lib/services/pipeline";
import { generatePodcast } from "@/lib/services/podcast";
import { accountKeys, queryKeys } from "@/lib/queryKeys";
import { errorMessage } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import type { PodcastRow } from "@/features/documents/types";
import type { DocumentAssets } from "./types";

/** Flashcards/quiz generation, podcast script generation and document deletion. */
export function useStudyActions({
  docId,
  podcast,
  canAutoPodcast,
}: {
  docId: string | undefined;
  podcast: PodcastRow | null;
  /** True when the document is ready, its notes exist and its assets have loaded. */
  canAutoPodcast: boolean;
}) {
  const { user } = useAuth();
  const { toast } = useToast();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { settings, userRole, preferences } = useSettings();

  const [derivLoading, setDerivLoading] = useState(false);
  const [podcastLoading, setPodcastLoading] = useState(false);

  const runDerivatives = useCallback(
    async (opts?: { force?: boolean }) => {
      if (!docId || derivLoading) return;
      setDerivLoading(true);
      try {
        await generateDerivatives(docId, {
          flashcardCount: settings.flashcardBatchSize,
          quizDifficulty: settings.quizDifficulty,
          force: opts?.force,
          userRole,
          workspacePreferences: preferences,
        });
        await Promise.all([
          queryClient.invalidateQueries({ queryKey: queryKeys.assets(docId) }),
          queryClient.invalidateQueries({ queryKey: accountKeys.dailyUsage(user?.id) }),
        ]);
        toast({ title: "Flashcards & quiz ready" });
      } catch (e: unknown) {
        toast({ title: "Generation failed", description: errorMessage(e), variant: "destructive" });
      } finally {
        setDerivLoading(false);
      }
    },
    [docId, derivLoading, settings.flashcardBatchSize, settings.quizDifficulty, userRole, preferences, queryClient, user?.id, toast],
  );

  const runPodcast = useCallback(async () => {
    if (!docId || podcastLoading) return;
    setPodcastLoading(true);
    queryClient.setQueryData<DocumentAssets>(queryKeys.assets(docId), (prev) =>
      prev
        ? {
            ...prev,
            podcast: {
              id: prev.podcast?.id ?? "draft",
              document_id: docId,
              title: "Writing script…",
              script: prev.podcast?.script ?? null,
              audio_url: null,
              status: "generating",
            },
          }
        : prev,
    );
    try {
      await generatePodcast(docId, { podcastStyle: preferences?.podcastStyle, userRole });
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.assets(docId) }),
        queryClient.invalidateQueries({ queryKey: accountKeys.dailyUsage(user?.id) }),
      ]);
      toast({
        title: "Podcast script ready",
        description: "Play it with device voices, or create audio from the Podcast tab.",
      });
    } catch (e: unknown) {
      await queryClient.invalidateQueries({ queryKey: queryKeys.assets(docId) });
      toast({ title: "Podcast script failed", description: errorMessage(e), variant: "destructive" });
    } finally {
      setPodcastLoading(false);
    }
  }, [docId, podcastLoading, preferences?.podcastStyle, userRole, queryClient, user?.id, toast]);

  // Optional: write the podcast script automatically once notes exist (once per document,
  // so a failed attempt is never retried in a loop).
  const autoPodcastRef = useRef<string | null>(null);
  useEffect(() => {
    if (!docId || autoPodcastRef.current === docId) return;
    if (settings.autoGeneratePodcast && canAutoPodcast && !podcast && !podcastLoading) {
      autoPodcastRef.current = docId;
      void runPodcast();
    }
  }, [docId, settings.autoGeneratePodcast, canAutoPodcast, podcast, podcastLoading, runPodcast]);

  const deleteDocument = useCallback(async () => {
    if (!docId) return;
    const { error } = await supabase.from("documents").delete().eq("id", docId);
    if (error) {
      toast({ title: "Delete failed", description: error.message, variant: "destructive" });
      return;
    }
    queryClient.invalidateQueries({ queryKey: queryKeys.documents });
    queryClient.invalidateQueries({ queryKey: accountKeys.documentCount(user?.id) });
    queryClient.removeQueries({ queryKey: queryKeys.document(docId) });
    queryClient.removeQueries({ queryKey: queryKeys.assets(docId) });
    router.push("/app");
  }, [docId, queryClient, router, toast, user?.id]);

  return { derivLoading, podcastLoading, runDerivatives, runPodcast, deleteDocument };
}
