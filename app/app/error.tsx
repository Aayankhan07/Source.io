"use client";

import Link from "next/link";
import { useEffect } from "react";
import * as Sentry from "@sentry/nextjs";
import { AlertTriangle, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";

// Error boundary for the authenticated workspace. Rendered inside the app
// shell (dock + layout stay mounted), so it uses the workspace surface tokens.
export default function WorkspaceError({
  error,
  retry,
}: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  useEffect(() => {
    Sentry.captureException(error, { tags: { boundary: "workspace" } });
    console.error(error);
  }, [error]);

  return (
    <div className="h-full min-h-[60vh] flex items-center justify-center px-6 py-12">
      <div
        role="alert"
        className="rounded-[28px] bg-card border border-border shadow-tactile-card p-8 sm:p-10 text-center max-w-md w-full space-y-5"
      >
        <div className="size-12 rounded-2xl bg-muted border border-border flex items-center justify-center text-foreground mx-auto">
          <AlertTriangle className="size-6" />
        </div>

        <div className="space-y-2">
          <p className="text-xs font-mono uppercase tracking-widest text-muted-foreground">Workspace error</p>
          <h1 className="text-xl font-bold text-foreground font-display tracking-tight">
            This view failed to load
          </h1>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Something went wrong while rendering your workspace. The issue has been reported. Your
            documents and study sets are safe.
          </p>
          {error.digest && (
            <p className="text-xs font-mono text-muted-foreground">Reference: {error.digest}</p>
          )}
        </div>

        <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
          <Button
            onClick={() => retry()}
            className="rounded-full text-xs font-semibold bg-primary text-primary-foreground hover:bg-primary/95"
          >
            <RotateCcw className="size-3.5 mr-1.5" />
            Try again
          </Button>
          <Button
            asChild
            variant="outline"
            className="rounded-full text-xs border-border text-foreground hover:bg-muted"
          >
            <Link href="/app">Back to library</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
