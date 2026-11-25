"use client";

import { Menu } from "lucide-react";
import { TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DailyQuotaPill } from "@/components/common/DailyQuotaPill";
import type { TabId } from "./types";

export interface WorkspaceTab {
  id: TabId;
  label: string;
  count?: number;
}

/**
 * Workspace tab bar. Must be rendered inside the shell's Radix <Tabs> root, which provides
 * role="tablist"/"tab", aria-selected, aria-controls and arrow-key navigation.
 */
export function WorkspaceHeader({
  tabs,
  documentTitle,
  onOpenMobileNav,
}: {
  tabs: WorkspaceTab[];
  documentTitle: string;
  onOpenMobileNav?: () => void;
}) {
  return (
    <div className="px-4 sm:px-8 pt-4 pb-2.5 flex items-center justify-center relative shrink-0 z-10 select-none no-print">
      {onOpenMobileNav && (
        <button
          type="button"
          className="md:hidden absolute left-4 size-9 rounded-full flex items-center justify-center text-muted-foreground hover:text-foreground bg-card/90 border border-border shrink-0 cursor-pointer shadow-xs"
          onClick={onOpenMobileNav}
          aria-label="Open navigation"
        >
          <Menu className="size-4" aria-hidden="true" />
        </button>
      )}

      <TabsList
        aria-label={`Study modes for ${documentTitle}`}
        className="h-auto justify-start gap-1 p-1 sm:p-1.5 rounded-full bg-card/95 backdrop-blur-md border border-border shadow-[0_2px_16px_rgba(0,0,0,0.04)] overflow-x-auto scrollbar-none max-w-full"
      >
        {tabs.map((t) => (
          <TabsTrigger
            key={t.id}
            value={t.id}
            className="h-9 px-3.5 sm:px-5 rounded-full text-xs sm:text-sm font-semibold transition-all duration-200 shrink-0 gap-2 cursor-pointer select-none text-muted-foreground hover:text-foreground hover:bg-muted data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-xs data-[state=active]:hover:bg-primary group"
          >
            <span>{t.label}</span>
            {t.count !== undefined && t.count > 0 && (
              <span className="text-xs px-1.5 py-0.5 rounded-full font-mono font-bold leading-none bg-muted text-muted-foreground group-data-[state=active]:bg-primary-foreground/20 group-data-[state=active]:text-primary-foreground">
                {t.count}
              </span>
            )}
          </TabsTrigger>
        ))}
      </TabsList>

      <div className="hidden sm:flex absolute right-4 sm:right-8 top-1/2 -translate-y-1/2 items-center">
        <DailyQuotaPill />
      </div>
    </div>
  );
}
