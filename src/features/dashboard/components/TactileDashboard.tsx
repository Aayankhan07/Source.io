"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { queryKeys } from "@/lib/queryKeys";
import { useAuth } from "@/features/auth/context/AuthContext";
import { DocumentRow } from "@/features/documents/types";
import { useAppShell } from "@/features/documents/context/AppShellContext";
import { Search, X, FileText, ArrowRight, BookOpen } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

import { TactileTopBar } from "./TactileTopBar";
import { TactileSourceCards } from "./TactileSourceCards";
import { TactilePerformanceChart } from "./TactilePerformanceChart";
import { TactileWeeklyGoals } from "./TactileWeeklyGoals";

export function TactileDashboard() {
  const router = useRouter();
  const { user } = useAuth();
  const { openUpload, activeView, setActiveView } = useAppShell();
  const [searchModalOpen, setSearchModalOpen] = useState(false);
  const [globalSearch, setGlobalSearch] = useState("");

  // Query actual user documents from Supabase
  const { data: documents = [], isLoading } = useQuery({
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

  // Filter actual user documents in global search
  const searchResults = documents.filter((d) =>
    (d.title || "Untitled Document").toLowerCase().includes(globalSearch.toLowerCase())
  );

  return (
    <div className="w-full max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
      {/* Top Bar: Search, Notifications, Profile (No disconnected study pills on dashboard) */}
      <TactileTopBar
        showPills={false}
        onOpenSearch={() => setSearchModalOpen(true)}
      />

      {/* Main Page Title Header */}
      <div className="mb-5 sm:mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl sm:text-4xl font-extrabold font-display text-slate-900 dark:text-white tracking-tight">
            {activeView === "dashboard" ? "Dashboard" : "Study Sources & Library"}
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            {activeView === "dashboard"
              ? "Synthesize notes, interactive flashcards, quizzes, and podcasts from your study materials."
              : "All uploaded textbooks, lecture recordings, papers, and YouTube videos."}
          </p>
        </div>

        {activeView === "library" && (
          <button
            onClick={() => setActiveView("dashboard")}
            className="h-9 px-4 rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            ← Back to Overview
          </button>
        )}
      </div>

      {/* VIEW 1: Overview Mode */}
      {activeView === "dashboard" && (
        <div className="flex flex-col gap-6 sm:gap-8 w-full">
          {/* Top Section: Performance Analytics + Weekly Goals (12-column split) */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 sm:gap-6 items-start">
            <div className="lg:col-span-7 w-full">
              <TactilePerformanceChart />
            </div>
            <div className="lg:col-span-5 w-full">
              <TactileWeeklyGoals />
            </div>
          </div>

          {/* Bottom Section: Full-Width Study Sources Grid */}
          <div className="w-full">
            <TactileSourceCards
              documents={documents}
              isLoading={isLoading}
              onNewSource={openUpload}
              onExpandView={() => setActiveView("library")}
            />
          </div>
        </div>
      )}

      {/* VIEW 2: Full-screen Study Sources Library */}
      {activeView === "library" && (
        <div className="w-full">
          <TactileSourceCards
            documents={documents}
            isLoading={isLoading}
            onNewSource={openUpload}
          />
        </div>
      )}

      {/* Global Quick Search Dialog Modal */}
      <AnimatePresence>
        {searchModalOpen && (
          <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 p-4 bg-slate-950/40 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: -10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -10 }}
              className="w-full max-w-xl bg-white dark:bg-slate-900 rounded-[28px] border border-black/[0.08] dark:border-white/10 p-5 shadow-tactile-dock"
            >
              <div className="flex items-center gap-3 border-b border-slate-100 dark:border-white/10 pb-3 mb-3">
                <Search className="size-5 text-slate-400 shrink-0" />
                <input
                  type="text"
                  placeholder="Search your study sources..."
                  value={globalSearch}
                  onChange={(e) => setGlobalSearch(e.target.value)}
                  autoFocus
                  className="w-full bg-transparent text-sm sm:text-base text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none"
                />
                <button
                  onClick={() => setSearchModalOpen(false)}
                  className="size-8 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center justify-center text-slate-400 cursor-pointer"
                >
                  <X className="size-4" />
                </button>
              </div>

              <div className="flex flex-col gap-2 max-h-64 overflow-y-auto pr-1">
                {searchResults.length === 0 ? (
                  <div className="py-8 text-center text-xs text-slate-400 flex flex-col items-center">
                    <BookOpen className="size-6 text-slate-300 dark:text-slate-700 mb-2" />
                    <span>{globalSearch ? `No documents matching "${globalSearch}"` : "No study sources uploaded yet"}</span>
                  </div>
                ) : (
                  searchResults.map((item) => (
                    <button
                      key={item.id}
                      onClick={() => {
                        setSearchModalOpen(false);
                        router.push(`/app/doc/${item.id}`);
                      }}
                      className="p-3 rounded-[16px] hover:bg-slate-50 dark:hover:bg-white/[0.04] text-left flex items-center justify-between text-xs font-semibold text-slate-800 dark:text-slate-200 cursor-pointer group transition-colors"
                    >
                      <div className="flex items-center gap-2.5 truncate pr-2">
                        <FileText className="size-4 text-slate-400 group-hover:text-slate-900 dark:group-hover:text-white shrink-0" />
                        <span className="truncate">{item.title || "Untitled Document"}</span>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="text-[10px] px-2 py-0.5 rounded-md bg-slate-100 dark:bg-white/10 font-mono text-slate-500 uppercase">
                          {item.source_type}
                        </span>
                        <ArrowRight className="size-3 text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                    </button>
                  ))
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
