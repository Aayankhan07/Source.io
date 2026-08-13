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
      {/* Same ambient treatment as the rest of the app, so this reads as a page
          rather than a crash. */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[350px] h-[350px] rounded-full bg-primary/5 blur-[80px] pointer-events-none" />

      <div className="glass-panel rounded-2xl border border-white/10 p-10 text-center max-w-md space-y-5 relative z-10">
        <div className="h-12 w-12 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary mx-auto">
          <Compass className="h-6 w-6" />
        </div>

        <div className="space-y-2">
          <p className="text-xs font-mono uppercase tracking-widest text-neutral-500">Error 404</p>
          <h1 className="text-2xl font-bold text-white font-display tracking-tight">This page doesn't exist</h1>
          <p className="text-sm text-neutral-400 leading-relaxed">
            The link may be outdated, or the page was moved. Your documents are safe.
          </p>
        </div>

        <div className="flex items-center justify-center gap-2 pt-1">
          <Button asChild className="bg-primary hover:bg-primary/95 text-primary-foreground font-semibold">
            <Link to="/app">Go to workspace</Link>
          </Button>
          <Button asChild variant="outline" className="border-white/10 text-white hover:bg-white/5">
            <Link to="/">Back to home</Link>
          </Button>
        </div>
      </div>
    </main>
  );
};

export default NotFound;
