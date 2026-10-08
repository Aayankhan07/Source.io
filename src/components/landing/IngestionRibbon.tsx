"use client";

import { 
  FileText, Mic, Video, FileCode, Globe, Database, BookOpen 
} from "lucide-react";

const INGESTION_FORMATS = [
  { icon: FileText, label: "PDF Documents", tag: "PDF" },
  { icon: Video, label: "Lecture Videos", tag: "YouTube, MP4" },
  { icon: Mic, label: "Audio Recordings", tag: "MP3, WAV" },
  { icon: Database, label: "Research Papers", tag: "LaTeX, arXiv" },
  { icon: Globe, label: "Web Articles", tag: "URLs" },
  { icon: FileCode, label: "Markdown & Word", tag: "MD, DOCX" },
  { icon: BookOpen, label: "EPUB Textbooks", tag: "EPUB" },
];

export function IngestionRibbon() {
  return (
    <section className="py-6 px-0 relative z-10 w-full flex flex-col items-center justify-center overflow-hidden">
      <p className="text-xs sm:text-sm font-medium text-slate-600 dark:text-slate-400 mb-3.5 text-center px-4">
        Upload PDFs, documents, web articles, lecture recordings, audio, or LaTeX files.
      </p>

      {/* Moving Ribbon Track with Edge Fade Masks */}
      <div className="w-full relative overflow-hidden py-1 [mask-image:linear-gradient(to_right,transparent,black_10%,black_90%,transparent)]">
        <div className="flex w-max animate-marquee hover:[animation-play-state:paused] gap-2 sm:gap-2.5">
          {/* First set of items */}
          <div className="flex items-center gap-2 sm:gap-2.5 shrink-0">
            {INGESTION_FORMATS.map((item) => {
              const Icon = item.icon;
              return (
                <div
                  key={`track-1-${item.label}`}
                  className="group inline-flex items-center gap-2 px-3.5 py-2 rounded-full border border-slate-200 dark:border-white/10 bg-white/95 dark:bg-slate-900/95 text-slate-800 dark:text-slate-200 text-xs font-medium leading-none shadow-xs hover:-translate-y-0.5 hover:shadow-sm transition-all select-none cursor-default"
                >
                  <div className="size-5 rounded-full bg-slate-100 dark:bg-white/10 text-slate-900 dark:white flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                    <Icon className="size-3" />
                  </div>
                  <span className="whitespace-nowrap">{item.label}</span>
                  <span className="text-[10px] font-mono text-slate-400 dark:text-slate-400 whitespace-nowrap">
                    {item.tag}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Duplicate set of items for seamless loop */}
          <div className="flex items-center gap-2 sm:gap-2.5 shrink-0" aria-hidden="true">
            {INGESTION_FORMATS.map((item) => {
              const Icon = item.icon;
              return (
                <div
                  key={`track-2-${item.label}`}
                  className="group inline-flex items-center gap-2 px-3.5 py-2 rounded-full border border-slate-200 dark:border-white/10 bg-white/95 dark:bg-slate-900/95 text-slate-800 dark:text-slate-200 text-xs font-medium leading-none shadow-xs hover:-translate-y-0.5 hover:shadow-sm transition-all select-none cursor-default"
                >
                  <div className="size-5 rounded-full bg-slate-100 dark:bg-white/10 text-slate-900 dark:white flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                    <Icon className="size-3" />
                  </div>
                  <span className="whitespace-nowrap">{item.label}</span>
                  <span className="text-[10px] font-mono text-slate-400 dark:text-slate-400 whitespace-nowrap">
                    {item.tag}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
