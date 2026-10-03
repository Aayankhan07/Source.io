"use client";

import { useMemo, useState, useEffect, useRef, useCallback } from "react";
import {
  ListTree,
  Search,
  X,
  ChevronRight,
  ChevronDown,
  Clock,
  FileText,
  ChevronsUpDown,
  PanelLeftClose,
  PanelLeftOpen,
  BookOpen,
  Hash,
  Minus,
  List,
  Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export interface OutlineHeading {
  id: string;
  text: string;
  level: number;
}

export interface ParsedHeading extends OutlineHeading {
  emoji?: string;
  number?: string;
  cleanTitle: string;
  index: number;
}

// Regex to extract leading emoji if present
const EMOJI_REGEX = /^(\p{Extended_Pictographic}|\uD83C[\uDF00-\uDFFF]|\uD83D[\uDC00-\uDFFF]|\uD83E[\uDD00-\uDFFF])\s*/u;

// Regex to extract leading number if present (e.g., "1.", "1.2", "20.")
const NUMBER_REGEX = /^(\d+(\.\d+)*)\.?\s+/;

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

export function parseHeading(h: OutlineHeading, index: number): ParsedHeading {
  let text = h.text.trim();
  let emoji: string | undefined;
  let number: string | undefined;

  // Check for leading emoji
  const emojiMatch = text.match(EMOJI_REGEX);
  if (emojiMatch) {
    emoji = emojiMatch[1];
    text = text.slice(emojiMatch[0].length).trim();
  }

  // Check for leading number
  const numMatch = text.match(NUMBER_REGEX);
  if (numMatch) {
    const rawNum = numMatch[1];
    // Pad single digits if pure number for aligned monospace layout (e.g. "1" -> "01")
    number = /^\d+$/.test(rawNum) && rawNum.length === 1 ? `0${rawNum}` : rawNum;
    text = text.slice(numMatch[0].length).trim();
  }

  return {
    ...h,
    emoji,
    number,
    cleanTitle: text || h.text,
    index,
  };
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
  activeHeadingId: externalActiveId,
  onSelectHeading,
  className,
  inlineChips = false,
  slimRail = false,
  isRetracted = false,
  onToggleRetract,
  maxChips = 8,
}: WorkspaceOutlineProps) {
  const rawHeadings = useMemo(() => extractHeadings(markdown), [markdown]);
  const parsedHeadings = useMemo(
    () => rawHeadings.map((h, idx) => parseHeading(h, idx)),
    [rawHeadings]
  );

  // Search & filter state
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Internal active heading tracking with scroll-spy fallback
  const [internalActiveId, setInternalActiveId] = useState<string | null>(null);
  const activeId = externalActiveId ?? internalActiveId;

  // Collapsed sections tracking (for collapsible chapters)
  const [collapsedSections, setCollapsedSections] = useState<Set<string>>(new Set());

  // Refs for auto-scrolling active item into view
  const activeItemRef = useRef<HTMLButtonElement>(null);
  const listContainerRef = useRef<HTMLDivElement>(null);

  const stats = useMemo(() => {
    if (!markdown) return { words: 0, readMinutes: 0 };
    const words = markdown.trim().split(/\s+/).filter(Boolean).length;
    const readMinutes = Math.max(1, Math.ceil(words / 200));
    return { words, readMinutes };
  }, [markdown]);

  // Current active index for progress bar
  const activeIndex = useMemo(() => {
    if (!activeId) return 0;
    const idx = parsedHeadings.findIndex((h) => h.id === activeId);
    return idx >= 0 ? idx : 0;
  }, [parsedHeadings, activeId]);

  const readingProgress = useMemo(() => {
    if (parsedHeadings.length <= 1) return 0;
    return Math.round(((activeIndex + 1) / parsedHeadings.length) * 100);
  }, [activeIndex, parsedHeadings.length]);

  // Scroll spy: observe headings in main content
  useEffect(() => {
    if (parsedHeadings.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        // Find the topmost intersecting heading
        const visible = entries.filter((e) => e.isIntersecting);
        if (visible.length > 0) {
          const first = visible[0];
          setInternalActiveId(first.target.id);
          onSelectHeading?.(first.target.id);
        }
      },
      {
        rootMargin: "-90px 0px -70% 0px",
        threshold: 0,
      }
    );

    const observedElements: Element[] = [];
    parsedHeadings.forEach((h) => {
      const el = document.getElementById(h.id);
      if (el) {
        observer.observe(el);
        observedElements.push(el);
      }
    });

    return () => {
      observedElements.forEach((el) => observer.unobserve(el));
      observer.disconnect();
    };
  }, [parsedHeadings, onSelectHeading]);

  // Smoothly auto-scroll active heading inside sidebar list
  useEffect(() => {
    if (!activeItemRef.current || !listContainerRef.current) return;
    const container = listContainerRef.current;
    const element = activeItemRef.current;
    const containerRect = container.getBoundingClientRect();
    const elemRect = element.getBoundingClientRect();

    if (elemRect.top < containerRect.top || elemRect.bottom > containerRect.bottom) {
      element.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }
  }, [activeId]);

  const scrollToHeading = useCallback(
    (id: string) => {
      setInternalActiveId(id);
      onSelectHeading?.(id);
      const element = document.getElementById(id);
      if (element) {
        element.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    },
    [onSelectHeading]
  );

  const toggleSectionCollapse = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setCollapsedSections((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleAllCollapse = () => {
    const level1And2 = parsedHeadings.filter((h) => h.level <= 2).map((h) => h.id);
    if (collapsedSections.size > 0) {
      setCollapsedSections(new Set());
    } else {
      setCollapsedSections(new Set(level1And2));
    }
  };

  // Filtered headings based on search query
  const filteredHeadings = useMemo(() => {
    if (!searchQuery.trim()) return parsedHeadings;
    const q = searchQuery.toLowerCase().trim();
    return parsedHeadings.filter(
      (h) =>
        h.text.toLowerCase().includes(q) ||
        h.cleanTitle.toLowerCase().includes(q) ||
        (h.number && h.number.includes(q))
    );
  }, [parsedHeadings, searchQuery]);

  // Determine visibility considering collapsed parent sections
  const visibleHeadings = useMemo(() => {
    if (searchQuery.trim()) return filteredHeadings; // Show all matches during search

    const visible: ParsedHeading[] = [];
    let currentCollapsedLevel: number | null = null;

    for (const h of parsedHeadings) {
      if (currentCollapsedLevel !== null) {
        if (h.level > currentCollapsedLevel) {
          // Under a collapsed parent: skip
          continue;
        } else {
          currentCollapsedLevel = null;
        }
      }

      visible.push(h);

      if (collapsedSections.has(h.id)) {
        currentCollapsedLevel = h.level;
      }
    }
    return visible;
  }, [parsedHeadings, filteredHeadings, collapsedSections, searchQuery]);

  // Top-level chip headings (H1/H2 only)
  const chipHeadings = useMemo(
    () => parsedHeadings.filter((h) => h.level <= 2).slice(0, maxChips),
    [parsedHeadings, maxChips]
  );

  /* ========================================================================= */
  /* 1. INLINE CHIPS VIEW (Horizontal scrollable chips for Notes view)         */
  /* ========================================================================= */
  if (inlineChips) {
    return (
      <div className={cn("flex items-center gap-1.5 overflow-x-auto pb-1 pr-4 -mr-4 scrollbar-none", className)}>
        {chipHeadings.map((h) => {
          const isActive = activeId === h.id;
          return (
            <button
              key={h.id}
              onClick={() => scrollToHeading(h.id)}
              className={cn(
                "shrink-0 inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium transition-all cursor-pointer",
                isActive
                  ? "bg-primary text-primary-foreground shadow-xs ring-1 ring-primary/30"
                  : "bg-surface-2 text-muted-foreground hover:text-foreground hover:bg-muted border border-border/60"
              )}
              title={h.text}
            >
              {h.emoji ? (
                <span className="text-xs">{h.emoji}</span>
              ) : h.number ? (
                <span className="font-mono text-[10px] opacity-70">{h.number}</span>
              ) : (
                <Hash className={cn("h-2.5 w-2.5", isActive ? "text-current" : "opacity-60")} />
              )}
              <span className="truncate max-w-[130px]">{h.cleanTitle}</span>
            </button>
          );
        })}
        {parsedHeadings.length > maxChips && (
          <button
            onClick={onToggleRetract}
            className="shrink-0 inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-surface-2 text-muted-foreground hover:text-foreground hover:bg-muted border border-border/60 cursor-pointer"
            title="Open full outline"
          >
            <List className="h-3 w-3" />
            <span>+{parsedHeadings.length - maxChips}</span>
          </button>
        )}
      </div>
    );
  }

  /* ========================================================================= */
  /* 2. RETRACTED SLIM RAIL (48px Bespoke Reading Spine)                       */
  /* ========================================================================= */
  if (slimRail || isRetracted) {
    return (
      <TooltipProvider delayDuration={150}>
        <aside
          className={cn(
            "flex flex-col h-full w-12 bg-card/60 backdrop-blur-md border-r border-border/70 text-foreground items-center shrink-0 select-none py-2.5",
            className
          )}
        >
          {/* Expand Toggle */}
          {onToggleRetract && (
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={onToggleRetract}
                  className="w-8 h-8 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/80 flex items-center justify-center transition-all cursor-pointer active:scale-95"
                  aria-label="Expand outline"
                >
                  <PanelLeftOpen className="h-4 w-4" />
                </button>
              </TooltipTrigger>
              <TooltipContent side="right" sideOffset={10}>
                <span className="text-xs font-medium">Expand outline</span>
              </TooltipContent>
            </Tooltip>
          )}

          {/* Vertical Stepper Track Line */}
          <div className="relative flex-1 w-full flex flex-col items-center py-3 overflow-y-auto scrollbar-none">
            {/* Guide line down center */}
            <div className="absolute top-4 bottom-4 left-1/2 -translate-x-1/2 w-px bg-border/40 pointer-events-none" />

            <div className="flex flex-col items-center gap-2.5 z-10 w-full px-1">
              {parsedHeadings.map((h, idx) => {
                const isActive = activeId === h.id;
                return (
                  <Tooltip key={h.id}>
                    <TooltipTrigger asChild>
                      <button
                        onClick={() => scrollToHeading(h.id)}
                        className={cn(
                          "group relative flex items-center justify-center transition-all duration-200 cursor-pointer",
                          isActive ? "scale-110" : "hover:scale-115"
                        )}
                        aria-label={`Jump to section: ${h.text}`}
                      >
                        {isActive ? (
                          <div className="w-5 h-5 rounded-full bg-primary text-primary-foreground shadow-xs flex items-center justify-center ring-2 ring-primary/20">
                            <span className="font-mono text-[9px] font-bold">
                              {h.number ? h.number : idx + 1}
                            </span>
                          </div>
                        ) : h.level === 1 ? (
                          <div className="w-3.5 h-3.5 rounded-sm bg-muted-foreground/30 border border-border group-hover:bg-foreground/70 transition-colors" />
                        ) : (
                          <div
                            className={cn(
                              "rounded-full transition-all",
                              h.level === 2
                                ? "w-2.5 h-2.5 bg-muted-foreground/40 group-hover:bg-foreground/80"
                                : "w-1.5 h-1.5 bg-muted-foreground/25 group-hover:bg-foreground/60"
                            )}
                          />
                        )}
                      </button>
                    </TooltipTrigger>
                    <TooltipContent side="right" sideOffset={12} className="max-w-xs">
                      <div className="flex items-center gap-1.5 text-xs">
                        {h.emoji && <span>{h.emoji}</span>}
                        {h.number && (
                          <span className="font-mono text-[10px] text-muted-foreground font-semibold">
                            {h.number}.
                          </span>
                        )}
                        <span className="font-medium text-foreground">{h.cleanTitle}</span>
                      </div>
                    </TooltipContent>
                  </Tooltip>
                );
              })}

              {parsedHeadings.length === 0 && (
                <div className="w-6 h-6 rounded-full bg-muted/60 flex items-center justify-center text-muted-foreground">
                  <Minus className="h-3 w-3" />
                </div>
              )}
            </div>
          </div>

          {/* Bottom Progress Marker */}
          <div className="pt-2 border-t border-border/40 w-full flex flex-col items-center">
            <span
              className="text-[9.5px] font-mono text-muted-foreground tracking-tighter"
              title={`${readingProgress}% read`}
            >
              {readingProgress}%
            </span>
          </div>
        </aside>
      </TooltipProvider>
    );
  }

  /* ========================================================================= */
  /* 3. FULL EXPANDED OUTLINE (~240px Clean Linear/Notion Style)               */
  /* ========================================================================= */
  return (
    <aside
      className={cn(
        "flex flex-col h-full bg-card/60 backdrop-blur-md border-r border-border/70 text-foreground overflow-hidden select-none",
        className
      )}
    >
      {/* 3.1 Sleek Header Bar */}
      <div className="px-3.5 py-3 border-b border-border/70 flex items-center justify-between shrink-0 gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-5 h-5 rounded-md bg-primary/10 text-primary flex items-center justify-center shrink-0">
            <ListTree className="h-3.5 w-3.5" />
          </div>
          <span className="text-xs font-semibold tracking-tight text-foreground font-display truncate">
            Outline
          </span>
          <span className="text-[10px] font-mono px-1.5 py-0.5 rounded-full bg-muted text-muted-foreground border border-border/60 shrink-0">
            {parsedHeadings.length}
          </span>
        </div>

        {/* Header Action Controls */}
        <div className="flex items-center gap-0.5 shrink-0">
          {/* Search Toggle */}
          <button
            onClick={() => {
              setSearchOpen(!searchOpen);
              if (!searchOpen) {
                setTimeout(() => searchInputRef.current?.focus(), 50);
              } else {
                setSearchQuery("");
              }
            }}
            className={cn(
              "w-6 h-6 rounded-md flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted/80 transition-colors cursor-pointer",
              searchOpen && "bg-muted text-foreground"
            )}
            title="Search headings"
            aria-label="Search headings"
          >
            <Search className="h-3.5 w-3.5" />
          </button>

          {/* Expand/Collapse All Chapters */}
          {parsedHeadings.some((h) => h.level <= 2) && (
            <button
              onClick={toggleAllCollapse}
              className="w-6 h-6 rounded-md flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted/80 transition-colors cursor-pointer"
              title={collapsedSections.size > 0 ? "Expand all chapters" : "Collapse all chapters"}
              aria-label="Toggle all chapters"
            >
              <ChevronsUpDown className="h-3.5 w-3.5" />
            </button>
          )}

          {/* Retract into slim rail */}
          {onToggleRetract && (
            <button
              onClick={onToggleRetract}
              className="w-6 h-6 rounded-md flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted/80 transition-colors cursor-pointer"
              title="Retract into slim rail"
              aria-label="Retract outline"
            >
              <PanelLeftClose className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* 3.2 Search Filter Box (Collapsible) */}
      {searchOpen && (
        <div className="p-2 border-b border-border/60 bg-muted/30 animate-fade-in shrink-0">
          <div className="relative flex items-center">
            <Search className="h-3.5 w-3.5 text-muted-foreground absolute left-2 pointer-events-none" />
            <input
              ref={searchInputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Filter sections..."
              className="w-full bg-background border border-border/80 rounded-lg pl-7 pr-7 py-1 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary/40 font-sans"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-2 text-muted-foreground hover:text-foreground cursor-pointer"
                title="Clear search"
              >
                <X className="h-3 w-3" />
              </button>
            )}
          </div>
          {searchQuery && (
            <div className="px-1 pt-1.5 flex items-center justify-between text-[10.5px] text-muted-foreground font-mono">
              <span>Matches:</span>
              <span>{filteredHeadings.length} found</span>
            </div>
          )}
        </div>
      )}

      {/* 3.3 Reading Metadata & Progress Track */}
      <div className="border-b border-border/50 shrink-0">
        <div className="px-3.5 py-2 flex items-center justify-between text-[11px] text-muted-foreground font-mono bg-muted/15">
          <div className="flex items-center gap-1.5">
            <Clock className="h-3 w-3 text-muted-foreground/70" />
            <span>{stats.readMinutes} min read</span>
          </div>
          <div className="flex items-center gap-1.5">
            <FileText className="h-3 w-3 text-muted-foreground/70" />
            <span>{stats.words.toLocaleString()} words</span>
          </div>
        </div>

        {/* 2px Micro Reading Progress Bar */}
        <div className="w-full h-[2px] bg-muted/40 relative overflow-hidden">
          <div
            className="h-full bg-primary/70 transition-all duration-300 ease-out"
            style={{ width: `${readingProgress}%` }}
          />
        </div>
      </div>

      {/* 3.4 Hierarchical Headings Tree */}
      <div
        ref={listContainerRef}
        className="flex-1 overflow-y-auto px-2 py-2.5 space-y-0.5 text-xs scrollbar-thin"
      >
        {visibleHeadings.length === 0 ? (
          <div className="py-8 px-4 text-center space-y-1.5">
            <p className="text-xs text-muted-foreground font-medium">
              {searchQuery ? "No matching sections found" : "No sections in this document"}
            </p>
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="text-[11px] text-primary hover:underline cursor-pointer"
              >
                Clear filter
              </button>
            )}
          </div>
        ) : (
          visibleHeadings.map((h) => {
            const isActive = activeId === h.id;
            const isCollapsed = collapsedSections.has(h.id);
            const hasSubsections =
              h.level <= 2 &&
              parsedHeadings.some(
                (child, cIdx) => cIdx > h.index && child.level > h.level && child.level <= h.level + 1
              );

            return (
              <div
                key={h.id}
                className={cn(
                  "relative group rounded-md transition-colors",
                  h.level === 1 && h.index > 0 && "mt-2 pt-1 border-t border-border/40"
                )}
              >
                <button
                  ref={isActive ? activeItemRef : undefined}
                  onClick={() => scrollToHeading(h.id)}
                  className={cn(
                    "w-full text-left rounded-md py-1.5 pr-2 flex items-center gap-2 transition-all relative cursor-pointer group",
                    // Indentation with guide rail lines
                    h.level === 1 && "pl-2 font-semibold text-foreground text-xs",
                    h.level === 2 && "pl-5 text-muted-foreground hover:text-foreground text-[11.5px]",
                    h.level === 3 && "pl-8 text-muted-foreground/80 hover:text-foreground text-[11px]",
                    // Active Pill Styling
                    isActive
                      ? "bg-primary/10 text-primary font-medium dark:bg-primary/15"
                      : "hover:bg-muted/70 hover:text-foreground text-muted-foreground"
                  )}
                  title={h.text}
                >
                  {/* Subtle active indicator bar */}
                  {isActive && (
                    <div className="absolute left-0.5 top-1.5 bottom-1.5 w-0.5 rounded-full bg-primary" />
                  )}

                  {/* Visual Marker per type: Emoji, Number Badge, or Guide Dot */}
                  {h.emoji ? (
                    <span className="text-xs shrink-0 select-none leading-none">{h.emoji}</span>
                  ) : h.number ? (
                    <span
                      className={cn(
                        "font-mono text-[9.5px] px-1 py-0.2 rounded border font-medium shrink-0 tracking-tight",
                        isActive
                          ? "bg-primary/20 text-primary border-primary/30"
                          : "bg-muted text-muted-foreground border-border/60 group-hover:border-border"
                      )}
                    >
                      {h.number}
                    </span>
                  ) : h.level === 1 ? (
                    <BookOpen
                      className={cn(
                        "h-3 w-3 shrink-0",
                        isActive ? "text-primary" : "text-muted-foreground/70"
                      )}
                    />
                  ) : (
                    <span
                      className={cn(
                        "rounded-full shrink-0 transition-colors",
                        h.level === 2 ? "w-1.5 h-1.5" : "w-1 h-1",
                        isActive
                          ? "bg-primary"
                          : "bg-muted-foreground/40 group-hover:bg-foreground/70"
                      )}
                    />
                  )}

                  {/* Clean Title */}
                  <span className="truncate flex-1 font-sans">{h.cleanTitle}</span>

                  {/* Collapsible toggle for chapters with children */}
                  {hasSubsections && (
                    <span
                      onClick={(e) => toggleSectionCollapse(h.id, e)}
                      className="p-0.5 rounded text-muted-foreground/60 hover:text-foreground hover:bg-muted/80 transition-colors ml-auto shrink-0"
                      title={isCollapsed ? "Expand chapter" : "Collapse chapter"}
                    >
                      {isCollapsed ? (
                        <ChevronRight className="h-3 w-3" />
                      ) : (
                        <ChevronDown className="h-3 w-3" />
                      )}
                    </span>
                  )}
                </button>
              </div>
            );
          })
        )}
      </div>

      {/* 3.5 Bottom Quick Status Footer */}
      <div className="p-2.5 border-t border-border/60 bg-muted/20 flex items-center justify-between text-[10.5px] text-muted-foreground font-mono shrink-0">
        <span className="truncate">
          {activeId ? (
            <span className="text-foreground/90 font-medium">
              § {activeIndex + 1} of {parsedHeadings.length}
            </span>
          ) : (
            <span>Ready</span>
          )}
        </span>
        <span className="shrink-0 font-medium text-foreground/80">{readingProgress}% read</span>
      </div>
    </aside>
  );
}