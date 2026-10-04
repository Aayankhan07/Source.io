"use client";

import { 
  FileText, Mic, Video, FileCode, Cpu, Globe, Database, BookOpen 
} from "lucide-react";

const INGESTION_FORMATS = [
  { 
    icon: FileText, 
    label: "PDF Documents", 
    colorClass: "text-amber-400 bg-amber-500/10 border-amber-500/25 hover:border-amber-500/50 shadow-[0_0_12px_rgba(245,158,11,0.08)]",
    dotClass: "bg-amber-400"
  },
  { 
    icon: Video, 
    label: "YouTube Lectures", 
    colorClass: "text-rose-400 bg-rose-500/10 border-rose-500/25 hover:border-rose-500/50 shadow-[0_0_12px_rgba(244,63,94,0.08)]",
    dotClass: "bg-rose-400"
  },
  { 
    icon: Mic, 
    label: "Audio & Speech", 
    colorClass: "text-emerald-400 bg-emerald-500/10 border-emerald-500/25 hover:border-emerald-500/50 shadow-[0_0_12px_rgba(16,185,129,0.08)]",
    dotClass: "bg-emerald-400"
  },
  { 
    icon: Database, 
    label: "LaTeX Equations", 
    colorClass: "text-cyan-400 bg-cyan-500/10 border-cyan-500/25 hover:border-cyan-500/50 shadow-[0_0_12px_rgba(6,182,212,0.08)]",
    dotClass: "bg-cyan-400"
  },
  { 
    icon: Cpu, 
    label: "Whisper Transcription", 
    colorClass: "text-teal-400 bg-teal-500/10 border-teal-500/25 hover:border-teal-500/50 shadow-[0_0_12px_rgba(20,184,166,0.08)]",
    dotClass: "bg-teal-400"
  },
  { 
    icon: FileCode, 
    label: "Markdown & DOCX", 
    colorClass: "text-violet-400 bg-violet-500/10 border-violet-500/25 hover:border-violet-500/50 shadow-[0_0_12px_rgba(139,92,246,0.08)]",
    dotClass: "bg-violet-400"
  },
  { 
    icon: Globe, 
    label: "Web Articles", 
    colorClass: "text-sky-400 bg-sky-500/10 border-sky-500/25 hover:border-sky-500/50 shadow-[0_0_12px_rgba(14,165,233,0.08)]",
    dotClass: "bg-sky-400"
  },
  { 
    icon: BookOpen, 
    label: "EPUB & Textbooks", 
    colorClass: "text-indigo-400 bg-indigo-500/10 border-indigo-500/25 hover:border-indigo-500/50 shadow-[0_0_12px_rgba(99,102,241,0.08)]",
    dotClass: "bg-indigo-400"
  },
];

export function IngestionRibbon() {
  return (
    <section className="py-6 px-4 sm:px-6 lg:px-8 relative z-10 w-full border-y border-border/80 bg-card/40 backdrop-blur-md">
      <div className="max-w-6xl mx-auto flex flex-wrap items-center justify-center gap-2 sm:gap-3">
        {INGESTION_FORMATS.map((item) => {
          const Icon = item.icon;
          return (
            <div
              key={item.label}
              className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border text-xs font-medium transition-all duration-200 select-none cursor-default group hover:scale-[1.02] ${item.colorClass}`}
            >
              <Icon className="h-3.5 w-3.5 shrink-0 transition-transform group-hover:scale-110" strokeWidth={1.75} />
              <span className="text-foreground/90 font-medium">{item.label}</span>
              <span className={`h-1.5 w-1.5 rounded-full ${item.dotClass} opacity-70 group-hover:opacity-100 transition-opacity`} />
            </div>
          );
        })}
      </div>
    </section>
  );
}
