import * as React from "react";
import { cn } from "@/lib/utils";

interface PageRailsProps {
  children: React.ReactNode;
  className?: string;
}

/**
 * Zain's Blueprint PageRails:
 * - 1440px max width centered canvas
 * - 1318px content column bounded by two 1px dashed rails (#dadada light / white/[0.08] dark)
 * - Rails hidden below md; 16px gutter on mobile
 */
export function PageRails({ children, className }: PageRailsProps) {
  return (
    <div className={cn("relative w-full max-w-[1440px] mx-auto overflow-hidden", className)}>
      {/* Left Blueprint Rail */}
      <div
        className="hidden md:block absolute top-0 bottom-0 pointer-events-none z-10 w-0 border-l border-dashed border-slate-300/80"
        style={{
          left: "max(24px, calc(50% - 659px))",
          borderStyle: "dashed",
        }}
        aria-hidden="true"
      />

      {/* Right Blueprint Rail */}
      <div
        className="hidden md:block absolute top-0 bottom-0 pointer-events-none z-10 w-0 border-r border-dashed border-slate-300/80"
        style={{
          right: "max(24px, calc(50% - 659px))",
          borderStyle: "dashed",
        }}
        aria-hidden="true"
      />

      {/* Content Canvas */}
      <div className="relative z-20 w-full max-w-[1318px] mx-auto px-4 sm:px-6 md:px-10 lg:px-12">
        {children}
      </div>
    </div>
  );
}
