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
      {/* Decorative top corner glow */}
      <div className="absolute top-0 left-0 w-24 h-24 bg-primary/5 rounded-full blur-xl pointer-events-none" />

      {/* Brand Section */}
      <div className="p-4 border-b border-sidebar-border/60">
        <Link to="/app" className="flex items-center gap-2 px-2 py-1 relative group">
          <div className="h-8 w-8 rounded-sm flex items-center justify-center overflow-hidden border border-border/60 bg-card/60 shadow-inner group-hover:border-primary/45 transition-colors">
            <img src="/favicon.png" className="h-full w-full object-contain" alt="Logo" />
          </div>
          <div className="flex flex-col">
            <span className="font-bold tracking-tight text-foreground font-display text-sm">Source.io</span>
            <span className="text-xs text-muted-foreground font-mono">Workspace v1.1</span>
          </div>
        </Link>
      </div>

      {/* New Source Button */}
      <div className="p-4">
        <Button 
          onClick={onNew} 
          variant="outline"
          className="w-full border-primary/40 bg-primary/5 hover:bg-primary/10 hover:border-primary text-primary font-semibold py-2.5 rounded-sm flex items-center justify-start gap-2 transition-all focus-ring" 
          size="sm"
        >
          <Plus className="h-4 w-4 shrink-0 text-primary" />
          <span>New Document</span>
        </Button>
      </div>

      {/* Library Scroll list */}
      <div className="flex-1 overflow-y-auto px-3 pb-4 space-y-4">
        <div className="flex items-center justify-between text-xs font-bold uppercase tracking-widest text-muted-foreground px-2">
          <span className="flex items-center gap-1"><Library className="h-3 w-3" /> Library</span>
          <span className="font-mono text-muted-foreground/70 bg-surface-raised px-1.5 py-0.5 rounded">{documents.length}</span>
        </div>
        
        {isLoading && (
          <div className="space-y-1.5 px-1" aria-label="Loading your library">
            {[0, 1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-9 w-full rounded-sm bg-surface-raised" />
            ))}
          </div>
        )}

        {isError && (
          <div className="px-2 py-5 text-center border border-dashed border-destructive/20 rounded-sm bg-destructive/5 space-y-2.5">
            <AlertCircle className="h-4 w-4 text-destructive mx-auto" />
            <p className="text-xs text-muted-foreground leading-relaxed">
              Couldn't load your library.
              <span className="block text-muted-foreground mt-1">{errorMessage(error)}</span>
            </p>
            <Button
              size="sm"
              variant="outline"
              onClick={() => refetch()}
              className="border-border text-foreground/90 hover:text-foreground bg-surface-raised text-xs h-8"
            >
              <RefreshCw className="h-3 w-3 mr-1.5" /> Retry
            </Button>
          </div>
        )}

        {!isLoading && !isError && documents.length === 0 && (
          <div className="text-xs text-muted-foreground px-2 py-6 text-center border border-dashed border-border/60 rounded-sm bg-surface-raised">
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
                    "w-full flex items-center gap-2.5 px-3 py-2 rounded-sm text-xs text-left transition-all relative group focus-ring",
                    active
                      ? "bg-surface-raised text-foreground border border-border shadow-md"
                      : "hover:bg-surface-raised text-muted-foreground hover:text-foreground border border-transparent"
                  )}
                >
                  {/* Left indicator bar for active item */}
                  {active && (
                    <span className="absolute left-0 top-2 bottom-2 w-1 bg-primary rounded-r-md" />
                  )}

                  <div className={cn(
                    "h-6 w-6 rounded flex items-center justify-center shrink-0 border",
                    active ? "bg-primary/10 border-primary/20 text-primary" : "bg-surface-sunken border-border/60 text-muted-foreground group-hover:text-foreground/90 group-hover:border-border"
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
      <div className="p-3 border-t border-sidebar-border/60 bg-surface-sunken">
        <div className="flex items-center gap-3 px-2 py-1.5 rounded-sm border border-transparent hover:border-border/60 hover:bg-surface-raised transition-all">
          <div className="h-8 w-8 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center text-xs font-semibold text-primary shadow-inner">
            {(user?.email ?? "?").slice(0, 1).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-xs font-semibold text-foreground truncate">{user?.email?.split("@")[0]}</div>
            <div className="text-xs text-muted-foreground truncate">{user?.email}</div>
          </div>
          <Button
            size="icon"
            variant="ghost"
            className="h-8 w-8 text-muted-foreground hover:text-foreground hover:bg-surface-elevated shrink-0"
            onClick={signOut}
            title="Sign out"
            aria-label="Sign out"
          >
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </aside>
  );
}
