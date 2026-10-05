"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Bot,
  Headphones,
  Palette,
  Database,
  ArrowLeft,
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
    <div className="w-full max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
      {/* Top Header */}
      <div className="mb-6 sm:mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="p-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
              <SettingsIcon className="size-4" />
            </span>
            <span className="text-xs font-mono font-semibold uppercase tracking-wider text-slate-400">
              Preferences
            </span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold font-display text-slate-900 dark:text-white tracking-tight">
            Platform Settings
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Configure AI reasoning engines, custom provider API keys, audio recap voices, and reading ergonomics.
          </p>
        </div>

        <button
          onClick={() => router.push("/app")}
          className="self-start sm:self-auto h-9 px-4 rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5 transition-colors cursor-pointer"
        >
          <ArrowLeft className="size-3.5" />
          <span>Back to Dashboard</span>
        </button>
      </div>

      {/* Floating Capsule Tab Pill Bar */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 mb-6 sm:mb-8 scrollbar-none select-none">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;

          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "h-10 px-4 sm:px-5 rounded-full text-xs font-semibold transition-all flex items-center gap-2 cursor-pointer whitespace-nowrap shadow-2xs",
                isActive
                  ? "bg-[#1E232A] text-white dark:bg-white dark:text-slate-950 shadow-tactile-pill scale-[1.02]"
                  : "bg-white/80 dark:bg-slate-900/80 text-slate-600 dark:text-slate-400 border border-black/[0.04] dark:border-white/10 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white"
              )}
            >
              <Icon className="size-4 shrink-0" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Active Tab Settings Panels */}
      <div className="w-full pb-16">
        {activeTab === "models" && <AIModelSettings />}
        {activeTab === "audio" && <AudioSettings />}
        {activeTab === "appearance" && <AppearanceSettings />}
        {activeTab === "data" && <DataStorageSettings />}
      </div>
    </div>
  );
}
