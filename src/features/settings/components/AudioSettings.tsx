"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Headphones, Mic, Volume2, Sparkles, Check } from "lucide-react";
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
      <Card className="rounded-2xl border-border/80 bg-card shadow-xs">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <Mic className="h-4 w-4 text-primary" />
            <CardTitle className="text-sm font-semibold">Podcast Host Duo Profiles</CardTitle>
          </div>
          <CardDescription className="text-xs">
            Choose the synthetic speech profile and conversational dynamic for the 2-host audio recap.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {voiceDuos.map((duo) => {
              const isSelected = settings.podcastVoiceDuo === duo.value;
              return (
                <button
                  key={duo.value}
                  onClick={() => updateSettings({ podcastVoiceDuo: duo.value })}
                  className={cn(
                    "p-3.5 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between",
                    isSelected
                      ? "border-primary bg-primary/5 text-foreground ring-1 ring-primary/30"
                      : "border-border/70 bg-background text-muted-foreground hover:text-foreground hover:bg-muted/40"
                  )}
                >
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-muted text-muted-foreground border border-border/60">
                        {duo.style}
                      </span>
                      {isSelected && <Check className="h-3.5 w-3.5 text-primary" />}
                    </div>
                    <span className={cn("text-xs font-semibold block pt-1", isSelected && "text-primary")}>
                      {duo.hosts}
                    </span>
                    <p className="text-[11px] text-muted-foreground leading-snug">{duo.desc}</p>
                  </div>
                </button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* 2. Audio Playback Defaults */}
      <Card className="rounded-2xl border-border/80 bg-card shadow-xs">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <Volume2 className="h-4 w-4 text-primary" />
            <CardTitle className="text-sm font-semibold">Playback Controls & Defaults</CardTitle>
          </div>
          <CardDescription className="text-xs">
            Set your default listening speed and pipeline automation for incoming documents.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Default Playback Speed */}
          <div className="space-y-2">
            <Label className="text-xs font-medium">Default Playback Rate</Label>
            <div className="flex items-center gap-1.5 p-1 bg-muted/40 rounded-xl border border-border/60 max-w-md">
              {speeds.map((s) => (
                <button
                  key={s}
                  onClick={() => updateSettings({ playbackSpeed: s })}
                  className={cn(
                    "flex-1 py-1.5 text-xs font-mono font-medium rounded-lg transition-all cursor-pointer text-center",
                    settings.playbackSpeed === s
                      ? "bg-background text-foreground shadow-2xs font-bold"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  {s.toFixed(2).replace(/\.00$/, ".0")}x
                </button>
              ))}
            </div>
          </div>

          <div className="h-px bg-border/60" />

          {/* Auto-generate Podcast Toggle */}
          <div className="flex items-center justify-between gap-4 p-3 rounded-xl bg-muted/30 border border-border/60">
            <div className="space-y-0.5">
              <Label htmlFor="auto-pod" className="text-xs font-semibold cursor-pointer">
                Auto-compile audio recap on document upload
              </Label>
              <p className="text-[11px] text-muted-foreground">
                When enabled, synthesizing the two-host podcast script will kick off automatically after notes compile.
              </p>
            </div>
            <Switch
              id="auto-pod"
              checked={settings.autoGeneratePodcast}
              onCheckedChange={(checked) => updateSettings({ autoGeneratePodcast: checked })}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
