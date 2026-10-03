"use client";

import { useMemo, useState } from "react";
import { Hash, Clock, FileText, ChevronRight, Bookmark, ChevronDown, List, Minus, Circle, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";

export interface OutlineHeading {
  id: string;
  text: string;
  level: number;
}

export function extractHeadings(markdown: string | null | undefined): OutlineHeading[] {
  if (!markdown) return [];
  const lines = markdown.split("\n");
  const headings: OutlineHeading[] = [];

  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed.startsWith("#")) {
      const match = trimmed.match(/^(#{1,3})\s+(.+)$/);
      if (match) {
        const level = match[1].length;
        const text = match[2].trim().replace(/[*_`]/g, "");
        const id = text.toLowerCase().replace(/[^\w\s-]/g, "").replace(/\s+/g, "-");
        headings.push({ id, text, level });
      }
    }
  }
  return headings;
}

interface WorkspaceOutlineProps {
  markdown: string | null | undefined;
  activeHeadingId?: string | null;
  onSelectHeading?: (id: string) => void;
  className?: string;
  /** Render as horizontal scrollable chips (for Notes tab inline) */
  inlineChips?: boolean;
  /** Render as slim numbered rail (for left sidebar) */
  slimRail?: boolean;
  /** Whether the sidebar is retracted in dual-state mode */
  isRetracted?: boolean;
  /** Toggle retracted / expanded state */
  onToggleRetract?: () => void;
  /** Max chips to show before overflow (default: all level 1-2 headings) */
  maxChips?: number;
}

export default function WorkspaceOutline({
  markdown,
  activeHeadingId,
  onSelectHeading,
  className,
  inlineChips = false,
  slimRail = false,
  isRetracted = false,
  onToggleRetract,
  maxChips = 8,
}: WorkspaceOutlineProps) {
  const headings = useMemo(() => extractHeadings(markdown), [markdown]);
  const [panelOpen, setPanelOpen] = useState(true);

  const stats = useMemo(() => {
    if (!markdown) return { words: 0, readMinutes: 0 };
    const words = markdown.trim().split(/\s+/).filter(Boolean).length;
    const readMinutes = Math.max(1, Math.ceil(words / 200));
    return { words, readMinutes };
  }, [markdown]);

  // Filter to top-level headings for chips (H1/H2 only)
  const chipHeadings = useMemo(() => headings.filter((h) => h.level <= 2).slice(0, maxChips), [headings, maxChips]);

  const scrollToHeading = (id: string) => {
    onSelectHeading?.(id);
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  if (inlineChips) {
    return (
      <div className={cn("flex items-center gap-1.5 overflow-x-auto pb-1 pr-4 -mr-4 scrollbar-hide", className)}>
        {chipHeadings.map((h, idx) => {
          const isActive = activeHeadingId === h.id;
          return (
            <button
              key={`${h.id}-${idx}`}
              onClick={() => scrollToHeading(h.id)}
              className={cn(
                "shrink-0 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium transition-all",
                isActive
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "bg-surface-2 text-muted-foreground hover:text-foreground hover:bg-muted border border-border/60"
              )}
              title={h.text}
            >
              <Hash className={cn("h-2.5 w-2.5", isActive ? "text-current" : "opacity-60")} />
              <span className="truncate max-w-[120px]">{h.text}</span>
            </button>
          );
        })}
        {headings.length > maxChips && (
          <button
            onClick={onToggleRetract}
            className="shrink-0 inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-surface-2 text-muted-foreground hover:text-foreground hover:bg-muted border border-border/60"
            title="Open full outline"
          >
            <List className="h-3 w-3" />
            <span>+{headings.length - maxChips}</span>
          </button>
        )}
      </div>
    );
  }

  // Retracted slim rail view (48px mini-rail)
  if (slimRail || isRetracted) {
    return (
      <aside className={cn("flex flex-col h-full w-12 bg-surface-sunken/40 border-r border-border/80 text-foreground items-center shrink-0", className)}>
        {/* Expand button at top */}
        {onToggleRetract && (
          <div className="pt-3 pb-2 border-b border-border/50 w-full flex justify-center">
            <button
              onClick={onToggleRetract}
              className="w-7 h-7 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted flex items-center justify-center transition-colors"
              title="Expand outline"
              aria-label="Expand outline"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        )}

        {/* Section Indicators */}
        <div className="flex flex-col items-center gap-2 pt-3 pb-4 flex-1 overflow-y-auto scrollbar-none w-full px-1">
          {headings.map((h, idx) => {
            const isActive = activeHeadingId === h.id;
            return (
              <button
                key={`${h.id}-${idx}`}
                onClick={() => scrollToHeading(h.id)}
                className={cn(
                  "w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-mono font-medium transition-all group relative",
                  isActive
                    ? "bg-primary text-primary-foreground shadow-sm scale-105"
                    : "bg-surface-2 text-muted-foreground hover:text-foreground hover:bg-muted"
                )}
                title={`${idx + 1}. ${h.text}`}
                aria-label={`Section ${idx + 1}: ${h.text}`}
              >
                <span>{idx + 1}</span>
              </button>
            );
          })}
          {headings.length === 0 && (
            <div className="w-7 h-7 rounded-full bg-surface-2 flex items-center justify-center">
              <Minus className="h-3.5 w-3.5 text-muted-foreground" />
            </div>
          )}
        </div>

        <div className="mt-auto mb-3 text-[10px] font-mono text-muted-foreground text-center">
          {headings.length}§
        </div>
      </aside>
    );
  }

  // Expanded full outline view (~220px)
  return (
    <aside className={cn("flex flex-col h-full bg-surface-sunken/40 border-r border-border/80 text-foreground", className)}>
      {/* Outline Header */}
      <div className="p-3.5 border-b border-border/70 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2">
          <Bookmark className="h-3.5 w-3.5 text-primary" />
          <span className="text-xs font-semibold uppercase tracking-wider font-mono text-muted-foreground">
            Document Outline
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="text-[11px] font-mono text-muted-foreground bg-muted px-2 py-0.5 rounded-full border border-border/60">
            {headings.length} sections
          </span>
          {onToggleRetract && (
            <button
              onClick={onToggleRetract}
              className="p-1 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
              title="Retract outline into slim rail"
              aria-label="Retract outline"
            >
              <ChevronDown className="h-3.5 w-3.5 rotate-90" />
            </button>
          )}
        </div>
      </div>

      {/* Reading Metadata metrics */}
      <div className="px-3.5 py-2.5 bg-muted/30 border-b border-border/50 grid grid-cols-2 gap-2 text-[11px] text-muted-foreground shrink-0">
        <div className="flex items-center gap-1.5 font-mono">
          <Clock className="h-3 w-3 text-sky-500" />
          <span>{stats.readMinutes} min read</span>
        </div>
        <div className="flex items-center gap-1.5 font-mono">
          <FileText className="h-3 w-3 text-emerald-500" />
          <span>{stats.words.toLocaleString()} words</span>
        </div>
      </div>

      {/* Headings Navigator Tree */}
      <div className={cn("flex-1 overflow-y-auto p-2 space-y-0.5 text-xs", !panelOpen && "hidden")}>
        {headings.length === 0 ? (
          <div className="p-4 text-center text-xs text-muted-foreground">
            <p>No headings generated yet.</p>
          </div>
        ) : (
          headings.map((h, idx) => {
            const isActive = activeHeadingId === h.id;
            return (
              <button
                key={`${h.id}-${idx}`}
                onClick={() => scrollToHeading(h.id)}
                className={cn(
                  "w-full text-left rounded-lg py-1.5 px-2 flex items-center gap-1.5 transition-colors group",
                  h.level === 1 && "font-semibold text-foreground text-xs",
                  h.level === 2 && "pl-4 text-muted-foreground hover:text-foreground text-[11.5px]",
                  h.level === 3 && "pl-6 text-muted-foreground/80 hover:text-foreground text-[11px]",
                  isActive
                    ? "bg-primary/10 text-primary font-medium border-l-2 border-primary rounded-l-none"
                    : "hover:bg-muted/60"
                )}
                title={h.text}
              >
                <Hash className={cn(
                  "shrink-0",
                  h.level === 1 ? "h-3.5 w-3.5 text-primary/70" : "h-2.5 w-2.5 opacity-40 group-hover:opacity-100"
                )} />
                <span className="truncate flex-1">{h.text}</span>
                <ChevronRight className="h-3 w-3 opacity-0 group-hover:opacity-60 transition-opacity shrink-0 ml-auto" />
              </button>
            );
          })
        )}
      </div>
    </aside>
  );
}