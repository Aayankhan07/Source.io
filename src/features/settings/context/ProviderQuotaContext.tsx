"use client";

import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import { useSettings } from "@/features/settings/context/SettingsContext";
import { testProviderApiKey, ByokTestResult } from "@/lib/services/byokTest";

interface ProviderQuotaInfo {
  provider: "groq" | "gemini" | "openai" | null;
  hasByok: boolean;
  remainingTokens?: number;
  limitTokens?: number;
  remainingRequests?: number;
  limitRequests?: number;
  percentRemaining: number | null;
  resetTime?: string;
  lastUpdated: number | null;
  isProbing: boolean;
  error?: string | null;
}

interface ProviderQuotaContextType {
  quota: ProviderQuotaInfo;
  refreshQuota: () => Promise<void>;
  updateFromHeaders: (headers: Headers, provider: "groq" | "gemini" | "openai") => void;
}

const STORAGE_KEY = "source_io_provider_quota_cache_v1";

const defaultQuota: ProviderQuotaInfo = {
  provider: null,
  hasByok: false,
  percentRemaining: null,
  lastUpdated: null,
  isProbing: false,
  error: null,
};

const ProviderQuotaContext = createContext<ProviderQuotaContextType>({
  quota: defaultQuota,
  refreshQuota: async () => {},
  updateFromHeaders: () => {},
});

export function ProviderQuotaProvider({ children }: { children: React.ReactNode }) {
  const { settings } = useSettings();
  const [quota, setQuota] = useState<ProviderQuotaInfo>(() => {
    if (typeof window === "undefined") return defaultQuota;
    try {
      const cached = localStorage.getItem(STORAGE_KEY);
      if (cached) return JSON.parse(cached);
    } catch {
      // ignore
    }
    return defaultQuota;
  });

  const activeProvider = ((): { provider: "groq" | "gemini" | "openai"; key: string } | null => {
    if (settings?.apiKeys?.groq?.trim()) return { provider: "groq", key: settings.apiKeys.groq.trim() };
    if (settings?.apiKeys?.gemini?.trim()) return { provider: "gemini", key: settings.apiKeys.gemini.trim() };
    if (settings?.apiKeys?.openai?.trim()) return { provider: "openai", key: settings.apiKeys.openai.trim() };
    return null;
  })();

  const updateFromHeaders = useCallback((headers: Headers, provider: "groq" | "gemini" | "openai") => {
    const remTok = headers.get("x-ratelimit-remaining-tokens");
    const limTok = headers.get("x-ratelimit-limit-tokens");
    const remReq = headers.get("x-ratelimit-remaining-requests");
    const limReq = headers.get("x-ratelimit-limit-requests");
    const resetTok = headers.get("x-ratelimit-reset-tokens");

    let percent: number | null = null;
    const remainingTokens = remTok ? parseInt(remTok, 10) : undefined;
    const limitTokens = limTok ? parseInt(limTok, 10) : undefined;
    const remainingRequests = remReq ? parseInt(remReq, 10) : undefined;
    const limitRequests = limReq ? parseInt(limReq, 10) : undefined;

    if (remainingTokens !== undefined && limitTokens !== undefined && limitTokens > 0) {
      percent = Math.max(0, Math.min(100, Math.round((remainingTokens / limitTokens) * 100)));
    } else if (remainingRequests !== undefined && limitRequests !== undefined && limitRequests > 0) {
      percent = Math.max(0, Math.min(100, Math.round((remainingRequests / limitRequests) * 100)));
    }

    setQuota((prev) => {
      const next: ProviderQuotaInfo = {
        ...prev,
        provider,
        hasByok: true,
        remainingTokens: remainingTokens ?? prev.remainingTokens,
        limitTokens: limitTokens ?? prev.limitTokens,
        remainingRequests: remainingRequests ?? prev.remainingRequests,
        limitRequests: limitRequests ?? prev.limitRequests,
        percentRemaining: percent ?? prev.percentRemaining,
        resetTime: resetTok || prev.resetTime,
        lastUpdated: Date.now(),
        error: null,
      };
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      } catch {
        // ignore
      }
      return next;
    });
  }, []);

  const refreshQuota = useCallback(async () => {
    if (!activeProvider) {
      setQuota(defaultQuota);
      try {
        localStorage.removeItem(STORAGE_KEY);
      } catch {
        // ignore
      }
      return;
    }

    setQuota((prev) => ({ ...prev, isProbing: true, provider: activeProvider.provider, hasByok: true }));

    try {
      const result: ByokTestResult = await testProviderApiKey(activeProvider.provider, activeProvider.key);
      if (!result.ok) {
        setQuota((prev) => ({
          ...prev,
          isProbing: false,
          error: result.message,
        }));
        return;
      }

      let percent: number | null = null;
      if (result.remainingTokens !== undefined && result.limitTokens !== undefined && result.limitTokens > 0) {
        percent = Math.max(0, Math.min(100, Math.round((result.remainingTokens / result.limitTokens) * 100)));
      } else if (result.remainingRequests !== undefined && result.limitRequests !== undefined && result.limitRequests > 0) {
        percent = Math.max(0, Math.min(100, Math.round((result.remainingRequests / result.limitRequests) * 100)));
      }

      setQuota({
        provider: activeProvider.provider,
        hasByok: true,
        remainingTokens: result.remainingTokens,
        limitTokens: result.limitTokens,
        remainingRequests: result.remainingRequests,
        limitRequests: result.limitRequests,
        percentRemaining: percent,
        resetTime: result.resetTokens || result.resetRequests,
        lastUpdated: Date.now(),
        isProbing: false,
        error: null,
      });

      try {
        localStorage.setItem(
          STORAGE_KEY,
          JSON.stringify({
            provider: activeProvider.provider,
            hasByok: true,
            remainingTokens: result.remainingTokens,
            limitTokens: result.limitTokens,
            remainingRequests: result.remainingRequests,
            limitRequests: result.limitRequests,
            percentRemaining: percent,
            resetTime: result.resetTokens || result.resetRequests,
            lastUpdated: Date.now(),
          })
        );
      } catch {
        // ignore
      }
    } catch (err: unknown) {
      setQuota((prev) => ({
        ...prev,
        isProbing: false,
        error: err instanceof Error ? err.message : "Failed to probe provider quota",
      }));
    }
  }, [activeProvider?.provider, activeProvider?.key]);

  // When API key changes in settings, automatically probe and update live quota
  useEffect(() => {
    refreshQuota();
  }, [activeProvider?.provider, activeProvider?.key]);

  return (
    <ProviderQuotaContext.Provider value={{ quota, refreshQuota, updateFromHeaders }}>
      {children}
    </ProviderQuotaContext.Provider>
  );
}

export function useProviderQuota() {
  return useContext(ProviderQuotaContext);
}
