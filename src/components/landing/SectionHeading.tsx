"use client";

import * as React from "react";
import { motion } from "motion/react";
import { cn } from "@/lib/utils";
import { reveal, revealStagger, VIEWPORT } from "./motion";

export type BadgeTone = "blue" | "darkBlue" | "cyan" | "amber" | "slate";

interface SectionHeadingProps {
  badge?: string;
  badgeTone?: BadgeTone | "emerald" | "violet";
  badgeIcon?: React.ReactNode;
  line1: string;
  line2?: string;
  description?: string;
  align?: "left" | "center";
  compact?: boolean;
  className?: string;
}

const badgeToneStyles: Record<string, string> = {
  blue: "bg-sky-50 text-sky-700 ring-1 ring-inset ring-sky-600/20 uppercase font-semibold text-xs tracking-wide",
  darkBlue: "bg-sky-50 text-sky-700 ring-1 ring-inset ring-sky-600/20 uppercase font-semibold text-xs tracking-wide",
  cyan: "bg-sky-50 text-sky-700 ring-1 ring-inset ring-sky-600/20 uppercase font-semibold text-xs tracking-wide",
  amber: "bg-sky-50 text-sky-700 ring-1 ring-inset ring-sky-600/20 uppercase font-semibold text-xs tracking-wide",
  slate: "bg-sky-50 text-sky-700 ring-1 ring-inset ring-sky-600/20 uppercase font-semibold text-xs tracking-wide",
  emerald: "bg-sky-50 text-sky-700 ring-1 ring-inset ring-sky-600/20 uppercase font-semibold text-xs tracking-wide",
  violet: "bg-sky-50 text-sky-700 ring-1 ring-inset ring-sky-600/20 uppercase font-semibold text-xs tracking-wide",
};

export function SectionHeading({
  badge,
  badgeTone = "blue",
  badgeIcon,
  line1,
  line2,
  description,
  align = "left",
  compact = false,
  className,
}: SectionHeadingProps) {
  const isCentered = align === "center";

  return (
    <div
      className={cn(
        "flex flex-col mb-10 md:mb-14",
        isCentered ? "items-center text-center mx-auto" : "items-start text-left",
        className
      )}
    >
      {/* 1. Chapter Badge */}
      {badge && (
        <div className="mb-3.5">
          <span
            className={cn(
              "inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold tracking-wide uppercase transition-colors shadow-xs",
              badgeToneStyles[badgeTone] || badgeToneStyles.blue
            )}
          >
            {badgeIcon && <span className="size-3.5 shrink-0 text-current">{badgeIcon}</span>}
            {badge}
          </span>
        </div>
      )}

      {/* 2. Solid High-Contrast Headline */}
      <h2
        className="font-display text-3xl sm:text-4xl font-bold tracking-tight text-slate-950 text-balance leading-[1.18]"
      >
        <span>{line1}</span>
        {line2 && (
          <>
            {" "}
            <span className="text-slate-600 font-normal">{line2}</span>
          </>
        )}
      </h2>

      {/* 3. Supporting Description */}
      {description && (
        <p
          className={cn(
            "mt-3 text-base sm:text-lg text-slate-600 leading-relaxed w-full text-balance",
            compact ? "max-w-2xl" : "max-w-2xl"
          )}
        >
          {description}
        </p>
      )}
    </div>
  );
}
