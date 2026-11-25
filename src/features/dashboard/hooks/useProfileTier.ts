"use client";

import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { accountKeys } from "@/lib/queryKeys";
import { useAuth } from "@/features/auth/context/AuthContext";
import { planForTier, type PlanLimits } from "@/lib/plans";

/** Resolves the signed-in user's plan from profiles.tier (falls back to Free). */
export function useUserPlan(): PlanLimits {
  const { user } = useAuth();
  const { data: tier } = useQuery({
    queryKey: accountKeys.profileTier(user?.id),
    enabled: !!user?.id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("tier")
        .eq("user_id", user!.id)
        .maybeSingle();
      if (error) throw error;
      return data?.tier ?? null;
    },
    staleTime: 60_000,
  });
  return planForTier(tier);
}
