"use client";

import Link from "next/link";
import { useEffect } from "react";
import * as Sentry from "@sentry/nextjs";
import { AlertTriangle, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function RootError({
  error,
  retry,
}: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  useEffect(() => {
    Sentry.captureException(error);
    console.error(error);
  }, [error]);

  return (
    <main className="min-h-screen flex items-center justify-center bg-background px-6 relative overflow-hidden select-none">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[350px] h-[350px] rounded-full bg-primary/5 blur-[80px] pointer-events-none" />

      <div
        role="alert"
        className="glass-panel rounded-2xl border border-white/10 p-10 text-center max-w-md space-y-5 relative z-10"
      >
        <div className="h-12 w-12 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary mx-auto">
          <AlertTriangle className="h-6 w-6" />
        </div>

        <div className="space-y-2">
          <p className="text-xs font-mono uppercase tracking-widest text-neutral-500">Unexpected error</p>
          <h1 className="text-2xl font-bold text-white font-display tracking-tight">Something went wrong</h1>
          <p className="text-sm text-neutral-400 leading-relaxed">
            We hit a snag loading this page. It has been reported, and your documents are safe.
          </p>
          {error.digest && (
            <p className="text-xs font-mono text-neutral-500">Reference: {error.digest}</p>
          )}
        </div>

        <div className="flex items-center justify-center gap-2 pt-1">
          <Button
            onClick={() => retry()}
            className="bg-primary hover:bg-primary/95 text-primary-foreground font-semibold"
          >
            <RotateCcw className="h-4 w-4 mr-1.5" />
            Try again
          </Button>
          <Button asChild variant="outline" className="border-white/10 text-white hover:bg-white/5">
            <Link href="/">Back to home</Link>
          </Button>
        </div>
      </div>
    </main>
  );
}
