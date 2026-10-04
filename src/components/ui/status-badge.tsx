import * as React from "react";
import { cn } from "@/lib/utils";

export type StatusTone = "success" | "danger" | "warning" | "info" | "neutral";

export interface StatusBadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  tone?: StatusTone;
  dot?: boolean;
}

const toneStyles: Record<StatusTone, { badge: string; dot: string }> = {
  success: {
    badge: "bg-[var(--emerald-bg)] text-[var(--emerald)] border-emerald-500/20",
    dot: "bg-[var(--emerald)]",
  },
  danger: {
    badge: "bg-[var(--red-bg)] text-[var(--red)] border-red-500/20",
    dot: "bg-[var(--red)]",
  },
  warning: {
    badge: "bg-[var(--amber-bg)] text-[var(--amber)] border-amber-500/20",
    dot: "bg-[var(--amber)]",
  },
  info: {
    badge: "bg-[var(--blue-bg)] text-[var(--blue)] border-blue-500/20",
    dot: "bg-[var(--blue)]",
  },
  neutral: {
    badge: "bg-muted/70 text-muted-foreground border-border/60",
    dot: "bg-muted-foreground",
  },
};

/**
 * Maps raw status strings (e.g. from documents or processing pipelines) to semantic tones.
 */
export function getStatusTone(status: string): StatusTone {
  const s = status.toLowerCase();
  if (["ready", "completed", "verified", "active", "online", "success"].includes(s)) return "success";
  if (["failed", "error", "rejected", "critical", "danger"].includes(s)) return "danger";
  if (["processing", "queued", "pending", "syncing", "warning"].includes(s)) return "warning";
  if (["ingesting", "indexing", "synthesizing", "info"].includes(s)) return "info";
  return "neutral";
}

export function StatusBadge({
  tone = "neutral",
  dot = true,
  className,
  children,
  ...props
}: StatusBadgeProps) {
  const style = toneStyles[tone];

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-medium leading-[16px] border select-none transition-colors duration-150",
        style.badge,
        className
      )}
      {...props}
    >
      {dot && <span className={cn("size-1.5 rounded-full shrink-0", style.dot)} aria-hidden="true" />}
      {children}
    </span>
  );
}
