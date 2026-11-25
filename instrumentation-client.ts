// Browser-side Sentry init. Next.js runs this file before the app hydrates.
// Sentry stays completely off unless NEXT_PUBLIC_SENTRY_DSN is set.
import * as Sentry from "@sentry/nextjs";
import { SENTRY_TRACES_SAMPLE_RATE, sentryDataCollection } from "./sentry.shared";

const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN;

if (dsn) {
  Sentry.init({
    dsn,
    environment: process.env.NEXT_PUBLIC_VERCEL_ENV || process.env.NODE_ENV,
    tracesSampleRate: SENTRY_TRACES_SAMPLE_RATE,
    dataCollection: sentryDataCollection,
  });
}

// Instruments App Router navigations; harmless when Sentry is not initialised.
export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;
