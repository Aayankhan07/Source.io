"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/features/auth/context/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useRouter } from "next/navigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { 
  Loader2, 
  Upload, 
  FileText, 
  Youtube, 
  CloudLightning, 
  FileType, 
  AlertTriangle, 
  Layers 
} from "lucide-react";
import { useDropzone } from "react-dropzone";
import { triggerIngest } from "@/lib/services/pipeline";
import { extractFileText } from "@/lib/services/extract";
import { errorMessage } from "@/lib/utils";
import { queryKeys } from "@/lib/queryKeys";

const MAX_FILE_BYTES = 50 * 1024 * 1024; // 50MB
const AUDIO_EXTS = ["mp3", "wav", "m4a", "ogg", "flac", "webm"];
const VIDEO_EXTS = ["mp4", "mov", "mkv"];

async function computeSha256(text: string): Promise<string> {
  const buf = new TextEncoder().encode(text.replace(/\u0000/g, "").trim());
  const hash = await crypto.subtle.digest("SHA-256", buf);
  return Array.from(new Uint8Array(hash))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export default function UploadDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
  const { user } = useAuth();
  const { toast } = useToast();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [submitting, setSubmitting] = useState(false);

  // Active documents slot query (3-document limit)
  const { data: activeDocCount = 0 } = useQuery({
    queryKey: ["active_saved_documents_count", user?.id],
    enabled: !!user?.id && open,
    queryFn: async () => {
      const { count, error } = await supabase
        .from("documents")
        .select("id", { count: "exact", head: true })
        .eq("user_id", user!.id)
        .in("status", ["ready", "processing", "pending"]);
      if (error) return 0;
      return count ?? 0;
    },
  });

  const isSlotLimitReached = activeDocCount >= 3;
  const slotsAvailable = Math.max(0, 3 - activeDocCount);

  // Text mode
  const [textTitle, setTextTitle] = useState("");
  const [textContent, setTextContent] = useState("");
  // YouTube mode
  const [ytUrl, setYtUrl] = useState("");
  // File mode
  const [file, setFile] = useState<File | null>(null);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    multiple: false,
    disabled: isSlotLimitReached,
    onDrop: (files) => setFile(files[0] ?? null),
  });

  const reset = () => {
    setTextTitle(""); setTextContent(""); setYtUrl(""); setFile(null);
  };

  const createTextDoc = async () => {
    if (!user || !textContent.trim()) return;
    if (isSlotLimitReached) {
      toast({
        title: "Slot limit reached",
        description: "You have reached the free limit of 3 saved documents. Delete a document to add another one.",
        variant: "destructive",
      });
      return;
    }

    setSubmitting(true);
    try {
      // 1. Client-side duplicate hash check
      const hash = await computeSha256(textContent);
      const { data: existingDoc } = await supabase
        .from("documents")
        .select("id, title")
        .eq("user_id", user.id)
        .eq("content_hash", hash)
        .maybeSingle();

      if (existingDoc) {
        toast({
          title: "Duplicate content detected",
          description: `"${existingDoc.title}" is already in your study library. Duplicates do not consume a slot.`,
        });
        reset(); 
        onOpenChange(false);
        router.push(`/app/doc/${existingDoc.id}`);
        return;
      }

      const { data, error } = await supabase
        .from("documents")
        .insert({
          user_id: user.id,
          title: textTitle.trim() || "Untitled note",
          source_type: "text",
          raw_text: textContent,
          content_hash: hash,
          status: "ready",
        })
        .select("id")
        .single();
      if (error) throw error;
      toast({ title: "Document created", description: "Saved to your study library." });
      queryClient.invalidateQueries({ queryKey: queryKeys.documents });
      queryClient.invalidateQueries({ queryKey: ["active_saved_documents_count", user.id] });
      reset(); 
      onOpenChange(false);
      router.push(`/app/doc/${data!.id}`);
    } catch (e: unknown) {
      toast({ title: "Failed", description: errorMessage(e), variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  const createYoutubeDoc = async () => {
    if (!user || !ytUrl.trim()) return;
    if (isSlotLimitReached) {
      toast({
        title: "Slot limit reached",
        description: "You have reached the free limit of 3 saved documents. Delete a document to add another one.",
        variant: "destructive",
      });
      return;
    }

    setSubmitting(true);
    try {
      const { data, error } = await supabase
        .from("documents")
        .insert({
          user_id: user.id,
          title: ytUrl,
          source_type: "youtube",
          source_url: ytUrl,
          status: "pending",
        })
        .select("id")
        .single();
      if (error) throw error;
      toast({ title: "YouTube link queued", description: "Fetching transcript…" });
      queryClient.invalidateQueries({ queryKey: queryKeys.documents });
      queryClient.invalidateQueries({ queryKey: ["active_saved_documents_count", user.id] });
      reset(); 
      onOpenChange(false);
      router.push(`/app/doc/${data!.id}`);
      triggerIngest(data!.id).catch((e) =>
        toast({ title: "Transcript failed", description: errorMessage(e), variant: "destructive" }),
      );
    } catch (e: unknown) {
      toast({ title: "Failed", description: errorMessage(e), variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  const createFileDoc = async () => {
    if (!user || !file) return;
    if (isSlotLimitReached) {
      toast({
        title: "Slot limit reached",
        description: "You have reached the free limit of 3 saved documents. Delete a document to add another one.",
        variant: "destructive",
      });
      return;
    }

    if (file.size > MAX_FILE_BYTES) {
      toast({ title: "File too large", description: "This document is too large for the current free limit (50MB max).", variant: "destructive" });
      return;
    }
    setSubmitting(true);
    try {
      const ext = file.name.split(".").pop()?.toLowerCase() ?? "";
      const isPdf = ext === "pdf";
      const isDocx = ext === "docx" || ext === "doc";
      const isAudio = AUDIO_EXTS.includes(ext);
      const isVideo = VIDEO_EXTS.includes(ext);

      // PDF/DOCX: extract text in the browser, no server visionary upload needed
      if (isPdf || isDocx) {
        toast({ title: "Extracting text…", description: "Parsing the document in your browser." });
        const { text, sourceType } = await extractFileText(file);
        if (!text || text.trim().length < 20) {
          throw new Error("Could not extract readable text from this file.");
        }

        // Client-side duplicate check
        const hash = await computeSha256(text);
        const { data: existingDoc } = await supabase
          .from("documents")
          .select("id, title")
          .eq("user_id", user.id)
          .eq("content_hash", hash)
          .maybeSingle();

        if (existingDoc) {
          toast({
            title: "Duplicate content detected",
            description: `"${existingDoc.title}" is already in your study library. Duplicates do not consume a slot.`,
          });
          reset(); 
          onOpenChange(false);
          router.push(`/app/doc/${existingDoc.id}`);
          return;
        }

        const { data, error } = await supabase
          .from("documents")
          .insert({
            user_id: user.id,
            title: file.name,
            source_type: sourceType,
            raw_text: text,
            content_hash: hash,
            status: "pending",
          })
          .select("id")
          .single();
        if (error) throw error;
        toast({ title: "Document added", description: "Finalizing notes…" });
        queryClient.invalidateQueries({ queryKey: queryKeys.documents });
        queryClient.invalidateQueries({ queryKey: ["active_saved_documents_count", user.id] });
        reset(); 
        onOpenChange(false);
        router.push(`/app/doc/${data!.id}`);
        triggerIngest(data!.id).catch((e) =>
          toast({ title: "Ingest failed", description: errorMessage(e), variant: "destructive" }),
        );
        return;
      }

      // Audio/Video: upload to storage; ingest function transcribes via Groq Whisper
      if (!isAudio && !isVideo) {
        throw new Error("Unsupported file type. Use PDF, DOCX, audio or video.");
      }
      const sourceType = isAudio ? "audio" : "video";
      const path = `${user.id}/${crypto.randomUUID()}-${file.name}`;
      const { error: upErr } = await supabase.storage.from("uploads").upload(path, file);
      if (upErr) throw upErr;

      const { data, error } = await supabase
        .from("documents")
        .insert({
          user_id: user.id,
          title: file.name,
          source_type: sourceType,
          source_url: path,
          status: "pending",
        })
        .select("id")
        .single();
      if (error) throw error;
      toast({ title: "File uploaded", description: "Transcribing…" });
      queryClient.invalidateQueries({ queryKey: queryKeys.documents });
      queryClient.invalidateQueries({ queryKey: ["active_saved_documents_count", user.id] });
      reset(); 
      onOpenChange(false);
      router.push(`/app/doc/${data!.id}`);
      triggerIngest(data!.id).catch((e) =>
        toast({ title: "Ingest failed", description: errorMessage(e), variant: "destructive" }),
      );
    } catch (e: unknown) {
      toast({ title: "Failed", description: errorMessage(e), variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { onOpenChange(v); if (!v) reset(); }}>
      <DialogContent className="sm:max-w-lg glass-card glass-highlight border-border/80 text-foreground rounded-3xl p-6 sm:p-7 shadow-2xl">
        <DialogHeader className="pb-1">
          <DialogTitle className="text-lg font-semibold font-display text-foreground flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="h-7 w-7 rounded-full bg-slate-900 dark:bg-white dark:text-zinc-950 text-white flex items-center justify-center">
                <CloudLightning className="h-4 w-4 text-sky-300 dark:text-zinc-950" />
              </div>
              <span>Add Study Material</span>
            </div>
            <span className="text-[11px] font-mono px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-semibold flex items-center gap-1">
              <Layers className="size-3" />
              <span>{activeDocCount} / 3 slots</span>
            </span>
          </DialogTitle>
        </DialogHeader>

        {/* Slot Warning Banner or Slot Availability Pill */}
        {isSlotLimitReached ? (
          <div className="p-3.5 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/80 text-amber-900 dark:text-amber-200 text-xs flex items-start gap-2.5">
            <AlertTriangle className="size-4 shrink-0 mt-0.5 text-amber-600 dark:text-amber-400" />
            <div className="space-y-1">
              <p className="font-bold">You have reached the free limit of 3 saved documents.</p>
              <p className="text-[11px] leading-relaxed text-amber-800 dark:text-amber-300">
                Delete a document to add another one. Deletion and replacement are completely free!
              </p>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-between px-3 py-1.5 rounded-xl bg-slate-100/70 dark:bg-white/[0.04] text-xs">
            <span className="text-slate-600 dark:text-slate-400">
              Saved documents: <strong className="text-slate-900 dark:text-white">{activeDocCount} of 3 used</strong>
            </span>
            <span className="font-mono text-purple-600 dark:text-purple-400 font-semibold text-[11px]">
              {slotsAvailable} slot{slotsAvailable === 1 ? "" : "s"} available
            </span>
          </div>
        )}

        <Tabs defaultValue="file" className="w-full">
          <TabsList className="grid grid-cols-3 w-full glass-pill p-1 rounded-full border border-border/80">
            <TabsTrigger value="file" className="rounded-full text-xs font-semibold data-[state=active]:bg-card data-[state=active]:text-foreground data-[state=active]:shadow-xs text-muted-foreground hover:text-foreground">
              <Upload className="h-3.5 w-3.5 sm:mr-1.5 shrink-0 text-foreground" /> <span className="hidden sm:inline">File</span>
            </TabsTrigger>
            <TabsTrigger value="youtube" className="rounded-full text-xs font-semibold data-[state=active]:bg-card data-[state=active]:text-foreground data-[state=active]:shadow-xs text-muted-foreground hover:text-foreground">
              <Youtube className="h-3.5 w-3.5 sm:mr-1.5 shrink-0 text-rose-500" /> <span className="hidden sm:inline">YouTube</span>
            </TabsTrigger>
            <TabsTrigger value="text" className="rounded-full text-xs font-semibold data-[state=active]:bg-card data-[state=active]:text-foreground data-[state=active]:shadow-xs text-muted-foreground hover:text-foreground">
              <FileText className="h-3.5 w-3.5 sm:mr-1.5 shrink-0 text-violet-500" /> <span className="hidden sm:inline">Text</span>
            </TabsTrigger>
          </TabsList>

          {/* File Upload Content */}
          <TabsContent value="file" className="space-y-4 pt-4 focus-visible:outline-none">
            <div
              {...getRootProps()}
              className={`border border-dashed rounded-2xl p-7 text-center transition-colors relative overflow-hidden focus-ring ${
                isSlotLimitReached
                  ? "border-slate-200 dark:border-slate-800 bg-slate-100/40 dark:bg-slate-900/40 cursor-not-allowed opacity-60"
                  : isDragActive
                  ? "border-slate-900 bg-slate-900/10 dark:border-white dark:bg-white/10 cursor-pointer"
                  : "border-border hover:border-slate-400 dark:hover:border-zinc-600 bg-muted/30 cursor-pointer"
              }`}
            >
              <input {...getInputProps()} aria-label="Choose a file to upload" disabled={isSlotLimitReached} />
              
              {file ? (
                <div className="space-y-2 py-3">
                  <div className="h-10 w-10 rounded-xl bg-muted dark:bg-zinc-800 border border-border flex items-center justify-center text-foreground mx-auto mb-2">
                    <FileType className="h-5 w-5" />
                  </div>
                  <p className="text-xs font-semibold text-foreground truncate max-w-xs mx-auto">{file.name}</p>
                  <p className="text-xs text-muted-foreground">{(file.size / 1024 / 1024).toFixed(2)} MB · Click to replace</p>
                </div>
              ) : (
                <div className="space-y-2 py-3">
                  <Upload className="h-7 w-7 mx-auto text-muted-foreground mb-2" />
                  <p className="text-xs text-foreground font-semibold">
                    {isSlotLimitReached
                      ? "Limit reached — delete a document first"
                      : isDragActive
                      ? "Drop the file here"
                      : "Drag files or click to browse"}
                  </p>
                  <p className="text-[11px] text-muted-foreground max-w-xs mx-auto">
                    Supports PDF, DOCX, mp3, wav, mp4 or mov (Client extracted, max 50MB)
                  </p>
                </div>
              )}
            </div>
            
            <Button 
              onClick={createFileDoc} 
              disabled={!file || submitting || isSlotLimitReached} 
              className="w-full bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-zinc-200 dark:text-zinc-950 text-white font-semibold py-2.5 rounded-full transition-colors text-xs shadow-sm cursor-pointer disabled:cursor-not-allowed"
            >
              {submitting ? (
                <span className="flex items-center justify-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin text-white dark:text-zinc-950" /> Ingesting file...
                </span>
              ) : isSlotLimitReached ? (
                <span>Limit reached (3 / 3 used)</span>
              ) : (
                <span>Upload Document</span>
              )}
            </Button>
          </TabsContent>

          {/* YouTube Content */}
          <TabsContent value="youtube" className="space-y-4 pt-4 focus-visible:outline-none">
            <div className="space-y-2">
              <Label htmlFor="yt" className="text-xs text-foreground">YouTube Video Link</Label>
              <Input 
                id="yt" 
                value={ytUrl} 
                disabled={isSlotLimitReached}
                onChange={(e) => setYtUrl(e.target.value)} 
                placeholder="https://youtube.com/watch?v=..." 
                className="bg-muted/40 border-border focus:border-foreground text-foreground placeholder:text-muted-foreground rounded-xl text-xs"
              />
              <p className="text-[11px] text-muted-foreground leading-normal">
                We will automatically fetch the video transcription or dialogue recap to build notes.
              </p>
            </div>
            <Button 
              onClick={createYoutubeDoc} 
              disabled={!ytUrl.trim() || submitting || isSlotLimitReached} 
              className="w-full bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-zinc-200 dark:text-zinc-950 text-white font-semibold py-2.5 rounded-full transition-colors text-xs shadow-sm cursor-pointer disabled:cursor-not-allowed"
            >
              {submitting ? (
                <span className="flex items-center justify-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin text-white dark:text-zinc-950" /> Queuing link...
                </span>
              ) : isSlotLimitReached ? (
                <span>Limit reached (3 / 3 used)</span>
              ) : (
                <span>Add Video</span>
              )}
            </Button>
          </TabsContent>

          {/* Pasted Text Content */}
          <TabsContent value="text" className="space-y-4 pt-4 focus-visible:outline-none">
            <div className="space-y-3">
              <div className="space-y-1.5">
                <Label htmlFor="title" className="text-xs text-foreground">Title</Label>
                <Input 
                  id="title" 
                  value={textTitle} 
                  disabled={isSlotLimitReached}
                  onChange={(e) => setTextTitle(e.target.value)} 
                  placeholder="E.g., History Lecture 5 Notes" 
                  className="bg-muted/40 border-border focus:border-foreground text-foreground placeholder:text-muted-foreground rounded-xl text-xs"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="content" className="text-xs text-foreground">Paste your material</Label>
                <Textarea 
                  id="content" 
                  value={textContent} 
                  disabled={isSlotLimitReached}
                  onChange={(e) => setTextContent(e.target.value)} 
                  rows={6} 
                  placeholder="Paste your readings, articles, transcripts here..." 
                  className="bg-muted/40 border-border focus:border-foreground text-foreground placeholder:text-muted-foreground rounded-xl text-xs resize-none"
                />
              </div>
            </div>
            <Button 
              onClick={createTextDoc} 
              disabled={!textContent.trim() || submitting || isSlotLimitReached} 
              className="w-full bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-zinc-200 dark:text-zinc-950 text-white font-semibold py-2.5 rounded-full transition-colors text-xs shadow-sm cursor-pointer disabled:cursor-not-allowed"
            >
              {submitting ? (
                <span className="flex items-center justify-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin text-white dark:text-zinc-950" /> Saving notes...
                </span>
              ) : isSlotLimitReached ? (
                <span>Limit reached (3 / 3 used)</span>
              ) : (
                <span>Add Text</span>
              )}
            </Button>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
