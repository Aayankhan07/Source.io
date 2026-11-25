"use client";

import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { queryKeys } from "@/lib/queryKeys";
import { useAuth } from "@/features/auth/context/AuthContext";
import type { DocumentRow } from "@/features/documents/types";

/**
 * Single fetch definition for `queryKeys.documents`. Every consumer of that key
 * must use this hook so the cached shape is identical everywhere (dashboard,
 * library, command palette, notifications).
 */
export const DOCUMENTS_LIST_SELECT = "id,title,source_type,status,error_code,created_at,updated_at";

export type DocumentListRow = DocumentRow & { updated_at: string };

export function useDocumentsList() {
  const { user } = useAuth();
  return useQuery({
    queryKey: queryKeys.documents,
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("documents")
        .select(DOCUMENTS_LIST_SELECT)
        .order("created_at", { ascending: false })
        .limit(200);
      if (error) throw error;
      return (data ?? []) as DocumentListRow[];
    },
  });
}
