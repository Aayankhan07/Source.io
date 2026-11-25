import { supabase } from "@/integrations/supabase/client";
import { track } from "@/lib/analytics/track";
import { callFunction, functionError } from "@/lib/services/functions";

/**
 * Generates (or regenerates) the two-host podcast SCRIPT on the server. Costs one AI action.
 * Audio is rendered in the browser afterwards (see src/features/podcast).
 * `voiceDuo` is still accepted for backward compatibility but is no longer sent to the server.
 */
export async function generatePodcast(
  documentId: string,
  options?: { voiceDuo?: string; idempotencyKey?: string; podcastStyle?: string; userRole?: string }
): Promise<{ ok: boolean; status: string; script?: string }> {
  const idempotencyKey =
    options?.idempotencyKey ||
    `${documentId}:podcast:${Date.now()}:${Math.random().toString(36).slice(2, 8)}`;

  const resp = await callFunction("generate_podcast", {
    document_id: documentId,
    podcast_style: options?.podcastStyle,
    user_role: options?.userRole,
    idempotency_key: idempotencyKey,
  });

  if (!resp.ok) throw await functionError(resp, `Podcast script generation failed (${resp.status})`);
  return await resp.json();
}

export class AudioQuotaExceededError extends Error {
  readonly code = "AUDIO_QUOTA_EXCEEDED";
}

async function podcastAudioError(resp: Response, fallback: string): Promise<Error> {
  const raw = await resp.clone().text().catch(() => "");
  try {
    const parsed = JSON.parse(raw);
    if (parsed?.code === "AUDIO_QUOTA_EXCEEDED") {
      return new AudioQuotaExceededError(
        "You've used today's audio renders. They reset at 00:00 UTC — you can still play the script with device voices.",
      );
    }
    if (parsed?.code === "NO_SCRIPT") return new Error("Generate the podcast script first.");
  } catch {
    // not JSON
  }
  return await functionError(resp, fallback);
}

export interface PodcastAudioUrl {
  /** Short-lived (1 hour) signed URL, or null when no audio has been rendered. */
  url: string | null;
  /** Audio renders left today, or null when unknown. */
  rendersRemaining: number | null;
}

export async function getPodcastAudioUrl(documentId: string, signal?: AbortSignal): Promise<PodcastAudioUrl> {
  const resp = await callFunction("podcast_audio", { action: "url", document_id: documentId }, { signal });
  if (!resp.ok) throw await podcastAudioError(resp, "Couldn't load the podcast audio.");
  const data = await resp.json();
  return { url: data.url ?? null, rendersRemaining: typeof data.renders_remaining === "number" ? data.renders_remaining : null };
}

/**
 * Uploads browser-rendered audio: reserves one daily audio render ('start'), uploads to the
 * signed upload URL, then records the file on the podcast row ('finish').
 */
export async function uploadPodcastAudio(
  documentId: string,
  audio: { blob: Blob; ext: "ogg" | "wav" | "webm"; contentType: string },
): Promise<PodcastAudioUrl> {
  const startResp = await callFunction("podcast_audio", { action: "start", document_id: documentId, ext: audio.ext });
  if (!startResp.ok) throw await podcastAudioError(startResp, "Couldn't start the audio upload.");
  const start = await startResp.json() as { path: string; token: string; renders_remaining?: number | null };

  const { error } = await supabase.storage
    .from("podcasts")
    .uploadToSignedUrl(start.path, start.token, audio.blob, { contentType: audio.contentType, upsert: false });
  if (error) throw new Error(`Audio upload failed: ${error.message}`);

  const finishResp = await callFunction("podcast_audio", { action: "finish", document_id: documentId, path: start.path });
  if (!finishResp.ok) throw await podcastAudioError(finishResp, "Couldn't save the podcast audio.");
  const finish = await finishResp.json();
  track("podcast_audio_created");
  return {
    url: finish.url ?? null,
    rendersRemaining: typeof start.renders_remaining === "number" ? start.renders_remaining : null,
  };
}
