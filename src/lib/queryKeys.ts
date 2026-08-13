/**
 * Central query-key registry.
 *
 * Realtime subscriptions invalidate these same keys, so defining them in one
 * place keeps the fetch sites and the invalidation sites from drifting apart.
 */
export const queryKeys = {
  documents: ["documents"] as const,
  document: (docId: string) => ["document", docId] as const,
  assets: (docId: string) => ["assets", docId] as const,
  podcast: (docId: string) => ["podcast", docId] as const,
  chat: (docId: string) => ["chat", docId] as const,
  chunkCount: (docId: string) => ["chunk-count", docId] as const,
};
