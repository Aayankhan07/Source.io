import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/features/auth/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Sparkles, Loader2, Mail, ArrowLeft, ArrowUpRight, Upload, Headphones, ListChecks, ArrowRight, ShieldCheck } from "lucide-react";
import ThemeToggle from "@/components/common/ThemeToggle";
import { useTheme } from "@/hooks/use-theme";
import { cn } from "@/lib/utils";

export default function Auth() {
  const { user, loading, signInAsGuest } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { theme } = useTheme();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [signupSuccess, setSignupSuccess] = useState(false);

  useEffect(() => {
    if (!loading && user) navigate("/app", { replace: true });
  }, [user, loading, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      if (mode === "signup") {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/app`,
            data: { display_name: displayName || email.split("@")[0] },
          },
        });
        if (error) throw error;
        
        if (data?.session) {
          toast({ title: "Account created", description: "You're signed in." });
        } else {
          setSignupSuccess(true);
          toast({ 
            title: "Verification email sent", 
            description: "Please check your inbox to confirm your account.",
          });
        }
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      }
    } catch (err: unknown) {
      toast({
        title: "Authentication failed",
        description: err instanceof Error ? err.message : "Something went wrong.",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleGuestDemo = () => {
    signInAsGuest();
    toast({
      title: "Guest Session Active",
      description: "Welcome to Source.io! Exploring sample documents.",
    });
    navigate("/app");
  };

  return (
    <main className={cn("luminous-app min-h-screen flex bg-background text-foreground relative font-sans antialiased", theme === "dark" && "dark")}>
      {/* Top right theme toggle */}
      <div className="absolute top-4 right-4 z-20">
        <ThemeToggle variant="pill" />
      </div>

      {/* Left split pane: Branding / Features (Hidden on mobile) */}
      <div className="hidden lg:flex lg:w-1/2 bg-muted/40 border-r border-border p-12 flex-col justify-between relative z-10">
        {/* Top brand header */}
        <Link to="/" className="flex items-center gap-2.5 group self-start">
          <div className="h-8 w-8 rounded-full flex items-center justify-center overflow-hidden border border-border bg-card shadow-2xs">
            <img src="/favicon.png" className="h-full w-full object-contain" alt="Logo" />
          </div>
          <span className="font-semibold tracking-tight text-base font-display text-foreground">Source.io</span>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-card border border-border text-muted-foreground">
            STUDIO
          </span>
        </Link>

        {/* Content Showcase */}
        <div className="space-y-8 max-w-md my-auto">
          <div className="space-y-3">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-card border border-border text-foreground text-xs font-mono">
              <Sparkles className="h-3 w-3 text-sky-500" />
              <span>Grounded Learning Architecture</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-semibold tracking-tight font-display text-foreground leading-tight">
              One central canvas for all your sources.
            </h2>
            <p className="text-muted-foreground text-xs sm:text-sm leading-relaxed">
              Consolidate PDFs, YouTube clips, audio notes, and papers. Get structured study sets, spaced flashcards, and a conversational audio recap immediately.
            </p>
          </div>

          {/* Stepper demonstration */}
          <div className="space-y-3.5">
            <div className="flex gap-3.5 items-start p-3.5 rounded-2xl bg-card border border-border/80 shadow-2xs">
              <div className="h-8 w-8 rounded-xl bg-sky-50 dark:bg-sky-500/10 border border-sky-200 dark:border-sky-500/30 flex items-center justify-center text-sky-700 dark:text-sky-400 shrink-0">
                <Upload className="h-4 w-4" />
              </div>
              <div>
                <h4 className="text-xs font-semibold text-foreground mb-0.5">Ingest Any Source</h4>
                <p className="text-xs text-muted-foreground">Drop PDFs, lecture audios, or YouTube links. Synthesized in seconds.</p>
              </div>
            </div>

            <div className="flex gap-3.5 items-start p-3.5 rounded-2xl bg-card border border-border/80 shadow-2xs">
              <div className="h-8 w-8 rounded-xl bg-sky-50 dark:bg-sky-500/10 border border-sky-200 dark:border-sky-500/30 flex items-center justify-center text-sky-700 dark:text-sky-400 shrink-0">
                <Headphones className="h-4 w-4" />
              </div>
              <div>
                <h4 className="text-xs font-semibold text-foreground mb-0.5">Conversational Audio Recap</h4>
                <p className="text-xs text-muted-foreground">Listen to a 2-host podcast walkthrough with interactive transcripts.</p>
              </div>
            </div>

            <div className="flex gap-3.5 items-start p-3.5 rounded-2xl bg-card border border-border/80 shadow-2xs">
              <div className="h-8 w-8 rounded-xl bg-sky-50 dark:bg-sky-500/10 border border-sky-200 dark:border-sky-500/30 flex items-center justify-center text-sky-700 dark:text-sky-400 shrink-0">
                <ListChecks className="h-4 w-4" />
              </div>
              <div>
                <h4 className="text-xs font-semibold text-foreground mb-0.5">Grounded Inquiry & Quizzes</h4>
                <p className="text-xs text-muted-foreground">Answers cite precise source passages with similarity confidence scores.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="text-xs text-muted-foreground flex justify-between items-center">
          <span>© Source.io AI Study Companion</span>
          <Link to="/" className="hover:text-foreground transition-colors flex items-center gap-1 font-medium">
            Explore features <ArrowUpRight className="h-3 w-3" />
          </Link>
        </div>
      </div>

      {/* Right split pane: Login / SignUp Form */}
      <div className="w-full lg:w-1/2 flex flex-col justify-center items-center px-6 sm:px-12 py-16 relative z-10">
        {/* Brand header for mobile */}
        <div className="lg:hidden flex items-center gap-2 justify-center mb-8">
          <div className="h-8 w-8 rounded-full flex items-center justify-center overflow-hidden border border-border bg-card shadow-2xs">
            <img src="/favicon.png" className="h-full w-full object-contain" alt="Logo" />
          </div>
          <h1 className="text-lg font-semibold tracking-tight text-foreground font-display">Source.io</h1>
        </div>

        <div className="w-full max-w-sm">
          {/* Card Form */}
          <div className="bg-card border border-border p-7 sm:p-8 rounded-3xl shadow-xl relative">
            {signupSuccess ? (
              <div className="text-center py-4 space-y-6 animate-in fade-in zoom-in duration-300">
                <div className="h-16 w-16 mx-auto rounded-full bg-sky-50 dark:bg-sky-500/10 border border-sky-200 dark:border-sky-500/30 flex items-center justify-center text-sky-600 dark:text-sky-400 shadow-sm">
                  <Mail className="h-8 w-8" />
                </div>
                <div className="space-y-2">
                  <h2 className="text-2xl font-bold tracking-tight text-foreground font-display">Check your inbox</h2>
                  <p className="text-xs text-muted-foreground max-w-xs mx-auto leading-relaxed">
                    We have sent a verification link to <span className="font-semibold text-foreground">{email}</span>. 
                    Please click the link to activate your account.
                  </p>
                </div>
                <Button 
                  onClick={() => {
                    setSignupSuccess(false);
                    setMode("signin");
                  }} 
                  className="w-full mt-4 font-semibold rounded-full bg-slate-900 hover:bg-slate-800 dark:bg-sky-500 dark:hover:bg-sky-400 text-white"
                >
                  Back to Sign In
                </Button>
              </div>
            ) : (
              <>
                <div className="mb-6">
                  <h2 className="text-xl sm:text-2xl font-semibold tracking-tight text-foreground font-display">
                    {mode === "signin" ? "Welcome back" : "Create your account"}
                  </h2>
                  <p className="text-xs text-muted-foreground mt-1">
                    {mode === "signin" ? "Log in to access your study library." : "Start building your intelligent workspace."}
                  </p>
                </div>

                {/* Instant Demo Launcher Pill */}
                <div className="mb-5">
                  <Button
                    type="button"
                    onClick={handleGuestDemo}
                    className="w-full bg-sky-50 hover:bg-sky-100 dark:bg-sky-500/15 dark:hover:bg-sky-500/25 text-sky-800 dark:text-sky-300 border border-sky-200 dark:border-sky-500/30 font-semibold py-2.5 rounded-full flex items-center justify-center gap-2 text-xs shadow-2xs transition-all"
                  >
                    <Sparkles className="h-3.5 w-3.5 text-sky-600 dark:text-sky-400 shrink-0" />
                    <span>Instant Demo Mode (No sign-up needed)</span>
                    <ArrowRight className="h-3.5 w-3.5 ml-auto text-sky-500" />
                  </Button>
                </div>

                <div className="relative my-4">
                  <div className="absolute inset-0 flex items-center"><span className="w-full border-t border-border" /></div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-card px-2.5 text-[10px] text-muted-foreground font-mono">or email account</span>
                  </div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-3.5">
                  {mode === "signup" && (
                    <div className="space-y-1.5">
                      <Label htmlFor="name" className="text-xs text-foreground font-medium">Display name</Label>
                      <Input 
                        id="name" 
                        value={displayName} 
                        onChange={(e) => setDisplayName(e.target.value)} 
                        placeholder="Your name" 
                        className="bg-muted/40 border-border focus:border-sky-500 text-foreground placeholder:text-muted-foreground rounded-xl text-xs"
                      />
                    </div>
                  )}
                  <div className="space-y-1.5">
                    <Label htmlFor="email" className="text-xs text-foreground font-medium">Email address</Label>
                    <Input 
                      id="email" 
                      type="email" 
                      value={email} 
                      onChange={(e) => setEmail(e.target.value)} 
                      required 
                      placeholder="name@university.edu" 
                      className="bg-muted/40 border-border focus:border-sky-500 text-foreground placeholder:text-muted-foreground rounded-xl text-xs"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="password" className="text-xs text-foreground font-medium">Password</Label>
                    <Input 
                      id="password" 
                      type="password" 
                      value={password} 
                      onChange={(e) => setPassword(e.target.value)} 
                      required 
                      minLength={6} 
                      placeholder="••••••••" 
                      className="bg-muted/40 border-border focus:border-sky-500 text-foreground placeholder:text-muted-foreground rounded-xl text-xs"
                    />
                  </div>

                  <Button 
                    type="submit" 
                    className="w-full bg-slate-900 hover:bg-slate-800 dark:bg-sky-500 dark:hover:bg-sky-400 text-white font-semibold py-2.5 rounded-full transition-colors text-xs shadow-sm mt-1" 
                    disabled={submitting}
                  >
                    {submitting ? (
                      <span className="flex items-center justify-center gap-2">
                        <Loader2 className="h-4 w-4 animate-spin text-white" /> Connecting…
                      </span>
                    ) : (
                      <span>{mode === "signin" ? "Sign in to Workspace" : "Create Account"}</span>
                    )}
                  </Button>
                </form>

                <div className="relative my-4">
                  <div className="absolute inset-0 flex items-center"><span className="w-full border-t border-border" /></div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-card px-2.5 text-[10px] text-muted-foreground font-mono">or continue with</span>
                  </div>
                </div>

                <Button
                  type="button"
                  variant="outline"
                  className="w-full bg-card border-border hover:bg-accent text-foreground font-medium py-2 rounded-full flex items-center justify-center gap-2 text-xs shadow-2xs"
                  disabled={submitting}
                  onClick={async () => {
                    setSubmitting(true);
                    try {
                      const { error } = await supabase.auth.signInWithOAuth({
                        provider: "google",
                        options: {
                          redirectTo: `${window.location.origin}/app`,
                        },
                      });
                      if (error) throw error;
                    } catch (err: unknown) {
                      toast({
                        title: "Google sign-in failed",
                        description: err instanceof Error ? err.message : "Something went wrong.",
                        variant: "destructive",
                      });
                      setSubmitting(false);
                    }
                  }}
                >
                  <svg className="h-4 w-4" viewBox="0 0 24 24">
                    <path fill="#EA4335" d="M12 10.2v3.9h5.5c-.2 1.4-1.7 4.1-5.5 4.1-3.3 0-6-2.7-6-6.1s2.7-6.1 6-6.1c1.9 0 3.2.8 3.9 1.5l2.7-2.6C16.9 3.3 14.7 2.3 12 2.3 6.7 2.3 2.4 6.6 2.4 12s4.3 9.7 9.6 9.7c5.5 0 9.2-3.9 9.2-9.4 0-.6-.1-1.1-.2-1.6H12z"/>
                  </svg>
                  Google Workspace
                </Button>

                <div className="mt-5 text-center text-xs text-muted-foreground">
                  {mode === "signin" ? (
                    <>
                      Don't have an account?{" "}
                      <button className="text-sky-600 dark:text-sky-400 font-semibold hover:underline transition-all rounded focus-ring ml-1" onClick={() => setMode("signup")}>Sign up free</button>
                    </>
                  ) : (
                    <>
                      Already have an account?{" "}
                      <button className="text-sky-600 dark:text-sky-400 font-semibold hover:underline transition-all rounded focus-ring ml-1" onClick={() => setMode("signin")}>Sign in here</button>
                    </>
                  )}
                </div>
              </>
            )}
          </div>

          <p className="text-center text-xs text-muted-foreground mt-6">
            <Link to="/" className="hover:text-foreground transition-colors inline-flex items-center gap-1.5 font-medium">
              <ArrowLeft className="h-3 w-3" /> Back to home
            </Link>
          </p>
        </div>
      </div>
    </main>
  );
}
