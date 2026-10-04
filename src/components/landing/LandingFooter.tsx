"use client";

import Link from "next/link";
import { Sparkles } from "lucide-react";

export function LandingFooter() {
  return (
    <footer className="px-4 sm:px-6 lg:px-8 pb-12 max-w-6xl mx-auto relative z-10 border-t border-border/80 pt-12 w-full text-left">
      <div className="space-y-10">
        <div className="flex flex-col md:flex-row items-start justify-between gap-8">
          <div className="space-y-3 max-w-sm">
            <Link href="/" className="flex items-center gap-2 group">
              <div className="h-6 w-6 rounded-full bg-primary flex items-center justify-center text-primary-foreground transition-transform group-hover:scale-105">
                <Sparkles className="h-3 w-3" strokeWidth={1.5} />
              </div>
              <span className="font-semibold text-sm font-display text-foreground">
                Source<span className="text-muted-foreground">.io</span>
              </span>
            </Link>
            <p className="text-xs text-muted-foreground leading-relaxed">
              The multi-modal intelligence workspace that synthesizes complex documents into verified study notes, active recall systems, and cited dialogues.
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-8 text-xs">
            <div>
              <span className="font-mono text-foreground font-semibold block mb-3">Product</span>
              <ul className="space-y-2 text-muted-foreground">
                <li><a href="#workbench" className="hover:text-foreground transition-colors">The 5 Views</a></li>
                <li><a href="#grounding" className="hover:text-foreground transition-colors">Verification Engine</a></li>
                <li><a href="#pipeline" className="hover:text-foreground transition-colors">4-Stage Pipeline</a></li>
                <li><a href="#comparison" className="hover:text-foreground transition-colors">Comparison &amp; FAQ</a></li>
              </ul>
            </div>

            <div>
              <span className="font-mono text-foreground font-semibold block mb-3">Grounding</span>
              <ul className="space-y-2 text-muted-foreground">
                <li><span className="text-muted-foreground">Whisper ASR</span></li>
                <li><span className="text-muted-foreground">Groq Llama 3.3-70b</span></li>
                <li><span className="text-muted-foreground">pgvector Coordinates</span></li>
                <li><span className="text-muted-foreground">Citation Engine</span></li>
              </ul>
            </div>

            <div>
              <span className="font-mono text-foreground font-semibold block mb-3">Platform</span>
              <ul className="space-y-2 text-muted-foreground">
                <li><Link href="/auth" className="hover:text-foreground transition-colors">Sign in</Link></li>
                <li><Link href="/auth" className="hover:text-foreground transition-colors">Create account</Link></li>
                <li><span className="text-muted-foreground">Zero-Data Retention</span></li>
                <li><span className="text-muted-foreground">MIT License</span></li>
              </ul>
            </div>
          </div>
        </div>

        <div className="pt-6 border-t border-border/70 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-muted-foreground">
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>All inference pipelines operational</span>
          </div>
          <div className="font-mono">
            &copy; {new Date().getFullYear()} Source.io • Built for anyone with a document
          </div>
        </div>
      </div>
    </footer>
  );
}
