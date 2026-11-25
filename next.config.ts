import type { NextConfig } from "next";
import { withSentryConfig } from "@sentry/nextjs/config";

const nextConfig: NextConfig = {
  // Keep src/ directory for non-route code; app/ is at root for routes
  // No custom webpack needed - Next.js handles React, TS, Tailwind natively
};

// Sentry build integration is only applied when a DSN is configured, so local
// and CI builds without any Sentry env behave exactly like a plain Next build.
// Source maps are uploaded only when SENTRY_AUTH_TOKEN is also present.
const sentryEnabled = Boolean(process.env.NEXT_PUBLIC_SENTRY_DSN);
const sentryUploadEnabled = Boolean(process.env.SENTRY_AUTH_TOKEN);

export default sentryEnabled
  ? withSentryConfig(nextConfig, {
      org: process.env.SENTRY_ORG,
      project: process.env.SENTRY_PROJECT,
      authToken: process.env.SENTRY_AUTH_TOKEN,
      silent: !process.env.CI,
      telemetry: false,
      widenClientFileUpload: sentryUploadEnabled,
      sourcemaps: {
        disable: !sentryUploadEnabled,
        deleteSourcemapsAfterUpload: true,
      },
    })
  : nextConfig;
