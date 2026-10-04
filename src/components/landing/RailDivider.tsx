import * as React from "react";
import { cn } from "@/lib/utils";

interface RailDividerProps {
  className?: string;
}

/**
 * Zain's Blueprint RailDivider:
 * - 1px dashed rule between sections
 * - 10px square nodes where the horizontal rule meets the vertical rails
 */
export function RailDivider({ className }: RailDividerProps) {
  return (
    <div className={cn("relative w-full my-8 md:my-14 pointer-events-none select-none", className)}>
      {/* Dashed Horizontal Hairline */}
      <div className="w-full border-t border-dashed border-slate-300/80 dark:border-white/[0.09]" />

      {/* Left Rail Intersection Square (10px) */}
      <div
        className="hidden md:block absolute -top-[5px] w-2.5 h-2.5 bg-background border border-slate-300 dark:border-white/20 rounded-[1px]"
        style={{ left: "-5px" }}
        aria-hidden="true"
      />

      {/* Right Rail Intersection Square (10px) */}
      <div
        className="hidden md:block absolute -top-[5px] w-2.5 h-2.5 bg-background border border-slate-300 dark:border-white/20 rounded-[1px]"
        style={{ right: "-5px" }}
        aria-hidden="true"
      />
    </div>
  );
}
