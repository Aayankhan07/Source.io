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
  blue: "bg-sky-500/10 text-sky-950 dark:bg-sky-500/20 dark:text-sky-200 border-sky-500/30 font-semibold",
  darkBlue: "bg-slate-900/10 text-slate-900 dark:bg-white/10 dark:text-white border-slate-900/20 dark:border-white/20 font-semibold",
  cyan: "bg-cyan-500/10 text-cyan-950 dark:bg-cyan-500/20 dark:text-cyan-200 border-cyan-500/30 font-semibold",
  amber: "bg-amber-500/10 text-amber-950 dark:bg-amber-500/20 dark:text-amber-200 border-amber-500/30 font-medium",
  slate: "bg-slate-100 text-slate-900 dark:bg-white/[0.08] dark:text-slate-100 border-slate-300 dark:border-white/15 font-medium",
  emerald: "bg-emerald-500/10 text-emerald-950 dark:bg-emerald-500/20 dark:text-emerald-200 border-emerald-500/30 font-medium",
  violet: "bg-violet-500/10 text-violet-950 dark:bg-violet-500/20 dark:text-violet-200 border-violet-500/30 font-medium",
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
    <motion.div
      variants={revealStagger}
      initial="hidden"
      whileInView="show"
      viewport={VIEWPORT}
      className={cn(
        "flex flex-col mb-10 md:mb-14",
        isCentered ? "items-center text-center mx-auto" : "items-start text-left",
        className
      )}
    >
      {/* 1. Tinted Chapter Badge */}
      {badge && (
        <motion.div variants={reveal} className="mb-3.5">
          <span
            className={cn(
              "inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[12px] font-medium leading-[18px] border shadow-xs transition-colors",
              badgeToneStyles[badgeTone]
            )}
          >
            {badgeIcon && <span className="size-3.5 shrink-0 text-current">{badgeIcon}</span>}
            {badge}
          </span>
        </motion.div>
      )}

      {/* 2. Two-Tone Headline */}
      <motion.h2
        variants={reveal}
        className="text-[clamp(26px,3vw,40px)] font-bold tracking-[-0.02em] leading-[1.14] text-slate-900 dark:text-white font-sans"
      >
        <span>{line1}</span>
        {line2 && (
          <>
            {" "}
            <span className="text-slate-600 dark:text-slate-300 font-normal">{line2}</span>
          </>
        )}
      </motion.h2>

      {/* 3. Supporting Description */}
      {description && (
        <motion.p
          variants={reveal}
          className={cn(
            "mt-3.5 text-[15.5px] leading-[1.7] text-slate-700 dark:text-slate-300 font-normal",
            compact ? "max-w-[760px]" : "max-w-[520px]"
          )}
        >
          {description}
        </motion.p>
      )}
    </motion.div>
  );
}
