import type { Metadata } from "next";
import { Suspense } from "react";
import Auth from "@/features/auth/pages/Auth";

export const metadata: Metadata = {
  title: "Sign In or Create Account | Source.io",
  robots: {
    index: false,
    follow: false,
  },
};

export default function AuthPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-white" />}>
      <Auth />
    </Suspense>
  );
}
