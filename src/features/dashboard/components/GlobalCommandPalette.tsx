"use client";

import React, { useState, useEffect, useMemo, useRef } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { queryKeys } from "@/lib/queryKeys";
import { useAuth } from "@/features/auth/context/AuthContext";
import { useAppShell } from "@/features/documents/context/AppShellContext";
import { DocumentRow } from "@/features/documents/types";
import { Search, X, FileText, BookOpen, Plus, LayoutDashboard, Settings, CornerDownLeft, Sliders, GraduationCap } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { cn } from "@/lib/utils";
import { useSettings } from "@/features/settings/context/SettingsContext";
import { useToast } from "@/hooks/use-toast";
import { ROLE_METADATA, ROLE_PRESETS, UserRole } from "@/types/customization";

export function GlobalCommandPalette() {
  const router = useRouter();
  const { user } = useAuth();
  const { searchOpen, setSearchOpen, openUpload, setActiveView } = useAppShell();
  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  // Global keyboard shortcut listener for Cmd+K / Ctrl+K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setSearchOpen(!searchOpen);
      } else if (e.key === "Escape" && searchOpen) {
        e.preventDefault();
        setSearchOpen(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [searchOpen, setSearchOpen]);

  // Focus input whenever modal opens and reset state
  useEffect(() => {
    if (searchOpen) {
      setQuery("");
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [searchOpen]);

  // Query actual user documents from Supabase
  const { data: documents = [] } = useQuery({
    queryKey: queryKeys.documents,
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("documents")
        .select("id,title,source_type,status,error_code,created_at")
        .order("created_at", { ascending: false })
        .limit(200);
      if (error) throw error;
      return (data ?? []) as DocumentRow[];
    },
  });

  const { userRole, setUserRole } = useSettings();
  const { toast } = useToast();

  const roleActions = useMemo(() => {
    return (Object.keys(ROLE_METADATA) as UserRole[]).map((r) => {
      const meta = ROLE_METADATA[r];
      const isCurrent = userRole === r;
      const rigor = ROLE_PRESETS[r]?.rigorLevel || 3;
      return {
        id: `role-${r}`,
        title: `Switch Persona: ${meta.label}`,
        subtitle: `${meta.desc} • Rigor Level ${rigor}/5${isCurrent ? " (Active)" : ""}`,
        icon: GraduationCap,
        run: () => {
          setSearchOpen(false);
          setUserRole(r);
          toast({
            title: `Persona Activated: ${meta.label}`,
            description: meta.desc,
          });
        },
      };
    });
  }, [userRole, setUserRole, toast, setSearchOpen]);

  // Built-in workspace navigation actions
  const defaultActions = useMemo(() => [
    {
      id: "action-upload",
      title: "Upload New Study Source",
      subtitle: "Import PDF, monograph, paper, or video",
      icon: Plus,
      run: () => {
        setSearchOpen(false);
        openUpload();
      },
    },
    {
      id: "action-dashboard",
      title: "Go to Dashboard Overview",
      subtitle: "Metrics, goals, and active recall streak",
      icon: LayoutDashboard,
      run: () => {
        setSearchOpen(false);
        setActiveView("dashboard");
        router.push("/app");
      },
    },
    {
      id: "action-library",
      title: "View All Study Sources",
      subtitle: "Full workspace document repository",
      icon: BookOpen,
      run: () => {
        setSearchOpen(false);
        setActiveView("library");
        router.push("/app");
      },
    },
    {
      id: "action-customization",
      title: "Workspace Customization & Role Switcher",
      subtitle: "Tailor study modes, notes layout, and pedagogical rigor",
      icon: Sliders,
      run: () => {
        setSearchOpen(false);
        router.push("/app/settings");
      },
    },
    {
      id: "action-settings",
      title: "Workspace Settings",
      subtitle: "BYOK keys, API telemetry, and theme",
      icon: Settings,
      run: () => {
        setSearchOpen(false);
        router.push("/app/settings");
      },
    },
  ], [openUpload, router, setActiveView, setSearchOpen]);

  // Filtered documents
  const filteredDocs = useMemo(() => {
    if (!query.trim()) return documents.slice(0, 8);
    const q = query.toLowerCase();
    return documents.filter((doc) =>
      (doc.title || "Untitled Document").toLowerCase().includes(q) ||
      (doc.source_type || "").toLowerCase().includes(q)
    );
  }, [documents, query]);

  // Combined selectable items
  const combinedItems = useMemo(() => {
    const docItems = filteredDocs.map((doc) => ({
      id: `doc-${doc.id}`,
      title: doc.title || "Untitled Document",
      badge: doc.source_type,
      icon: FileText,
      run: () => {
        setSearchOpen(false);
        router.push(`/app/doc/${doc.id}`);
      },
    }));

    if (!query.trim()) {
      return [...defaultActions, ...roleActions.slice(0, 3), ...docItems];
    }

    const q = query.toLowerCase();
    const matchingRoles = roleActions.filter(
      (a) => a.title.toLowerCase().includes(q) || a.subtitle.toLowerCase().includes(q)
    );
    const matchingActions = defaultActions.filter(
      (a) => a.title.toLowerCase().includes(q) || a.subtitle.toLowerCase().includes(q)
    );

    return [...matchingActions, ...matchingRoles, ...docItems];
  }, [defaultActions, roleActions, filteredDocs, query]);

  // Reset selected index when items change
  useEffect(() => {
    setSelectedIndex(0);
  }, [combinedItems.length]);

  // Handle keyboard navigation inside the list
  const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1) % Math.max(1, combinedItems.length));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev - 1 + combinedItems.length) % Math.max(1, combinedItems.length));
    } else if (e.key === "Enter" && combinedItems[selectedIndex]) {
      e.preventDefault();
      combinedItems[selectedIndex].run();
    }
  };

  return (
    <AnimatePresence>
      {searchOpen && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-16 sm:pt-24 p-4 bg-slate-950/40 backdrop-blur-sm">
          <div
            className="fixed inset-0"
            onClick={() => setSearchOpen(false)}
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: -8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: -8 }}
            transition={{ duration: 0.15, ease: "easeOut" }}
            className="w-full max-w-xl bg-white dark:bg-slate-900 rounded-[24px] border border-slate-200 dark:border-slate-800 p-4 sm:p-5 shadow-tactile-dock relative z-10 select-none overflow-hidden"
          >
            {/* Search Input Bar */}
            <div className="flex items-center gap-3 border-b border-slate-100 dark:border-slate-800 pb-3 mb-3">
              <Search className="size-4.5 text-slate-400 shrink-0" />
              <input
                ref={inputRef}
                type="text"
                placeholder="Search study sources, chapters, or jump to..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={handleInputKeyDown}
                className="w-full bg-transparent text-sm sm:text-base text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none"
              />
              {query && (
                <button
                  onClick={() => setQuery("")}
                  className="size-6 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center justify-center text-slate-400 cursor-pointer"
                  title="Clear input"
                >
                  <X className="size-3.5" />
                </button>
              )}
              <kbd className="hidden sm:inline-flex items-center gap-0.5 rounded bg-slate-100 dark:bg-slate-800 px-2 py-0.5 font-mono text-[10px] font-bold text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
                ESC
              </kbd>
            </div>

            {/* Item List */}
            <div className="flex flex-col gap-1 max-h-[340px] overflow-y-auto pr-1">
              {combinedItems.length === 0 ? (
                <div className="py-10 text-center text-xs text-slate-400 flex flex-col items-center">
                  <BookOpen className="size-6 text-slate-300 dark:text-slate-700 mb-2" />
                  <span>No study sources matching &quot;{query}&quot;</span>
                </div>
              ) : (
                combinedItems.map((item, idx) => {
                  const isSelected = idx === selectedIndex;
                  const Icon = item.icon;

                  return (
                    <button
                      key={item.id}
                      onClick={() => item.run()}
                      onMouseEnter={() => setSelectedIndex(idx)}
                      className={cn(
                        "p-2.5 sm:p-3 rounded-[16px] text-left flex items-center justify-between text-xs font-semibold cursor-pointer transition-colors",
                        isSelected
                          ? "bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white"
                          : "text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/50"
                      )}
                    >
                      <div className="flex items-center gap-3 truncate pr-2">
                        <div className={cn(
                          "size-8 rounded-[12px] flex items-center justify-center shrink-0 transition-colors",
                          isSelected
                            ? "bg-slate-900 text-white dark:bg-white dark:text-slate-900"
                            : "bg-slate-100 dark:bg-slate-800 text-slate-500"
                        )}>
                          <Icon className="size-4" />
                        </div>
                        <div className="truncate">
                          <span className="block truncate text-xs font-bold font-display">
                            {item.title}
                          </span>
                          {"subtitle" in item && item.subtitle && (
                            <span className="block truncate text-[11px] font-normal text-slate-400 font-sans mt-0.5">
                              {item.subtitle}
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        {"badge" in item && item.badge && (
                          <span className="text-[10px] px-2 py-0.5 rounded-md bg-slate-200/80 dark:bg-slate-700/80 font-mono text-slate-600 dark:text-slate-300 uppercase">
                            {item.badge}
                          </span>
                        )}
                        {isSelected && (
                          <CornerDownLeft className="size-3.5 text-slate-400" />
                        )}
                      </div>
                    </button>
                  );
                })
              )}
            </div>

            {/* Bottom Keyboard Hint Bar */}
            <div className="mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px] font-mono text-slate-400">
              <div className="flex items-center gap-3">
                <span className="flex items-center gap-1">
                  <kbd className="rounded bg-slate-100 dark:bg-slate-800 px-1 py-0.5 border border-slate-200 dark:border-slate-700 text-[10px]">↑</kbd>
                  <kbd className="rounded bg-slate-100 dark:bg-slate-800 px-1 py-0.5 border border-slate-200 dark:border-slate-700 text-[10px]">↓</kbd>
                  Navigate
                </span>
                <span className="flex items-center gap-1">
                  <kbd className="rounded bg-slate-100 dark:bg-slate-800 px-1 py-0.5 border border-slate-200 dark:border-slate-700 text-[10px]">↵</kbd>
                  Open
                </span>
              </div>
              <span className="hidden sm:inline">Source.io Quick Command</span>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
