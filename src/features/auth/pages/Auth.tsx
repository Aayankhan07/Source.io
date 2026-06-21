import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/features/auth/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Sparkles, Loader2, Mail, ArrowLeft, ArrowUpRight, Upload, Headphones, ListChecks } from "lucide-react";

export default function Auth() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
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
    } catch (err: any) {
      toast({
        title: "Authentication failed",
        description: err.message ?? "Something went wrong.",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="min-h-screen flex bg-[#09090b] text-foreground relative overflow-hidden">
      {/* Background radial highlights */}
      <div className="absolute top-[-10%] right-[-10%] w-[50vw] h-[50vw] rounded-full bg-primary/5 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] left-[-10%] w-[50vw] h-[50vw] rounded-full bg-purple-500/5 blur-[120px] pointer-events-none" />

      {/* Left split pane: Branding / Features (Hidden on mobile) */}
      <div className="hidden lg:flex lg:w-1/2 bg-[#0c0c0e] border-r border-white/5 p-12 flex-col justify-between relative z-10">
        {/* Top brand header */}
        <Link to="/" className="flex items-center gap-2 group self-start">
          <div className="h-8 w-8 rounded-lg flex items-center justify-center overflow-hidden border border-white/10 bg-card group-hover:border-primary/50 transition-colors">
            <img src="/favicon.png" className="h-full w-full object-contain" alt="Logo" />
          </div>
          <span className="font-semibold tracking-tight text-lg font-display text-white">Source.io</span>
        </Link>

        {/* Content Showcase */}
        <div className="space-y-10 max-w-lg my-auto">
          <div className="space-y-4">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-white/5 bg-white/5 text-xs text-primary font-mono font-medium">
              <Sparkles className="h-3 w-3 animate-pulse" /> Unified Knowledge Engine
            </div>
            <h2 className="text-4xl font-extrabold tracking-tight font-display text-white leading-tight">
              One central canvas for all your sources.
            </h2>
            <p className="text-neutral-400 text-sm leading-relaxed">
              Consolidate PDFs, YouTube clips, audio notes, and DOCX files. Get structured study sets and a conversational podcast summary immediately.
            </p>
          </div>

          {/* Stepper demonstration */}
          <div className="space-y-6">
            <div className="flex gap-4 items-start">
              <div className="h-8 w-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-neutral-300 shrink-0 font-semibold font-mono text-xs">01</div>
              <div>
                <h4 className="text-sm font-semibold text-white font-display mb-1 flex items-center gap-1.5"><Upload className="h-3.5 w-3.5 text-neutral-400" /> Ingest Sources</h4>
                <p className="text-xs text-neutral-400">Drag files or drop media links. Our parser indexes contents locally.</p>
              </div>
            </div>
            <div className="flex gap-4 items-start">
              <div className="h-8 w-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-neutral-300 shrink-0 font-semibold font-mono text-xs">02</div>
              <div>
                <h4 className="text-sm font-semibold text-white font-display mb-1 flex items-center gap-1.5"><Headphones className="h-3.5 w-3.5 text-neutral-400" /> Synthesize Recap</h4>
                <p className="text-xs text-neutral-400">Audio summaries compile automatically alongside notes & quiz modules.</p>
              </div>
            </div>
            <div className="flex gap-4 items-start">
              <div className="h-8 w-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-neutral-300 shrink-0 font-semibold font-mono text-xs">03</div>
              <div>
                <h4 className="text-sm font-semibold text-white font-display mb-1 flex items-center gap-1.5"><ListChecks className="h-3.5 w-3.5 text-neutral-400" /> Grounded Dialogue</h4>
                <p className="text-xs text-neutral-400">Chat with documents. Answers cite underlying source fragments directly.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="text-xs text-neutral-500 flex justify-between">
          <span>© Source.io Study Companion</span>
          <a href="/" className="hover:underline flex items-center gap-0.5">Explore features <ArrowUpRight className="h-3 w-3" /></a>
        </div>
      </div>

      {/* Right split pane: Login / SignUp Form */}
      <div className="w-full lg:w-1/2 flex flex-col justify-center items-center px-6 sm:px-12 py-16 relative z-10">
        {/* Brand header for mobile */}
        <div className="lg:hidden flex items-center gap-2 justify-center mb-10">
          <div className="h-8 w-8 rounded-lg flex items-center justify-center overflow-hidden border border-white/10 bg-card">
            <img src="/favicon.png" className="h-full w-full object-contain" alt="Logo" />
          </div>
          <h1 className="text-xl font-semibold tracking-tight text-white font-display">Source.io</h1>
        </div>

        <div className="w-full max-w-sm">
          {/* Glass Form Card */}
          <div className="glass-panel p-8 rounded-2xl border border-white/10 shadow-2xl relative">
            {signupSuccess ? (
              <div className="text-center py-4 space-y-6 animate-in fade-in zoom-in duration-300">
                <div className="h-16 w-16 mx-auto rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shadow-glow">
                  <Mail className="h-8 w-8 text-primary" />
                </div>
                <div className="space-y-2">
                  <h2 className="text-2xl font-bold tracking-tight text-white font-display">Check your inbox</h2>
                  <p className="text-xs text-neutral-400 max-w-xs mx-auto leading-relaxed">
                    We have sent a verification link to <span className="font-semibold text-white">{email}</span>. 
                    Please click the link to activate your account and start using Source.io.
                  </p>
                </div>
                <Button 
                  onClick={() => {
                    setSignupSuccess(false);
                    setMode("signin");
                  }} 
                  className="w-full mt-4 bg-white hover:bg-neutral-200 text-black font-semibold"
                >
                  Back to Sign In
                </Button>
              </div>
            ) : (
              <>
                <div className="mb-6">
                  <h2 className="text-2xl font-bold tracking-tight text-white font-display">
                    {mode === "signin" ? "Welcome back" : "Create account"}
                  </h2>
                  <p className="text-xs text-neutral-400 mt-1">
                    {mode === "signin" ? "Log in to access your study materials." : "Start building your document workspace."}
                  </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                  {mode === "signup" && (
                    <div className="space-y-1.5">
                      <Label htmlFor="name" className="text-xs text-neutral-300">Display name</Label>
                      <Input 
                        id="name" 
                        value={displayName} 
                        onChange={(e) => setDisplayName(e.target.value)} 
                        placeholder="Your name" 
                        className="bg-[#121216] border-white/5 focus:border-primary/50 text-white placeholder-neutral-600 rounded-lg text-sm"
                      />
                    </div>
                  )}
                  <div className="space-y-1.5">
                    <Label htmlFor="email" className="text-xs text-neutral-300">Email address</Label>
                    <Input 
                      id="email" 
                      type="email" 
                      value={email} 
                      onChange={(e) => setEmail(e.target.value)} 
                      required 
                      placeholder="name@domain.com" 
                      className="bg-[#121216] border-white/5 focus:border-primary/50 text-white placeholder-neutral-600 rounded-lg text-sm"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="password" className="text-xs text-neutral-300">Password</Label>
                    </div>
                    <Input 
                      id="password" 
                      type="password" 
                      value={password} 
                      onChange={(e) => setPassword(e.target.value)} 
                      required 
                      minLength={6} 
                      placeholder="••••••••" 
                      className="bg-[#121216] border-white/5 focus:border-primary/50 text-white placeholder-neutral-600 rounded-lg text-sm"
                    />
                  </div>

                  <Button 
                    type="submit" 
                    className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold py-2.5 rounded-lg transition-colors mt-2" 
                    disabled={submitting}
                  >
                    {submitting ? (
                      <span className="flex items-center justify-center gap-2">
                        <Loader2 className="h-4 w-4 animate-spin" /> Working…
                      </span>
                    ) : (
                      <span>{mode === "signin" ? "Sign in" : "Register"}</span>
                    )}
                  </Button>
                </form>

                <div className="relative my-6">
                  <div className="absolute inset-0 flex items-center"><span className="w-full border-t border-white/5" /></div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-card px-2.5 text-[10px] text-neutral-500 font-mono">or continue with</span>
                  </div>
                </div>

                <Button
                  type="button"
                  variant="outline"
                  className="w-full bg-white/5 border-white/10 hover:bg-white/10 text-white font-medium py-2.5 rounded-lg flex items-center justify-center gap-2"
                  disabled={submitting}
                  onClick={async () => {
                    setSubmitting(true);
                    const { error } = await supabase.auth.signInWithOAuth({
                      provider: "google",
                      options: {
                        redirectTo: `${window.location.origin}/app`,
                      },
                    });
                    if (error) {
                      toast({ title: "Google sign-in failed", description: error.message, variant: "destructive" });
                      setSubmitting(false);
                    }
                  }}
                >
                  <svg className="h-4 w-4" viewBox="0 0 24 24">
                    <path fill="#EA4335" d="M12 10.2v3.9h5.5c-.2 1.4-1.7 4.1-5.5 4.1-3.3 0-6-2.7-6-6.1s2.7-6.1 6-6.1c1.9 0 3.2.8 3.9 1.5l2.7-2.6C16.9 3.3 14.7 2.3 12 2.3 6.7 2.3 2.4 6.6 2.4 12s4.3 9.7 9.6 9.7c5.5 0 9.2-3.9 9.2-9.4 0-.6-.1-1.1-.2-1.6H12z"/>
                  </svg>
                  Google Workspace
                </Button>

                <div className="mt-6 text-center text-xs text-neutral-400">
                  {mode === "signin" ? (
                    <>
                      Don't have an account?{" "}
                      <button className="text-primary hover:text-primary-glow font-medium hover:underline transition-all" onClick={() => setMode("signup")}>Sign up free</button>
                    </>
                  ) : (
                    <>
                      Already have an account?{" "}
                      <button className="text-primary hover:text-primary-glow font-medium hover:underline transition-all" onClick={() => setMode("signin")}>Sign in here</button>
                    </>
                  )}
                </div>
              </>
            )}
          </div>

          <p className="text-center text-xs text-neutral-500 mt-8">
            <Link to="/" className="hover:text-white transition-colors flex items-center justify-center gap-1">
              <ArrowLeft className="h-3 w-3" /> Back to marketing page
            </Link>
          </p>
        </div>
      </div>
    </main>
  );
}
