"use client";

import { useEffect } from "react";
import { analyticsEnabled, initAnalytics } from "./track";

/**
 * Boots PostHog after hydration when NEXT_PUBLIC_POSTHOG_KEY is set; renders
 * nothing. User identification happens in AuthContext (Supabase user id only).
 */
export function AnalyticsProvider() {
  useEffect(() => {
    if (analyticsEnabled) void initAnalytics();
  }, []);
  return null;
}
