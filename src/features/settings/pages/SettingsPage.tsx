"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Bot,
  Headphones,
  Palette,
  Database,
  ChevronLeft,
  Settings as SettingsIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import AIModelSettings from "../components/AIModelSettings";
import AudioSettings from "../components/AudioSettings";
import AppearanceSettings from "../components/AppearanceSettings";
import DataStorageSettings from "../components/DataStorageSettings";

type SettingsTab = "models" | "audio" | "appearance" | "data";

export default function SettingsPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<SettingsTab>("models");

  const tabs: { id: SettingsTab; label: string; icon: typeof Bot; desc: string }[] = [
    { id: "models", label: "AI & Models", icon: Bot, desc: "Notes depth & BYOK keys" },
    { id: "audio", label: "Podcast & Audio", icon: Headphones, desc: "Host voices & speed" },
    { id: "appearance", label: "Appearance", icon: Palette, desc: "Theme & reading speed" },
    { id: "data", label: "Data & Storage", icon: Database, desc: "Export & cache reset" },
  ];

  return (
    <div className="h-full flex flex-col bg-background overflow-hidden">
      {/* Header bar */}
      <header className="border-b border-border/80 bg-background/95 backdrop-blur-md px-4 sm:px-8 py-3.5 flex items-center justify-between shrink-0 z-20">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push("/app")}
            className="h-8 px-2.5 text-xs text-muted-foreground hover:text-foreground rounded-full flex items-center gap-1.5 cursor-pointer"
          >
            <ChevronLeft className="h-3.5 w-3.5" />
            <span>Library</span>
          </Button>
          <span className="text-muted-foreground/40">/</span>
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded-md bg-primary/10 text-primary flex items-center justify-center">
              <SettingsIcon className="h-3.5 w-3.5" />
            </div>
            <h1 className="text-sm font-semibold text-foreground font-display tracking-tight">
              Settings
            </h1>
          </div>
        </div>
      </header>

      {/* Main Settings Body */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-5xl mx-auto px-4 sm:px-8 py-6 sm:py-10 space-y-8">
          {/* Header Title & Intro */}
          <div className="space-y-1.5 border-b border-border/60 pb-6">
            <h2 className="text-2xl font-bold font-display text-foreground tracking-tight">
              Platform Settings
            </h2>
            <p className="text-xs sm:text-sm text-muted-foreground">
              Customize your AI reasoning models, audio recap host profiles, reading speed, and local credentials.
            </p>
          </div>

          {/* Settings Two-Column Layout */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
            {/* Left Tab Navigation */}
            <div className="md:col-span-3 space-y-1">
              <span className="text-[10.5px] font-mono uppercase tracking-wider text-muted-foreground px-2 font-semibold block mb-2">
                Preferences
              </span>
              <nav className="flex md:flex-col gap-1 overflow-x-auto pb-2 md:pb-0 scrollbar-none">
                {tabs.map((tab) => {
                  const Icon = tab.icon;
                  const isActive = activeTab === tab.id;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={cn(
                        "w-full text-left px-3 py-2 rounded-xl text-xs font-medium transition-all flex items-center gap-2.5 shrink-0 cursor-pointer",
                        isActive
                          ? "bg-slate-900 text-white dark:bg-white dark:text-zinc-950 font-semibold shadow-xs"
                          : "text-muted-foreground hover:text-foreground hover:bg-muted/60"
                      )}
                    >
                      <Icon className={cn("h-4 w-4 shrink-0", isActive ? "text-current" : "text-muted-foreground")} />
                      <div className="flex flex-col min-w-0">
                        <span className="truncate">{tab.label}</span>
                      </div>
                    </button>
                  );
                })}
              </nav>
            </div>

            {/* Right Content Pane */}
            <div className="md:col-span-9 min-w-0 pb-16">
              {activeTab === "models" && <AIModelSettings />}
              {activeTab === "audio" && <AudioSettings />}
              {activeTab === "appearance" && <AppearanceSettings />}
              {activeTab === "data" && <DataStorageSettings />}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
