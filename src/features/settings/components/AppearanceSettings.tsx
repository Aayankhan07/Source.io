"use client";

import { Sun, Moon, Laptop, Palette, Gauge, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { useSettings } from "../context/SettingsContext";
import { useTheme } from "@/hooks/use-theme";
import { AccentColor, AppTheme } from "../types";

export default function AppearanceSettings() {
  const { settings, updateSettings } = useSettings();
  const { theme, setTheme } = useTheme();

  const handleThemeChange = (newTheme: AppTheme) => {
    if (newTheme === "system") {
      const isDark = typeof window !== "undefined" && window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches;
      setTheme(isDark ? "dark" : "light");
    } else {
      setTheme(newTheme);
    }
    updateSettings({ theme: newTheme });
  };

  const themes: { value: AppTheme; label: string; icon: typeof Sun; desc: string }[] = [
    { value: "light", label: "Light Mode", icon: Sun, desc: "Crisp stark paper surface" },
    { value: "dark", label: "Dark Mode", icon: Moon, desc: "Deep charcoal reading contrast" },
    { value: "system", label: "System Auto", icon: Laptop, desc: "Synchronize with OS theme" },
  ];

  const wpmPresets = [
    { wpm: 180, label: "Studious (180 WPM)", desc: "For dense academic texts with heavy math" },
    { wpm: 200, label: "Standard (200 WPM)", desc: "Average adult non-fiction reading speed" },
    { wpm: 250, label: "Skim / Speed (250 WPM)", desc: "For fast scanning and revision" },
  ];

  const accents: { value: AccentColor; label: string; colorClass: string }[] = [
    { value: "slate", label: "Monochrome Slate", colorClass: "bg-slate-900 dark:bg-white" },
    { value: "sky", label: "Electric Sky", colorClass: "bg-sky-500" },
    { value: "emerald", label: "Emerald Focus", colorClass: "bg-emerald-500" },
    { value: "violet", label: "Deep Violet", colorClass: "bg-violet-500" },
  ];

  return (
    <div className="space-y-6">
      {/* 1. Theme Mode */}
      <div className="rounded-[28px] bg-white dark:bg-slate-900/90 border border-black/[0.04] dark:border-white/10 shadow-tactile-card p-6 sm:p-7 space-y-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="p-1 rounded-lg bg-amber-100 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300">
              <Sun className="size-4" />
            </span>
            <h3 className="text-base sm:text-lg font-bold font-display text-slate-900 dark:text-white">
              Color Theme
            </h3>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Choose your preferred workspace brightness and color mode.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {themes.map((t) => {
            const Icon = t.icon;
            const isSelected = (theme || settings.theme) === t.value;
            return (
              <button
                key={t.value}
                onClick={() => handleThemeChange(t.value)}
                className={cn(
                  "p-4 rounded-[20px] border text-left transition-all cursor-pointer flex flex-col justify-between select-none",
                  isSelected
                    ? "bg-[#1E232A] text-white dark:bg-white dark:text-slate-950 shadow-tactile-pill border-transparent scale-[1.01]"
                    : "bg-slate-50/70 dark:bg-white/[0.03] border-slate-200/80 dark:border-white/10 text-slate-800 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-white/5"
                )}
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className={cn(
                      "size-8 rounded-xl flex items-center justify-center",
                      isSelected ? "bg-white/20 dark:bg-slate-950/10 text-white dark:text-slate-950" : "bg-slate-100 dark:bg-white/10 text-slate-700 dark:text-slate-300"
                    )}>
                      <Icon className="size-4" />
                    </div>
                    {isSelected && <Check className="size-3.5 text-amber-400 dark:text-amber-600 stroke-[2.5]" />}
                  </div>
                  <span className={cn("text-xs font-bold block pt-1", isSelected ? "text-white dark:text-slate-950" : "text-slate-900 dark:text-white")}>
                    {t.label}
                  </span>
                  <p className={cn("text-[11px] leading-relaxed", isSelected ? "text-slate-300 dark:text-slate-600" : "text-slate-500 dark:text-slate-400")}>
                    {t.desc}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* 2. Reading Speed Calibrator */}
      <div className="rounded-[28px] bg-white dark:bg-slate-900/90 border border-black/[0.04] dark:border-white/10 shadow-tactile-card p-6 sm:p-7 space-y-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="p-1 rounded-lg bg-teal-100 dark:bg-teal-950/50 text-teal-700 dark:text-teal-300">
              <Gauge className="size-4" />
            </span>
            <h3 className="text-base sm:text-lg font-bold font-display text-slate-900 dark:text-white">
              Reading Time Calculation Benchmark
            </h3>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Calibrates the estimated reading time ("X min read") displayed in the document outline and header.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {wpmPresets.map((preset) => {
            const isSelected = settings.readingTargetWpm === preset.wpm;
            return (
              <button
                key={preset.wpm}
                onClick={() => updateSettings({ readingTargetWpm: preset.wpm })}
                className={cn(
                  "p-4 rounded-[20px] border text-left transition-all cursor-pointer flex flex-col justify-between select-none",
                  isSelected
                    ? "bg-[#1E232A] text-white dark:bg-white dark:text-slate-950 shadow-tactile-pill border-transparent scale-[1.01]"
                    : "bg-slate-50/70 dark:bg-white/[0.03] border-slate-200/80 dark:border-white/10 text-slate-800 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-white/5"
                )}
              >
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <span className={cn("text-xs font-bold block", isSelected ? "text-white dark:text-slate-950" : "text-slate-900 dark:text-white")}>
                      {preset.label}
                    </span>
                    {isSelected && <Check className="size-3.5 text-amber-400 dark:text-amber-600 stroke-[2.5]" />}
                  </div>
                  <p className={cn("text-[11px] leading-relaxed", isSelected ? "text-slate-300 dark:text-slate-600" : "text-slate-500 dark:text-slate-400")}>
                    {preset.desc}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* 3. Accent Tone */}
      <div className="rounded-[28px] bg-white dark:bg-slate-900/90 border border-black/[0.04] dark:border-white/10 shadow-tactile-card p-6 sm:p-7 space-y-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="p-1 rounded-lg bg-violet-100 dark:bg-violet-950/50 text-violet-700 dark:text-violet-300">
              <Palette className="size-4" />
            </span>
            <h3 className="text-base sm:text-lg font-bold font-display text-slate-900 dark:text-white">
              Interface Accent Tint
            </h3>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Subtle highlight color used for badges, active tabs, and focus indicators.
          </p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {accents.map((acc) => {
            const isSelected = settings.accentColor === acc.value;
            return (
              <button
                key={acc.value}
                onClick={() => updateSettings({ accentColor: acc.value })}
                className={cn(
                  "p-3 rounded-[18px] border text-left transition-all cursor-pointer flex items-center gap-2.5 select-none",
                  isSelected
                    ? "bg-[#1E232A] text-white dark:bg-white dark:text-slate-950 shadow-tactile-pill border-transparent font-bold"
                    : "bg-slate-50/70 dark:bg-white/[0.03] border-slate-200/80 dark:border-white/10 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/5"
                )}
              >
                <div className={cn("size-3.5 rounded-full shrink-0 shadow-2xs", acc.colorClass)} />
                <span className="text-xs font-semibold truncate">{acc.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
