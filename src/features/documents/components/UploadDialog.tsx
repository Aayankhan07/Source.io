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
import { Loader2, Upload, FileText, Youtube } from "lucide-react";
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
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Add a document</DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="file">
          <TabsList className="grid grid-cols-3 w-full">
            <TabsTrigger value="file"><Upload className="h-3.5 w-3.5 mr-1.5" /> File</TabsTrigger>
            <TabsTrigger value="youtube"><Youtube className="h-3.5 w-3.5 mr-1.5" /> YouTube</TabsTrigger>
            <TabsTrigger value="text"><FileText className="h-3.5 w-3.5 mr-1.5" /> Text</TabsTrigger>
          </TabsList>

          <TabsContent value="file" className="space-y-4 pt-4">
            <div
              {...getRootProps()}
              className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
                isDragActive ? "border-primary bg-primary/5" : "border-border hover:border-primary/50"
              }`}
            >
              <input {...getInputProps()} />
              <Upload className="h-8 w-8 mx-auto mb-3 text-muted-foreground" />
              {file ? (
                <p className="text-sm">{file.name}</p>
              ) : (
                <p className="text-sm text-muted-foreground">
                  {isDragActive ? "Drop here…" : "Drag a PDF, DOCX, audio or video file, or click to browse"}
                </p>
              )}
            </div>
            <Button onClick={createFileDoc} disabled={!file || submitting} className="w-full">
              {submitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />} Upload
            </Button>
          </TabsContent>

          <TabsContent value="youtube" className="space-y-4 pt-4">
            <div className="space-y-1.5">
              <Label htmlFor="yt">YouTube URL</Label>
              <Input id="yt" value={ytUrl} onChange={(e) => setYtUrl(e.target.value)} placeholder="https://youtube.com/watch?v=..." />
            </div>
            <Button onClick={createYoutubeDoc} disabled={!ytUrl.trim() || submitting} className="w-full">
              {submitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />} Add link
            </Button>
          </TabsContent>

          <TabsContent value="text" className="space-y-4 pt-4">
            <div className="space-y-1.5">
              <Label htmlFor="title">Title</Label>
              <Input id="title" value={textTitle} onChange={(e) => setTextTitle(e.target.value)} placeholder="Untitled note" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="content">Content</Label>
              <Textarea id="content" value={textContent} onChange={(e) => setTextContent(e.target.value)} rows={8} placeholder="Paste your text here…" />
            </div>
            <Button onClick={createTextDoc} disabled={!textContent.trim() || submitting} className="w-full">
              {submitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />} Create
            </Button>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
