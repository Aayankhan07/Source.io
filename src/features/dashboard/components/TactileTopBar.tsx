"use client";

import React, { useState, useRef, useEffect, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Search, Bell, Settings, LogOut, CheckCircle2, AlertTriangle, CalendarClock } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { useAuth } from "@/features/auth/context/AuthContext";
import { DailyQuotaPill } from "@/components/common/DailyQuotaPill";
import { cn } from "@/lib/utils";
import { useDocumentsList } from "../hooks/useDocumentsList";
import { relativeTime, startOfLocalDay } from "../lib/activity";
import { useDueCards } from "@/features/learning/useDueCards";
import { dueReviewHref } from "@/features/learning/dueSummary";

const NOTIF_SEEN_KEY = "source_io_notifications_seen_at_v1";

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

  // Real notifications: documents that finished processing or failed in the last 7 days.
  const { data: documents = [] } = useDocumentsList();
  const [lastSeenAt, setLastSeenAt] = useState<number>(() => {
    if (typeof window === "undefined") return 0;
    try {
      return Number(localStorage.getItem(NOTIF_SEEN_KEY) ?? 0) || 0;
    } catch {
      return 0;
    }
  });

  // Items newer than this stay highlighted while the panel is open.
  const [highlightSince, setHighlightSince] = useState<number>(0);

  const notifications = useMemo(() => {
    const cutoff = Date.now() - 7 * 24 * 60 * 60 * 1000;
    return documents
      .filter((d) => (d.status === "ready" || d.status === "failed") && new Date(d.updated_at).getTime() >= cutoff)
      .sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime())
      .slice(0, 5)
      .map((d) => ({
        id: d.id,
        title: d.status === "ready" ? "Source ready" : "Processing failed",
        desc: d.title,
        time: relativeTime(d.updated_at),
        icon: d.status === "ready" ? CheckCircle2 : AlertTriangle,
        failed: d.status === "failed",
        updatedAt: new Date(d.updated_at).getTime(),
      }));
  }, [documents]);

  // Due-review reminder: one entry while any card is due today. Unread until the panel is opened today.
  const { summary: due } = useDueCards(!!user);
  const dueTop = due.documents[0];
  const dueEntry =
    due.totalDue > 0 && dueTop
      ? {
          title: `${due.totalDue} card${due.totalDue === 1 ? "" : "s"} due today`,
          desc:
            due.documents.length === 1
              ? (documents.find((d) => d.id === dueTop.documentId)?.title ?? "Review your flashcards")
              : `Across ${due.documents.length} sources. Start with the one with the most due.`,
          href: dueReviewHref(dueTop.documentId),
        }
      : null;
  const startOfToday = startOfLocalDay(new Date()).getTime();
  const dueUnread = dueEntry !== null && lastSeenAt < startOfToday;

  const unreadCount = notifications.filter((n) => n.updatedAt > lastSeenAt).length + (dueUnread ? 1 : 0);

  const toggleNotifications = () => {
    if (!notificationsOpen) {
      // Opening marks everything as seen; keep the previous mark for in-panel highlighting.
      const now = Date.now();
      setHighlightSince(lastSeenAt);
      setLastSeenAt(now);
      try {
        localStorage.setItem(NOTIF_SEEN_KEY, String(now));
      } catch {
        // storage unavailable; unread state just resets next visit
      }
    }
    setNotificationsOpen(!notificationsOpen);
  };

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
        <div className="flex items-center p-1 rounded-full bg-card/90 backdrop-blur-md border border-border shadow-tactile-card overflow-x-auto scrollbar-none max-w-full">
          {pills.map((pill) => {
            const isActive = activePill === pill.id;

            return (
              <button
                key={pill.id}
                onClick={() => onSelectPill(pill.id)}
                className={cn(
                  "relative px-3.5 sm:px-6 py-1.5 sm:py-2 rounded-full text-xs sm:text-[13px] font-semibold transition-colors duration-200 cursor-pointer z-10 whitespace-nowrap shrink-0",
                  isActive
                    ? "text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                {isActive && (
                  <motion.div
                    layoutId="active-tactile-top-pill"
                    transition={{ type: "spring", stiffness: 450, damping: 35 }}
                    className="absolute inset-0 rounded-full bg-primary shadow-tactile-pill -z-10"
                  />
                )}
                {pill.label}
              </button>
            );
          })}
        </div>
      )}

      {/* Top Right Utilities: Daily Quota Pill, Search, Notifications, Profile */}
      <div className="flex items-center gap-2 sm:gap-2.5">
        {/* Real-time API Quota Pill */}
        <DailyQuotaPill inline />

        {/* Search Button */}
        <button
          onClick={onOpenSearch}
          title="Quick search sources and flashcards (⌘K / Ctrl+K)"
          className="size-10 rounded-[18px] bg-card/90 backdrop-blur-md border border-border text-muted-foreground hover:text-foreground flex items-center justify-center shadow-tactile-pill hover:scale-105 active:scale-95 transition-all cursor-pointer"
        >
          <Search className="size-4.5 stroke-[2]" />
        </button>

        {/* Notifications Button with Popover */}
        <div className="relative" ref={notifRef}>
          <button
            onClick={toggleNotifications}
            title="Notifications"
            aria-label={unreadCount > 0 ? `Notifications (${unreadCount} new)` : "Notifications"}
            className={cn(
              "size-10 rounded-[18px] bg-card/90 backdrop-blur-md border border-border flex items-center justify-center shadow-tactile-pill hover:scale-105 active:scale-95 transition-all cursor-pointer relative",
              notificationsOpen ? "text-foreground border-border" : "text-muted-foreground"
            )}
          >
            <Bell className="size-4.5 stroke-[2]" />
            {unreadCount > 0 && (
              <span className="absolute top-2 right-2 size-2 rounded-full bg-cyan-500 border border-card" />
            )}
          </button>

          {/* Interactive Notifications Popover */}
          <AnimatePresence>
            {notificationsOpen && (
              <motion.div
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 8, scale: 0.95 }}
                transition={{ duration: 0.15 }}
                className="absolute right-0 mt-3 w-80 sm:w-92 bg-popover text-popover-foreground rounded-[28px] border border-border p-4 shadow-tactile-dock z-50 select-none"
              >
                <div className="flex items-center justify-between pb-3 mb-2 border-b border-border">
                  <h4 className="text-sm font-bold font-display text-foreground">Notifications</h4>
                  {unreadCount > 0 && (
                    <span className="text-xs font-mono px-2 py-0.5 rounded-full bg-cyan-500/15 text-cyan-600 dark:text-cyan-400 font-semibold">
                      {unreadCount} new
                    </span>
                  )}
                </div>

                {dueEntry && (
                  <Link
                    href={dueEntry.href}
                    onClick={() => setNotificationsOpen(false)}
                    className={cn(
                      "p-2.5 mb-2 rounded-[18px] flex items-start gap-2.5 transition-colors",
                      highlightSince < startOfToday ? "bg-muted" : "hover:bg-accent"
                    )}
                  >
                    <div className="size-8 rounded-[12px] flex items-center justify-center shrink-0 mt-0.5 bg-primary text-primary-foreground">
                      <CalendarClock className="size-3.5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <span className="text-xs font-bold text-foreground truncate block">{dueEntry.title}</span>
                      <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">{dueEntry.desc}</p>
                    </div>
                  </Link>
                )}

                {notifications.length === 0 && dueEntry ? null : notifications.length === 0 ? (
                  <div className="py-6 flex flex-col items-center text-center gap-1.5">
                    <CheckCircle2 className="size-5 text-muted-foreground" />
                    <span className="text-xs font-bold text-foreground">You&apos;re all caught up</span>
                    <span className="text-xs text-muted-foreground">
                      We&apos;ll let you know here when a source finishes processing.
                    </span>
                  </div>
                ) : (
                  <div className="flex flex-col gap-2">
                    {notifications.map((n) => {
                      const Icon = n.icon;
                      return (
                        <Link
                          key={n.id}
                          href={`/app/doc/${n.id}`}
                          onClick={() => setNotificationsOpen(false)}
                          className={cn(
                            "p-2.5 rounded-[18px] flex items-start gap-2.5 transition-colors",
                            n.updatedAt > highlightSince ? "bg-muted" : "hover:bg-accent"
                          )}
                        >
                          <div
                            className={cn(
                              "size-8 rounded-[12px] flex items-center justify-center shrink-0 mt-0.5",
                              n.failed
                                ? "bg-rose-100 text-rose-700 dark:bg-rose-950/50 dark:text-rose-300"
                                : "bg-primary text-primary-foreground"
                            )}
                          >
                            <Icon className="size-3.5" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-1">
                              <span className="text-xs font-bold text-foreground truncate">{n.title}</span>
                              <span className="text-xs text-muted-foreground font-mono shrink-0">{n.time}</span>
                            </div>
                            <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">{n.desc}</p>
                          </div>
                        </Link>
                      );
                    })}
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* User Profile Avatar with Popover */}
        <div className="relative" ref={profileRef}>
          <div 
            onClick={() => setProfileOpen((prev) => !prev)}
            className={cn(
              "h-10 pl-1.5 pr-2.5 rounded-[18px] bg-card/90 backdrop-blur-md border border-border flex items-center gap-2 shadow-tactile-pill cursor-pointer transition-all",
              profileOpen ? "border-foreground/30 scale-102" : "hover:border-border"
            )}
            title={userDisplayName}
          >
            <div className="size-7 rounded-[12px] bg-primary text-primary-foreground font-bold text-xs flex items-center justify-center shadow-xs">
              {userInitial}
            </div>
            <span className="hidden sm:inline-block text-xs font-semibold text-foreground max-w-[90px] truncate">
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
                className="absolute right-0 mt-3 w-64 bg-popover text-popover-foreground rounded-[28px] border border-border p-3.5 shadow-tactile-dock z-50 select-none"
              >
                {/* User Card */}
                <div className="p-2.5 rounded-[18px] bg-muted mb-2 flex items-center gap-2.5">
                  <div className="size-10 rounded-[14px] bg-primary text-primary-foreground font-bold text-sm flex items-center justify-center shadow-xs">
                    {userInitial}
                  </div>
                  <div className="min-w-0">
                    <span className="text-xs font-bold text-foreground block truncate">
                      {userDisplayName}
                    </span>
                    <span className="text-xs text-muted-foreground block truncate font-mono">
                      {userEmail}
                    </span>
                  </div>
                </div>

                <div className="flex flex-col gap-1 text-xs font-medium">
                  <Link
                    href="/app/settings"
                    onClick={() => setProfileOpen(false)}
                    className="p-2 rounded-[14px] flex items-center gap-2.5 text-foreground hover:bg-accent transition-colors"
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
