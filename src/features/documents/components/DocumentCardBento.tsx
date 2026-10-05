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
  ListChecks,
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
import { StatusBadge, getStatusTone } from "@/components/ui/status-badge";
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
      className="p-4 rounded-xl bg-card border border-border/80 hover:bg-muted/40 shadow-xs hover:shadow-sm transition-all duration-150 cursor-pointer flex flex-col justify-between group relative overflow-hidden"
    >
      {/* Top Meta Row */}
      <div>
        <div className="flex items-center justify-between gap-2 mb-3">
          <div className="flex items-center gap-2">
            <div className="size-7 rounded-md bg-muted/60 border border-border/70 flex items-center justify-center text-primary group-active:scale-[0.98] transition-transform shrink-0">
              <SourceIcon className="size-3.5" />
            </div>
            <span className="text-[11px] font-mono capitalize text-muted-foreground bg-muted/40 border border-border/60 px-2 py-0.5 rounded-full">
              {doc.source_type}
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            {/* Status indicator via StatusBadge */}
            <StatusBadge tone={getStatusTone(doc.status)}>
              <span className="capitalize">{doc.status}</span>
            </StatusBadge>

            {/* Context Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                <Button
                  hierarchy="tertiary-gray"
                  size="icon-sm"
                  className="size-7 rounded-md text-muted-foreground hover:text-foreground opacity-60 group-hover:opacity-100"
                >
                  <MoreVertical className="size-3.5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-40 rounded-lg">
                <DropdownMenuItem onClick={() => router.push(`/app/doc/${doc.id}`)}>
                  <ExternalLink className="mr-2 size-3.5 text-muted-foreground" />
                  <span>Open studio</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleCopyLink}>
                  <Copy className="mr-2 size-3.5 text-muted-foreground" />
                  <span>{copied ? "Copied!" : "Copy link"}</span>
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
                      <Trash2 className="mr-2 size-3.5" />
                      <span>Delete</span>
                    </DropdownMenuItem>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Title */}
        <h3 className="text-sm font-semibold text-foreground tracking-tight line-clamp-2 mb-1.5 group-hover:text-primary transition-colors">
          {doc.title}
        </h3>

        <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground font-mono mb-3.5">
          <Clock className="size-3 text-muted-foreground/60" />
          <span>Added {formattedDate}</span>
        </div>
      </div>

      {/* 1-Click Deep Jump Action Pills */}
      <div className="pt-2.5 border-t border-border/60 flex items-center gap-1.5 flex-wrap">
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            router.push(`/app/doc/${doc.id}`);
          }}
          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium bg-muted/50 hover:bg-muted text-muted-foreground hover:text-foreground border border-border/60 transition-colors"
          title="Open Notes"
        >
          <FileText className="size-3 text-blue-900 dark:text-blue-400" />
          <span>Notes</span>
        </button>

        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            router.push(`/app/doc/${doc.id}`);
          }}
          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium bg-muted/50 hover:bg-muted text-muted-foreground hover:text-foreground border border-border/60 transition-colors"
          title="Review Flashcards"
        >
          <Layers className="size-3 text-amber-600 dark:text-amber-400" />
          <span>Cards</span>
        </button>

        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            router.push(`/app/doc/${doc.id}`);
          }}
          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium bg-muted/50 hover:bg-muted text-muted-foreground hover:text-foreground border border-border/60 transition-colors"
          title="Practice Quiz"
        >
          <ListChecks className="size-3 text-emerald-600 dark:text-emerald-400" />
          <span>Quiz</span>
        </button>

        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            router.push(`/app/doc/${doc.id}`);
          }}
          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium bg-muted/50 hover:bg-muted text-muted-foreground hover:text-foreground border border-border/60 transition-colors"
          title="Listen Podcast"
        >
          <Headphones className="size-3 text-sky-600 dark:text-sky-400" />
          <span>Recap</span>
        </button>
      </div>
    </div>
  );
}
