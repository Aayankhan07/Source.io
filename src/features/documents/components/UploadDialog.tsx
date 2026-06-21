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
import { useNavigate } from "react-router-dom";
import { Loader2, Upload, FileText, Youtube, CloudLightning, FileType } from "lucide-react";
import { useDropzone } from "react-dropzone";
import { triggerIngest } from "@/lib/services/pipeline";
import { extractFileText } from "@/lib/services/extract";

const MAX_FILE_BYTES = 50 * 1024 * 1024; // 50MB
const AUDIO_EXTS = ["mp3", "wav", "m4a", "ogg", "flac", "webm"];
const VIDEO_EXTS = ["mp4", "mov", "mkv"];

export default function UploadDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
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
      navigate(`/app/doc/${data!.id}`);
    } catch (e: any) {
      toast({ title: "Failed", description: e.message, variant: "destructive" });
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
      navigate(`/app/doc/${data!.id}`);
      triggerIngest(data!.id).catch((e) =>
        toast({ title: "Transcript failed", description: e.message, variant: "destructive" }),
      );
    } catch (e: any) {
      toast({ title: "Failed", description: e.message, variant: "destructive" });
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
        navigate(`/app/doc/${data!.id}`);
        triggerIngest(data!.id).catch((e) =>
          toast({ title: "Ingest failed", description: e.message, variant: "destructive" }),
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
      navigate(`/app/doc/${data!.id}`);
      triggerIngest(data!.id).catch((e) =>
        toast({ title: "Ingest failed", description: e.message, variant: "destructive" }),
      );
    } catch (e: any) {
      toast({ title: "Failed", description: e.message, variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { onOpenChange(v); if (!v) reset(); }}>
      <DialogContent className="sm:max-w-lg bg-[#0d0d11] border-white/10 text-white rounded-2xl">
        <DialogHeader className="pb-2">
          <DialogTitle className="text-lg font-bold font-display text-white flex items-center gap-2">
            <CloudLightning className="h-5 w-5 text-primary" /> Add Study Source
          </DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="file" className="w-full">
          <TabsList className="grid grid-cols-3 w-full bg-[#171721] p-1 rounded-xl border border-white/5">
            <TabsTrigger value="file" className="rounded-lg text-xs font-semibold data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              <Upload className="h-3.5 w-3.5 mr-1.5 shrink-0" /> File
            </TabsTrigger>
            <TabsTrigger value="youtube" className="rounded-lg text-xs font-semibold data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              <Youtube className="h-3.5 w-3.5 mr-1.5 shrink-0" /> YouTube
            </TabsTrigger>
            <TabsTrigger value="text" className="rounded-lg text-xs font-semibold data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              <FileText className="h-3.5 w-3.5 mr-1.5 shrink-0" /> Text
            </TabsTrigger>
          </TabsList>

          {/* File Upload Content */}
          <TabsContent value="file" className="space-y-4 pt-4 outline-none">
            <div
              {...getRootProps()}
              className={`border border-dashed rounded-xl p-8 text-center cursor-pointer transition-all relative overflow-hidden ${
                isDragActive 
                  ? "border-primary bg-primary/5 shadow-glow" 
                  : "border-white/10 hover:border-primary/40 bg-[#121217]"
              }`}
            >
              <input {...getInputProps()} />
              
              {file ? (
                <div className="space-y-2 py-4">
                  <div className="h-10 w-10 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center text-primary mx-auto mb-2">
                    <FileType className="h-5 w-5" />
                  </div>
                  <p className="text-xs font-semibold text-white truncate max-w-xs mx-auto">{file.name}</p>
                  <p className="text-[10px] text-neutral-500">{(file.size / 1024 / 1024).toFixed(2)} MB · Tap to replace</p>
                </div>
              ) : (
                <div className="space-y-2 py-4">
                  <Upload className="h-7 w-7 mx-auto text-neutral-500 mb-2" />
                  <p className="text-xs text-neutral-300 font-semibold">
                    {isDragActive ? "Drop the file here" : "Drag files or click to browse"}
                  </p>
                  <p className="text-[10px] text-neutral-500 max-w-xs mx-auto">
                    Supports PDF, DOCX, mp3, wav, mp4 or mov (Max 50MB)
                  </p>
                </div>
              )}
            </div>
            
            <Button 
              onClick={createFileDoc} 
              disabled={!file || submitting} 
              className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold py-2.5 rounded-lg transition-colors"
            >
              {submitting ? (
                <span className="flex items-center justify-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" /> Ingesting file...
                </span>
              ) : (
                <span>Upload and Process</span>
              )}
            </Button>
          </TabsContent>

          {/* YouTube Content */}
          <TabsContent value="youtube" className="space-y-4 pt-4 outline-none">
            <div className="space-y-2">
              <Label htmlFor="yt" className="text-xs text-neutral-300">YouTube Video Link</Label>
              <Input 
                id="yt" 
                value={ytUrl} 
                onChange={(e) => setYtUrl(e.target.value)} 
                placeholder="https://youtube.com/watch?v=..." 
                className="bg-[#121217] border-white/10 focus:border-primary/50 text-white placeholder-neutral-600 rounded-lg text-xs"
              />
              <p className="text-[10px] text-neutral-500 leading-normal">
                We will automatically fetch the video transcription or dialogue recap to build notes.
              </p>
            </div>
            <Button 
              onClick={createYoutubeDoc} 
              disabled={!ytUrl.trim() || submitting} 
              className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold py-2.5 rounded-lg transition-colors"
            >
              {submitting ? (
                <span className="flex items-center justify-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" /> Queuing link...
                </span>
              ) : (
                <span>Add YouTube Source</span>
              )}
            </Button>
          </TabsContent>

          {/* Pasted Text Content */}
          <TabsContent value="text" className="space-y-4 pt-4 outline-none">
            <div className="space-y-3">
              <div className="space-y-1.5">
                <Label htmlFor="title" className="text-xs text-neutral-300">Workspace title</Label>
                <Input 
                  id="title" 
                  value={textTitle} 
                  onChange={(e) => setTextTitle(e.target.value)} 
                  placeholder="E.g., History Lecture 5 Notes" 
                  className="bg-[#121217] border-white/10 focus:border-primary/50 text-white placeholder-neutral-600 rounded-lg text-xs"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="content" className="text-xs text-neutral-300">Paste material text</Label>
                <Textarea 
                  id="content" 
                  value={textContent} 
                  onChange={(e) => setTextContent(e.target.value)} 
                  rows={6} 
                  placeholder="Paste your readings, articles, transcripts here..." 
                  className="bg-[#121217] border-white/10 focus:border-primary/50 text-white placeholder-neutral-600 rounded-lg text-xs resize-none"
                />
              </div>
            </div>
            <Button 
              onClick={createTextDoc} 
              disabled={!textContent.trim() || submitting} 
              className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold py-2.5 rounded-lg transition-colors"
            >
              {submitting ? (
                <span className="flex items-center justify-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" /> Saving notes...
                </span>
              ) : (
                <span>Compile Text Workspace</span>
              )}
            </Button>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
