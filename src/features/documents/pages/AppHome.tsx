import { useState } from "react";
import { Outlet } from "react-router-dom";
import AppSidebar from "@/features/documents/components/AppSidebar";
import UploadDialog from "@/features/documents/components/UploadDialog";
import { Sheet, SheetContent } from "@/components/ui/sheet";

export default function AppHome() {
  const [uploadOpen, setUploadOpen] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  return (
    <div className="flex h-screen bg-background text-foreground">
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
        <Outlet
          context={{
            openUpload: () => setUploadOpen(true),
            openMobileNav: () => setMobileNavOpen(true),
          }}
        />
      </div>

      <UploadDialog open={uploadOpen} onOpenChange={setUploadOpen} />
    </div>
  );
}
