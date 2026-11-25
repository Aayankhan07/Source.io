"use client";

import { PodcastPlayer } from "@/features/documents/components/PodcastPlayer";
import type { PodcastRow } from "@/features/documents/types";
import { TAB_PANE_CLASS } from "./tabPane";

export function PodcastTab({ podcast, loading, onGenerate }: {
  podcast: PodcastRow | null;
  loading: boolean;
  onGenerate: () => void;
}) {
  return (
    <div className={TAB_PANE_CLASS}>
      <PodcastPlayer podcast={podcast} onGenerate={onGenerate} loading={loading} />
    </div>
  );
}
