"use client";

import React, { useState } from "react";
import { BookOpen, Clock, Award, ChevronRight } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

export function TactileLeaderboard() {
  const [showAll, setShowAll] = useState(false);
  const [selectedFriend, setSelectedFriend] = useState<string | null>(null);

  const friends = [
    {
      id: "f-1",
      name: "Anna Morgan",
      books: 25,
      hours: "832h",
      badges: 48,
      score: "10,568",
      avatarBg: "bg-purple-600",
      initial: "A",
      rank: 1,
    },
    {
      id: "f-2",
      name: "Jake Thompson",
      books: 23,
      hours: "778h",
      badges: 39,
      score: "10,234",
      avatarBg: "bg-blue-600",
      initial: "J",
      rank: 2,
    },
    {
      id: "f-3",
      name: "Sofia Bennett",
      books: 20,
      hours: "742h",
      badges: 33,
      score: "9,892",
      avatarBg: "bg-amber-600",
      initial: "S",
      rank: 3,
    },
    {
      id: "f-4",
      name: "Marcus Vance",
      books: 18,
      hours: "690h",
      badges: 29,
      score: "9,420",
      avatarBg: "bg-emerald-600",
      initial: "M",
      rank: 4,
    },
    {
      id: "f-5",
      name: "Elena Rostova",
      books: 16,
      hours: "612h",
      badges: 24,
      score: "8,950",
      avatarBg: "bg-rose-600",
      initial: "E",
      rank: 5,
    },
  ];

  const displayedList = showAll ? friends : friends.slice(0, 3);

  return (
    <div className="bg-white dark:bg-slate-900/90 rounded-[32px] p-5 sm:p-6 border border-black/[0.04] dark:border-white/10 shadow-tactile-card flex flex-col justify-between select-none relative">
      {/* Header with Title & "All" button */}
      <div className="flex items-center justify-between mb-3.5">
        <div>
          <h2 className="text-base sm:text-lg font-bold font-display text-slate-900 dark:text-white tracking-tight">
            Friends Score
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            See how you rank among friends
          </p>
        </div>

        <button 
          onClick={() => setShowAll((prev) => !prev)}
          className={cn(
            "h-8 px-3 rounded-full text-xs font-semibold transition-all cursor-pointer",
            showAll 
              ? "bg-slate-950 text-white dark:bg-white dark:text-slate-950 shadow-sm"
              : "bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300"
          )}
        >
          {showAll ? "Top 3" : "All"}
        </button>
      </div>

      {/* Friends Rankings List */}
      <div className="flex flex-col gap-2.5">
        {displayedList.map((friend) => (
          <div 
            key={friend.id} 
            onClick={() => setSelectedFriend(selectedFriend === friend.id ? null : friend.id)}
            className={cn(
              "flex items-center justify-between gap-3 p-2 rounded-[20px] transition-colors cursor-pointer",
              selectedFriend === friend.id 
                ? "bg-slate-100 dark:bg-white/[0.06]" 
                : "hover:bg-slate-50 dark:hover:bg-white/[0.03]"
            )}
          >
            {/* Avatar & Name & Meta Stats */}
            <div className="flex items-center gap-3 min-w-0">
              <div className={`size-10 rounded-[14px] ${friend.avatarBg} text-white font-bold text-sm flex items-center justify-center shrink-0 shadow-2xs`}>
                {friend.initial}
              </div>

              <div className="min-w-0">
                <span className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white block truncate">
                  {friend.name}
                </span>

                {/* Subtitle Mini Stats Icons (Book, Clock, Award) */}
                <div className="flex items-center gap-2.5 text-[10px] sm:text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 font-mono">
                  <span className="flex items-center gap-0.5">
                    <BookOpen className="size-3" /> {friend.books}
                  </span>
                  <span className="flex items-center gap-0.5">
                    <Clock className="size-3" /> {friend.hours}
                  </span>
                  <span className="flex items-center gap-0.5">
                    <Award className="size-3" /> {friend.badges}
                  </span>
                </div>
              </div>
            </div>

            {/* Score */}
            <span className="text-xs sm:text-sm font-bold font-mono text-slate-900 dark:text-white tabular-nums shrink-0">
              {friend.score}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
