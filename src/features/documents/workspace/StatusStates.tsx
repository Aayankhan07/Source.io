"use client";

import { AlertCircle, ChevronLeft, FileText, Loader2, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

function Skeleton({ className }: { className?: string }) {
  return <div aria-hidden="true" className={cn("animate-pulse rounded-md bg-muted", className)} />;
}

export function Placeholder({ title, desc, loading = false }: { title: string; desc: string; loading?: boolean }) {
  return (
    <div
      role="status"
      className="bg-card border border-border/80 rounded-2xl p-10 text-center max-w-md mx-auto mt-12 space-y-3 shadow-sm"
    >
      {loading ? (
        <Loader2 className="h-6 w-6 animate-spin text-primary mx-auto" aria-hidden="true" />
      ) : (
        <div className="h-8 w-8 rounded-xl bg-muted border border-border flex items-center justify-center text-muted-foreground mx-auto">
          <FileText className="h-4 w-4" aria-hidden="true" />
        </div>
      )}
      <h3 className="font-semibold text-foreground font-display text-sm">{title}</h3>
      <p className="text-xs text-muted-foreground leading-relaxed">{desc}</p>
    </div>
  );
}

/** Loading skeleton shaped like the notes card (used on desktop and mobile). */
export function NotesSkeleton({ label = "Loading notes" }: { label?: string }) {
  return (
    <div
      role="status"
      aria-label={label}
      className="rounded-[24px] sm:rounded-[32px] bg-card border border-border shadow-tactile-card p-6 sm:p-10 space-y-6"
    >
      <div className="flex items-center justify-between gap-3 pb-6 border-b border-border">
        <Skeleton className="h-6 w-28 rounded-full" />
        <Skeleton className="h-8 w-40 rounded-full" />
      </div>
      <Skeleton className="h-7 w-2/3" />
      <div className="space-y-2.5">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-11/12" />
        <Skeleton className="h-4 w-4/5" />
      </div>
      <Skeleton className="h-6 w-1/2" />
      <div className="space-y-2.5">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-3/4" />
      </div>
      <span className="sr-only">{label}…</span>
    </div>
  );
}

export function WorkspaceLoading() {
  return (
    <div role="status" aria-label="Loading document" className="h-full flex items-center justify-center bg-background">
      <Loader2 className="h-5 w-5 animate-spin text-primary" aria-hidden="true" />
    </div>
  );
}

export function DocumentLoadError({ message, onRetry, onBack }: { message: string; onRetry: () => void; onBack: () => void }) {
  return (
    <div className="h-full flex items-center justify-center bg-background px-6">
      <div role="alert" className="text-center p-8 border border-dashed border-destructive/20 rounded-2xl max-w-sm bg-card space-y-4 shadow-sm">
        <div className="h-10 w-10 rounded-xl bg-destructive/10 border border-destructive/20 flex items-center justify-center text-destructive mx-auto">
          <AlertCircle className="h-5 w-5" aria-hidden="true" />
        </div>
        <div className="space-y-1">
          <h3 className="font-bold text-foreground font-display text-sm">Couldn&apos;t load this document</h3>
          <p className="text-sm text-muted-foreground leading-relaxed">{message}</p>
        </div>
        <div className="flex items-center justify-center gap-2">
          <Button onClick={onRetry} className="bg-primary hover:bg-primary/95 text-primary-foreground font-semibold text-xs rounded-full">
            <RefreshCw className="h-3.5 w-3.5 mr-1.5" aria-hidden="true" /> Retry
          </Button>
          <Button variant="outline" onClick={onBack} className="border-border text-foreground hover:bg-muted rounded-full text-xs">
            Go to library
          </Button>
        </div>
      </div>
    </div>
  );
}

export function DocumentNotFound({ onBack }: { onBack: () => void }) {
  return (
    <div className="h-full flex items-center justify-center bg-background">
      <div className="text-center p-8 border border-dashed border-border rounded-2xl max-w-sm bg-card shadow-sm">
        <p className="text-muted-foreground text-sm mb-4">Study document was not found.</p>
        <Button variant="outline" onClick={onBack} className="border-border text-foreground hover:bg-muted rounded-full text-xs">
          <ChevronLeft className="h-4 w-4 mr-1 shrink-0" aria-hidden="true" /> Go to library
        </Button>
      </div>
    </div>
  );
}
