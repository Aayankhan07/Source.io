// Edge-runtime Sentry init. Loaded from instrumentation.ts only when
// NEXT_PUBLIC_SENTRY_DSN is set.
import * as Sentry from "@sentry/nextjs";
import { SENTRY_TRACES_SAMPLE_RATE, sentryDataCollection } from "./sentry.shared";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  environment: process.env.VERCEL_ENV || process.env.NODE_ENV,
  tracesSampleRate: SENTRY_TRACES_SAMPLE_RATE,
  dataCollection: sentryDataCollection,
});
