"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useAuth } from "@/features/auth/context/AuthContext";
import { ArrowRight, Menu, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion, useScroll, useSpring } from "motion/react";

export function LandingHeader() {
  const { user } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  const [hoveredLink, setHoveredLink] = useState<string | null>(null);

  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, { stiffness: 280, damping: 30, restDelta: 0.001 });

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 40);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const navLinks = [
    { href: "/#how-it-works", label: "How it works" },
    { href: "/#modes", label: "Study Modes" },
    { href: "/#personas", label: "Personas" },
    { href: "/#comparison", label: "Comparison" },
    { href: "/#pricing", label: "Pricing" },
    { href: "/#faq", label: "FAQ" },
  ];

  return (
    <header className="fixed top-3.5 sm:top-5 left-1/2 -translate-x-1/2 z-50 w-[calc(100%-1.5rem)] sm:w-[calc(100%-3rem)] max-w-5xl select-none transition-[top,transform] duration-300">
      <div
        className={cn(
          "w-full rounded-full px-3 sm:px-5 flex items-center justify-between transition-all duration-300 relative overflow-hidden",
          "bg-white/95 backdrop-blur-xl",
          "border border-slate-200/90",
          scrolled ? "py-1.5 sm:py-2 shadow-tactile-dock" : "py-2.5 sm:py-3 shadow-tactile-pill"
        )}
      >
        {/* Subtle Spring-Damped Scroll Progress Bar along header bottom */}
        <motion.div
          style={{ scaleX }}
          className="absolute bottom-0 left-0 right-0 h-[2px] bg-slate-900 origin-left pointer-events-none opacity-85 z-20"
        />
        {/* Brand Logo with App's Geometric Box Emblem */}
        <Link
          href="/"
          className="flex items-center gap-2.5 group cursor-pointer"
          title="Source.io: AI Study Workspace"
        >
          <div className="size-8 sm:size-9 rounded-[12px] bg-[#1E232A] text-white flex items-center justify-center shadow-xs group-hover:scale-105 active:scale-95 transition-transform duration-200">
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <rect x="3.5" y="3.5" width="17" height="17" rx="3.5" stroke="currentColor" strokeWidth="2.2" />
              <rect x="8" y="8" width="8" height="8" rx="1.5" fill="currentColor" opacity="0.9" />
            </svg>
          </div>
          <span className="font-bold text-base sm:text-lg tracking-tight text-slate-900 font-display">
            Source<span className="text-slate-900 font-medium">.io</span>
          </span>
        </Link>

        {/* Center Floating Navigation Links with Sliding Ghost Pill */}
        <nav
          onMouseLeave={() => setHoveredLink(null)}
          className="hidden md:flex items-center gap-0.5 lg:gap-1 text-[13px] font-medium text-slate-600 relative"
        >
          {navLinks.map((link) => {
            const isHovered = hoveredLink === link.href;
            return (
              <a
                key={link.href}
                href={link.href}
                onMouseEnter={() => setHoveredLink(link.href)}
                className="relative px-3.5 py-1.5 rounded-full text-slate-600 hover:text-slate-950 transition-colors"
              >
                {isHovered && (
                  <motion.div
                    layoutId="navHover"
                    className="absolute inset-0 rounded-full bg-slate-100 -z-0"
                    transition={{ type: "spring", stiffness: 450, damping: 28 }}
                  />
                )}
                <span className="relative z-10">{link.label}</span>
              </a>
            );
          })}
        </nav>

        {/* Right Action Controls: Sign In / Start Free & Theme Toggle */}
        <div className="flex items-center gap-1.5 sm:gap-2.5">
          {/* Authentication & CTA */}
          {user ? (
            <motion.div
              whileHover={{ scale: 1.025, y: -1 }}
              whileTap={{ scale: 0.97 }}
              transition={{ type: "spring", stiffness: 400, damping: 20 }}
            >
              <Link
                href="/app"
                className="h-8 sm:h-9 px-4 rounded-full bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs sm:text-sm shadow-tactile-pill transition-colors inline-flex items-center gap-1.5 cursor-pointer"
              >
                <span>Open workspace</span>
                <ArrowRight className="size-3.5" />
              </Link>
            </motion.div>
          ) : (
            <div className="flex items-center gap-1.5">
              <Link
                href="/auth?mode=signin"
                className="hidden sm:inline-block text-xs font-semibold text-slate-600 hover:text-slate-900 px-2.5 sm:px-3 py-1.5 rounded-full hover:bg-black/[0.04] transition-colors"
              >
                Sign in
              </Link>
              <motion.div
                whileHover={{ scale: 1.02, y: -0.5 }}
                whileTap={{ scale: 0.965, y: 0.5 }}
                transition={{ type: "spring", stiffness: 450, damping: 25 }}
              >
                <Link
                  href="/auth?mode=signup"
                  className="h-8 sm:h-9 px-3.5 sm:px-4 rounded-full bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs sm:text-sm shadow-tactile-pill hover:shadow-md border-t border-white/20 transition-all inline-flex items-center justify-center cursor-pointer whitespace-nowrap"
                >
                  Start free
                </Link>
              </motion.div>
            </div>
          )}

          {/* Mobile Menu Trigger */}
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden size-9 sm:size-8 flex items-center justify-center rounded-full text-slate-600 hover:bg-black/[0.05] transition-colors cursor-pointer p-1"
            aria-label="Toggle navigation menu"
            aria-expanded={mobileMenuOpen}
          >
            {mobileMenuOpen ? <X className="size-4" /> : <Menu className="size-4" />}
          </button>
        </div>
      </div>

      {/* Floating Mobile Drawer Navigation */}
      {mobileMenuOpen && (
        <div className="md:hidden mt-2 p-4 rounded-[28px] bg-white/95 backdrop-blur-xl border border-black/[0.08] shadow-tactile-dock flex flex-col gap-1.5 animate-in fade-in-50 slide-in-from-top-2 duration-150">
          {navLinks.map((link) => (
            <a
              key={link.href}
              href={link.href}
              onClick={() => setMobileMenuOpen(false)}
              className="px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold text-slate-800 hover:bg-slate-100 transition-colors flex items-center justify-between"
            >
              <span>{link.label}</span>
              <ArrowRight className="size-3 text-slate-400" />
            </a>
          ))}
          <div className="pt-3 mt-1 border-t border-slate-100 flex items-center gap-2">
            {user ? (
              <Link
                href="/app"
                onClick={() => setMobileMenuOpen(false)}
                className="w-full py-2.5 text-center rounded-full text-xs font-semibold bg-slate-900 text-white shadow-tactile-pill"
              >
                Open workspace
              </Link>
            ) : (
              <>
                <Link
                  href="/auth?mode=signin"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex-1 py-2.5 text-center rounded-full text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-800 transition-colors"
                >
                  Sign in
                </Link>
                <Link
                  href="/auth?mode=signup"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex-1 py-2.5 text-center rounded-full text-xs font-semibold bg-slate-900 hover:bg-slate-800 text-white shadow-tactile-pill transition-colors"
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
