import { useEffect } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/features/auth/context/AuthContext";
import { useWorkspace, DocumentRow } from "@/features/documents/store/workspace";
import { Button } from "@/components/ui/button";
import { Sparkles, Plus, FileText, Mic, Video, Youtube, FileType2, LogOut, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

const sourceIcon = {
  pdf: FileType2,
  docx: FileType2,
  text: FileText,
  audio: Mic,
  video: Video,
  youtube: Youtube,
} as const;

export default function AppSidebar({ onNew, onNavigate }: { onNew: () => void; onNavigate?: () => void }) {
  const { user, signOut } = useAuth();
  const { documents, setDocuments, upsertDocument, removeDocument } = useWorkspace();
  const { docId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    if (!user) return;
    let mounted = true;

    (async () => {
      const { data, error } = await supabase
        .from("documents")
        .select("id,title,source_type,status,error_code,created_at")
        .order("created_at", { ascending: false });
      if (error) {
        toast({ title: "Failed to load documents", description: error.message, variant: "destructive" });
        return;
      }
      if (mounted && data) setDocuments(data as DocumentRow[]);
    })();

    const channel = supabase
      .channel("documents-sidebar")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "documents", filter: `user_id=eq.${user.id}` },
        (payload) => {
          if (payload.eventType === "DELETE") {
            removeDocument((payload.old as any).id);
          } else {
            const row = payload.new as any;
            upsertDocument({
              id: row.id,
              title: row.title,
              source_type: row.source_type,
              status: row.status,
              error_code: row.error_code,
              created_at: row.created_at,
            });
          }
        }
      )
      .subscribe();

    return () => {
      mounted = false;
      supabase.removeChannel(channel);
    };
  }, [user, setDocuments, upsertDocument, removeDocument, toast]);

  return (
    <aside className="w-64 shrink-0 border-r border-sidebar-border bg-sidebar flex flex-col h-screen md:w-64 w-[18rem]">
      <div className="p-3 border-b border-sidebar-border">
        <Link to="/app" className="flex items-center gap-2 px-2 py-1.5">
          <div className="h-7 w-7 rounded-md bg-gradient-primary flex items-center justify-center shadow-glow">
            <Sparkles className="h-4 w-4 text-primary-foreground" />
          </div>
          <span className="font-semibold tracking-tight">Source.io</span>
        </Link>
      </div>

      <div className="p-3">
        <Button onClick={onNew} className="w-full justify-start" size="sm">
          <Plus className="h-4 w-4 mr-2" /> New document
        </Button>
      </div>

      <div className="flex-1 overflow-y-auto px-2 pb-2">
        <div className="text-[11px] uppercase tracking-wide text-muted-foreground px-2 py-2">Library</div>
        {documents.length === 0 && (
          <div className="text-xs text-muted-foreground px-2 py-4 text-center">No documents yet.</div>
        )}
        <ul className="space-y-0.5">
          {documents.map((d) => {
            const Icon = sourceIcon[d.source_type] ?? FileText;
            const active = d.id === docId;
            return (
              <li key={d.id}>
                <button
                  onClick={() => {
                    navigate(`/app/doc/${d.id}`);
                    onNavigate?.();
                  }}
                  className={cn(
                    "w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-sm text-left transition-colors",
                    active ? "bg-sidebar-accent text-sidebar-accent-foreground" : "hover:bg-sidebar-accent/60 text-sidebar-foreground"
                  )}
                >
                  <Icon className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                  <span className="truncate flex-1">{d.title}</span>
                  {d.status !== "ready" && d.status !== "failed" && (
                    <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />
                  )}
                  {d.status === "failed" && (
                    <span className="h-1.5 w-1.5 rounded-full bg-destructive" />
                  )}
                </button>
              </li>
            );
          })}
        </ul>
      </div>

      <div className="p-2 border-t border-sidebar-border">
        <div className="flex items-center gap-2 px-2 py-1.5">
          <div className="h-7 w-7 rounded-full bg-muted flex items-center justify-center text-xs font-medium">
            {(user?.email ?? "?").slice(0, 1).toUpperCase()}
          </div>
          <div className="flex-1 truncate text-sm">{user?.email}</div>
          <Button size="icon" variant="ghost" className="h-7 w-7" onClick={signOut} title="Sign out">
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </aside>
  );
}
