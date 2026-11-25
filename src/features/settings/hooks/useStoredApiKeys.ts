import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/features/auth/context/AuthContext";
import { listApiKeys, type ApiKeyProvider, type SavedApiKey } from "@/lib/services/apiKeys";
import { accountKeys } from "@/lib/queryKeys";

export const API_KEY_PROVIDER_LABELS: Record<ApiKeyProvider, string> = {
  groq: "Groq",
  gemini: "Google Gemini",
  openai: "OpenAI",
};

/** Order the server prefers stored keys in; the first saved one is shown as "your key". */
const PROVIDER_PRIORITY: ApiKeyProvider[] = ["groq", "gemini", "openai"];

/**
 * The user's saved BYOK keys (provider + last 4 characters only).
 * Keys live encrypted on the server; the browser never sees or stores them.
 */
export function useStoredApiKeys() {
  const { user } = useAuth();
  const query = useQuery({
    queryKey: accountKeys.apiKeys(user?.id),
    enabled: !!user?.id,
    queryFn: listApiKeys,
    staleTime: 60_000,
  });
  const keys: SavedApiKey[] = query.data ?? [];
  const keyFor = (provider: ApiKeyProvider) => keys.find((k) => k.provider === provider);
  const primary = PROVIDER_PRIORITY.map(keyFor).find(Boolean) ?? null;

  return {
    ...query,
    keys,
    keyFor,
    hasKey: (provider: ApiKeyProvider) => !!keyFor(provider),
    /** The key the server will use first, or null when the user has none. */
    primary,
    hasAnyKey: keys.length > 0,
  };
}
