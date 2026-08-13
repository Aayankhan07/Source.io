import { useOutletContext } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Plus, Menu, FileText, Headphones, Sparkles, BookOpen, Clock } from "lucide-react";

export default function AppEmpty() {
  const { openUpload, openMobileNav } = useOutletContext<{
    openUpload: () => void;
    openMobileNav: () => void;
  }>();

  return (
    <div className="h-full flex flex-col bg-background relative overflow-hidden">
      {/* An empty plate, waiting to be drawn. */}
      <div className="absolute inset-0 plate-field opacity-50 pointer-events-none" />

      {/* Mobile top bar */}
      <div className="md:hidden flex items-center justify-between border-b border-border/60 bg-sidebar px-4 py-3 shrink-0">
        <Button variant="ghost" size="icon" onClick={openMobileNav} aria-label="Open navigation" className="text-muted-foreground hover:text-foreground">
          <Menu className="h-5 w-5" />
        </Button>
        <span className="font-semibold text-foreground font-display text-sm">Source.io</span>
        <div className="w-9" />
      </div>

      {/* Main Empty State Content */}
      <div className="flex-1 flex flex-col items-center justify-center text-center px-6 max-w-2xl mx-auto py-12 relative z-10">
        <p className="font-mono text-xs uppercase tracking-widest text-primary mb-4">No plates yet</p>
        <h2 className="text-3xl font-display font-bold text-foreground mb-3 tracking-tight">Add your first source.</h2>
        <p className="text-muted-foreground mb-9 max-w-md leading-relaxed">
          A PDF, a lecture recording, a YouTube link, or text you paste in. Whatever
          you give it becomes notes, flashcards, a quiz, an audio recap, and a chat
          that cites its own sources.
        </p>

        {/* Shortcut Quick Tiles Grid */}
        <div className="grid sm:grid-cols-2 gap-4 w-full mb-8 text-left">
          {[
            {
              icon: FileText,
              title: "Import a source file",
              desc: "Upload local PDF, DOCX, or text files to build formatted study outlines."
            },
            {
              icon: Headphones,
              title: "Draft an audio podcast",
              desc: "Synthesize notes to compile a simulated audio dialogue summary."
            }
          ].map((item, idx) => (
            <button
              key={idx}
              type="button"
              onClick={openUpload}
              className="plate p-4 rounded-sm border border-border/60 hover:border-primary/30 cursor-pointer transition-all flex gap-3 group text-left w-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
            >
              <div className="h-8 w-8 rounded-sm bg-surface-sunken border border-border/60 flex items-center justify-center text-muted-foreground group-hover:text-primary group-hover:bg-primary/10 transition-colors shrink-0">
                <item.icon className="h-4 w-4" />
              </div>
              <div>
                <h4 className="text-xs font-semibold text-foreground font-display mb-1 flex items-center gap-1">
                  {item.title}
                </h4>
                <p className="text-xs text-muted-foreground leading-normal">{item.desc}</p>
              </div>
            </button>
          ))}
        </div>

        <Button 
          onClick={openUpload} 
          size="lg" 
          className="bg-primary hover:bg-primary-glow text-primary-foreground font-semibold px-6 py-5 rounded-sm"
        >
          <Plus className="h-4 w-4 mr-2 shrink-0" />
          <span>Add Study Source</span>
        </Button>
      </div>
    </div>
  );
}
