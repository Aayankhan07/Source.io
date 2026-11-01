import type { Metadata } from "next";
import RequireAuth from "@/features/auth/components/RequireAuth";
import AppHome from "@/features/documents/pages/AppHome";

export const metadata: Metadata = {
  robots: {
    index: false,
    follow: false,
  },
};

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <RequireAuth>
      <AppHome>{children}</AppHome>
    </RequireAuth>
  );
}
