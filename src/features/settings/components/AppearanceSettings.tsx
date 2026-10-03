"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
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
      <Card className="rounded-2xl border-border/80 bg-card shadow-xs">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <Sun className="h-4 w-4 text-primary" />
            <CardTitle className="text-sm font-semibold">Color Theme</CardTitle>
          </div>
          <CardDescription className="text-xs">
            Choose your preferred workspace brightness and color mode.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {themes.map((t) => {
              const Icon = t.icon;
              const isSelected = (theme || settings.theme) === t.value;
              return (
                <button
                  key={t.value}
                  onClick={() => handleThemeChange(t.value)}
                  className={cn(
                    "p-3.5 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between",
                    isSelected
                      ? "border-primary bg-primary/5 text-foreground ring-1 ring-primary/30"
                      : "border-border/70 bg-background text-muted-foreground hover:text-foreground hover:bg-muted/40"
                  )}
                >
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <div className="w-7 h-7 rounded-lg bg-muted flex items-center justify-center">
                        <Icon className="h-4 w-4 text-foreground" />
                      </div>
                      {isSelected && <Check className="h-3.5 w-3.5 text-primary" />}
                    </div>
                    <span className={cn("text-xs font-semibold block pt-1", isSelected && "text-primary")}>
                      {t.label}
                    </span>
                    <p className="text-[11px] text-muted-foreground">{t.desc}</p>
                  </div>
                </button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* 2. Reading Speed Calibrator */}
      <Card className="rounded-2xl border-border/80 bg-card shadow-xs">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <Gauge className="h-4 w-4 text-primary" />
            <CardTitle className="text-sm font-semibold">Reading Time Calculation Benchmark</CardTitle>
          </div>
          <CardDescription className="text-xs">
            Calibrates the estimated reading time ("X min read") displayed in the document outline and header.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {wpmPresets.map((preset) => {
              const isSelected = settings.readingTargetWpm === preset.wpm;
              return (
                <button
                  key={preset.wpm}
                  onClick={() => updateSettings({ readingTargetWpm: preset.wpm })}
                  className={cn(
                    "p-3.5 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between",
                    isSelected
                      ? "border-primary bg-primary/5 text-foreground ring-1 ring-primary/30"
                      : "border-border/70 bg-background text-muted-foreground hover:text-foreground hover:bg-muted/40"
                  )}
                >
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <span className={cn("text-xs font-semibold block", isSelected && "text-primary")}>
                        {preset.label}
                      </span>
                      {isSelected && <Check className="h-3.5 w-3.5 text-primary" />}
                    </div>
                    <p className="text-[11px] text-muted-foreground leading-snug">{preset.desc}</p>
                  </div>
                </button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* 3. Accent Tone */}
      <Card className="rounded-2xl border-border/80 bg-card shadow-xs">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <Palette className="h-4 w-4 text-primary" />
            <CardTitle className="text-sm font-semibold">Interface Accent Tint</CardTitle>
          </div>
          <CardDescription className="text-xs">
            Subtle highlight color used for badges, active tabs, and focus indicators.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {accents.map((acc) => {
              const isSelected = settings.accentColor === acc.value;
              return (
                <button
                  key={acc.value}
                  onClick={() => updateSettings({ accentColor: acc.value })}
                  className={cn(
                    "p-3 rounded-xl border text-left transition-all cursor-pointer flex items-center gap-2.5",
                    isSelected
                      ? "border-primary bg-primary/5 text-foreground ring-1 ring-primary/30"
                      : "border-border/70 bg-background text-muted-foreground hover:text-foreground hover:bg-muted/40"
                  )}
                >
                  <div className={cn("w-4 h-4 rounded-full shrink-0 shadow-2xs", acc.colorClass)} />
                  <span className="text-xs font-medium truncate">{acc.label}</span>
                </button>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
