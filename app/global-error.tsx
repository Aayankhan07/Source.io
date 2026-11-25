"use client";

import { useEffect } from "react";
import * as Sentry from "@sentry/nextjs";

// Replaces the root layout when it crashes, so globals.css and fonts are not
// available here. Styling is inline and mirrors the dark brand surface.
export default function GlobalError({
  error,
  retry,
}: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  useEffect(() => {
    Sentry.captureException(error, { tags: { boundary: "global" } });
  }, [error]);

  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#0a0a0a",
          color: "#fafafa",
          fontFamily: "Geist, system-ui, -apple-system, Segoe UI, sans-serif",
          padding: "24px",
        }}
      >
        <title>Something went wrong | Source.io</title>
        <div
          role="alert"
          style={{
            maxWidth: 420,
            width: "100%",
            textAlign: "center",
            border: "1px solid rgba(255,255,255,0.1)",
            borderRadius: 16,
            padding: 40,
            background: "rgba(255,255,255,0.03)",
          }}
        >
          <p
            style={{
              fontSize: 12,
              letterSpacing: "0.15em",
              textTransform: "uppercase",
              color: "#a3a3a3",
              margin: 0,
              fontFamily: "ui-monospace, monospace",
            }}
          >
            Application error
          </p>
          <h1 style={{ fontSize: 24, margin: "8px 0", fontWeight: 700 }}>Something went wrong</h1>
          <p style={{ fontSize: 14, lineHeight: 1.6, color: "#a3a3a3", margin: 0 }}>
            Source.io hit an unexpected error. It has been reported, and your documents are safe.
          </p>
          {error.digest && (
            <p style={{ fontSize: 12, color: "#a3a3a3", marginTop: 8, fontFamily: "ui-monospace, monospace" }}>
              Reference: {error.digest}
            </p>
          )}
          <div style={{ display: "flex", gap: 8, justifyContent: "center", marginTop: 20 }}>
            <button
              type="button"
              onClick={() => retry()}
              style={{
                background: "#fafafa",
                color: "#0a0a0a",
                border: "none",
                borderRadius: 8,
                padding: "10px 16px",
                fontWeight: 600,
                fontSize: 14,
                cursor: "pointer",
              }}
            >
              Try again
            </button>
            <a
              href="/"
              style={{
                color: "#fafafa",
                border: "1px solid rgba(255,255,255,0.15)",
                borderRadius: 8,
                padding: "10px 16px",
                fontSize: 14,
                textDecoration: "none",
              }}
            >
              Back to home
            </a>
          </div>
        </div>
      </body>
    </html>
  );
}
