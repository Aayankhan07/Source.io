"use client";

import { useState } from "react";
import Link from "next/link";
import { useAuth } from "@/features/auth/context/AuthContext";
import { useTheme } from "@/hooks/use-theme";
import { ArrowRight, Menu, X, Sun, Moon } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export function LandingHeader() {
  const { user } = useAuth();
  const { theme, toggleTheme, mounted } = useTheme();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 w-full bg-background/80 backdrop-blur-md transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-[68px] sm:h-[76px] flex items-center justify-between">
        {/* Brand Logo - Pure Text, No Icon */}
        <Link 
          href="/" 
          className="font-bold text-xl sm:text-2xl tracking-tight text-foreground select-none hover:opacity-90 transition-opacity"
        >
          Source<span className="text-primary font-medium">.io</span>
        </Link>

        {/* Center Navigation Links (Matching Reference UI) */}
        <nav className="hidden md:flex items-center gap-8 lg:gap-10 text-[14px]">
          <a 
            href="#workbench" 
            className="relative font-semibold text-foreground hover:text-foreground transition-colors after:content-[''] after:absolute after:-bottom-1.5 after:left-0 after:right-0 after:h-[2px] after:bg-foreground after:rounded-full"
          >
            Why Source?
          </a>
          <a 
            href="#workbench" 
            className="font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            Study Lenses
          </a>
          <a 
            href="#grounding" 
            className="font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            Verification
          </a>
          <a 
            href="#pipeline" 
            className="font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            Pipeline
          </a>
        </nav>

        {/* Action Controls: Sign In, Sign Up Pill & Theme Toggle */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Authentication & CTA */}
          {mounted && user ? (
            <Link
              href="/app"
              className="bg-primary text-primary-foreground font-medium rounded-full px-5 py-2 text-sm shadow-sm hover:opacity-95 active:scale-95 transition-all inline-flex items-center gap-1.5"
            >
              Workspace
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          ) : (
            <>
              <Link
                href="/auth"
                className="text-sm font-medium text-muted-foreground hover:text-foreground px-3.5 py-1.5 rounded-full hover:bg-muted/40 transition-colors hidden sm:inline-block"
              >
                Sign In
              </Link>
              <Link
                href="/auth"
                className="bg-primary text-primary-foreground font-semibold rounded-full px-5 py-2 text-sm shadow-sm hover:opacity-95 active:scale-95 transition-all inline-flex items-center justify-center"
              >
                Sign Up
              </Link>
            </>
          )}

          {/* Theme Toggle */}
          <TooltipProvider delayDuration={150}>
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  onClick={toggleTheme}
                  className="size-9 flex items-center justify-center rounded-full text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  aria-label={!mounted || theme === "dark" ? "Switch to light theme" : "Switch to dark theme"}
                >
                  {!mounted || theme === "dark" ? (
                    <Sun className="size-4" />
                  ) : (
                    <Moon className="size-4" />
                  )}
                </button>
              </TooltipTrigger>
              <TooltipContent side="bottom">
                <p className="text-xs">
                  {!mounted || theme === "dark" ? "Luminous Light" : "Obsidian Studio"}
                </p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          {/* Mobile Menu Trigger */}
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden size-9 flex items-center justify-center rounded-full text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            aria-label="Toggle navigation menu"
            aria-expanded={mobileMenuOpen}
          >
            {mobileMenuOpen ? <X className="size-4" /> : <Menu className="size-4" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer Navigation */}
      {mobileMenuOpen && (
        <nav className="md:hidden border-t border-border/50 px-6 py-4 bg-background/95 backdrop-blur-md flex flex-col gap-3 text-sm font-medium text-muted-foreground animate-in fade-in-50 duration-150">
          <a
            href="#workbench"
            onClick={() => setMobileMenuOpen(false)}
            className="text-foreground font-semibold py-1 transition-colors"
          >
            Why Source?
          </a>
          <a
            href="#workbench"
            onClick={() => setMobileMenuOpen(false)}
            className="hover:text-foreground py-1 transition-colors"
          >
            Study Lenses
          </a>
          <a
            href="#grounding"
            onClick={() => setMobileMenuOpen(false)}
            className="hover:text-foreground py-1 transition-colors"
          >
            Verification Engine
          </a>
          <a
            href="#pipeline"
            onClick={() => setMobileMenuOpen(false)}
            className="hover:text-foreground py-1 transition-colors"
          >
            Pipeline
          </a>
          <div className="pt-2 border-t border-border/50 flex items-center gap-3">
            <Link
              href="/auth"
              onClick={() => setMobileMenuOpen(false)}
              className="text-sm font-medium text-muted-foreground hover:text-foreground"
            >
              Sign In
            </Link>
            <Link
              href="/auth"
              onClick={() => setMobileMenuOpen(false)}
              className="bg-primary text-primary-foreground font-semibold rounded-full px-4 py-1.5 text-sm shadow-xs"
            >
              Sign Up
            </Link>
          </div>
        </nav>
      )}
    </header>
  );
}
