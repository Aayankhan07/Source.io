"use client";

import { 
  FileText, Mic, Video, FileCode, Cpu, Globe, Database, BookOpen 
} from "lucide-react";

const INGESTION_FORMATS = [
  { icon: FileText, label: "PDF Documents" },
  { icon: Video, label: "YouTube Lectures" },
  { icon: Mic, label: "Audio & Speech" },
  { icon: Database, label: "LaTeX Equations" },
  { icon: Cpu, label: "Whisper Transcription" },
  { icon: FileCode, label: "Markdown & DOCX" },
  { icon: Globe, label: "Web Articles" },
  { icon: BookOpen, label: "EPUB & Textbooks" },
];

export function IngestionRibbon() {
  return (
    <section className="py-6 px-4 sm:px-6 lg:px-8 relative z-10 w-full border-y border-slate-200/80 dark:border-border/80 bg-slate-50/80 dark:bg-[#070A12]/50 backdrop-blur-md">
      <div className="max-w-6xl mx-auto flex flex-wrap items-center justify-center gap-2 sm:gap-3">
        {INGESTION_FORMATS.map((item) => {
          const Icon = item.icon;
          return (
            <div
              key={item.label}
              className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-slate-200/90 dark:border-white/[0.08] bg-white dark:bg-white/[0.03] text-xs font-medium text-slate-700 dark:text-zinc-300 hover:text-cyan-950 dark:hover:text-cyan-100 hover:border-cyan-500/50 dark:hover:border-cyan-500/40 hover:bg-cyan-50/80 dark:hover:bg-cyan-500/10 hover:shadow-[0_0_15px_rgba(6,182,212,0.12)] transition-all duration-200 select-none cursor-default group hover:scale-[1.02] shadow-2xs"
            >
              <Icon className="h-3.5 w-3.5 shrink-0 text-slate-500 dark:text-zinc-400 group-hover:text-cyan-600 dark:group-hover:text-cyan-400 transition-colors" strokeWidth={1.75} />
              <span className="font-medium text-slate-700 dark:text-zinc-300 group-hover:text-cyan-950 dark:group-hover:text-cyan-100">{item.label}</span>
              <span className="h-1.5 w-1.5 rounded-full bg-cyan-500/40 dark:bg-cyan-400/40 group-hover:bg-cyan-500 dark:group-hover:bg-cyan-400 group-hover:shadow-[0_0_8px_rgba(6,182,212,0.6)] transition-all" />
            </div>
          );
        })}
      </div>
    </section>
  );
}
