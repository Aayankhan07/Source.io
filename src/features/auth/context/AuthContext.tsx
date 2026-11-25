"use client";

import { createContext, useCallback, useContext, useEffect, useState, ReactNode } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase, migrateLegacyLocalStorageSession } from "@/integrations/supabase/client";
import { identifyUser, resetAnalytics } from "@/lib/analytics/track";
import { errorMessage } from "@/lib/utils";
import { clearLegacySettingsStorage, useOptionalSettings } from "@/features/settings/context/SettingsContext";

/** Upper bound on the initial session lookup before we surface an error. */
const SESSION_LOOKUP_TIMEOUT_MS = 6000;

type AuthContextType = {
  user: User | null;
  session: Session | null;
  loading: boolean;
  /** Set when the initial session lookup failed. Auth state is unknown, not "signed out". */
  error: string | null;
  /**
   * True when a pre-cookie (localStorage) session from an older app version
   * existed but could not be restored, so the user has to sign in once more.
   */
  legacySessionExpired: boolean;
  signOut: () => Promise<void>;
};


const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  loading: true,
  error: null,
  legacySessionExpired: false,
  signOut: async () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [legacySessionExpired, setLegacySessionExpired] = useState(false);
  const settingsCtx = useOptionalSettings();
  const clearSettings = settingsCtx?.clearForSignOut;

  useEffect(() => {
    // Set up listener FIRST
    const { data: sub } = supabase.auth.onAuthStateChange((_event, sess) => {
      setSession(sess ?? null);
      setUser(sess?.user ?? null);
      if (sess?.user) setError(null);
    });

    let settled = false;
    const finish = (message: string | null) => {
      if (settled) return;
      settled = true;
      if (message) setError(message);
      setLoading(false);
    };

    const timeout = setTimeout(() => {
      finish("Timed out reaching the authentication service.");
    }, SESSION_LOOKUP_TIMEOUT_MS);

    // Sessions from before the cookie-based client lived in localStorage; move
    // them into cookies first so existing users are not silently signed out.
    migrateLegacyLocalStorageSession()
      .then((migration) => {
        if (migration === "expired") setLegacySessionExpired(true);
        return supabase.auth.getSession();
      })
      .then(({ data: { session: sess }, error: sessErr }) => {
        if (sessErr) throw sessErr;
        if (settled) return;
        setSession(sess);
        setUser(sess?.user ?? null);
        finish(null);
      })
      .catch((e: unknown) => {
        finish(errorMessage(e));
      });

    return () => {
      clearTimeout(timeout);
      sub.subscription.unsubscribe();
    };
  }, []);

  const userId = user?.id;
  useEffect(() => {
    if (userId) identifyUser(userId);
  }, [userId]);

  const signOut = useCallback(async () => {
    // Per-user settings and session API keys must not survive into the next account on this browser.
    if (clearSettings) clearSettings();
    else clearLegacySettingsStorage();
    setUser(null);
    setSession(null);
    resetAnalytics();
    await supabase.auth.signOut().catch(() => {});
  }, [clearSettings]);

  return (
    <AuthContext.Provider value={{ user, session, loading, error, legacySessionExpired, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
