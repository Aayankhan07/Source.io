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
    <section className="py-6 px-2 relative z-10 w-full flex flex-col items-center justify-center">
      <p className="text-xs sm:text-sm font-medium text-slate-600 dark:text-slate-400 mb-3.5 text-center">
        Upload PDFs, documents, web articles, lecture recordings, audio, or LaTeX files.
      </p>

      {/* Formats Container with Mobile Scroll and Desktop Flex */}
      <div className="w-full max-w-5xl overflow-x-auto no-scrollbar py-1">
        <div className="flex items-center justify-start sm:justify-center gap-2 sm:gap-2.5 min-w-max mx-auto px-2">
          {INGESTION_FORMATS.map((item) => {
            const Icon = item.icon;
            return (
              <div
                key={item.label}
                className="group inline-flex items-center gap-2 px-3.5 py-2 rounded-full border border-slate-200 dark:border-white/10 bg-white/90 dark:bg-slate-900/90 text-slate-800 dark:text-slate-200 text-xs font-medium leading-none shadow-xs hover:-translate-y-0.5 hover:shadow-sm transition-all select-none cursor-default"
              >
                <div className="size-5 rounded-full bg-slate-100 dark:bg-white/10 text-slate-900 dark:text-white flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                  <Icon className="size-3" />
                </div>
                <span>{item.label}</span>
                <span className="text-[10px] font-mono text-slate-400 dark:text-slate-400">
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
