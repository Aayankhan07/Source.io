import { Suspense } from "react";
import Auth from "@/features/auth/pages/Auth";

export default function AuthPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-white" />}>
      <Auth />
    </Suspense>
  );
}