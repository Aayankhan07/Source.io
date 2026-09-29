import { useNavigate, useOutletContext } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Plus, Menu, FileText, Sparkles, BookOpen, ArrowRight, Layers, Cpu, Play } from "lucide-react";

export default function AppEmpty() {
  const navigate = useNavigate();
  const { openUpload, openMobileNav } = useOutletContext<{
    openUpload: () => void;
    openMobileNav: () => void;
  }>();

  return (
    <div className="h-full flex flex-col bg-background relative overflow-hidden">
      {/* Mobile top bar */}
      <div className="md:hidden flex items-center justify-between border-b border-border bg-sidebar px-4 py-3 shrink-0">
        <Button
          variant="ghost"
          size="icon"
          onClick={openMobileNav}
          aria-label="Open navigation"
          className="text-muted-foreground hover:text-foreground"
        >
          <Menu className="h-5 w-5" />
        </Button>
        <span className="font-semibold text-foreground font-display text-sm">Source.io</span>
        <div className="w-9" />
      </div>

      {/* Main Empty State Content */}
      <div className="flex-1 flex flex-col items-center justify-center text-center px-6 max-w-xl mx-auto py-12 relative z-10">
        {/* Soft Ambient Center Icon */}
        <div className="h-16 w-16 rounded-full bg-slate-900 dark:bg-card border border-transparent dark:border-border text-white dark:text-sky-400 flex items-center justify-center mb-6 shadow-md">
          <Sparkles className="h-7 w-7 text-sky-400 dark:text-sky-400" />
        </div>

        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-card border border-border text-foreground text-xs font-mono uppercase tracking-wider mb-4 shadow-2xs">
          <span>Source Studio Active</span>
        </div>

        <h2 className="text-3xl sm:text-4xl font-display font-semibold text-foreground mb-3 tracking-tight">
          Select or import study material
        </h2>
        <p className="text-sm text-muted-foreground mb-8 max-w-md leading-relaxed">
          Upload any PDF, audio, YouTube lecture, or notes. Source.io converts it into structured study notes, spaced flashcards, adaptive quizzes, audio recap podcasts, and grounded chat.
        </p>

        {/* Quick Launch Sample Documents */}
        <div className="grid sm:grid-cols-2 gap-3.5 w-full mb-8 text-left">
          <button
            type="button"
            onClick={() => navigate("/app/doc/demo-quantum")}
            className="p-4 rounded-2xl bg-card border border-border/80 hover:border-sky-500/40 hover:shadow-xs cursor-pointer transition-all flex gap-3 text-left w-full group focus-ring"
          >
            <div className="h-8 w-8 rounded-xl bg-sky-50 dark:bg-sky-500/10 border border-sky-100 dark:border-sky-500/30 flex items-center justify-center text-sky-700 dark:text-sky-400 shrink-0 group-hover:scale-105 transition-transform">
              <Cpu className="h-4 w-4" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between mb-0.5">
                <h4 className="text-xs font-semibold text-foreground truncate">
                  Quantum Computing
                </h4>
                <ArrowRight className="h-3.5 w-3.5 text-muted-foreground group-hover:text-foreground group-hover:translate-x-0.5 transition-all shrink-0 ml-1" />
              </div>
              <p className="text-[11px] text-muted-foreground leading-normal">
                Notes, 4 flashcards, 3-question quiz & audio recap ready.
              </p>
            </div>
          </button>

          <button
            type="button"
            onClick={() => navigate("/app/doc/demo-linalg")}
            className="p-4 rounded-2xl bg-card border border-border/80 hover:border-sky-500/40 hover:shadow-xs cursor-pointer transition-all flex gap-3 text-left w-full group focus-ring"
          >
            <div className="h-8 w-8 rounded-xl bg-sky-50 dark:bg-sky-500/10 border border-sky-100 dark:border-sky-500/30 flex items-center justify-center text-sky-700 dark:text-sky-400 shrink-0 group-hover:scale-105 transition-transform">
              <FileText className="h-4 w-4" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between mb-0.5">
                <h4 className="text-xs font-semibold text-foreground truncate">
                  Linear Algebra Lecture
                </h4>
                <ArrowRight className="h-3.5 w-3.5 text-muted-foreground group-hover:text-foreground group-hover:translate-x-0.5 transition-all shrink-0 ml-1" />
              </div>
              <p className="text-[11px] text-muted-foreground leading-normal">
                Eigenvalues, spectral decomposition & flashcards.
              </p>
            </div>
          </button>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-3">
          <Button
            onClick={openUpload}
            size="lg"
            className="bg-slate-900 hover:bg-slate-800 dark:bg-sky-500 dark:hover:bg-sky-400 text-white font-semibold px-7 py-3 rounded-full shadow-sm text-xs sm:text-sm"
          >
            <Plus className="h-4 w-4 mr-2 shrink-0 text-white" />
            <span>Upload New Material</span>
          </Button>
          <Button
            onClick={() => navigate("/app/doc/demo-quantum")}
            variant="outline"
            size="lg"
            className="border-border text-foreground hover:bg-accent rounded-full text-xs sm:text-sm"
          >
            <Play className="h-3.5 w-3.5 mr-1.5 text-sky-600 dark:text-sky-400" />
            <span>Open Sample Document</span>
          </Button>
        </div>
      </div>
    </div>
  );
}
