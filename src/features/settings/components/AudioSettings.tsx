"use client";

import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Mic, Volume2, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { useSettings } from "../context/SettingsContext";
import { PodcastVoiceDuo } from "../types";

export default function AudioSettings() {
  const { settings, updateSettings } = useSettings();

  const voiceDuos: {
    value: PodcastVoiceDuo;
    title: string;
    hosts: string;
    desc: string;
    style: string;
  }[] = [
    {
      value: "chen-marcus",
      title: "Academic & Analytical",
      hosts: "Dr. Sarah Chen & Marcus",
      desc: "Deep-dive explanatory dynamic with balanced pacing and analytical rigor.",
      style: "Default Co-hosts",
    },
    {
      value: "rachel-alex",
      title: "Fast-Paced Tech Interview",
      hosts: "Rachel & Alex",
      desc: "Energetic dialogue focused on real-world engineering intuition and shortcuts.",
      style: "Dynamic",
    },
    {
      value: "emma-daniel",
      title: "Warm & Conversational",
      hosts: "Emma & Daniel",
      desc: "Calm, narrative walkthrough ideal for passive revision and long commutes.",
      style: "Calm Review",
    },
  ];

  const speeds = [1.0, 1.25, 1.5, 1.75, 2.0];

  return (
    <div className="space-y-6">
      {/* 1. Host Voice Selection */}
      <div className="rounded-[28px] bg-white dark:bg-slate-900/90 border border-black/[0.04] dark:border-white/10 shadow-tactile-card p-6 sm:p-7 space-y-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="p-1 rounded-lg bg-pink-100 dark:bg-pink-950/50 text-pink-700 dark:text-pink-300">
              <Mic className="size-4" />
            </span>
            <h3 className="text-base sm:text-lg font-bold font-display text-slate-900 dark:text-white">
              Podcast Host Duo Profiles
            </h3>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Choose the synthetic speech profile and conversational dynamic for the 2-host audio recap.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {voiceDuos.map((duo) => {
            const isSelected = settings.podcastVoiceDuo === duo.value;
            return (
              <button
                key={duo.value}
                onClick={() => updateSettings({ podcastVoiceDuo: duo.value })}
                className={cn(
                  "p-4 rounded-[20px] border text-left transition-all cursor-pointer flex flex-col justify-between select-none",
                  isSelected
                    ? "bg-[#1E232A] text-white dark:bg-white dark:text-slate-950 shadow-tactile-pill border-transparent scale-[1.01]"
                    : "bg-slate-50/70 dark:bg-white/[0.03] border-slate-200/80 dark:border-white/10 text-slate-800 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-white/5"
                )}
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className={cn(
                      "text-[10px] font-mono px-2 py-0.5 rounded-md border",
                      isSelected
                        ? "bg-white/20 dark:bg-slate-950/10 border-white/20 text-white dark:text-slate-950 font-semibold"
                        : "bg-slate-100 dark:bg-white/10 border-slate-200 dark:border-white/10 text-slate-500"
                    )}>
                      {duo.style}
                    </span>
                    {isSelected && <Check className="size-3.5 text-amber-400 dark:text-amber-600 stroke-[2.5]" />}
                  </div>
                  <span className={cn("text-xs font-bold block pt-0.5", isSelected ? "text-white dark:text-slate-950" : "text-slate-900 dark:text-white")}>
                    {duo.hosts}
                  </span>
                  <p className={cn("text-[11px] leading-relaxed", isSelected ? "text-slate-300 dark:text-slate-600" : "text-slate-500 dark:text-slate-400")}>
                    {duo.desc}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* 2. Audio Playback Defaults */}
      <div className="rounded-[28px] bg-white dark:bg-slate-900/90 border border-black/[0.04] dark:border-white/10 shadow-tactile-card p-6 sm:p-7 space-y-5">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="p-1 rounded-lg bg-indigo-100 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300">
              <Volume2 className="size-4" />
            </span>
            <h3 className="text-base sm:text-lg font-bold font-display text-slate-900 dark:text-white">
              Playback Controls & Defaults
            </h3>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Set your default listening speed and pipeline automation for incoming documents.
          </p>
        </div>

        {/* Default Playback Speed */}
        <div className="space-y-2">
          <Label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Default Playback Rate</Label>
          <div className="flex items-center gap-1.5 p-1 bg-slate-100/70 dark:bg-white/[0.04] rounded-[16px] border border-slate-200/80 dark:border-white/10 max-w-md">
            {speeds.map((s) => (
              <button
                key={s}
                onClick={() => updateSettings({ playbackSpeed: s })}
                className={cn(
                  "flex-1 py-2 text-xs font-mono font-medium rounded-[12px] transition-all cursor-pointer text-center",
                  settings.playbackSpeed === s
                    ? "bg-[#1E232A] text-white dark:bg-white dark:text-slate-950 shadow-2xs font-bold"
                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                )}
              >
                {s.toFixed(2).replace(/\.00$/, ".0")}x
              </button>
            ))}
          </div>
        </div>

        {/* Auto-generate Podcast Toggle */}
        <div className="flex items-center justify-between gap-4 p-4 rounded-[20px] bg-slate-50/70 dark:bg-white/[0.03] border border-slate-200/80 dark:border-white/10">
          <div className="space-y-0.5">
            <Label htmlFor="auto-pod" className="text-xs font-bold text-slate-900 dark:text-white cursor-pointer">
              Auto-compile audio recap on document upload
            </Label>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              When enabled, synthesizing the two-host podcast script will kick off automatically after notes compile.
            </p>
          </div>
          <Switch
            id="auto-pod"
            checked={settings.autoGeneratePodcast}
            onCheckedChange={(checked) => updateSettings({ autoGeneratePodcast: checked })}
          />
        </div>
      </div>
    </div>
  );
}
