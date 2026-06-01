import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/features/auth/context/AuthContext";
import RequireAuth from "@/features/auth/components/RequireAuth";
import Index from "./pages/Index";
import Auth from "@/features/auth/pages/Auth";
import AppHome from "@/features/documents/pages/AppHome";
import AppEmpty from "@/features/documents/pages/AppEmpty";
import DocumentWorkspace from "@/features/documents/pages/DocumentWorkspace";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
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
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
