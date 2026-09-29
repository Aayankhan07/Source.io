import { useEffect } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/features/auth/context/AuthContext";
import { DocumentRow } from "@/features/documents/types";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus, FileText, Mic, Video, Youtube, FileType2, LogOut, Loader2, AlertCircle, Library, RefreshCw } from "lucide-react";
import { cn, errorMessage } from "@/lib/utils";
import { queryKeys } from "@/lib/queryKeys";
import ThemeToggle from "@/components/common/ThemeToggle";
import { DEMO_DOCUMENT_LIST } from "@/features/documents/data/mockDocuments";

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
  const { docId } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const {
    data: documents = [],
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: queryKeys.documents,
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("documents")
        .select("id,title,source_type,status,error_code,created_at")
        .order("created_at", { ascending: false })
        .limit(200);
      if (error) throw error;
      return (data ?? []) as DocumentRow[];
    },
  });

  const displayDocs = documents.length > 0 ? documents : DEMO_DOCUMENT_LIST;

  // Realtime rows land in the query cache directly — writing them anywhere else
  // would leave two sources of truth that drift apart.
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel("documents-sidebar")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "documents", filter: `user_id=eq.${user.id}` },
        (payload) => {
          queryClient.setQueryData<DocumentRow[]>(queryKeys.documents, (prev) => {
            const rows = prev ?? [];
            if (payload.eventType === "DELETE") {
              return rows.filter((d) => d.id !== (payload.old as { id: string }).id);
            }
            const row = payload.new as DocumentRow;
            const next: DocumentRow = {
              id: row.id,
              title: row.title,
              source_type: row.source_type,
              status: row.status,
              error_code: row.error_code,
              created_at: row.created_at,
            };
            const idx = rows.findIndex((d) => d.id === next.id);
            if (idx === -1) return [next, ...rows];
            const copy = [...rows];
            copy[idx] = next;
            return copy;
          });

          // The workspace reads the same document row under its own key.
          if (payload.eventType !== "DELETE") {
            const row = payload.new as DocumentRow;
            queryClient.invalidateQueries({ queryKey: queryKeys.document(row.id) });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, queryClient]);

  return (
    <aside className="w-full md:w-64 shrink-0 border-r border-sidebar-border bg-sidebar flex flex-col h-screen relative z-25">
      {/* Brand Section */}
      <div className="p-4 border-b border-sidebar-border/60">
        <Link to="/app" className="flex items-center gap-2.5 px-2 py-1 relative group">
          <div className="h-8 w-8 rounded-full bg-slate-900 dark:bg-card border border-transparent dark:border-border flex items-center justify-center text-white shadow-sm overflow-hidden">
            <img src="/favicon.png" className="h-4 w-4 object-contain" alt="Logo" />
          </div>
          <div className="flex flex-col">
            <span className="font-semibold tracking-tight text-foreground font-display text-sm">
              Source<span className="text-sky-600 dark:text-sky-400">.io</span>
            </span>
            <span className="text-[10px] text-muted-foreground font-mono">Research Studio</span>
          </div>
        </Link>
      </div>

      {/* New Source Button */}
      <div className="p-4">
        <Button 
          onClick={onNew} 
          className="w-full bg-slate-900 hover:bg-slate-800 dark:bg-sky-500 dark:hover:bg-sky-400 text-white font-semibold py-2.5 rounded-full flex items-center justify-center gap-2 shadow-sm transition-all focus-ring text-xs" 
          size="sm"
        >
          <Plus className="h-4 w-4 shrink-0 text-sky-400 dark:text-white" />
          <span>New Document</span>
        </Button>
      </div>

      {/* Library Scroll list */}
      <div className="flex-1 overflow-y-auto px-3 pb-4 space-y-3">
        <div className="flex items-center justify-between text-xs font-semibold text-muted-foreground px-2">
          <span className="flex items-center gap-1.5 text-[11px] font-mono uppercase tracking-wider">
            <Library className="h-3.5 w-3.5 text-slate-500 dark:text-slate-400" /> Library
          </span>
          <span className="font-mono text-[11px] text-muted-foreground bg-card border border-border/80 px-2 py-0.5 rounded-full shadow-2xs">
            {displayDocs.length}
          </span>
        </div>
        
        {isLoading && (
          <div className="space-y-1.5 px-1" aria-label="Loading your library">
            {[0, 1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-9 w-full rounded-xl bg-muted/60" />
            ))}
          </div>
        )}

        {isError && (
          <div className="px-2 py-5 text-center border border-dashed border-destructive/20 rounded-xl bg-destructive/5 space-y-2.5">
            <AlertCircle className="h-4 w-4 text-destructive mx-auto" />
            <p className="text-xs text-muted-foreground leading-relaxed">
              Couldn't load your library.
              <span className="block text-muted-foreground mt-1">{errorMessage(error)}</span>
            </p>
            <Button
              size="sm"
              variant="outline"
              onClick={() => refetch()}
              className="border-border text-foreground hover:bg-card bg-card text-xs h-8 rounded-full"
            >
              <RefreshCw className="h-3 w-3 mr-1.5" /> Retry
            </Button>
          </div>
        )}

        {!isLoading && !isError && displayDocs.length === 0 && (
          <div className="text-xs text-muted-foreground px-3 py-8 text-center border border-dashed border-border/80 rounded-xl bg-card shadow-2xs">
            No documents imported yet. Click <span className="font-semibold text-foreground">+ New Document</span> to start.
          </div>
        )}

        <ul className="space-y-1">
          {displayDocs.map((d) => {
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
                    "w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs text-left transition-all relative group focus-ring",
                    active
                      ? "bg-card text-foreground border border-border shadow-xs font-medium"
                      : "hover:bg-accent/60 text-muted-foreground hover:text-foreground border border-transparent"
                  )}
                >
                  <div className={cn(
                    "h-6 w-6 rounded-lg flex items-center justify-center shrink-0 border transition-colors",
                    active 
                      ? "bg-sky-50 dark:bg-sky-500/10 border-sky-200 dark:border-sky-500/30 text-sky-700 dark:text-sky-400" 
                      : "bg-card border-border text-muted-foreground group-hover:text-foreground"
                  )}>
                    <Icon className="h-3.5 w-3.5" />
                  </div>

                  <span className="truncate flex-1 font-medium">{d.title}</span>

                  {d.status !== "ready" && d.status !== "failed" && (
                    <Loader2 className="h-3.5 w-3.5 animate-spin text-sky-600 dark:text-sky-400 shrink-0" />
                  )}
                  {d.status === "failed" && (
                    <AlertCircle className="h-3.5 w-3.5 text-destructive shrink-0" />
                  )}
                </button>
              </li>
            );
          })}
        </ul>
      </div>

      {/* Account Info & Theme Footer */}
      <div className="p-3 border-t border-sidebar-border/60 bg-sidebar">
        <div className="flex items-center gap-2 px-2.5 py-2 rounded-xl glass-card shadow-2xs">
          <div className="h-7 w-7 rounded-full bg-slate-900 dark:bg-sky-500 text-white flex items-center justify-center text-xs font-semibold shrink-0 shadow-2xs">
            {(user?.user_metadata?.display_name || user?.email || "S").slice(0, 1).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-xs font-semibold text-foreground truncate">
              {user?.user_metadata?.display_name || user?.email?.split("@")[0] || "Scholar"}
            </div>
            <div className="text-[11px] text-muted-foreground truncate">{user?.email || "guest@source.io"}</div>
          </div>
          <div className="flex items-center gap-1 shrink-0">
            <ThemeToggle className="h-7 w-7 border-none bg-transparent hover:bg-accent" />
            <Button
              size="icon"
              variant="ghost"
              className="h-7 w-7 text-muted-foreground hover:text-foreground hover:bg-accent shrink-0 rounded-full"
              onClick={signOut}
              title="Sign out"
              aria-label="Sign out"
            >
              <LogOut className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      </div>
    </aside>
  );
}
