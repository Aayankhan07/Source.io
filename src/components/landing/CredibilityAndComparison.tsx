import { useState } from "react";
import { Link } from "react-router-dom";
import { 
  Check, X, Sparkles, GraduationCap, ArrowRight, ShieldCheck, 
  HelpCircle, Scale, Stethoscope, Binary, BookOpenCheck
} from "lucide-react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

export function CredibilityAndComparison() {
  const [activeAudience, setActiveAudience] = useState<"cs" | "med" | "law" | "lang">("cs");

  const audienceContent = {
    cs: {
      field: "Engineering & Computer Science",
      icon: Binary,
      source: "Introduction to Distributed Systems (MIT 6.824, 42 pp.)",
      extracted: "Raft consensus election safety proofs, RPC log replication diagrams, and RPC timeout equations.",
      citation: "Passage §4.2 (p. 18) • 98% match"
    },
    med: {
      field: "Medicine & Life Sciences",
      icon: Stethoscope,
      source: "Harrison's Principles: Cardiovascular Pathophysiology (36 pp.)",
      extracted: "Ischemic cascade mechanisms, pharmacokinetics tables, and diagnostic algorithm flowcharts.",
      citation: "Passage §8.1 (p. 24) • 97% match"
    },
    law: {
      field: "Law & Public Policy",
      icon: Scale,
      source: "Antitrust Precedents & Sherman Act Analysis (Supreme Court, 58 pp.)",
      extracted: "Rule of reason precedents, market definition doctrines, and dissenting opinion cross-references.",
      citation: "Passage §2.3 (p. 14) • 96% match"
    },
    lang: {
      field: "Humanities & Languages",
      icon: BookOpenCheck,
      source: "Comparative Linguistics & Historical Syntax (Oxford Press, 28 pp.)",
      extracted: "Proto-Indo-European phonetic shifts, morphological declensions, and vocabulary frequency charts.",
      citation: "Passage §5.4 (p. 9) • 95% match"
    }
  };

  const comparisonRows = [
    {
      feature: "Verifiable Page & Time Coordinates",
      source: true,
      chatgpt: false,
      notebooklm: "Partial (Document level)",
      note: "Every statement anchored to exact paragraph & audio millisecond"
    },
    {
      feature: "Active Spaced Repetition (Leitner Algorithm)",
      source: true,
      chatgpt: false,
      notebooklm: false,
      note: "Adaptive intervals (1d, 2d, 4d, 7d) derived from source text"
    },
    {
      feature: "Interactive Comprehension Practice Quiz",
      source: true,
      chatgpt: "Requires manual prompting",
      notebooklm: false,
      note: "Instant right/wrong verification with coordinate explanations"
    },
    {
      feature: "Conversational 2-Host Audio Dialogues",
      source: true,
      chatgpt: false,
      notebooklm: true,
      note: "Generated multi-speaker audio with synchronized transcripts"
    },
    {
      feature: "No Training on Your Personal Documents",
      source: true,
      chatgpt: "Opt-out required",
      notebooklm: "Cloud indexed",
      note: "Strict zero-data-retention guarantee for academic papers"
    }
  ];

  const faqs = [
    {
      q: "What file formats and sizes can I upload?",
      a: "Source.io accepts PDF documents up to 200MB, audio files (MP3, WAV, M4A) up to 2 hours, Markdown, DOCX, and direct YouTube video lecture links. OCR and Whisper transcription run automatically upon ingestion."
    },
    {
      q: "How does coordinate citation verification work?",
      a: "When Source ingests your document, it splits passages into vector embedding chunks with immutable page numbers, paragraph positions, and audio timestamps. Every answer, flashcard, and quiz question computes cosine similarity against these chunks and displays the exact coordinate."
    },
    {
      q: "Is Source.io free for students?",
      a: "Yes. Our Student Tier is completely free forever. You can upload up to 100 documents per month, generate unlimited Leitner flashcards, and access all 5 derived study modalities without a credit card."
    },
    {
      q: "Are my research papers or documents used to train AI models?",
      a: "No. Your documents and audio files are parsed strictly in isolated sessions with zero retention for model training. Your data remains strictly yours."
    }
  ];

  return (
    <div className="space-y-24 sm:space-y-32">
      {/* SOCIAL PROOF & INSTITUTIONAL TRUST */}
      <section className="py-12 px-4 sm:px-6 lg:px-8 border-y border-border bg-card/30">
        <div className="max-w-6xl mx-auto text-center space-y-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-accent border border-border text-xs font-mono text-muted-foreground">
            <GraduationCap className="h-3.5 w-3.5 text-primary" />
            <span>ACADEMIC INTEGRITY & TRUST</span>
          </div>

          <p className="text-sm sm:text-base text-foreground font-medium max-w-xl mx-auto">
            Used by over <span className="font-semibold text-primary">12,000+ students and researchers</span> across leading institutions:
          </p>

          <div className="flex flex-wrap items-center justify-center gap-6 sm:gap-12 text-sm font-mono text-muted-foreground font-semibold">
            <span>Stanford University</span>
            <span className="h-1 w-1 rounded-full bg-border" />
            <span>MIT</span>
            <span className="h-1 w-1 rounded-full bg-border" />
            <span>UC Berkeley</span>
            <span className="h-1 w-1 rounded-full bg-border" />
            <span>Oxford</span>
            <span className="h-1 w-1 rounded-full bg-border" />
            <span>Cambridge</span>
          </div>

          <div className="grid sm:grid-cols-3 gap-4 pt-6 text-left max-w-5xl mx-auto">
            {[
              {
                quote: "The ability to click any claim in my study notes and jump straight to page 18 of the textbook prevents hallucination entirely.",
                author: "Elena R.",
                role: "Graduate Researcher, Stanford"
              },
              {
                quote: "Source turns a 2-hour lecture recording into Leitner flashcards in under two minutes with word-for-word citations.",
                author: "Marcus T.",
                role: "Computer Science, MIT"
              },
              {
                quote: "The 2-host audio dialogue breaks down complex cardiovascular pathology during my hospital commute. Game changer.",
                author: "Dr. Sarah K.",
                role: "Resident Physician, Oxford"
              }
            ].map((t) => (
              <div key={t.author} className="p-5 rounded-2xl bg-card border border-border shadow-2xs space-y-3 flex flex-col justify-between">
                <p className="text-xs text-muted-foreground leading-relaxed italic">"{t.quote}"</p>
                <div className="border-t border-border pt-2 text-[11px] font-mono">
                  <span className="font-semibold text-foreground block">{t.author}</span>
                  <span className="text-muted-foreground">{t.role}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* USE CASES BY AUDIENCE */}
      <section className="px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto text-left">
        <div className="max-w-2xl mb-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-accent border border-border text-xs font-mono text-foreground mb-3">
            <span>TAILORED REASONING</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-display font-medium text-foreground tracking-tight">
            Built for rigorous disciplines
          </h2>
          <p className="text-sm text-muted-foreground mt-2">
            Select a field to inspect how Source extracts exact mathematical, medical, and legal anchors.
          </p>
        </div>

        {/* Audience Selector Tabs */}
        <div className="flex flex-wrap gap-2 mb-6">
          {(["cs", "med", "law", "lang"] as const).map((key) => {
            const item = audienceContent[key];
            const Icon = item.icon;
            const isSelected = activeAudience === key;
            return (
              <button
                key={key}
                type="button"
                onClick={() => setActiveAudience(key)}
                className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-medium border transition-all cursor-pointer ${
                  isSelected
                    ? "bg-primary text-primary-foreground border-primary shadow-xs"
                    : "bg-card hover:bg-accent text-muted-foreground hover:text-foreground border-border"
                }`}
              >
                <Icon className="h-3.5 w-3.5" />
                <span>{item.field}</span>
              </button>
            );
          })}
        </div>

        {/* Active Audience Card */}
        <div className="bg-card rounded-2xl sm:rounded-3xl border border-border p-6 sm:p-8 shadow-xs grid lg:grid-cols-12 gap-8 items-center">
          <div className="lg:col-span-7 space-y-4">
            <span className="text-xs font-mono text-primary font-semibold block">
              SAMPLE INGESTION SPECIFICATION
            </span>
            <h3 className="text-xl font-semibold text-foreground">
              {audienceContent[activeAudience].source}
            </h3>
            <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
              {audienceContent[activeAudience].extracted}
            </p>
            <div className="pt-2 flex items-center gap-3">
              <span className="text-xs font-mono px-3 py-1 rounded-md bg-accent border border-border text-foreground font-semibold">
                {audienceContent[activeAudience].citation}
              </span>
              <span className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">
                Verified Anchor
              </span>
            </div>
          </div>

          <div className="lg:col-span-5 bg-accent/40 rounded-2xl p-5 border border-border space-y-3 font-mono text-xs">
            <div className="text-muted-foreground text-[11px] pb-2 border-b border-border">
              OUTPUT DERIVATIONS
            </div>
            <div className="flex items-center justify-between text-foreground">
              <span>Markdown Outline</span>
              <span className="text-emerald-600 dark:text-emerald-400">Ready</span>
            </div>
            <div className="flex items-center justify-between text-foreground">
              <span>Leitner Deck</span>
              <span className="text-emerald-600 dark:text-emerald-400">32 Cards</span>
            </div>
            <div className="flex items-center justify-between text-foreground">
              <span>Practice Quiz</span>
              <span className="text-emerald-600 dark:text-emerald-400">10 Questions</span>
            </div>
            <div className="flex items-center justify-between text-foreground">
              <span>Audio Recap</span>
              <span className="text-emerald-600 dark:text-emerald-400">4:12 mins</span>
            </div>
          </div>
        </div>
      </section>

      {/* COMPARISON TABLE: SOURCE.IO VS CHATGPT VS NOTEBOOKLM */}
      <section className="px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto text-left">
        <div className="max-w-2xl mb-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-accent border border-border text-xs font-mono text-foreground mb-3">
            <span>OBJECTIVE COMPARISON</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-display font-medium text-foreground tracking-tight">
            Engineered for verification, not general chat
          </h2>
          <p className="text-sm text-muted-foreground mt-2">
            Why serious students and researchers choose Source.io over general chat assistants.
          </p>
        </div>

        <div className="overflow-x-auto rounded-2xl sm:rounded-3xl border border-border bg-card shadow-xs">
          <table className="w-full text-left text-xs sm:text-sm border-collapse">
            <thead>
              <tr className="border-b border-border bg-accent/40 font-mono text-xs text-muted-foreground">
                <th className="p-4 sm:p-5 font-semibold text-foreground">Capability</th>
                <th className="p-4 sm:p-5 font-semibold text-primary bg-primary/5 border-x border-border">Source.io</th>
                <th className="p-4 sm:p-5 font-semibold">Generic ChatGPT</th>
                <th className="p-4 sm:p-5 font-semibold">NotebookLM</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {comparisonRows.map((r) => (
                <tr key={r.feature} className="hover:bg-accent/20 transition-colors">
                  <td className="p-4 sm:p-5 font-medium text-foreground">
                    <div>{r.feature}</div>
                    <div className="text-[11px] text-muted-foreground font-mono mt-0.5">{r.note}</div>
                  </td>
                  <td className="p-4 sm:p-5 bg-primary/5 border-x border-border font-semibold text-emerald-600 dark:text-emerald-400">
                    <span className="flex items-center gap-1.5">
                      <Check className="h-4 w-4 text-emerald-600 dark:text-emerald-400" /> Supported
                    </span>
                  </td>
                  <td className="p-4 sm:p-5 text-muted-foreground">
                    {r.chatgpt === false ? (
                      <span className="flex items-center gap-1 text-rose-500 font-mono">
                        <X className="h-4 w-4" /> No
                      </span>
                    ) : (
                      r.chatgpt
                    )}
                  </td>
                  <td className="p-4 sm:p-5 text-muted-foreground">
                    {r.notebooklm === false ? (
                      <span className="flex items-center gap-1 text-rose-500 font-mono">
                        <X className="h-4 w-4" /> No
                      </span>
                    ) : r.notebooklm === true ? (
                      <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-mono">
                        <Check className="h-4 w-4" /> Yes
                      </span>
                    ) : (
                      r.notebooklm
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* FREE FOR STUDENTS PRICING BANNER */}
      <section className="px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto">
        <div className="rounded-3xl border border-border bg-gradient-to-b from-card to-accent/30 p-8 sm:p-12 text-center shadow-sm space-y-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-accent border border-border text-xs font-mono text-foreground">
            <Sparkles className="h-3.5 w-3.5 text-primary" />
            <span>FREE FOR STUDENTS & RESEARCHERS</span>
          </div>

          <h3 className="text-3xl sm:text-4xl font-display font-medium text-foreground tracking-tight">
            Full study workspace. Zero cost for learners.
          </h3>
          <p className="text-xs sm:text-sm text-muted-foreground max-w-xl mx-auto leading-relaxed">
            Ingest your documents, generate verified Leitner flashcards, take practice quizzes, and listen to synthesized 2-host audio podcasts without paying a cent.
          </p>

          <div className="pt-2">
            <Link
              to="/auth"
              className="bg-primary hover:opacity-90 text-primary-foreground font-medium text-xs sm:text-sm px-8 py-3 rounded-full shadow-sm active:scale-[0.98] transition-all inline-flex items-center gap-2"
            >
              Get started free
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          <div className="text-[11px] font-mono text-muted-foreground pt-1">
            No credit card required • Instant browser access • 100 free monthly documents
          </div>
        </div>
      </section>

      {/* FAQ ACCORDION */}
      <section className="px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto text-left pb-12">
        <div className="text-center max-w-xl mx-auto mb-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-accent border border-border text-xs font-mono text-foreground mb-3">
            <HelpCircle className="h-3.5 w-3.5 text-primary" />
            <span>FREQUENTLY ASKED QUESTIONS</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-display font-medium text-foreground tracking-tight">
            Clear answers on privacy and limits
          </h2>
        </div>

        <Accordion type="single" collapsible className="w-full space-y-3">
          {faqs.map((f, idx) => (
            <AccordionItem key={idx} value={`item-${idx}`} className="border border-border bg-card rounded-2xl px-5 py-1 shadow-2xs">
              <AccordionTrigger className="text-sm sm:text-base font-semibold text-foreground hover:no-underline text-left py-4">
                {f.q}
              </AccordionTrigger>
              <AccordionContent className="text-xs sm:text-sm text-muted-foreground leading-relaxed pt-1 pb-4">
                {f.a}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </section>
    </div>
  );
}
