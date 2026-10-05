"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import AppSidebar from "@/features/documents/components/AppSidebar";
import UploadDialog from "@/features/documents/components/UploadDialog";
import { Sheet, SheetContent } from "@/components/ui/sheet";
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

  const isDashboard = pathname === "/app";

  return (
    <AppShellProvider
      onUpload={() => setUploadOpen(true)}
      onMobileNav={() => setMobileNavOpen(true)}
      activeView={activeView}
      onSelectView={setActiveView}
    >
      <div className={cn("luminous-app flex h-screen bg-background text-foreground antialiased font-sans", theme === "dark" && "dark")}>
        {isDashboard ? (
          <>
            {/* Tactile Left Dock for Dashboard (Expandable) */}
            <TactileLeftDock 
              onNewSource={() => setUploadOpen(true)}
              isExpanded={sidebarExpanded}
              onToggleExpand={() => setSidebarExpanded((prev) => !prev)}
              activeTab={activeView}
              onSelectTab={(tab) => {
                if (tab === "dashboard" || tab === "library") {
                  setActiveView(tab);
                }
              }}
            />

            {/* Main Tactile Dashboard Surface with porcelain canvas */}
            <main 
              className={cn(
                "flex-1 overflow-y-auto bg-tactile-canvas pb-20 md:pb-6 transition-all duration-300 ease-out",
                sidebarExpanded ? "md:pl-[270px]" : "md:pl-24"
              )}
            >
              {children}
            </main>
          </>
        ) : (
          <>
            {/* Legacy Desktop sidebar for document workspace */}
            <div className="hidden md:flex">
              <AppSidebar onNew={() => setUploadOpen(true)} />
            </div>

            {/* Mobile drawer sidebar */}
            <Sheet open={mobileNavOpen} onOpenChange={setMobileNavOpen}>
              <SheetContent side="left" className="p-0 w-[18rem] border-sidebar-border bg-sidebar">
                <AppSidebar
                  onNew={() => {
                    setMobileNavOpen(false);
                    setUploadOpen(true);
                  }}
                  onNavigate={() => setMobileNavOpen(false)}
                />
              </SheetContent>
            </Sheet>

            <div className="flex-1 overflow-hidden">
              {children}
            </div>
          </>
        )}

        <UploadDialog open={uploadOpen} onOpenChange={setUploadOpen} />
      </div>
    </AppShellProvider>
  );
}