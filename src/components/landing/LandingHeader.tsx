"use client";

import { useState } from "react";
import Link from "next/link";
import { useAuth } from "@/features/auth/context/AuthContext";
import { useTheme } from "@/hooks/use-theme";
import { Sparkles, ArrowRight, Menu, X, Sun, Moon } from "lucide-react";
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
    <header className="sticky top-3 sm:top-5 z-50 px-3 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto bg-card/85 backdrop-blur-xl border border-border/80 rounded-full px-4 sm:px-6 py-2.5 shadow-sm transition-colors">
        <div className="flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 group">
            <div className="h-6 w-6 rounded-full bg-primary flex items-center justify-center text-primary-foreground transition-transform group-hover:scale-105">
              <Sparkles className="h-3 w-3" strokeWidth={1.5} />
            </div>
            <span className="font-semibold tracking-tight text-sm font-display text-foreground">
              Source<span className="text-muted-foreground">.io</span>
            </span>
          </Link>

          <nav className="hidden md:flex items-center gap-6 text-xs font-medium text-muted-foreground">
            <a href="#workbench" className="hover:text-foreground transition-colors">
              The 5 Views
            </a>
            <a href="#grounding" className="hover:text-foreground transition-colors">
              Verification Engine
            </a>
            <a href="#pipeline" className="hover:text-foreground transition-colors">
              Pipeline
            </a>
            <a href="#comparison" className="hover:text-foreground transition-colors">
              Comparison
            </a>
          </nav>

          <div className="flex items-center gap-2 sm:gap-2.5">
            <TooltipProvider delayDuration={150}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    type="button"
                    onClick={toggleTheme}
                    className="h-8 w-8 flex items-center justify-center rounded-full text-muted-foreground hover:text-foreground hover:bg-accent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring cursor-pointer"
                    aria-label={!mounted || theme === "dark" ? "Switch to light theme" : "Switch to dark theme"}
                  >
                    {!mounted || theme === "dark" ? (
                      <Sun className="h-4 w-4" strokeWidth={1.5} />
                    ) : (
                      <Moon className="h-4 w-4" strokeWidth={1.5} />
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

            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden h-8 w-8 flex items-center justify-center rounded-full text-muted-foreground hover:text-foreground hover:bg-accent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              aria-label="Toggle navigation menu"
              aria-expanded={mobileMenuOpen}
            >
              {mobileMenuOpen ? (
                <X className="h-4 w-4" strokeWidth={1.5} />
              ) : (
                <Menu className="h-4 w-4" strokeWidth={1.5} />
              )}
            </button>

            {mounted && user ? (
              <Link
                href="/app"
                className="border border-border/80 bg-background/60 hover:bg-accent text-foreground rounded-full px-4 py-1.5 text-xs font-medium shadow-xs inline-flex items-center gap-1.5 active:scale-[0.98] transition-all"
              >
                Workspace
                <ArrowRight className="h-3 w-3 text-muted-foreground" strokeWidth={1.5} />
              </Link>
            ) : (
              <>
                <Link
                  href="/auth"
                  className="text-xs font-medium text-muted-foreground hover:text-foreground px-2.5 py-1.5 transition-colors hidden sm:inline-block"
                >
                  Sign in
                </Link>
                <Link
                  href="/auth"
                  className="border border-border/80 bg-background/60 hover:bg-accent text-foreground font-medium rounded-full px-4 py-1.5 text-xs shadow-xs inline-flex items-center gap-1.5 active:scale-[0.98] transition-all"
                >
                  Get started
                </Link>
              </>
            )}
          </div>
        </div>

        {/* Mobile dropdown navigation */}
        {mobileMenuOpen && (
          <nav className="md:hidden mt-3 pt-3 border-t border-border/70 flex flex-col gap-2 text-xs font-medium text-muted-foreground pb-1 animate-in fade-in-50 duration-150">
            <a
              href="#workbench"
              onClick={() => setMobileMenuOpen(false)}
              className="hover:text-foreground py-1 transition-colors"
            >
              The 5 Views
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
            <a
              href="#comparison"
              onClick={() => setMobileMenuOpen(false)}
              className="hover:text-foreground py-1 transition-colors"
            >
              Comparison & FAQ
            </a>
          </nav>
        )}
      </div>
    </header>
  );
}
