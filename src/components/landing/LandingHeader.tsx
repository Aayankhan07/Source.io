"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useAuth } from "@/features/auth/context/AuthContext";
import { ArrowRight, Menu, X } from "lucide-react";
import { cn } from "@/lib/utils";

export function LandingHeader() {
  const { user } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <header className="fixed top-3.5 sm:top-5 left-1/2 -translate-x-1/2 z-50 w-[calc(100%-1.5rem)] sm:w-[calc(100%-3rem)] max-w-5xl select-none transition-all duration-300">
      <div
        className={cn(
          "w-full rounded-full px-3 sm:px-5 py-2 sm:py-2.5 flex items-center justify-between transition-all duration-300",
          "bg-white/90 dark:bg-[#151A22]/90 backdrop-blur-xl",
          "border border-black/[0.06] dark:border-white/10",
          scrolled ? "shadow-tactile-dock" : "shadow-tactile-pill"
        )}
      >
        {/* Brand Logo with App's Geometric Box Emblem */}
        <Link
          href="/"
          className="flex items-center gap-2.5 group cursor-pointer"
          title="Source.io: AI Study Workspace"
        >
          <div className="size-8 sm:size-9 rounded-[12px] bg-[#1E232A] text-white dark:bg-white dark:text-slate-950 flex items-center justify-center shadow-xs group-hover:scale-105 active:scale-95 transition-transform duration-200">
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <rect x="3.5" y="3.5" width="17" height="17" rx="3.5" stroke="currentColor" strokeWidth="2.2" />
              <rect x="8" y="8" width="8" height="8" rx="1.5" fill="currentColor" opacity="0.9" />
            </svg>
          </div>
          <span className="font-bold text-base sm:text-lg tracking-tight text-slate-900 dark:text-white font-display">
            Source<span className="text-primary font-medium">.io</span>
          </span>
        </Link>

        {/* Center Floating Navigation Links */}
        <nav className="hidden md:flex items-center gap-1 lg:gap-2 text-[13px] font-medium text-slate-600 dark:text-slate-300">
          <a
            href="#modes"
            className="px-3 py-1.5 rounded-full hover:bg-black/[0.04] dark:hover:bg-white/[0.06] hover:text-slate-900 dark:hover:text-white transition-colors"
          >
            Product
          </a>
          <a
            href="#how-it-works"
            className="px-3 py-1.5 rounded-full hover:bg-black/[0.04] dark:hover:bg-white/[0.06] hover:text-slate-900 dark:hover:text-white transition-colors"
          >
            How it works
          </a>
          <a
            href="#verification"
            className="px-3 py-1.5 rounded-full hover:bg-black/[0.04] dark:hover:bg-white/[0.06] hover:text-slate-900 dark:hover:text-white transition-colors"
          >
            Verification
          </a>
          <a
            href="#pricing"
            className="px-3 py-1.5 rounded-full hover:bg-black/[0.04] dark:hover:bg-white/[0.06] hover:text-slate-900 dark:hover:text-white transition-colors"
          >
            Free plan
          </a>
          <a
            href="#faq"
            className="px-3 py-1.5 rounded-full hover:bg-black/[0.04] dark:hover:bg-white/[0.06] hover:text-slate-900 dark:hover:text-white transition-colors"
          >
            FAQ
          </a>
        </nav>

        {/* Right Action Controls: Sign In / Start Free & Theme Toggle */}
        <div className="flex items-center gap-1.5 sm:gap-2.5">
          {/* Authentication & CTA */}
          {user ? (
            <Link
              href="/app"
              className="h-8 sm:h-9 px-4 rounded-full bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs sm:text-sm shadow-tactile-pill active:scale-95 transition-all inline-flex items-center gap-1.5 cursor-pointer"
            >
              <span>Open workspace</span>
              <ArrowRight className="size-3.5" />
            </Link>
          ) : (
            <div className="flex items-center gap-1.5">
              <Link
                href="/auth"
                className="text-xs font-semibold text-slate-600 hover:text-slate-900 px-2.5 sm:px-3 py-1.5 rounded-full hover:bg-black/[0.04] transition-colors"
              >
                Sign in
              </Link>
              <Link
                href="/auth"
                className="h-8 sm:h-9 px-3.5 sm:px-4 rounded-full bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs sm:text-sm shadow-tactile-pill active:scale-95 transition-all inline-flex items-center justify-center cursor-pointer"
              >
                Start free
              </Link>
            </div>
          )}

          {/* Mobile Menu Trigger */}
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden size-8 flex items-center justify-center rounded-full text-slate-600 dark:text-slate-300 hover:bg-black/[0.05] dark:hover:bg-white/[0.08] transition-colors cursor-pointer"
            aria-label="Toggle navigation menu"
            aria-expanded={mobileMenuOpen}
          >
            {mobileMenuOpen ? <X className="size-4" /> : <Menu className="size-4" />}
          </button>
        </div>
      </div>

      {/* Floating Mobile Drawer Navigation */}
      {mobileMenuOpen && (
        <div className="md:hidden mt-2 p-4 rounded-[28px] bg-white/95 dark:bg-[#151A22]/95 backdrop-blur-xl border border-black/[0.08] dark:border-white/10 shadow-tactile-dock flex flex-col gap-2 animate-in fade-in-50 slide-in-from-top-2 duration-150">
          <a
            href="#modes"
            onClick={() => setMobileMenuOpen(false)}
            className="px-3 py-2 rounded-xl text-xs font-semibold text-slate-800 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-white/[0.06] transition-colors"
          >
            Product
          </a>
          <a
            href="#how-it-works"
            onClick={() => setMobileMenuOpen(false)}
            className="px-3 py-2 rounded-xl text-xs font-semibold text-slate-800 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-white/[0.06] transition-colors"
          >
            How it works
          </a>
          <a
            href="#verification"
            onClick={() => setMobileMenuOpen(false)}
            className="px-3 py-2 rounded-xl text-xs font-semibold text-slate-800 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-white/[0.06] transition-colors"
          >
            Verification
          </a>
          <a
            href="#pricing"
            onClick={() => setMobileMenuOpen(false)}
            className="px-3 py-2 rounded-xl text-xs font-semibold text-slate-800 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-white/[0.06] transition-colors"
          >
            Free plan
          </a>
          <a
            href="#faq"
            onClick={() => setMobileMenuOpen(false)}
            className="px-3 py-2 rounded-xl text-xs font-semibold text-slate-800 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-white/[0.06] transition-colors"
          >
            FAQ
          </a>
          <div className="pt-2 border-t border-slate-100 flex items-center gap-2">
            {user ? (
              <Link
                href="/app"
                onClick={() => setMobileMenuOpen(false)}
                className="w-full py-2.5 text-center rounded-full text-xs font-semibold bg-slate-900 text-white"
              >
                Open workspace
              </Link>
            ) : (
              <>
                <Link
                  href="/auth"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex-1 py-2 text-center rounded-full text-xs font-semibold bg-slate-100 text-slate-800"
                >
                  Sign in
                </Link>
                <Link
                  href="/auth"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex-1 py-2 text-center rounded-full text-xs font-semibold bg-slate-900 text-white"
                >
                  Start free
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
