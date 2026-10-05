"use client";

import { useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import UploadDialog from "@/features/documents/components/UploadDialog";
import { useTheme } from "@/hooks/use-theme";
import { cn } from "@/lib/utils";
import { AppShellProvider } from "@/features/documents/context/AppShellContext";
import { TactileLeftDock } from "@/features/dashboard/components/TactileLeftDock";

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

  // Determine active dock tab based on current route
  const currentDockTab = isSettings
    ? "settings"
    : isDocWorkspace
    ? "library"
    : activeView;

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

  return (
    <AppShellProvider
      onUpload={() => setUploadOpen(true)}
      onMobileNav={() => setMobileNavOpen(true)}
      activeView={activeView}
      onSelectView={setActiveView}
    >
      <div className={cn("luminous-app flex h-screen bg-background text-foreground antialiased font-sans", theme === "dark" && "dark")}>
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
            "flex-1 transition-all duration-300 ease-out",
            isDocWorkspace 
              ? "overflow-hidden flex flex-col h-screen" 
              : "overflow-y-auto bg-tactile-canvas pb-20 md:pb-6",
            sidebarExpanded ? "md:pl-[270px]" : "md:pl-24"
          )}
        >
          {children}
        </main>

        <UploadDialog open={uploadOpen} onOpenChange={setUploadOpen} />
      </div>
    </AppShellProvider>
  );
}