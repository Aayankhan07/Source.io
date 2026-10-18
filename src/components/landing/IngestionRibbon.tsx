"use client";

import { 
  FileText, Mic, Video, FileCode, Globe, Database, BookOpen 
} from "lucide-react";

const INGESTION_FORMATS = [
  { icon: FileText, label: "PDF Documents", tag: "PDF" },
  { icon: Video, label: "Lecture Videos", tag: "YouTube, MP4" },
  { icon: Mic, label: "Audio Seminars", tag: "MP3, WAV, M4A" },
  { icon: FileCode, label: "Word & Documents", tag: "DOCX, Text" },
  { icon: Globe, label: "Web Articles", tag: "URLs" },
  { icon: Database, label: "Research Papers", tag: "Dense PDF" },
];

export function IngestionRibbon() {
  return (
    <section className="py-4 sm:py-12 px-0 relative z-10 w-full flex flex-col items-center justify-center overflow-hidden">
      <p className="text-xs sm:text-sm font-medium text-slate-600 mb-3.5 text-center px-4">
        Ingest textbooks, lecture recordings, papers, and notes with automatic coordinate mapping.
      </p>

      {/* Centered Static Array on Desktop / Smooth Horizontal Swipe Track on Mobile */}
      <div className="w-full max-w-6xl mx-auto px-4 pt-2">
        <div className="flex flex-nowrap overflow-x-auto scrollbar-none snap-x lg:overflow-x-visible items-center justify-start lg:justify-center gap-2 sm:gap-2.5 lg:gap-3 pb-2 lg:pb-0 px-1 lg:px-0">
          {INGESTION_FORMATS.map((item) => {
            const Icon = item.icon;
            return (
              <div
                key={item.label}
                className="group inline-flex items-center gap-2 px-3.5 py-2 rounded-full border border-slate-200/90 bg-white/95 text-slate-800 text-xs font-medium leading-none shadow-xs hover:-translate-y-0.5 hover:shadow-md hover:border-slate-400 hover:bg-white transition-all duration-200 select-none cursor-pointer shrink-0 snap-center"
              >
                <div className="size-6 rounded-full bg-slate-100 text-slate-900 flex items-center justify-center shrink-0 group-hover:bg-slate-900 group-hover:text-white transition-colors duration-200">
                  <Icon className="size-3.5 group-hover:scale-110 transition-transform duration-200" />
                </div>
                <span className="whitespace-nowrap group-hover:text-slate-950 font-medium transition-colors">
                  {item.label}
                </span>
                <span className="text-[10px] font-mono text-slate-500 group-hover:text-slate-900 whitespace-nowrap transition-colors">
                  {item.tag}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
