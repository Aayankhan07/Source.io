"use client";

import Link from "next/link";

export function LandingFooter() {
  return (
    <footer className="px-4 sm:px-6 pb-12 mx-auto relative z-10 border-t border-border/60 pt-14 w-full text-left">
      <div className="space-y-10">
        <div className="flex flex-col md:flex-row items-start justify-between gap-8">
          <div className="space-y-2.5 max-w-sm">
            <Link href="/" className="inline-block select-none hover:opacity-90 transition-opacity">
              <span className="font-bold text-xl font-sans text-foreground">
                Source<span className="text-primary font-medium">.io</span>
              </span>
            </Link>
            <p className="text-[13px] leading-[20px] text-muted-foreground">
              The multimodal intelligence workspace that synthesizes complex documents into verified study notes, active recall systems, and cited dialogues.
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-8 text-[13px]">
            <div>
              <span className="font-medium text-foreground block mb-2.5">Product</span>
              <ul className="space-y-2 text-muted-foreground">
                <li><a href="#workbench" className="hover:text-foreground transition-colors">Study Lenses</a></li>
                <li><a href="#grounding" className="hover:text-foreground transition-colors">Verification Engine</a></li>
                <li><a href="#pipeline" className="hover:text-foreground transition-colors">Pipeline</a></li>
                <li><a href="#comparison" className="hover:text-foreground transition-colors">Comparison &amp; FAQ</a></li>
              </ul>
            </div>

            <div>
              <span className="font-medium text-foreground block mb-2.5">Grounding</span>
              <ul className="space-y-2 text-muted-foreground">
                <li><span className="text-muted-foreground">Whisper ASR</span></li>
                <li><span className="text-muted-foreground">Groq Llama 3.3-70b</span></li>
                <li><span className="text-muted-foreground">pgvector Coordinates</span></li>
                <li><span className="text-muted-foreground">Citation Engine</span></li>
              </ul>
            </div>

            <div>
              <span className="font-medium text-foreground block mb-2.5">Platform</span>
              <ul className="space-y-2 text-muted-foreground">
                <li><Link href="/auth" className="hover:text-foreground transition-colors">Sign in</Link></li>
                <li><Link href="/auth" className="hover:text-foreground transition-colors">Create account</Link></li>
                <li><span className="text-muted-foreground">Zero-Data Retention</span></li>
                <li><span className="text-muted-foreground">MIT License</span></li>
              </ul>
            </div>
          </div>
        </div>

        <div className="pt-5 border-t border-border/60 flex flex-col sm:flex-row items-center justify-between gap-3 text-[11px] text-muted-foreground">
          <div className="flex items-center gap-2">
            <span className="size-1.5 rounded-full bg-primary shadow-[0_0_6px_hsl(var(--primary)/0.7)]" aria-hidden="true" />
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
