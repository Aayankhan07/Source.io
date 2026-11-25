"use client";

import React from "react";
import { API_KEY_PROVIDER_LABELS, useStoredApiKeys } from "@/features/settings/hooks/useStoredApiKeys";
import type { ApiKeyProvider } from "@/lib/services/apiKeys";

/**
 * BYOK status for the quota pill.
 *
 * Keys are stored encrypted on the server (roadmap §6.0), so the browser can no longer
 * probe a provider's rate-limit headers with the raw key. All we can show is whether the
 * user has their own key and which one ("Your Groq key ••••1234").
 */
export interface ProviderKeyStatus {
  provider: ApiKeyProvider | null;
  /** "Groq", "Google Gemini", "OpenAI", or null without a key. */
  providerLabel: string | null;
  last4: string | null;
  hasByok: boolean;
  isLoading: boolean;
}

/**
 * Kept so existing provider trees keep compiling. Status now comes from the shared
 * `useStoredApiKeys()` query, so this no longer holds any state of its own.
 */
export function ProviderQuotaProvider({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

export function useProviderQuota(): ProviderKeyStatus {
  const { primary, isLoading } = useStoredApiKeys();
  return {
    provider: primary?.provider ?? null,
    providerLabel: primary ? API_KEY_PROVIDER_LABELS[primary.provider] : null,
    last4: primary?.last4 ?? null,
    hasByok: !!primary,
    isLoading,
  };
}
