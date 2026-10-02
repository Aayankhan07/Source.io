"use client";

import { useState } from "react";
import { DocumentRow } from "@/features/documents/types";
import {
  FileText,
  Mic,
  Video,
  Youtube,
  FileType2,
  MoreVertical,
  Trash2,
  Copy,
  ExternalLink,
  Layers,
  Headphones,
  MessagesSquare,
  ListChecks,
  Check,
  Loader2,
  Clock,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";

const sourceIconMap = {
  pdf: FileType2,
  docx: FileType2,
  text: FileText,
  audio: Mic,
  video: Video,
  youtube: Youtube,
} as const;

interface DocumentCardBentoProps {
  document: DocumentRow;
  onDelete?: (id: string) => void;
}

export default function DocumentCardBento({
  document: doc,
  onDelete,
}: DocumentCardBentoProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);

  const SourceIcon = sourceIconMap[doc.source_type as keyof typeof sourceIconMap] || FileText;

  const handleCopyLink = (e: React.MouseEvent) => {
    e.stopPropagation();
    const url = `${window.location.origin}/app/doc/${doc.id}`;
    navigator.clipboard.writeText(url);
    setCopied(true);
    toast({ title: "Link copied", description: "Document link copied to clipboard." });
    setTimeout(() => setCopied(false), 2000);
  };

  const formattedDate = new Date(doc.created_at).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });

  return (
    <div
      onClick={() => router.push(`/app/doc/${doc.id}`)}
      className="p-5 rounded-2xl sm:rounded-3xl bg-card border border-border/80 hover:border-primary/40 shadow-xs hover:shadow-md transition-[color,background-color,border-color,box-shadow,transform] duration-200 cursor-pointer flex flex-col justify-between group relative overflow-hidden"
    >
      {/* Top Meta Row */}
      <div>
        <div className="flex items-center justify-between gap-2 mb-3.5">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-xl bg-surface-sunken border border-border/70 flex items-center justify-center text-primary group-active:scale-95 transition-transform shrink-0">
              <SourceIcon className="h-4 w-4" />
            </div>
            <Badge
              variant="outline"
              className="text-[10px] uppercase font-mono tracking-wider border-border/80 text-muted-foreground bg-muted/50 px-2 py-0.5 rounded-full"
            >
              {doc.source_type}
            </Badge>
          </div>

          <div className="flex items-center gap-1">
            {/* Status indicator */}
            {doc.status === "ready" && (
              <span className="flex items-center gap-1 text-[10px] text-emerald-600 dark:text-emerald-400 font-mono font-medium bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800/40">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                Ready
              </span>
            )}
            {doc.status === "processing" || doc.status === "pending" ? (
              <span className="flex items-center gap-1 text-[10px] text-zinc-700 dark:text-zinc-300 font-mono font-medium bg-zinc-100 dark:bg-zinc-800/80 px-2 py-0.5 rounded-full border border-zinc-200 dark:border-zinc-700">
                <Loader2 className="h-2.5 w-2.5 animate-spin text-zinc-600 dark:text-zinc-400" />
                Ingesting
              </span>
            ) : null}

            {/* Context Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 rounded-full text-muted-foreground hover:text-foreground opacity-60 group-hover:opacity-100"
                >
                  <MoreVertical className="h-3.5 w-3.5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-44 rounded-xl">
                <DropdownMenuItem onClick={() => router.push(`/app/doc/${doc.id}`)}>
                  <ExternalLink className="mr-2 h-3.5 w-3.5 text-muted-foreground" />
                  <span>Open Studio</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleCopyLink}>
                  <Copy className="mr-2 h-3.5 w-3.5 text-muted-foreground" />
                  <span>{copied ? "Copied!" : "Copy Link"}</span>
                </DropdownMenuItem>
                {onDelete && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={(e) => {
                        e.stopPropagation();
                        onDelete(doc.id);
                      }}
                      className="text-destructive focus:text-destructive"
                    >
                      <Trash2 className="mr-2 h-3.5 w-3.5" />
                      <span>Delete</span>
                    </DropdownMenuItem>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Title */}
        <h3 className="text-sm sm:text-base font-semibold text-foreground tracking-tight line-clamp-2 mb-2 font-display group-hover:text-primary transition-colors">
          {doc.title}
        </h3>

        <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground font-mono mb-4">
          <Clock className="h-3 w-3 text-muted-foreground/60" />
          <span>Added {formattedDate}</span>
        </div>
      </div>

      {/* 1-Click Deep Jump Action Pills */}
      <div className="pt-3 border-t border-border/60 flex items-center gap-1.5 flex-wrap">
        <button
          onClick={(e) => {
            e.stopPropagation();
            router.push(`/app/doc/${doc.id}`);
          }}
          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-medium bg-muted/60 hover:bg-muted text-muted-foreground hover:text-foreground border border-border/60 transition-colors"
          title="Open Notes"
        >
          <FileText className="h-3 w-3 text-sky-600 dark:text-zinc-300" />
          <span>Notes</span>
        </button>

        <button
          onClick={(e) => {
            e.stopPropagation();
            router.push(`/app/doc/${doc.id}`);
          }}
          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-medium bg-muted/60 hover:bg-muted text-muted-foreground hover:text-foreground border border-border/60 transition-colors"
          title="Review Flashcards"
        >
          <Layers className="h-3 w-3 text-rose-500" />
          <span>Cards</span>
        </button>

        <button
          onClick={(e) => {
            e.stopPropagation();
            router.push(`/app/doc/${doc.id}`);
          }}
          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-medium bg-muted/60 hover:bg-muted text-muted-foreground hover:text-foreground border border-border/60 transition-colors"
          title="Practice Quiz"
        >
          <ListChecks className="h-3 w-3 text-emerald-500" />
          <span>Quiz</span>
        </button>

        <button
          onClick={(e) => {
            e.stopPropagation();
            router.push(`/app/doc/${doc.id}`);
          }}
          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-medium bg-muted/60 hover:bg-muted text-muted-foreground hover:text-foreground border border-border/60 transition-colors"
          title="Listen Podcast"
        >
          <Headphones className="h-3 w-3 text-amber-500" />
          <span>Recap</span>
        </button>
      </div>
    </div>
  );
}
