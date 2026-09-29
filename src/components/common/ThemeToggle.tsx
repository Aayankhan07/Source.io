import { Sun, Moon } from "lucide-react";
import { useTheme } from "@/hooks/use-theme";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface ThemeToggleProps {
  className?: string;
  variant?: "icon" | "pill";
}

export default function ThemeToggle({ className, variant = "icon" }: ThemeToggleProps) {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === "dark";

  if (variant === "pill") {
    return (
      <button
        onClick={toggleTheme}
        className={cn(
          "inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium transition-all border",
          isDark
            ? "bg-slate-800/80 border-slate-700/80 text-slate-200 hover:bg-slate-750 hover:text-white"
            : "bg-slate-100 border-slate-200/90 text-slate-700 hover:bg-slate-200 hover:text-slate-900",
          className
        )}
        aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
        title={isDark ? "Switch to light mode" : "Switch to dark mode"}
      >
        {isDark ? (
          <>
            <Sun className="h-3.5 w-3.5 text-amber-400" />
            <span>Light</span>
          </>
        ) : (
          <>
            <Moon className="h-3.5 w-3.5 text-sky-600" />
            <span>Dark</span>
          </>
        )}
      </button>
    );
  }

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={toggleTheme}
      className={cn(
        "h-8 w-8 rounded-full transition-colors border",
        isDark
          ? "border-slate-800 bg-slate-900/60 text-slate-300 hover:text-white hover:bg-slate-800"
          : "border-slate-200/80 bg-white/80 text-slate-600 hover:text-slate-900 hover:bg-slate-100",
        className
      )}
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
      title={isDark ? "Switch to light mode" : "Switch to dark mode"}
    >
      {isDark ? (
        <Sun className="h-3.5 w-3.5 text-amber-400 transition-transform duration-300 rotate-0 hover:rotate-45" />
      ) : (
        <Moon className="h-3.5 w-3.5 text-slate-700 transition-transform duration-300 hover:-rotate-12" />
      )}
    </Button>
  );
}
