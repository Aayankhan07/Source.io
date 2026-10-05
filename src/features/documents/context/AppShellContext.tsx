"use client";

import { createContext, useContext, useState, ReactNode } from "react";

type AppShellContextType = {
  openUpload: () => void;
  openMobileNav: () => void;
  activeView: "dashboard" | "library";
  setActiveView: (view: "dashboard" | "library") => void;
};

const AppShellContext = createContext<AppShellContextType>({
  openUpload: () => {},
  openMobileNav: () => {},
  activeView: "dashboard",
  setActiveView: () => {},
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
  return (
    <AppShellContext.Provider
      value={{
        openUpload: onUpload,
        openMobileNav: onMobileNav,
        activeView,
        setActiveView: onSelectView,
      }}
    >
      {children}
    </AppShellContext.Provider>
  );
}

export function useAppShell() {
  return useContext(AppShellContext);
}