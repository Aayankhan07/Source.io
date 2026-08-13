import { Component, type ErrorInfo, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { AlertTriangle, RefreshCw } from "lucide-react";

type Props = { children: ReactNode };
type State = { error: Error | null };

/**
 * Catches render-time errors so a thrown component does not leave a blank page.
 * Async/event-handler errors are not caught by React error boundaries — those
 * still surface through the per-action toasts.
 */
export default class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("Unhandled render error:", error, info.componentStack);
  }

  render() {
    const { error } = this.state;
    if (!error) return this.props.children;

    return (
      <div className="min-h-screen flex items-center justify-center bg-background px-6">
        <div className="glass-panel rounded-2xl border border-white/10 p-8 text-center max-w-md space-y-4">
          <div className="h-10 w-10 rounded-lg bg-destructive/10 border border-destructive/20 flex items-center justify-center text-destructive mx-auto">
            <AlertTriangle className="h-5 w-5" />
          </div>
          <div className="space-y-1.5">
            <h1 className="font-bold text-white font-display text-base">Something went wrong</h1>
            <p className="text-sm text-neutral-400 leading-relaxed">
              This page hit an unexpected error. Reloading usually clears it — your saved documents are unaffected.
            </p>
          </div>
          <pre className="text-xs text-neutral-500 font-mono bg-neutral-900/60 border border-white/5 rounded-lg p-3 text-left overflow-x-auto max-h-32">
            {error.message}
          </pre>
          <div className="flex items-center justify-center gap-2">
            <Button
              onClick={() => window.location.reload()}
              className="bg-primary hover:bg-primary/95 text-primary-foreground font-semibold"
            >
              <RefreshCw className="h-4 w-4 mr-1.5" /> Reload page
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                this.setState({ error: null });
                window.location.assign("/app");
              }}
              className="border-white/10 text-white hover:bg-white/5"
            >
              Back to library
            </Button>
          </div>
        </div>
      </div>
    );
  }
}
