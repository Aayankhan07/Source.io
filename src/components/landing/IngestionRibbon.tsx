"use client";

import { 
  FileText, Mic, Video, FileCode, Cpu, Globe, Database, BookOpen 
} from "lucide-react";

const INGESTION_FORMATS = [
  { icon: FileText, label: "PDF Documents" },
  { icon: Video, label: "YouTube Lectures" },
  { icon: Mic, label: "Audio & Speech" },
  { icon: Database, label: "LaTeX Equations" },
  { icon: Cpu, label: "Whisper ASR" },
  { icon: FileCode, label: "Markdown & DOCX" },
  { icon: Globe, label: "Web Articles" },
  { icon: BookOpen, label: "EPUB Textbooks" },
];

export function IngestionRibbon() {
  return (
    <section className="py-4 px-2 relative z-10 w-full flex flex-col items-center justify-center">
      <div className="p-3 sm:p-4 rounded-[36px] bg-card/80 dark:bg-card/50 backdrop-blur-xl border border-border/80 shadow-[0_12px_30px_-10px_rgba(0,0,0,0.06)] dark:shadow-[0_12px_30px_-10px_rgba(0,0,0,0.35)] flex flex-wrap items-center justify-center gap-2 sm:gap-3 max-w-4xl relative">
        {INGESTION_FORMATS.map((item) => {
          const Icon = item.icon;
          return (
            <div
              key={item.label}
              className="group inline-flex items-center gap-2 px-4 py-2 rounded-full border border-border/70 bg-background/90 hover:bg-muted/80 text-foreground text-xs font-medium leading-none shadow-xs hover:-translate-y-0.5 hover:shadow-sm transition-all select-none cursor-default"
            >
              <div className="size-5 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                <Icon className="size-3" />
              </div>
              <span>{item.label}</span>
              <span className="size-1.5 rounded-full bg-amber-400/80 dark:bg-amber-400/90 shadow-2xs" aria-hidden="true" />
            </div>
          );
        })}
      </div>
    </section>
  );
}
