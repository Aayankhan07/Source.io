import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { errorMessage } from "@/lib/utils";

/** Upper bound on the initial session lookup before we surface an error. */
const SESSION_LOOKUP_TIMEOUT_MS = 8000;

type AuthContextType = {
  user: User | null;
  session: Session | null;
  loading: boolean;
  /** Set when the initial session lookup failed. Auth state is unknown, not "signed out". */
  error: string | null;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  loading: true,
  error: null,
  signOut: async () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Set up listener FIRST
    const { data: sub } = supabase.auth.onAuthStateChange((_event, sess) => {
      setSession(sess);
      setUser(sess?.user ?? null);
      setError(null);
    });

    // THEN fetch the existing session.
    //
    // This must be bounded, not just try/catch'd. When the stored token is expired
    // supabase-js refreshes it internally, and that retry loop can swallow a network
    // failure without ever settling the promise it returned — so `.catch`/`.finally`
    // never run and the app sits on a spinner forever. Race it against a timeout.
    let settled = false;
    const finish = (message: string | null) => {
      if (settled) return;
      settled = true;
      if (message) setError(message);
      setLoading(false);
    };

    const timeout = setTimeout(
      () => finish("Timed out reaching the authentication service."),
      SESSION_LOOKUP_TIMEOUT_MS,
    );

    supabase.auth
      .getSession()
      .then(({ data: { session: sess }, error: sessErr }) => {
        if (sessErr) throw sessErr;
        if (settled) return;
        setSession(sess);
        setUser(sess?.user ?? null);
        finish(null);
      })
      .catch((e: unknown) => finish(errorMessage(e)));

    return () => {
      clearTimeout(timeout);
      sub.subscription.unsubscribe();
    };
  }, []);

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  return (
    <AuthContext.Provider value={{ user, session, loading, error, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
