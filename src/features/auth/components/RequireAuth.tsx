import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/features/auth/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Loader2, Sparkles, ArrowRight } from "lucide-react";
import { useTheme } from "@/hooks/use-theme";
import { cn } from "@/lib/utils";

export default function RequireAuth({ children }: { children: React.ReactNode }) {
  const { user, loading, error, signInAsGuest } = useAuth();
  const location = useLocation();
  const { theme } = useTheme();

  if (loading) {
    return (
      <div className={cn("luminous-app min-h-screen flex items-center justify-center bg-background", theme === "dark" && "dark")}>
        <Loader2 className="h-5 w-5 animate-spin text-sky-500" />
      </div>
    );
  }

  if (error && !user) {
    return (
      <div className={cn("luminous-app min-h-screen flex items-center justify-center bg-background px-6 font-sans antialiased", theme === "dark" && "dark")}>
        <div className="bg-card border border-border rounded-3xl p-8 text-center max-w-sm space-y-4 shadow-xl">
          <div className="h-12 w-12 rounded-full bg-sky-50 dark:bg-sky-500/10 border border-sky-200 dark:border-sky-500/30 flex items-center justify-center text-sky-600 dark:text-sky-400 mx-auto">
            <Sparkles className="h-6 w-6" />
          </div>
          <div className="space-y-1.5">
            <h1 className="font-semibold text-foreground font-display text-base">Explore Source.io Studio</h1>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Use demo mode to explore the full interactive study workspace and sample documents.
            </p>
          </div>
          <Button onClick={signInAsGuest} className="w-full font-semibold text-xs py-2.5 shadow-md">
            <span>Continue in Demo Mode</span>
            <ArrowRight className="h-3.5 w-3.5 ml-1.5" />
          </Button>
        </div>
      </div>
    );
  }

  if (!user) return <Navigate to="/auth" state={{ from: location }} replace />;
  return <>{children}</>;
}
