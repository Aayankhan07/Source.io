"use client";

import { createContext, useContext, useState, ReactNode } from "react";

type AppShellContextType = {
  openUpload: () => void;
  openMobileNav: () => void;
};

const AppShellContext = createContext<AppShellContextType>({
  openUpload: () => {},
  openMobileNav: () => {},
});

export function AppShellProvider({
  children,
  onUpload,
  onMobileNav,
}: {
  children: ReactNode;
  onUpload: () => void;
  onMobileNav: () => void;
}) {
  return (
    <AppShellContext.Provider value={{ openUpload: onUpload, openMobileNav: onMobileNav }}>
      {children}
    </AppShellContext.Provider>
  );
}

export function useAppShell() {
  return useContext(AppShellContext);
}