import { useOutletContext } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Sparkles, Plus, Menu } from "lucide-react";

export default function AppEmpty() {
  const { openUpload, openMobileNav } = useOutletContext<{
    openUpload: () => void;
    openMobileNav: () => void;
  }>();
  return (
    <div className="h-full flex flex-col">
      {/* Mobile top bar */}
      <div className="md:hidden flex items-center justify-between border-b border-border px-4 py-3">
        <Button variant="ghost" size="icon" onClick={openMobileNav} aria-label="Open navigation">
          <Menu className="h-5 w-5" />
        </Button>
        <span className="font-semibold tracking-tight">Source.io</span>
        <div className="w-9" />
      </div>

      <div className="flex-1 flex flex-col items-center justify-center text-center px-6">
        <div className="h-12 w-12 rounded-xl flex items-center justify-center mb-4 overflow-hidden">
          <img src="/favicon.png" className="h-full w-full object-contain" alt="Logo" />
        </div>
        <h2 className="text-2xl font-semibold mb-2">Your workspace is ready</h2>
        <p className="text-muted-foreground mb-6 max-w-md">
          Add a PDF, audio, video, YouTube link or paste text to generate notes, flashcards, quizzes, a podcast and a chat.
        </p>
        <Button onClick={openUpload} size="lg">
          <Plus className="h-4 w-4 mr-2" /> Add your first document
        </Button>
      </div>
    </div>
  );
}
