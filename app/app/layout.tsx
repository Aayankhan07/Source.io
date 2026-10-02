import RequireAuth from "@/features/auth/components/RequireAuth";
import AppHome from "@/features/documents/pages/AppHome";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <RequireAuth>
      <AppHome>{children}</AppHome>
    </RequireAuth>
  );
}