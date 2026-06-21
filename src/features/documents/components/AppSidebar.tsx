import { useEffect } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/features/auth/context/AuthContext";
import { useWorkspace, DocumentRow } from "@/features/documents/store/workspace";
import { Button } from "@/components/ui/button";
import { Plus, FileText, Mic, Video, Youtube, FileType2, LogOut, Loader2, Sparkles, AlertCircle, Library } from "lucide-react";
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
    <aside className="w-64 shrink-0 border-r border-sidebar-border bg-[#0b0b0e] flex flex-col h-screen md:w-64 w-[18rem] relative z-25">
      {/* Decorative top corner glow */}
      <div className="absolute top-0 left-0 w-24 h-24 bg-primary/5 rounded-full blur-xl pointer-events-none" />

      {/* Brand Section */}
      <div className="p-4 border-b border-sidebar-border/60">
        <Link to="/app" className="flex items-center gap-2 px-2 py-1 relative group">
          <div className="h-8 w-8 rounded-lg flex items-center justify-center overflow-hidden border border-white/5 bg-card/60 shadow-inner group-hover:border-primary/45 transition-colors">
            <img src="/favicon.png" className="h-full w-full object-contain" alt="Logo" />
          </div>
          <div className="flex flex-col">
            <span className="font-bold tracking-tight text-white font-display text-sm">Source.io</span>
            <span className="text-[10px] text-neutral-500 font-mono">Workspace v1.1</span>
          </div>
        </Link>
      </div>

      {/* New Source Button */}
      <div className="p-4">
        <Button 
          onClick={onNew} 
          className="w-full bg-primary hover:bg-primary-glow text-primary-foreground font-semibold py-2.5 rounded-lg flex items-center justify-start gap-2 shadow-glow transition-all" 
          size="sm"
        >
          <Plus className="h-4 w-4 shrink-0" />
          <span>New Document</span>
        </Button>
      </div>

      {/* Library Scroll list */}
      <div className="flex-1 overflow-y-auto px-3 pb-4 space-y-4">
        <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-widest text-neutral-500 px-2">
          <span className="flex items-center gap-1"><Library className="h-3 w-3" /> Library</span>
          <span className="font-mono text-neutral-600 bg-white/5 px-1.5 py-0.5 rounded">{documents.length}</span>
        </div>
        
        {documents.length === 0 && (
          <div className="text-xs text-neutral-500 px-2 py-6 text-center border border-dashed border-white/5 rounded-xl bg-white/5">
            No sources imported yet.
          </div>
        )}
        
        <ul className="space-y-1">
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
                    "w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs text-left transition-all relative group",
                    active 
                      ? "bg-white/5 text-white border border-white/10 shadow-md" 
                      : "hover:bg-white/5 text-neutral-400 hover:text-neutral-200 border border-transparent"
                  )}
                >
                  {/* Left indicator bar for active item */}
                  {active && (
                    <span className="absolute left-0 top-2 bottom-2 w-1 bg-primary rounded-r-md" />
                  )}

                  <div className={cn(
                    "h-6 w-6 rounded flex items-center justify-center shrink-0 border",
                    active ? "bg-primary/10 border-primary/20 text-primary" : "bg-neutral-900 border-white/5 text-neutral-500 group-hover:text-neutral-300 group-hover:border-white/10"
                  )}>
                    <Icon className="h-3.5 w-3.5" />
                  </div>

                  <span className="truncate flex-1 font-medium">{d.title}</span>

                  {d.status !== "ready" && d.status !== "failed" && (
                    <Loader2 className="h-3.5 w-3.5 animate-spin text-primary" />
                  )}
                  {d.status === "failed" && (
                    <AlertCircle className="h-3.5 w-3.5 text-destructive" />
                  )}
                </button>
              </li>
            );
          })}
        </ul>
      </div>

      {/* Account Info Footer */}
      <div className="p-3 border-t border-sidebar-border/60 bg-[#070709]">
        <div className="flex items-center gap-3 px-2 py-1.5 rounded-lg border border-transparent hover:border-white/5 hover:bg-white/5 transition-all">
          <div className="h-8 w-8 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center text-xs font-semibold text-primary shadow-inner">
            {(user?.email ?? "?").slice(0, 1).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-xs font-semibold text-white truncate">{user?.email?.split("@")[0]}</div>
            <div className="text-[10px] text-neutral-500 truncate">{user?.email}</div>
          </div>
          <Button 
            size="icon" 
            variant="ghost" 
            className="h-8 w-8 text-neutral-400 hover:text-white hover:bg-white/10 shrink-0" 
            onClick={signOut} 
            title="Sign out"
          >
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </aside>
  );
}
