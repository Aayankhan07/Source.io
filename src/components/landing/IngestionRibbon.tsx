"use client";

import { 
  FileText, Mic, Video, FileCode, Cpu, Globe, Database, BookOpen 
} from "lucide-react";

const INGESTION_FORMATS = [
  { icon: FileText, label: "PDF Documents" },
  { icon: Mic, label: "Audio & Speech" },
  { icon: Video, label: "YouTube Lectures" },
  { icon: FileCode, label: "Markdown & DOCX" },
  { icon: Cpu, label: "Whisper Transcription" },
  { icon: Globe, label: "Web Articles" },
  { icon: Database, label: "LaTeX Equations" },
  { icon: BookOpen, label: "EPUB & Textbooks" },
];

export function IngestionRibbon() {
  return (
    <section className="py-6 px-4 sm:px-6 lg:px-8 relative z-10 w-full border-y border-border/80 bg-card/40 backdrop-blur-xs">
      <div className="max-w-6xl mx-auto flex flex-wrap items-center justify-center gap-2 sm:gap-2.5">
        {INGESTION_FORMATS.map((item) => {
          const Icon = item.icon;
          return (
            <div
              key={item.label}
              className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-card border border-border/70 text-xs font-medium text-foreground shadow-xs transition-colors hover:bg-accent/60 select-none"
            >
              <Icon className="h-3.5 w-3.5 text-muted-foreground shrink-0" strokeWidth={1.5} />
              <span>{item.label}</span>
            </div>
          );
        })}
      </div>
    </section>
  );
}
