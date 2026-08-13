import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/features/auth/context/AuthContext";
import { Button } from "@/components/ui/button";
import { AlertCircle, Loader2, RefreshCw } from "lucide-react";

export default function RequireAuth({ children }: { children: React.ReactNode }) {
  const { user, loading, error } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  // The session lookup failed, so we do not know whether the user is signed in.
  // Redirecting to /auth here would wrongly present this as "signed out".
  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background px-6">
        <div className="plate rounded-sm p-8 text-center max-w-sm space-y-4">
          <div className="h-10 w-10 rounded-sm bg-destructive/10 border border-destructive/20 flex items-center justify-center text-destructive mx-auto">
            <AlertCircle className="h-5 w-5" />
          </div>
          <div className="space-y-1.5">
            <h1 className="font-bold text-foreground font-display text-base">Could not verify your session</h1>
            <p className="text-sm text-muted-foreground leading-relaxed">{error}</p>
          </div>
          <Button onClick={() => window.location.reload()} className="bg-primary hover:bg-primary/95 text-primary-foreground font-semibold">
            <RefreshCw className="h-4 w-4 mr-1.5" /> Try again
          </Button>
        </div>
      </div>
    );
  }

  if (!user) return <Navigate to="/auth" state={{ from: location }} replace />;
  return <>{children}</>;
}
