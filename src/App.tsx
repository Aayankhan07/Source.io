import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/features/auth/context/AuthContext";
import RequireAuth from "@/features/auth/components/RequireAuth";
import { Suspense, lazy } from "react";
import { Loader2 } from "lucide-react";
import ErrorBoundary from "@/components/common/ErrorBoundary";

// Route-level splitting: the marketing page, the workspace, and the PDF/DOCX
// extractors no longer all ship in the first-load bundle.
const Index = lazy(() => import("./pages/Index"));
const Auth = lazy(() => import("@/features/auth/pages/Auth"));
const AppHome = lazy(() => import("@/features/documents/pages/AppHome"));
const AppEmpty = lazy(() => import("@/features/documents/pages/AppEmpty"));
const DocumentWorkspace = lazy(() => import("@/features/documents/pages/DocumentWorkspace"));
const NotFound = lazy(() => import("./pages/NotFound"));
// TEMPORARY design-review route. Remove before merge.
const PreviewWorkspace = lazy(() => import("./pages/__PreviewWorkspace"));

function RouteFallback() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
    </div>
  );
}

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 30_000,
      refetchOnWindowFocus: false,
    },
  },
});

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <ErrorBoundary>
            <Suspense fallback={<RouteFallback />}>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/auth" element={<Auth />} />
              <Route
                path="/app"
                element={
                  <RequireAuth>
                    <AppHome />
                  </RequireAuth>
                }
              >
                <Route index element={<AppEmpty />} />
                <Route path="doc/:docId" element={<DocumentWorkspace />} />
              </Route>
              {import.meta.env.DEV && (
                <Route path="/__preview" element={<PreviewWorkspace />} />
              )}
              <Route path="*" element={<NotFound />} />
            </Routes>
            </Suspense>
          </ErrorBoundary>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
