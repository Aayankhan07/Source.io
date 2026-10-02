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
import { Loader2, Upload, FileText, Youtube, CloudLightning, FileType } from "lucide-react";
import { useDropzone } from "react-dropzone";
import { triggerIngest } from "@/lib/services/pipeline";
import { extractFileText } from "@/lib/services/extract";
import { errorMessage } from "@/lib/utils";

const MAX_FILE_BYTES = 50 * 1024 * 1024; // 50MB
const AUDIO_EXTS = ["mp3", "wav", "m4a", "ogg", "flac", "webm"];
const VIDEO_EXTS = ["mp4", "mov", "mkv"];

export default function UploadDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
  const { user } = useAuth();
  const { toast } = useToast();
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);

  // Text mode
  const [textTitle, setTextTitle] = useState("");
  const [textContent, setTextContent] = useState("");
  // YouTube mode
  const [ytUrl, setYtUrl] = useState("");
  // File mode
  const [file, setFile] = useState<File | null>(null);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    multiple: false,
    onDrop: (files) => setFile(files[0] ?? null),
  });

  const reset = () => {
    setTextTitle(""); setTextContent(""); setYtUrl(""); setFile(null);
  };

  const createTextDoc = async () => {
    if (!user || !textContent.trim()) return;
    setSubmitting(true);
    try {
      const { data, error } = await supabase
        .from("documents")
        .insert({
          user_id: user.id,
          title: textTitle.trim() || "Untitled note",
          source_type: "text",
          raw_text: textContent,
          status: "ready",
        })
        .select("id")
        .single();
      if (error) throw error;
      toast({ title: "Document created" });
      reset(); onOpenChange(false);
      router.push(`/app/doc/${data!.id}`);
    } catch (e: unknown) {
      toast({ title: "Failed", description: errorMessage(e), variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  const createYoutubeDoc = async () => {
    if (!user || !ytUrl.trim()) return;
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
      reset(); onOpenChange(false);
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
    if (file.size > MAX_FILE_BYTES) {
      toast({ title: "File too large", description: "Maximum 50MB.", variant: "destructive" });
      return;
    }
    setSubmitting(true);
    try {
      const ext = file.name.split(".").pop()?.toLowerCase() ?? "";
      const isPdf = ext === "pdf";
      const isDocx = ext === "docx" || ext === "doc";
      const isAudio = AUDIO_EXTS.includes(ext);
      const isVideo = VIDEO_EXTS.includes(ext);

      // PDF/DOCX: extract text in the browser, no file upload needed
      if (isPdf || isDocx) {
        toast({ title: "Extracting text…", description: "Parsing the document in your browser." });
        const { text, sourceType } = await extractFileText(file);
        if (!text || text.trim().length < 20) {
          throw new Error("Could not extract readable text from this file.");
        }
        const { data, error } = await supabase
          .from("documents")
          .insert({
            user_id: user.id,
            title: file.name,
            source_type: sourceType,
            raw_text: text,
            status: "pending",
          })
          .select("id")
          .single();
        if (error) throw error;
        toast({ title: "Document added", description: "Finalizing…" });
        reset(); onOpenChange(false);
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
      reset(); onOpenChange(false);
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
        <DialogHeader className="pb-2">
          <DialogTitle className="text-lg font-semibold font-display text-foreground flex items-center gap-2">
            <div className="h-7 w-7 rounded-full bg-slate-900 dark:bg-white dark:text-zinc-950 text-white flex items-center justify-center">
              <CloudLightning className="h-4 w-4 text-sky-300 dark:text-zinc-950" />
            </div>
            <span>Add Study Material</span>
          </DialogTitle>
        </DialogHeader>

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
              className={`border border-dashed rounded-2xl p-8 text-center cursor-pointer transition-colors relative overflow-hidden focus-ring ${
                isDragActive
                  ? "border-slate-900 bg-slate-900/10 dark:border-white dark:bg-white/10"
                  : "border-border hover:border-slate-400 dark:hover:border-zinc-600 bg-muted/30"
              }`}
            >
              <input {...getInputProps()} aria-label="Choose a file to upload" />
              
              {file ? (
                <div className="space-y-2 py-4">
                  <div className="h-10 w-10 rounded-xl bg-muted dark:bg-zinc-800 border border-border flex items-center justify-center text-foreground mx-auto mb-2">
                    <FileType className="h-5 w-5" />
                  </div>
                  <p className="text-xs font-semibold text-foreground truncate max-w-xs mx-auto">{file.name}</p>
                  <p className="text-xs text-muted-foreground">{(file.size / 1024 / 1024).toFixed(2)} MB · Click to replace</p>
                </div>
              ) : (
                <div className="space-y-2 py-4">
                  <Upload className="h-7 w-7 mx-auto text-muted-foreground mb-2" />
                  <p className="text-xs text-foreground font-semibold">
                    {isDragActive ? "Drop the file here" : "Drag files or click to browse"}
                  </p>
                  <p className="text-xs text-muted-foreground max-w-xs mx-auto">
                    Supports PDF, DOCX, mp3, wav, mp4 or mov (Max 50MB)
                  </p>
                </div>
              )}
            </div>
            
            <Button 
              onClick={createFileDoc} 
              disabled={!file || submitting} 
              className="w-full bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-zinc-200 dark:text-zinc-950 text-white font-semibold py-2.5 rounded-full transition-colors text-xs shadow-sm"
            >
              {submitting ? (
                <span className="flex items-center justify-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin text-white" /> Ingesting file...
                </span>
              ) : (
                <span>Upload</span>
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
                onChange={(e) => setYtUrl(e.target.value)} 
                placeholder="https://youtube.com/watch?v=..." 
                className="bg-muted/40 border-border focus:border-foreground text-foreground placeholder:text-muted-foreground rounded-xl text-xs"
              />
              <p className="text-xs text-muted-foreground leading-normal">
                We will automatically fetch the video transcription or dialogue recap to build notes.
              </p>
            </div>
            <Button 
              onClick={createYoutubeDoc} 
              disabled={!ytUrl.trim() || submitting} 
              className="w-full bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-zinc-200 dark:text-zinc-950 text-white font-semibold py-2.5 rounded-full transition-colors text-xs shadow-sm"
            >
              {submitting ? (
                <span className="flex items-center justify-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin text-white dark:text-zinc-950" /> Queuing link...
                </span>
              ) : (
                <span>Add video</span>
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
                  onChange={(e) => setTextContent(e.target.value)} 
                  rows={6} 
                  placeholder="Paste your readings, articles, transcripts here..." 
                  className="bg-muted/40 border-border focus:border-foreground text-foreground placeholder:text-muted-foreground rounded-xl text-xs resize-none"
                />
              </div>
            </div>
            <Button 
              onClick={createTextDoc} 
              disabled={!textContent.trim() || submitting} 
              className="w-full bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-zinc-200 dark:text-zinc-950 text-white font-semibold py-2.5 rounded-full transition-colors text-xs shadow-sm"
            >
              {submitting ? (
                <span className="flex items-center justify-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin text-white dark:text-zinc-950" /> Saving notes...
                </span>
              ) : (
                <span>Add text</span>
              )}
            </Button>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
