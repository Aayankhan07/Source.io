import type { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2.57.4";

export const PODCAST_BUCKET = "podcasts";

/** Audio containers the browser renderer can upload. */
export const AUDIO_EXTENSIONS = {
  ogg: "audio/ogg",
  webm: "audio/webm",
  wav: "audio/wav",
} as const;
export type AudioExtension = keyof typeof AUDIO_EXTENSIONS;

export function isAudioExtension(value: unknown): value is AudioExtension {
  return typeof value === "string" && Object.prototype.hasOwnProperty.call(AUDIO_EXTENSIONS, value);
}

/** `${userId}/${documentId}` — every audio object for a document lives directly in this folder. */
export function audioFolder(userId: string, documentId: string): string {
  return `${userId}/${documentId}`;
}

export function buildAudioPath(userId: string, documentId: string, ext: AudioExtension, now = Date.now()): string {
  return `${audioFolder(userId, documentId)}/${now}.${ext}`;
}

const UUIDISH = /^[0-9a-f-]{8,64}$/i;

/**
 * True only for `${userId}/${documentId}/<digits>.<ext>`, so a caller can never point the
 * podcast row at another user's object or at a nested/traversal path.
 */
export function isOwnedAudioPath(path: unknown, userId: string, documentId: string): path is string {
  if (typeof path !== "string") return false;
  if (!UUIDISH.test(userId) || !UUIDISH.test(documentId)) return false;
  const prefix = `${audioFolder(userId, documentId)}/`;
  if (!path.startsWith(prefix)) return false;
  return /^\d{10,16}\.(ogg|webm|wav)$/.test(path.slice(prefix.length));
}

/**
 * Best-effort removal of a document's audio files, optionally keeping one path.
 * Never throws; returns how many objects were removed.
 */
export async function removeDocumentAudio(
  admin: SupabaseClient,
  userId: string,
  documentId: string,
  keepPath?: string,
): Promise<number> {
  try {
    const folder = audioFolder(userId, documentId);
    const { data: files, error } = await admin.storage.from(PODCAST_BUCKET).list(folder, { limit: 100 });
    if (error || !files) return 0;
    const stale = files
      .map((f: { name: string }) => `${folder}/${f.name}`)
      .filter((p: string) => p !== keepPath);
    if (stale.length === 0) return 0;
    const { error: rmErr } = await admin.storage.from(PODCAST_BUCKET).remove(stale);
    return rmErr ? 0 : stale.length;
  } catch {
    return 0;
  }
}
