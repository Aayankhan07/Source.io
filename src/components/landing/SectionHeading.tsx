"use client";

import * as React from "react";
import { motion } from "motion/react";
import { cn } from "@/lib/utils";
import { reveal, revealStagger, VIEWPORT } from "./motion";

export type BadgeTone = "cyan" | "amber" | "slate";

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
  cyan: "bg-cyan-500/10 text-cyan-800 dark:text-cyan-300 border-cyan-500/20",
  amber: "bg-amber-500/10 text-amber-800 dark:text-amber-300 border-amber-500/20",
  slate: "bg-slate-100 text-slate-800 dark:bg-white/[0.06] dark:text-slate-200 border-slate-200 dark:border-white/10",
  emerald: "bg-cyan-500/10 text-cyan-800 dark:text-cyan-300 border-cyan-500/20",
  violet: "bg-amber-500/10 text-amber-800 dark:text-amber-300 border-amber-500/20",
};

export function SectionHeading({
  badge,
  badgeTone = "cyan",
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
        className="text-[clamp(26px,3vw,40px)] font-bold tracking-[-0.02em] leading-[1.12] text-foreground font-sans"
      >
        <span>{line1}</span>
        {line2 && (
          <>
            {" "}
            <span className="text-[#6F7988] dark:text-slate-400 font-normal">{line2}</span>
          </>
        )}
      </motion.h2>

      {/* 3. Supporting Description */}
      {description && (
        <motion.p
          variants={reveal}
          className={cn(
            "mt-3.5 text-[15.5px] leading-[1.7] text-muted-foreground",
            compact ? "max-w-[760px]" : "max-w-[520px]"
          )}
        >
          {description}
        </motion.p>
      )}
    </motion.div>
  );
}
