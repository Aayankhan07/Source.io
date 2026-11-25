"use client";

import { useEffect, useState } from "react";
import { Folder, Home, Plus, Settings } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import UploadDialog from "@/features/documents/components/UploadDialog";
import { useTheme } from "@/hooks/use-theme";
import { cn } from "@/lib/utils";
import { AppShellProvider } from "@/features/documents/context/AppShellContext";
import { TactileLeftDock } from "@/features/dashboard/components/TactileLeftDock";
import { GlobalCommandPalette } from "@/features/dashboard/components/GlobalCommandPalette";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";

const MOBILE_NAV_ITEMS = [
  { id: "dashboard", label: "Dashboard", icon: Home },
  { id: "library", label: "Library", icon: Folder },
  { id: "settings", label: "Settings", icon: Settings },
] as const;

export default function AppHome({ children }: { children: React.ReactNode }) {
  const [uploadOpen, setUploadOpen] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [sidebarExpanded, setSidebarExpanded] = useState(false);
  const [activeView, setActiveView] = useState<"dashboard" | "library">("dashboard");
  const { theme } = useTheme();
  const pathname = usePathname();
  const router = useRouter();

  const isDocWorkspace = pathname.startsWith("/app/doc/");
  const isSettings = pathname.startsWith("/app/settings");
  const isOnboarding = pathname.startsWith("/app/onboarding");

  // Determine active dock tab based on current route
  const currentDockTab = isSettings
    ? "settings"
    : isDocWorkspace
    ? "library"
    : activeView;

  // Onboarding ends at the first upload: /app?upload=1 opens the upload dialog once, then cleans the URL.
  useEffect(() => {
    if (pathname !== "/app") return;
    const params = new URLSearchParams(window.location.search);
    if (params.get("upload") !== "1") return;
    setUploadOpen(true);
    router.replace("/app");
  }, [pathname, router]);

  const handleDockSelectTab = (tab: string) => {
    if (tab === "settings") {
      router.push("/app/settings");
    } else if (tab === "library") {
      setActiveView("library");
      if (pathname !== "/app") {
        router.push("/app");
      }
    } else if (tab === "dashboard") {
      setActiveView("dashboard");
      if (pathname !== "/app") {
        router.push("/app");
      }
    }
  };

  if (isOnboarding) {
    return (
      <div className={cn("luminous-app min-h-screen bg-tactile-canvas text-foreground antialiased font-sans", theme === "dark" && "dark")}>
        {children}
      </div>
    );
  }

  return (
    <AppShellProvider
      onUpload={() => setUploadOpen(true)}
      onMobileNav={() => setMobileNavOpen(true)}
      activeView={activeView}
      onSelectView={setActiveView}
    >
      <div className={cn("luminous-app flex h-screen bg-tactile-canvas text-foreground antialiased font-sans", theme === "dark" && "dark")}>
        {/* Unified Tactile Left Dock across ALL pages */}
        <TactileLeftDock 
          onNewSource={() => setUploadOpen(true)}
          isExpanded={sidebarExpanded}
          onToggleExpand={() => setSidebarExpanded((prev) => !prev)}
          activeTab={currentDockTab}
          onSelectTab={handleDockSelectTab}
        />

        {/* Main Content Area */}
        <main 
          className={cn(
            "flex-1 transition-all duration-300 ease-out bg-tactile-canvas",
            isDocWorkspace 
              ? "overflow-hidden flex flex-col h-screen" 
              : "overflow-y-auto pb-20 md:pb-6",
            sidebarExpanded ? "md:pl-[270px]" : "md:pl-24"
          )}
        >
          {children}
        </main>

        <UploadDialog open={uploadOpen} onOpenChange={setUploadOpen} />

        {/* Mobile navigation drawer (opened from the workspace Menu button) */}
        <Drawer open={mobileNavOpen} onOpenChange={setMobileNavOpen} shouldScaleBackground={false}>
          <DrawerContent className={cn("luminous-app md:hidden", theme === "dark" && "dark")}>
            <DrawerHeader className="text-left">
              <DrawerTitle>Navigate</DrawerTitle>
              <DrawerDescription className="sr-only">Go to another part of your workspace</DrawerDescription>
            </DrawerHeader>
            <nav aria-label="Workspace" className="flex flex-col gap-1 px-4 pb-6">
              {MOBILE_NAV_ITEMS.map((item) => {
                const Icon = item.icon;
                const isActive = currentDockTab === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => {
                      setMobileNavOpen(false);
                      handleDockSelectTab(item.id);
                    }}
                    aria-current={isActive ? "page" : undefined}
                    className={cn(
                      "flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-semibold transition-colors cursor-pointer",
                      isActive ? "bg-primary text-primary-foreground" : "text-foreground hover:bg-muted",
                    )}
                  >
                    <Icon className="size-5" aria-hidden="true" />
                    {item.label}
                  </button>
                );
              })}
              <button
                type="button"
                onClick={() => {
                  setMobileNavOpen(false);
                  setUploadOpen(true);
                }}
                className="mt-2 flex items-center gap-3 rounded-2xl border border-border px-4 py-3 text-sm font-semibold text-foreground hover:bg-muted transition-colors cursor-pointer"
              >
                <Plus className="size-5" aria-hidden="true" />
                Add a document
              </button>
            </nav>
          </DrawerContent>
        </Drawer>
        <GlobalCommandPalette />
      </div>
    </AppShellProvider>
  );
}