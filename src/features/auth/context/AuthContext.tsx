"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { errorMessage } from "@/lib/utils";

/** Upper bound on the initial session lookup before we surface an error. */
const SESSION_LOOKUP_TIMEOUT_MS = 6000;

export const GUEST_USER: User = {
  id: "guest-user-01",
  app_metadata: {},
  user_metadata: { display_name: "Scholar Guest" },
  aud: "authenticated",
  created_at: new Date().toISOString(),
  email: "guest@source.io",
} as User;

type AuthContextType = {
  user: User | null;
  session: Session | null;
  loading: boolean;
  /** Set when the initial session lookup failed. Auth state is unknown, not "signed out". */
  error: string | null;
  signOut: () => Promise<void>;
  signInAsGuest: () => void;
};

const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  loading: true,
  error: null,
  signOut: async () => {},
  signInAsGuest: () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const signInAsGuest = () => {
    try {
      localStorage.setItem("source_io_guest_session", "true");
    } catch {
      // ignore
    }
    setUser(GUEST_USER);
    setLoading(false);
    setError(null);
  };

  useEffect(() => {
    try {
      if (localStorage.getItem("source_io_guest_session") === "true") {
        setUser(GUEST_USER);
        setLoading(false);
      }
    } catch {
      // ignore
    }

    // Set up listener FIRST
    const { data: sub } = supabase.auth.onAuthStateChange((_event, sess) => {
      if (sess?.user) {
        setSession(sess);
        setUser(sess.user);
        setError(null);
      } else {
        const isGuest = localStorage.getItem("source_io_guest_session") === "true";
        if (isGuest) {
          setUser(GUEST_USER);
        } else {
          setSession(null);
          setUser(null);
        }
      }
    });

    let settled = false;
    const finish = (message: string | null) => {
      if (settled) return;
      settled = true;
      if (message) setError(message);
      setLoading(false);
    };

    const timeout = setTimeout(() => {
      const isGuest = localStorage.getItem("source_io_guest_session") === "true";
      if (isGuest) {
        setUser(GUEST_USER);
        finish(null);
      } else {
        finish("Timed out reaching the authentication service.");
      }
    }, SESSION_LOOKUP_TIMEOUT_MS);

    supabase.auth
      .getSession()
      .then(({ data: { session: sess }, error: sessErr }) => {
        if (sessErr) throw sessErr;
        if (settled) return;
        if (sess) {
          setSession(sess);
          setUser(sess.user);
        } else {
          const isGuest = localStorage.getItem("source_io_guest_session") === "true";
          if (isGuest) {
            setUser(GUEST_USER);
          }
        }
        finish(null);
      })
      .catch((e: unknown) => {
        const isGuest = localStorage.getItem("source_io_guest_session") === "true";
        if (isGuest) {
          setUser(GUEST_USER);
          finish(null);
        } else {
          finish(errorMessage(e));
        }
      });

    return () => {
      clearTimeout(timeout);
      sub.subscription.unsubscribe();
    };
  }, []);

  const signOut = async () => {
    try {
      localStorage.removeItem("source_io_guest_session");
    } catch {
      // ignore
    }
    setUser(null);
    setSession(null);
    await supabase.auth.signOut().catch(() => {});
  };

  return (
    <AuthContext.Provider value={{ user, session, loading, error, signOut, signInAsGuest }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
