import { Link, useLocation } from "react-router-dom";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Compass } from "lucide-react";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <main className="min-h-screen flex items-center justify-center bg-background px-6 relative overflow-hidden">
      <div className="absolute inset-0 plate-field opacity-50 pointer-events-none" />

      <div className="plate plate-registered rounded-sm p-10 text-center max-w-md space-y-5 relative z-10">
        <div className="h-12 w-12 rounded-sm bg-primary/10 border border-primary/20 flex items-center justify-center text-primary mx-auto">
          <Compass className="h-6 w-6" />
        </div>

        <div className="space-y-2">
          <p className="text-xs font-mono uppercase tracking-widest text-muted-foreground">Error 404</p>
          <h1 className="text-2xl font-bold text-foreground font-display tracking-tight">This page doesn't exist</h1>
          <p className="text-sm text-muted-foreground leading-relaxed">
            The link may be outdated, or the page was moved. Your documents are safe.
          </p>
        </div>

        <div className="flex items-center justify-center gap-2 pt-1">
          <Button asChild className="bg-primary hover:bg-primary/95 text-primary-foreground font-semibold">
            <Link to="/app">Go to workspace</Link>
          </Button>
          <Button asChild variant="outline" className="border-border text-foreground hover:bg-surface-raised">
            <Link to="/">Back to home</Link>
          </Button>
        </div>
      </div>
    </main>
  );
};

export default NotFound;
