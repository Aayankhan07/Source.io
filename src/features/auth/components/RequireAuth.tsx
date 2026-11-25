"use client";

import { useRouter } from "next/navigation";
import { useAuth } from "@/features/auth/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Loader2, AlertCircle, RefreshCw } from "lucide-react";
import { useTheme } from "@/hooks/use-theme";
import { cn } from "@/lib/utils";
import { useEffect } from "react";
import { useSettings } from "@/features/settings/context/SettingsContext";
import { usePathname } from "next/navigation";
import Link from "next/link";

export default function RequireAuth({ children }: { children: React.ReactNode }) {
  const { user, loading, error } = useAuth();
  const { onboardingCompleted, settingsUserId } = useSettings();
  const router = useRouter();
  const pathname = usePathname();
  const { theme } = useTheme();

  const isOnboardingRoute = pathname.startsWith("/app/onboarding");
  // Onboarding state is only meaningful once it was loaded for *this* user.
  const onboardingKnown = !!user && settingsUserId === user.id && onboardingCompleted !== undefined;
  const waitingForOnboarding = !!user && !isOnboardingRoute && !onboardingKnown;

  useEffect(() => {
    if (!loading && !user && !error) {
      router.replace(`/auth?next=${encodeURIComponent(pathname)}`);
      return;
    }

    if (!loading && user && onboardingKnown && !onboardingCompleted && !isOnboardingRoute) {
      router.replace("/app/onboarding");
    }
  }, [loading, user, error, onboardingKnown, onboardingCompleted, isOnboardingRoute, pathname, router]);

  const spinner = (
    <div className={cn("luminous-app min-h-screen flex items-center justify-center bg-background", theme === "dark" && "dark")}>
      <Loader2 className="h-5 w-5 animate-spin text-foreground" />
    </div>
  );

  if (loading) return spinner;

  if (error && !user) {
    return (
      <div className={cn("luminous-app min-h-screen flex items-center justify-center bg-background px-6 font-sans antialiased", theme === "dark" && "dark")}>
        <div className="bg-card border border-border rounded-3xl p-8 text-center max-w-sm space-y-4 shadow-xl">
          <div className="h-12 w-12 rounded-full bg-muted dark:bg-zinc-800 border border-border flex items-center justify-center text-foreground mx-auto">
            <AlertCircle className="h-6 w-6" />
          </div>
          <div className="space-y-1.5">
            <h1 className="font-semibold text-foreground font-display text-base">Couldn&apos;t reach sign-in</h1>
            <p className="text-xs text-muted-foreground leading-relaxed">{error}</p>
          </div>
          <div className="flex flex-col gap-2">
            <Button onClick={() => window.location.reload()} className="w-full font-semibold text-xs py-2.5 shadow-md">
              <RefreshCw className="h-3.5 w-3.5 mr-1.5" />
              <span>Try again</span>
            </Button>
            <Button asChild variant="outline" className="w-full text-xs">
              <Link href="/demo">Browse the sample documents</Link>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (!user || waitingForOnboarding) return spinner;

  return <>{children}</>;
}
