"use client";

import { Suspense, useCallback } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Bot,
  Headphones,
  Palette,
  Database,
  ArrowLeft,
  Settings as SettingsIcon,
  CreditCard,
} from "lucide-react";
import AIModelSettings from "../components/AIModelSettings";
import AudioSettings from "../components/AudioSettings";
import AppearanceSettings from "../components/AppearanceSettings";
import DataStorageSettings from "../components/DataStorageSettings";
import CustomizationSettings from "../components/CustomizationSettings";
import PlanBillingSettings from "../components/PlanBillingSettings";

type SettingsTab = "customization" | "billing" | "models" | "audio" | "appearance" | "data";

const SETTINGS_TABS: readonly SettingsTab[] = ["customization", "billing", "models", "audio", "appearance", "data"];

function isSettingsTab(value: string | null | undefined): value is SettingsTab {
  return !!value && (SETTINGS_TABS as readonly string[]).includes(value);
}

const PANEL_CLASS = "mt-0 focus-visible:ring-offset-4 rounded-3xl";

/** Settings, one tab per area. The active tab is in the URL (?tab=billing) so it can be deep-linked. */
export default function SettingsPage() {
  // useSearchParams needs a Suspense boundary for the route to prerender.
  return (
    <Suspense fallback={null}>
      <SettingsPageContent />
    </Suspense>
  );
}

function SettingsPageContent() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const requested = searchParams?.get("tab");
  const activeTab: SettingsTab = isSettingsTab(requested) ? requested : "customization";

  const setActiveTab = useCallback(
    (value: string) => {
      if (!isSettingsTab(value)) return;
      const next = new URLSearchParams(searchParams?.toString());
      next.set("tab", value);
      window.history.replaceState(null, "", `${pathname}?${next.toString()}`);
    },
    [pathname, searchParams],
  );

  const tabs: { id: SettingsTab; label: string; icon: typeof Bot; desc: string }[] = [
    { id: "customization", label: "Customization", icon: SettingsIcon, desc: "Academic roles & visible tabs" },
    { id: "billing", label: "Plan & Billing", icon: CreditCard, desc: "Scholar Pass & usage quotas" },
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
            <span className="p-1 rounded-lg bg-muted text-muted-foreground">
              <SettingsIcon className="size-4" aria-hidden="true" />
            </span>
            <span className="text-xs font-mono font-semibold uppercase tracking-wider text-muted-foreground">
              Preferences
            </span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold font-display text-foreground tracking-tight">
            Platform Settings
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1">
            Configure AI reasoning engines, custom provider API keys, audio recap voices, and reading ergonomics.
          </p>
        </div>

        <button
          type="button"
          onClick={() => router.push("/app")}
          className="self-start sm:self-auto h-9 px-4 rounded-full bg-muted hover:bg-accent text-xs font-semibold text-foreground flex items-center gap-1.5 transition-colors cursor-pointer"
        >
          <ArrowLeft className="size-3.5" aria-hidden="true" />
          <span>Back to Dashboard</span>
        </button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList
          aria-label="Settings sections"
          className="h-auto w-full justify-start bg-transparent p-0 pb-2 mb-6 sm:mb-8 gap-2 overflow-x-auto scrollbar-none select-none"
        >
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <TabsTrigger
                key={tab.id}
                value={tab.id}
                className="h-10 px-4 sm:px-5 rounded-full text-xs font-semibold transition-all gap-2 cursor-pointer whitespace-nowrap shadow-2xs bg-card text-muted-foreground border border-border hover:bg-muted hover:text-foreground data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:border-primary data-[state=active]:shadow-tactile-pill data-[state=active]:hover:bg-primary"
              >
                <Icon className="size-4 shrink-0" aria-hidden="true" />
                <span>{tab.label}</span>
              </TabsTrigger>
            );
          })}
        </TabsList>

        <div className="w-full pb-16">
          <TabsContent value="customization" className={PANEL_CLASS}><CustomizationSettings /></TabsContent>
          <TabsContent value="billing" className={PANEL_CLASS}>
            <PlanBillingSettings onSwitchToModelsTab={() => setActiveTab("models")} />
          </TabsContent>
          <TabsContent value="models" className={PANEL_CLASS}><AIModelSettings /></TabsContent>
          <TabsContent value="audio" className={PANEL_CLASS}><AudioSettings /></TabsContent>
          <TabsContent value="appearance" className={PANEL_CLASS}><AppearanceSettings /></TabsContent>
          <TabsContent value="data" className={PANEL_CLASS}><DataStorageSettings /></TabsContent>
        </div>
      </Tabs>
    </div>
  );
}
