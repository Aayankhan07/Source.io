import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Sparkles, FileText, Headphones, MessagesSquare, ListChecks, Layers } from "lucide-react";
import { useAuth } from "@/features/auth/context/AuthContext";

const features = [
  { icon: FileText, title: "Rich Notes", desc: "Markdown notes with tables, math and headings — streamed in real time." },
  { icon: Layers, title: "Flashcards", desc: "Spaced-repetition friendly cards generated from your notes." },
  { icon: ListChecks, title: "Quizzes", desc: "MCQ and short-answer questions with explanations and scoring." },
  { icon: Headphones, title: "Podcasts", desc: "2-speaker audio version of any document, ready to listen on the go." },
  { icon: MessagesSquare, title: "RAG Chat", desc: "Ask questions and get answers grounded in your document." },
];

export default function Index() {
  const { user } = useAuth();
  return (
    <main className="min-h-screen bg-background">
      <header className="border-b border-border">
        <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <div className="h-7 w-7 rounded-md bg-gradient-primary flex items-center justify-center shadow-glow">
              <Sparkles className="h-4 w-4 text-primary-foreground" />
            </div>
            <span className="font-semibold tracking-tight">Source.io</span>
          </Link>
          <div className="flex items-center gap-2">
            {user ? (
              <Button asChild size="sm"><Link to="/app">Open app</Link></Button>
            ) : (
              <>
                <Button asChild variant="ghost" size="sm"><Link to="/auth">Sign in</Link></Button>
                <Button asChild size="sm"><Link to="/auth">Get started</Link></Button>
              </>
            )}
          </div>
        </div>
      </header>

      <section className="max-w-4xl mx-auto px-6 pt-24 pb-16 text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-border bg-card text-xs text-muted-foreground mb-6 animate-fade-in">
          <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse-slow" />
          AI study workspace
        </div>
        <h1 className="text-4xl sm:text-6xl font-semibold tracking-tight mb-6 animate-fade-in">
          Turn anything into <span className="bg-gradient-primary bg-clip-text text-transparent">study material</span>.
        </h1>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-8">
          Drop a PDF, video, audio file, YouTube link or pasted text. Get notes, flashcards, quizzes, a podcast and a chat — instantly.
        </p>
        <div className="flex items-center justify-center gap-3">
          <Button asChild size="lg" className="shadow-glow">
            <Link to={user ? "/app" : "/auth"}>{user ? "Open workspace" : "Try it free"}</Link>
          </Button>
        </div>
      </section>

      <section className="max-w-6xl mx-auto px-6 pb-24 grid md:grid-cols-3 gap-4">
        {features.map((f) => (
          <div key={f.title} className="p-5 rounded-xl border border-border bg-card hover:border-primary/40 transition-colors">
            <f.icon className="h-5 w-5 text-primary mb-3" />
            <h3 className="font-semibold mb-1">{f.title}</h3>
            <p className="text-sm text-muted-foreground">{f.desc}</p>
          </div>
        ))}
      </section>

      <footer className="border-t border-border py-6 text-center text-xs text-muted-foreground">
        Built with React & Supabase · Dark mode by default
      </footer>
    </main>
  );
}
