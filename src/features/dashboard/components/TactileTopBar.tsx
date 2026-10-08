"use client";

import React, { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Search, Bell, Settings, LogOut, CheckCircle2, BookOpen, Clock, Sparkles } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/features/auth/context/AuthContext";
import { cn } from "@/lib/utils";

interface TactileTopBarProps {
  activePill?: string;
  onSelectPill?: (pill: string) => void;
  onOpenSearch?: () => void;
  showPills?: boolean;
}

export function TactileTopBar({
  activePill = "dashboard",
  onSelectPill,
  onOpenSearch,
  showPills = false,
}: TactileTopBarProps) {
  const router = useRouter();
  const { user, signOut } = useAuth();

  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);

  const notifRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);

  // Close menus when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(event.target as Node)) {
        setNotificationsOpen(false);
      }
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setProfileOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const pills = [
    { id: "dashboard", label: "Dashboard" },
    { id: "sources", label: "Study Sources" },
    { id: "flashcards", label: "Flashcards" },
    { id: "quizzes", label: "Quizzes" },
  ];

  const userInitial = user?.email ? user.email.charAt(0).toUpperCase() : "S";
  const userDisplayName = user?.user_metadata?.full_name || user?.email?.split("@")[0] || "Scholar";
  const userEmail = user?.email || "scholar@source.io";

  const notifications = [
    {
      id: "n-1",
      title: "15 Flashcards Due",
      desc: "Quantum Computing • Leitner Box 2 decay threshold",
      time: "10m ago",
      icon: BookOpen,
      unread: true,
    },
    {
      id: "n-2",
      title: "Acoustic Diarization Complete",
      desc: "Distributed Systems (MIT 6.824) processed with 98% certainty",
      time: "1h ago",
      icon: CheckCircle2,
      unread: true,
    },
    {
      id: "n-3",
      title: "Study Streak Milestone",
      desc: "You've studied 5 days in a row! Rank #1 among friends.",
      time: "3h ago",
      icon: Clock,
      unread: false,
    },
  ];

  const handleSignOut = async () => {
    try {
      await signOut();
      router.push("/auth");
    } catch {
      router.push("/auth");
    }
  };

  return (
    <header className="w-full flex items-center justify-between gap-4 py-2 sm:py-3 mb-4 select-none relative z-30">
      {/* Mobile Brand on mobile */}
      <div className="flex items-center gap-3">
        <div className="md:hidden flex items-center gap-2">
          <div className="size-9 rounded-[14px] bg-[#1E232A] text-white dark:bg-white dark:text-slate-950 flex items-center justify-center font-display font-black text-base shadow-sm">
            S
          </div>
          <span className="font-display font-bold text-lg text-slate-900 dark:text-white">Source.io</span>
        </div>
      </div>

      {/* Center Segmented Floating Pill Bar (Only when showPills is true) */}
      {showPills && onSelectPill && (
        <div className="flex items-center p-1 rounded-full bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border border-black/[0.04] dark:border-white/10 shadow-tactile-card overflow-x-auto scrollbar-none max-w-full">
          {pills.map((pill) => {
            const isActive = activePill === pill.id;

            return (
              <button
                key={pill.id}
                onClick={() => onSelectPill(pill.id)}
                className={cn(
                  "relative px-3.5 sm:px-6 py-1.5 sm:py-2 rounded-full text-xs sm:text-[13px] font-semibold transition-colors duration-200 cursor-pointer z-10 whitespace-nowrap shrink-0",
                  isActive
                    ? "text-white dark:text-slate-950"
                    : "text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white"
                )}
              >
                {isActive && (
                  <motion.div
                    layoutId="active-tactile-top-pill"
                    transition={{ type: "spring", stiffness: 450, damping: 35 }}
                    className="absolute inset-0 rounded-full bg-[#1E232A] dark:bg-white shadow-tactile-pill -z-10"
                  />
                )}
                {pill.label}
              </button>
            );
          })}
        </div>
      )}

      {/* Top Right Utilities: Search, Notifications, Profile (NO THEME TOGGLE) */}
      <div className="flex items-center gap-2 sm:gap-2.5">
        {/* Search Button */}
        <button
          onClick={onOpenSearch}
          title="Quick search sources and flashcards"
          className="size-10 rounded-[18px] bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border border-black/[0.04] dark:border-white/10 text-slate-600 hover:text-slate-950 dark:text-slate-300 dark:hover:text-white flex items-center justify-center shadow-tactile-pill hover:scale-105 active:scale-95 transition-all cursor-pointer"
        >
          <Search className="size-4.5 stroke-[2]" />
        </button>

        {/* Notifications Button with Popover */}
        <div className="relative" ref={notifRef}>
          <button
            onClick={() => setNotificationsOpen((prev) => !prev)}
            title="Notifications & Study Reminders"
            className={cn(
              "size-10 rounded-[18px] bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border border-black/[0.04] dark:border-white/10 flex items-center justify-center shadow-tactile-pill hover:scale-105 active:scale-95 transition-all cursor-pointer relative",
              notificationsOpen ? "text-slate-950 dark:text-white border-slate-300" : "text-slate-600 dark:text-slate-300"
            )}
          >
            <Bell className="size-4.5 stroke-[2]" />
            <span className="absolute top-2 right-2 size-2 rounded-full bg-cyan-500 border border-white dark:border-slate-900" />
          </button>

          {/* Interactive Notifications Popover */}
          <AnimatePresence>
            {notificationsOpen && (
              <motion.div
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 8, scale: 0.95 }}
                transition={{ duration: 0.15 }}
                className="absolute right-0 mt-3 w-80 sm:w-92 bg-white dark:bg-slate-900 rounded-[28px] border border-black/[0.06] dark:border-white/10 p-4 shadow-tactile-dock z-50 select-none"
              >
                <div className="flex items-center justify-between pb-3 mb-2 border-b border-slate-100 dark:border-white/10">
                  <h4 className="text-sm font-bold font-display text-slate-900 dark:text-white">Notifications</h4>
                  <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-cyan-500/15 text-cyan-700 dark:text-cyan-300 font-semibold">
                    2 new
                  </span>
                </div>

                <div className="flex flex-col gap-2">
                  {notifications.map((n) => {
                    const Icon = n.icon;
                    return (
                      <div
                        key={n.id}
                        className={cn(
                          "p-2.5 rounded-[18px] flex items-start gap-2.5 transition-colors cursor-pointer",
                          n.unread
                            ? "bg-slate-50 dark:bg-white/[0.04]"
                            : "hover:bg-slate-50 dark:hover:bg-white/[0.02]"
                        )}
                      >
                        <div className="size-8 rounded-[12px] bg-slate-900 text-white dark:bg-white dark:text-slate-950 flex items-center justify-center shrink-0 mt-0.5">
                          <Icon className="size-3.5" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-1">
                            <span className="text-xs font-bold text-slate-900 dark:text-white truncate">
                              {n.title}
                            </span>
                            <span className="text-[10px] text-slate-400 dark:text-slate-500 font-mono shrink-0">
                              {n.time}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-1 mt-0.5">
                            {n.desc}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* User Profile Avatar with Popover */}
        <div className="relative" ref={profileRef}>
          <div 
            onClick={() => setProfileOpen((prev) => !prev)}
            className={cn(
              "h-10 pl-1.5 pr-2.5 rounded-[18px] bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border border-black/[0.04] dark:border-white/10 flex items-center gap-2 shadow-tactile-pill cursor-pointer transition-all",
              profileOpen ? "border-slate-300 dark:border-slate-600 scale-102" : "hover:border-slate-300 dark:hover:border-slate-700"
            )}
            title={userDisplayName}
          >
            <div className="size-7 rounded-[12px] bg-slate-900 text-white dark:bg-white dark:text-slate-950 font-bold text-xs flex items-center justify-center shadow-xs">
              {userInitial}
            </div>
            <span className="hidden sm:inline-block text-xs font-semibold text-slate-800 dark:text-slate-200 max-w-[90px] truncate">
              {userDisplayName}
            </span>
          </div>

          {/* Interactive Profile Dropdown Menu */}
          <AnimatePresence>
            {profileOpen && (
              <motion.div
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 8, scale: 0.95 }}
                transition={{ duration: 0.15 }}
                className="absolute right-0 mt-3 w-64 bg-white dark:bg-slate-900 rounded-[28px] border border-black/[0.06] dark:border-white/10 p-3.5 shadow-tactile-dock z-50 select-none"
              >
                {/* User Card */}
                <div className="p-2.5 rounded-[18px] bg-slate-50 dark:bg-white/[0.04] mb-2 flex items-center gap-2.5">
                  <div className="size-10 rounded-[14px] bg-slate-900 text-white dark:bg-white dark:text-slate-950 font-bold text-sm flex items-center justify-center shadow-xs">
                    {userInitial}
                  </div>
                  <div className="min-w-0">
                    <span className="text-xs font-bold text-slate-900 dark:text-white block truncate">
                      {userDisplayName}
                    </span>
                    <span className="text-[10px] text-slate-500 dark:text-slate-400 block truncate font-mono">
                      {userEmail}
                    </span>
                  </div>
                </div>

                <div className="flex flex-col gap-1 text-xs font-medium">
                  <Link
                    href="/app/settings"
                    onClick={() => setProfileOpen(false)}
                    className="p-2 rounded-[14px] flex items-center gap-2.5 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/5 transition-colors"
                  >
                    <Settings className="size-4" />
                    <span>Workspace Settings</span>
                  </Link>

                  <button
                    onClick={handleSignOut}
                    className="p-2 rounded-[14px] flex items-center gap-2.5 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/20 transition-colors w-full text-left cursor-pointer"
                  >
                    <LogOut className="size-4" />
                    <span>Sign Out</span>
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </header>
  );
}
