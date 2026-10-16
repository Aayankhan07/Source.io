"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useAuth } from "@/features/auth/context/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { 
  Sparkles, 
  Check, 
  ExternalLink, 
  Clock, 
  Key, 
  ShieldCheck, 
  Zap, 
  Headphones, 
  FileText, 
  HelpCircle,
  CreditCard,
  ArrowRight
} from "lucide-react";
import { cn } from "@/lib/utils";

interface PlanBillingSettingsProps {
  onSwitchToModelsTab?: () => void;
}

export default function PlanBillingSettings({ onSwitchToModelsTab }: PlanBillingSettingsProps) {
  const { user } = useAuth();
  const [timeUntilReset, setTimeUntilReset] = useState<string>("");

  // Live countdown to 00:00 UTC daily quota reset
  useEffect(() => {
    function updateCountdown() {
      const now = new Date();
      const nextUtcMidnight = new Date(Date.UTC(
        now.getUTCFullYear(),
        now.getUTCMonth(),
        now.getUTCDate() + 1,
        0, 0, 0, 0
      ));
      const diffMs = nextUtcMidnight.getTime() - now.getTime();
      const hours = Math.floor(diffMs / (1000 * 60 * 60));
      const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diffMs % (1000 * 60)) / 1000);
      setTimeUntilReset(
        `${String(hours).padStart(2, "0")}h ${String(minutes).padStart(2, "0")}m ${String(seconds).padStart(2, "0")}s`
      );
    }
    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  }, []);

  // Fetch user subscription tier & quotas from Supabase
  const { data: userProfile, isLoading } = useQuery({
    queryKey: ["user_tier_billing", user?.id],
    enabled: !!user?.id,
    queryFn: async () => {
      const { data } = await supabase
        .from("profiles")
        .select("tier, daily_quota_limit, daily_tts_quota_limit")
        .or(`id.eq.${user!.id},user_id.eq.${user!.id}`)
        .maybeSingle();
      return data;
    },
  });

  const isScholarPass = userProfile?.tier === "pro";
  const dailyQuota = userProfile?.daily_quota_limit ?? (isScholarPass ? 200 : 25);
  const dailyTtsQuota = userProfile?.daily_tts_quota_limit ?? (isScholarPass ? 50 : 2);

  const checkoutUrl = `https://sourceio.lemonsqueezy.com/buy/scholar-pass?checkout[custom][user_id]=${user?.id || ""}&checkout[email]=${encodeURIComponent(user?.email || "")}`;

  return (
    <div className="space-y-6 sm:space-y-8 max-w-4xl">
      {/* 1. Current Active Tier Overview Card */}
      <div className="rounded-[28px] bg-card border-2 border-border p-6 sm:p-8 shadow-tactile-card relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2.5">
              <span className="p-1.5 rounded-xl bg-primary/10 text-primary">
                <CreditCard className="size-4" />
              </span>
              <span className="text-xs font-mono font-bold uppercase tracking-wider text-muted-foreground">
                Current Plan
              </span>
              {isScholarPass ? (
                <span className="text-[11px] font-mono px-3 py-0.5 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 font-bold border border-emerald-500/30 flex items-center gap-1">
                  <Check className="size-3" /> Scholar Pass Active
                </span>
              ) : (
                <span className="text-[11px] font-mono px-3 py-0.5 rounded-full bg-muted text-muted-foreground font-semibold border border-border">
                  Free Forever Plan
                </span>
              )}
            </div>

            <h2 className="text-2xl sm:text-3xl font-extrabold font-display text-foreground tracking-tight">
              {isScholarPass ? "Scholar Pass Subscription" : "Standard Student Tier"}
            </h2>
            <p className="text-xs sm:text-sm text-muted-foreground max-w-xl leading-relaxed">
              {isScholarPass
                ? "You have full Scholar Pass privileges with 200 daily generation actions, 50 studio podcast renders, and priority high-throughput GPU queuing."
                : "Every account receives 25 daily AI actions that reset every night at 00:00 UTC. Bring your own API keys anytime for unlimited zero-cost usage."}
            </p>
          </div>

          <div className="flex flex-col sm:flex-row md:flex-col gap-2 shrink-0">
            {isScholarPass ? (
              <a
                href="https://sourceio.lemonsqueezy.com/billing"
                target="_blank"
                rel="noreferrer"
                className="h-10 px-5 rounded-full bg-muted hover:bg-accent text-foreground text-xs font-semibold flex items-center justify-center gap-1.5 border border-border transition-colors cursor-pointer"
              >
                <span>Manage Subscription</span>
                <ExternalLink className="size-3.5" />
              </a>
            ) : (
              <a
                href={checkoutUrl}
                target="_blank"
                rel="noreferrer"
                className="h-10 px-6 rounded-full bg-primary text-primary-foreground text-xs font-bold flex items-center justify-center gap-2 hover:opacity-90 shadow-tactile-pill transition-all cursor-pointer whitespace-nowrap"
              >
                <Sparkles className="size-3.5" />
                <span>Upgrade to Scholar Pass ($9/mo)</span>
                <ExternalLink className="size-3" />
              </a>
            )}
            <Link
              href="/#pricing"
              className="text-center text-[11px] text-muted-foreground hover:text-foreground font-medium transition-colors py-1"
            >
              View public comparison &rarr;
            </Link>
          </div>
        </div>

        {/* Live Quota & Reset Counter Badges */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-6 mt-6 border-t border-border">
          <div className="p-3.5 rounded-2xl bg-muted/40 border border-border/60">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-1">
              <Zap className="size-3.5 text-amber-500" />
              <span>Daily AI Generation</span>
            </div>
            <div className="text-lg font-bold font-mono text-foreground">
              {dailyQuota} <span className="text-xs font-normal text-muted-foreground">actions/day</span>
            </div>
          </div>

          <div className="p-3.5 rounded-2xl bg-muted/40 border border-border/60">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-1">
              <Headphones className="size-3.5 text-sky-500" />
              <span>Studio Voice Renders</span>
            </div>
            <div className="text-lg font-bold font-mono text-foreground">
              {dailyTtsQuota} <span className="text-xs font-normal text-muted-foreground">episodes/day</span>
            </div>
          </div>

          <div className="p-3.5 rounded-2xl bg-muted/40 border border-border/60">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-1">
              <Clock className="size-3.5 text-emerald-500" />
              <span>Quota Resets In</span>
            </div>
            <div className="text-lg font-bold font-mono text-foreground">
              {timeUntilReset || "--:--:--"}
            </div>
          </div>
        </div>
      </div>

      {/* 2. Side-by-Side Tier Breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Tier 1: Free Forever */}
        <div className="rounded-[28px] bg-card border border-border p-6 sm:p-7 shadow-tactile-card flex flex-col justify-between space-y-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-[11px] font-mono uppercase tracking-wider text-muted-foreground font-semibold">
                  Standard Tier
                </span>
                <h3 className="text-xl font-bold font-display text-foreground mt-0.5">
                  Free Forever
                </h3>
              </div>
              <div className="text-right">
                <span className="text-2xl font-extrabold font-display text-foreground">$0</span>
                <span className="text-xs text-muted-foreground">/forever</span>
              </div>
            </div>

            <p className="text-xs text-muted-foreground leading-relaxed">
              Ideal for high school and undergraduate coursework with daily quota resets and zero trial traps.
            </p>

            <ul className="space-y-2.5 pt-2 border-t border-border text-xs text-foreground">
              <li className="flex items-center gap-2">
                <Check className="size-3.5 text-emerald-500 shrink-0" />
                <span><strong>25 daily AI actions</strong> (resets nightly at 00:00 UTC)</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="size-3.5 text-emerald-500 shrink-0" />
                <span>All 7 Role-Adaptive Presets & Cornell Note blocks</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="size-3.5 text-emerald-500 shrink-0" />
                <span>KaTeX formula & mathematical proof rendering</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="size-3.5 text-emerald-500 shrink-0" />
                <span>Page-and-line citation proofs & coordinate viewers</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="size-3.5 text-emerald-500 shrink-0" />
                <span><strong>Unlimited zero-cost BYOK</strong> (Gemini, OpenAI, Groq)</span>
              </li>
            </ul>
          </div>

          <div className="pt-4 border-t border-border">
            <span className="text-xs font-medium text-muted-foreground">
              Included with your account
            </span>
          </div>
        </div>

        {/* Tier 2: Scholar Pass */}
        <div className="rounded-[28px] bg-card border-2 border-primary/40 p-6 sm:p-7 shadow-tactile-card flex flex-col justify-between space-y-6 relative overflow-hidden">
          <div className="absolute top-0 right-0 bg-primary text-primary-foreground text-[10px] font-mono font-bold uppercase tracking-wider px-3.5 py-1 rounded-bl-xl shadow-xs">
            Recommended for Exams
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-[11px] font-mono uppercase tracking-wider text-primary font-bold">
                  Power Academic
                </span>
                <h3 className="text-xl font-bold font-display text-foreground mt-0.5">
                  Scholar Pass
                </h3>
              </div>
              <div className="text-right">
                <span className="text-2xl font-extrabold font-display text-foreground">$9</span>
                <span className="text-xs text-muted-foreground">/month</span>
              </div>
            </div>

            <p className="text-xs text-muted-foreground leading-relaxed">
              Designed for intense semesters, thesis research, and medical/law exam preparation.
            </p>

            <ul className="space-y-2.5 pt-2 border-t border-border text-xs text-foreground">
              <li className="flex items-center gap-2">
                <Check className="size-3.5 text-primary shrink-0" />
                <span><strong>200 daily AI actions</strong> with priority GPU routing</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="size-3.5 text-primary shrink-0" />
                <span><strong>50 neural 2-host audio podcast renders</strong> per day</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="size-3.5 text-primary shrink-0" />
                <span>Unlimited document slots & monographs up to 250 pages</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="size-3.5 text-primary shrink-0" />
                <span>Teacher & Researcher assessment rubric exports</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="size-3.5 text-primary shrink-0" />
                <span>7-day full money-back guarantee, cancel anytime</span>
              </li>
            </ul>
          </div>

          <div className="pt-4 border-t border-border">
            {isScholarPass ? (
              <div className="w-full h-10 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs font-bold flex items-center justify-center gap-2 select-none">
                <Check className="size-4" />
                <span>Active On Your Account</span>
              </div>
            ) : (
              <a
                href={checkoutUrl}
                target="_blank"
                rel="noreferrer"
                className="w-full h-10 rounded-full bg-primary text-primary-foreground text-xs font-bold flex items-center justify-center gap-2 hover:opacity-90 shadow-tactile-pill transition-all cursor-pointer"
              >
                <Sparkles className="size-3.5" />
                <span>Get Scholar Pass ($9/mo)</span>
                <ExternalLink className="size-3" />
              </a>
            )}
          </div>
        </div>
      </div>

      {/* 3. Honest BYOK Notice (Don't want to pay? Bring Your Own Key) */}
      <div className="rounded-[24px] bg-muted/40 border border-border p-5 sm:p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-start gap-3">
          <span className="p-2 rounded-xl bg-amber-500/15 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5">
            <Key className="size-4" />
          </span>
          <div className="space-y-1">
            <h4 className="text-sm font-bold text-foreground">
              Don't want to subscribe? Bring Your Own Key (BYOK)
            </h4>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Source.io supports direct client-side provider keys. Paste your personal Gemini, OpenAI, Anthropic, or Groq API key in the AI & Models tab for 100% free unlimited synthesis.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => {
            if (onSwitchToModelsTab) {
              onSwitchToModelsTab();
            } else {
              window.location.hash = "#models";
            }
          }}
          className="shrink-0 h-9 px-4 rounded-full bg-card hover:bg-accent border border-border text-xs font-semibold text-foreground flex items-center gap-1.5 transition-colors cursor-pointer"
        >
          <span>Configure API Keys</span>
          <ArrowRight className="size-3.5" />
        </button>
      </div>

      {/* 4. Security & Guarantee Badges */}
      <div className="flex flex-wrap items-center justify-between gap-4 px-2 text-xs text-muted-foreground">
        <div className="flex items-center gap-2">
          <ShieldCheck className="size-4 text-emerald-500" />
          <span>Encrypted payment processing via LemonSqueezy</span>
        </div>
        <div className="flex items-center gap-4">
          <Link href="/#faq" className="hover:text-foreground transition-colors">
            Billing FAQ
          </Link>
          <span>&bull;</span>
          <Link href="/#pricing" className="hover:text-foreground transition-colors">
            Full Pricing Comparison
          </Link>
        </div>
      </div>
    </div>
  );
}
