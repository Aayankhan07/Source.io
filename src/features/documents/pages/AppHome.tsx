"use client";

import { useState } from "react";
import AppSidebar from "@/features/documents/components/AppSidebar";
import UploadDialog from "@/features/documents/components/UploadDialog";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { useTheme } from "@/hooks/use-theme";
import { cn } from "@/lib/utils";
import { AppShellProvider } from "@/features/documents/context/AppShellContext";

export default function AppHome({ children }: { children: React.ReactNode }) {
  const [uploadOpen, setUploadOpen] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const { theme } = useTheme();

  return (
    <AppShellProvider
      onUpload={() => setUploadOpen(true)}
      onMobileNav={() => setMobileNavOpen(true)}
    >
      <div className={cn("luminous-app flex h-screen bg-background text-foreground antialiased font-sans", theme === "dark" && "dark")}>
        {/* Desktop sidebar */}
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

        <UploadDialog open={uploadOpen} onOpenChange={setUploadOpen} />
      </div>
    </AppShellProvider>
  );
}