import { useOutletContext } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Plus, Menu, FileText, Headphones, Sparkles, BookOpen, Clock } from "lucide-react";

export default function AppEmpty() {
  const { openUpload, openMobileNav } = useOutletContext<{
    openUpload: () => void;
    openMobileNav: () => void;
  }>();

  return (
    <div className="h-full flex flex-col bg-[#09090b] relative overflow-hidden">
      {/* Background orbs */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[350px] h-[350px] rounded-full bg-primary/5 blur-[80px] pointer-events-none" />

      {/* Mobile top bar */}
      <div className="md:hidden flex items-center justify-between border-b border-white/5 bg-[#0b0b0e] px-4 py-3 shrink-0">
        <Button variant="ghost" size="icon" onClick={openMobileNav} aria-label="Open navigation" className="text-neutral-400 hover:text-white">
          <Menu className="h-5 w-5" />
        </Button>
        <span className="font-semibold text-white font-display text-sm">Source.io</span>
        <div className="w-9" />
      </div>

      {/* Main Empty State Content */}
      <div className="flex-1 flex flex-col items-center justify-center text-center px-6 max-w-2xl mx-auto py-12 relative z-10">
        <div className="h-14 w-14 rounded-xl flex items-center justify-center mb-6 overflow-hidden border border-white/10 bg-card shadow-glow relative group">
          <img src="/favicon.png" className="h-full w-full object-contain" alt="Logo" />
          <div className="absolute inset-0 bg-primary/10 opacity-0 group-hover:opacity-100 transition-opacity" />
        </div>
        
        <h2 className="text-2xl font-bold text-white mb-2 font-display">Create Your First Study Asset</h2>
        <p className="text-neutral-400 text-sm mb-8 max-w-md leading-relaxed">
          Source.io transforms static files and audio links into active revision guides, conversational recap podcasts, and a grounded QA chatbot.
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
            <div 
              key={idx}
              onClick={openUpload}
              className="glass-panel p-4 rounded-xl border border-white/5 hover:border-primary/30 cursor-pointer transition-all flex gap-3 group"
            >
              <div className="h-8 w-8 rounded-lg bg-neutral-900 border border-white/5 flex items-center justify-center text-neutral-400 group-hover:text-primary group-hover:bg-primary/10 transition-colors shrink-0">
                <item.icon className="h-4 w-4" />
              </div>
              <div>
                <h4 className="text-xs font-semibold text-white font-display mb-1 flex items-center gap-1">
                  {item.title}
                </h4>
                <p className="text-[11px] text-neutral-500 leading-normal">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>

        <Button 
          onClick={openUpload} 
          size="lg" 
          className="bg-primary hover:bg-primary-glow text-primary-foreground font-semibold px-6 py-5 rounded-xl shadow-glow"
        >
          <Plus className="h-4 w-4 mr-2 shrink-0" />
          <span>Add Study Source</span>
        </Button>
      </div>
    </div>
  );
}
