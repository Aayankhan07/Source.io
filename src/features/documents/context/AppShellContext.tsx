"use client";

import { createContext, useContext, useState, ReactNode } from "react";

type AppShellContextType = {
  openUpload: () => void;
  openMobileNav: () => void;
  activeView: "dashboard" | "library";
  setActiveView: (view: "dashboard" | "library") => void;
  copilotOpen: boolean;
  setCopilotOpen: (open: boolean) => void;
  openSearch: () => void;
  searchOpen: boolean;
  setSearchOpen: (open: boolean) => void;
};

const AppShellContext = createContext<AppShellContextType>({
  openUpload: () => {},
  openMobileNav: () => {},
  activeView: "dashboard",
  setActiveView: () => {},
  copilotOpen: false,
  setCopilotOpen: () => {},
  openSearch: () => {},
  searchOpen: false,
  setSearchOpen: () => {},
});

export function AppShellProvider({
  children,
  onUpload,
  onMobileNav,
  activeView = "dashboard",
  onSelectView = () => {},
}: {
  children: ReactNode;
  onUpload: () => void;
  onMobileNav: () => void;
  activeView?: "dashboard" | "library";
  onSelectView?: (view: "dashboard" | "library") => void;
}) {
  const [copilotOpen, setCopilotOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);

  return (
    <AppShellContext.Provider
      value={{
        openUpload: onUpload,
        openMobileNav: onMobileNav,
        activeView,
        setActiveView: onSelectView,
        copilotOpen,
        setCopilotOpen,
        openSearch: () => setSearchOpen(true),
        searchOpen,
        setSearchOpen,
      }}
    >
      {children}
    </AppShellContext.Provider>
  );
}

export function useAppShell() {
  return useContext(AppShellContext);
}