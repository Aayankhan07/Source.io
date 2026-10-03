"use client";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import { cn } from "@/lib/utils";
import { useSettings } from "@/features/settings/context/SettingsContext";

interface MarkdownViewProps {
  children: string;
  className?: string;
  fontSize?: "compact" | "regular" | "large";
  fontFamily?: "sans" | "serif" | "mono";
  lineHeight?: "tight" | "normal" | "relaxed";
  renderKaTeX?: boolean;
}

export default function MarkdownView({
  children,
  className,
  fontSize: propFontSize,
  fontFamily: propFontFamily,
  lineHeight: propLineHeight,
  renderKaTeX: propRenderKaTeX,
}: MarkdownViewProps) {
  const { notesSettings } = useSettings();

  const fontSize = propFontSize ?? notesSettings.fontSize;
  const fontFamily = propFontFamily ?? notesSettings.fontFamily;
  const lineHeight = propLineHeight ?? notesSettings.lineHeight;
  const renderKaTeX = propRenderKaTeX ?? notesSettings.renderKaTeX;

  const fontClasses = cn(
    fontFamily === "serif" && "font-serif",
    fontFamily === "mono" && "font-mono",
    fontFamily === "sans" && "font-sans",
    fontSize === "compact" && "text-sm",
    fontSize === "regular" && "text-base",
    fontSize === "large" && "text-lg",
    lineHeight === "tight" && "leading-normal",
    lineHeight === "normal" && "leading-relaxed",
    lineHeight === "relaxed" && "leading-loose"
  );

  const remarkPlugins = renderKaTeX ? [remarkGfm, remarkMath] : [remarkGfm];
  const rehypePlugins = renderKaTeX ? [rehypeKatex] : [];

  return (
    <div className={cn("prose-invert-tight max-w-none transition-all duration-200", fontClasses, className)}>
      <ReactMarkdown
        remarkPlugins={remarkPlugins}
        rehypePlugins={rehypePlugins}
        components={{
          // Generated study notes routinely contain wide comparison tables. Without
          // this wrapper they widen the whole page on narrow screens instead of
          // scrolling within their own container.
          table: ({ children, ...props }) => (
            <div className="w-full overflow-x-auto my-4 rounded-xl border border-border/80">
              <table className="w-full border-collapse" {...props}>{children}</table>
            </div>
          ),
          h1: ({ children, ...props }) => {
            const text = String(children ?? "");
            const id = text.toLowerCase().replace(/[^\w\s-]/g, "").replace(/\s+/g, "-");
            return <h1 id={id} className="scroll-mt-24 group relative font-display tracking-tight" {...props}>{children}</h1>;
          },
          h2: ({ children, ...props }) => {
            const text = String(children ?? "");
            const id = text.toLowerCase().replace(/[^\w\s-]/g, "").replace(/\s+/g, "-");
            return <h2 id={id} className="scroll-mt-24 group relative font-display tracking-tight" {...props}>{children}</h2>;
          },
          h3: ({ children, ...props }) => {
            const text = String(children ?? "");
            const id = text.toLowerCase().replace(/[^\w\s-]/g, "").replace(/\s+/g, "-");
            return <h3 id={id} className="scroll-mt-24 group relative font-display" {...props}>{children}</h3>;
          },
        }}
      >
        {children}
      </ReactMarkdown>
    </div>
  );
}
