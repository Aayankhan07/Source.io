"use client";

import React, { useMemo } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/features/auth/context/AuthContext";
import { useAppShell } from "@/features/documents/context/AppShellContext";
import { FileText, Clock, CheckCircle2, RotateCw, Plus } from "lucide-react";
import { useDocumentsList } from "../hooks/useDocumentsList";
import { relativeTime } from "../lib/activity";

import { TactileTopBar } from "./TactileTopBar";
import { TactileSourceCards } from "./TactileSourceCards";
import { TactilePerformanceChart } from "./TactilePerformanceChart";
import { TactileWeeklyGoals } from "./TactileWeeklyGoals";
import { TactileStudyStreak } from "./TactileStudyStreak";
import { TactileDueReviews } from "./TactileDueReviews";

export function TactileDashboard() {
  const router = useRouter();
  const { user } = useAuth();
  const { openUpload, activeView, setActiveView, openSearch } = useAppShell();

  const { data: documents = [], isLoading } = useDocumentsList();

  // Most recently touched document (updated_at moves when processing or edits finish).
  const lastDocument = useMemo(
    () =>
      documents.length === 0
        ? null
        : [...documents].sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime())[0],
    [documents]
  );

  return (
    <div className="w-full max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
      {/* Top Bar: Search, Notifications, Profile (No disconnected study pills on dashboard) */}
      <TactileTopBar
        showPills={false}
        onOpenSearch={openSearch}
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
          {/* Top Hero: most recent document, or a first-upload call to action */}
          <div className="w-full bg-white dark:bg-slate-900 rounded-[28px] border border-slate-200/90 dark:border-slate-800 p-5 sm:p-6 shadow-xs relative overflow-hidden">
            {isLoading ? (
              <div className="h-[76px] flex items-center text-xs text-muted-foreground">Loading your library…</div>
            ) : lastDocument ? (
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                <div className="space-y-2 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 dark:bg-slate-800 px-2.5 py-0.5 text-xs font-mono font-semibold text-slate-800 dark:text-slate-200 border border-slate-300 dark:border-slate-700">
                      <Clock className="size-3 text-slate-500" />
                      Most recent source
                    </span>
                    <span className="text-xs font-mono text-muted-foreground">
                      Updated {relativeTime(lastDocument.updated_at)}
                    </span>
                  </div>
                  <h3 className="text-xl sm:text-2xl font-bold font-display text-slate-900 dark:text-white truncate">
                    {lastDocument.title}
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
                    {lastDocument.status === "ready"
                      ? "Pick up where you left off with notes, flashcards, or a quiz."
                      : lastDocument.status === "failed"
                        ? "This source failed to process. Open it to see what went wrong."
                        : "This source is still processing. Study tools unlock when it is ready."}
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2 pt-1 lg:pt-0 shrink-0">
                  <button
                    type="button"
                    onClick={() => router.push(`/app/doc/${lastDocument.id}?tab=notes`)}
                    className="h-9 px-4 rounded-full bg-slate-900 text-white hover:bg-slate-800 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-100 text-xs font-semibold flex items-center gap-1.5 shadow-2xs transition-all active:scale-95 cursor-pointer"
                  >
                    <FileText className="size-3.5" />
                    <span>Open Notes</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => router.push(`/app/doc/${lastDocument.id}?tab=cards`)}
                    className="h-9 px-4 rounded-full bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-semibold flex items-center gap-1.5 border border-slate-200 dark:border-slate-700 transition-all active:scale-95 cursor-pointer"
                  >
                    <RotateCw className="size-3.5 text-slate-600 dark:text-slate-300" />
                    <span>Flashcards</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => router.push(`/app/doc/${lastDocument.id}?tab=quiz`)}
                    className="h-9 px-4 rounded-full bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-semibold flex items-center gap-1.5 border border-slate-200 dark:border-slate-700 transition-all active:scale-95 cursor-pointer"
                  >
                    <CheckCircle2 className="size-3.5 text-slate-900 dark:text-white" />
                    <span>Take Quiz</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                <div className="space-y-2 min-w-0">
                  <h3 className="text-xl sm:text-2xl font-bold font-display text-slate-900 dark:text-white">
                    Add your first source
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
                    Upload a PDF, paste text, or add a lecture recording or YouTube link. Notes, flashcards, a quiz,
                    and a podcast are generated from it.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={openUpload}
                  className="h-10 px-5 rounded-full bg-slate-900 text-white hover:bg-slate-800 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-100 text-sm font-semibold flex items-center gap-1.5 shadow-2xs transition-all active:scale-95 cursor-pointer shrink-0 self-start lg:self-auto"
                >
                  <Plus className="size-4" />
                  <span>Upload a source</span>
                </button>
              </div>
            )}
          </div>

          {/* Retention: study streak + cards due today (signed-in only; both read real activity) */}
          {user && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 sm:gap-6 items-stretch">
              <div className="lg:col-span-4 w-full">
                <TactileStudyStreak />
              </div>
              <div className="lg:col-span-8 w-full">
                <TactileDueReviews />
              </div>
            </div>
          )}

          {/* Analytics Section: Performance Analytics + Weekly Goals (12-column split) */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 sm:gap-6 items-start">
            <div className="lg:col-span-7 w-full">
              <TactilePerformanceChart isGuest={!user} />
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
            hideHeader={true}
            showAll
          />
        </div>
      )}
    </div>
  );
}
