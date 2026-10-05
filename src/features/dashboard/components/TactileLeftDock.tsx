"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { 
  Home, 
  Folder, 
  Settings, 
  ChevronRight, 
  ChevronLeft,
  Sun,
  Moon
} from "lucide-react";
import { motion } from "framer-motion";
import { useTheme } from "@/hooks/use-theme";
import { cn } from "@/lib/utils";

interface TactileLeftDockProps {
  onNewSource?: () => void;
  activeTab?: string;
  onSelectTab?: (tab: string) => void;
  isExpanded?: boolean;
  onToggleExpand?: () => void;
}

export function TactileLeftDock({ 
  onNewSource, 
  activeTab = "dashboard", 
  onSelectTab,
  isExpanded: controlledExpanded,
  onToggleExpand: controlledToggleExpand
}: TactileLeftDockProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { theme, toggleTheme } = useTheme();

  // Internal state fallback if not controlled from parent
  const [internalExpanded, setInternalExpanded] = useState(false);
  const isExpanded = controlledExpanded !== undefined ? controlledExpanded : internalExpanded;
  const toggleExpand = controlledToggleExpand || (() => setInternalExpanded((prev) => !prev));

  const navItems = [
    { id: "dashboard", label: "Dashboard", icon: Home, href: "/app" },
    { id: "library", label: "Library", icon: Folder, href: "#library" },
    { id: "settings", label: "Settings", icon: Settings, href: "/app/settings" },
  ];

  const handleItemClick = (e: React.MouseEvent, item: typeof navItems[0]) => {
    if (onSelectTab) {
      e.preventDefault();
      onSelectTab(item.id);
      return;
    }
    if (item.id === "settings") {
      router.push("/app/settings");
      return;
    }
    router.push("/app");
  };

  return (
    <>
      {/* 1. Brand Logo: Independent at Top-Left Corner (As in reference image) */}
      <div className="hidden md:flex fixed top-6 left-6 z-40 select-none">
        <Link 
          href="/app"
          className="size-12 rounded-[16px] bg-[#1E232A] text-white dark:bg-white dark:text-slate-950 flex items-center justify-center shadow-tactile-pill hover:scale-105 active:scale-95 transition-all duration-200"
          title="Source.io"
        >
          {/* Exact geometric box emblem from reference image */}
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect x="3.5" y="3.5" width="17" height="17" rx="3.5" stroke="currentColor" strokeWidth="2.2" />
            <rect x="8" y="8" width="8" height="8" rx="1.5" fill="currentColor" opacity="0.9" />
          </svg>
        </Link>
      </div>

      {/* 2. Floating Capsule Dock: Centered Vertically in the Middle of the Page (As in reference image) */}
      <aside 
        className={cn(
          "hidden md:flex flex-col fixed left-6 top-1/2 -translate-y-1/2 z-40 select-none transition-all duration-300 ease-out",
          isExpanded ? "w-[230px]" : "w-[64px]"
        )}
      >
        <motion.div 
          animate={{ width: isExpanded ? 230 : 64 }}
          transition={{ type: "spring", stiffness: 380, damping: 30 }}
          className="bg-white/95 dark:bg-[#151A22]/95 backdrop-blur-xl rounded-[32px] border border-black/[0.04] dark:border-white/10 p-2.5 flex flex-col items-center shadow-tactile-dock overflow-hidden"
        >
          {/* Navigation Items Stack */}
          <div className="flex flex-col items-stretch gap-3 w-full">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;

              return (
                <button
                  key={item.id}
                  onClick={(e) => handleItemClick(e, item)}
                  title={item.label}
                  className={cn(
                    "h-11 rounded-[20px] flex items-center transition-all duration-200 cursor-pointer relative group",
                    isExpanded ? "px-3.5 gap-3.5 w-full justify-start" : "w-11 justify-center mx-auto",
                    isActive
                      ? "bg-[#1E232A] text-white dark:bg-white dark:text-slate-950 shadow-sm"
                      : "text-slate-400 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100/70 dark:hover:bg-white/5"
                  )}
                >
                  <Icon className={cn("size-5 shrink-0 stroke-[2]", isActive ? "stroke-[2.2]" : "stroke-[1.8]")} />

                  {/* Expanded Text Label */}
                  {isExpanded && (
                    <motion.span
                      initial={{ opacity: 0, x: -6 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -6 }}
                      transition={{ duration: 0.15 }}
                      className={cn(
                        "text-xs font-semibold tracking-wide whitespace-nowrap overflow-hidden text-ellipsis",
                        isActive ? "text-white dark:text-slate-950" : "text-slate-700 dark:text-slate-200"
                      )}
                    >
                      {item.label}
                    </motion.span>
                  )}

                  {/* Tooltip in collapsed mode */}
                  {!isExpanded && (
                    <span className="pointer-events-none absolute left-14 px-2.5 py-1 rounded-lg bg-slate-900 text-white text-xs font-medium whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity shadow-md z-50">
                      {item.label}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Bottom Expand / Collapse Toggle + Theme */}
          <div className="flex flex-col items-center gap-1.5 w-full pt-2.5 mt-2 border-t border-slate-100 dark:border-white/10">
            {/* Quick theme toggle */}
            <button
              onClick={toggleTheme}
              title={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
              className={cn(
                "h-8 rounded-[14px] text-slate-400 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/5 flex items-center transition-all cursor-pointer",
                isExpanded ? "w-full px-3 gap-2.5 justify-start" : "w-8 justify-center mx-auto"
              )}
            >
              {theme === "dark" ? <Sun className="size-4 shrink-0" /> : <Moon className="size-4 shrink-0" />}
              {isExpanded && (
                <span className="text-[11px] font-medium text-slate-600 dark:text-slate-300">
                  {theme === "dark" ? "Light Mode" : "Dark Mode"}
                </span>
              )}
            </button>

            {/* Expand / Collapse Button */}
            <button
              onClick={toggleExpand}
              title={isExpanded ? "Collapse sidebar" : "Expand sidebar"}
              className={cn(
                "h-8 rounded-[14px] text-slate-400 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/5 flex items-center transition-all cursor-pointer",
                isExpanded ? "w-full px-3 gap-2.5 justify-start" : "w-8 justify-center mx-auto"
              )}
            >
              {isExpanded ? (
                <>
                  <ChevronLeft className="size-4 shrink-0 stroke-[2.2]" />
                  <span className="text-[11px] font-medium text-slate-600 dark:text-slate-300">Collapse</span>
                </>
              ) : (
                <ChevronRight className="size-4 shrink-0 stroke-[2.2]" />
              )}
            </button>
          </div>
        </motion.div>
      </aside>

      {/* Mobile Floating Bottom Navigation Bar */}
      <nav className="md:hidden fixed bottom-4 left-4 right-4 z-50 bg-white/95 dark:bg-slate-900/95 backdrop-blur-lg rounded-[24px] border border-black/[0.06] dark:border-white/10 p-2 px-3 flex items-center justify-between shadow-tactile-dock">
        {navItems.slice(0, 5).map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={(e) => handleItemClick(e, item)}
              className={cn(
                "p-2.5 rounded-[16px] transition-all flex items-center justify-center",
                isActive
                  ? "bg-[#1E232A] text-white dark:bg-white dark:text-slate-950 shadow-sm"
                  : "text-slate-400 dark:text-slate-400"
              )}
            >
              <Icon className="size-5" />
            </button>
          );
        })}
      </nav>
    </>
  );
}
