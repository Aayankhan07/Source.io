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
  blue: "bg-sky-500/10 text-sky-900 border-sky-500/25 font-semibold",
  darkBlue: "bg-sky-500/10 text-sky-900 border-sky-500/25 font-semibold",
  cyan: "bg-sky-500/10 text-sky-900 border-sky-500/25 font-semibold",
  amber: "bg-sky-500/10 text-sky-900 border-sky-500/25 font-semibold",
  slate: "bg-sky-500/10 text-sky-900 border-sky-500/25 font-semibold",
  emerald: "bg-sky-500/10 text-sky-900 border-sky-500/25 font-semibold",
  violet: "bg-sky-500/10 text-sky-900 border-sky-500/25 font-semibold",
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
              "inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[12px] font-semibold leading-[18px] border shadow-xs transition-colors",
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
        className="text-[clamp(26px,3vw,40px)] font-bold tracking-[-0.02em] leading-[1.18] text-slate-900 font-sans text-balance"
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
            "mt-3.5 text-[15.5px] leading-[1.7] text-slate-600 font-normal w-full text-balance",
            compact ? "max-w-2xl" : "max-w-lg"
          )}
        >
          {description}
        </p>
      )}
    </div>
  );
}
