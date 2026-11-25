"use client";
import React, { ReactNode } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import { cn } from "@/lib/utils";
import { useSettings } from "@/features/settings/context/SettingsContext";

// Matches textual citations like [p. 14, §1.2], [p. 18], [Page 4, §2], [§3.4], [Passage §1.1]
const TEXT_CITATION = /\[(?:p\.|pp\.|page|passage|§)[\w\s.,§-]+\]/i;
// Matches numbered passage citations emitted by chat: [1], [2], [12]
const NUMBERED_CITATION = /\[\d{1,2}\]/;
// Split patterns must be global + capturing. They are only used with String.split,
// which ignores lastIndex, so the /g flag cannot leak state between calls.
const SPLIT_TEXT = /(\[(?:p\.|pp\.|page|passage|§)[\w\s.,§-]+\])/gi;
const SPLIT_ALL = /(\[(?:p\.|pp\.|page|passage|§)[\w\s.,§-]+\]|\[\d{1,2}\])/gi;

type CitationClick = (n: number) => void;

function renderWithCitations(node: ReactNode, onCitationClick?: CitationClick): ReactNode {
  if (typeof node === "string") {
    const hasText = TEXT_CITATION.test(node);
    const hasNumbered = !!onCitationClick && NUMBERED_CITATION.test(node);
    if (!hasText && !hasNumbered) return node;
    const parts = node.split(onCitationClick ? SPLIT_ALL : SPLIT_TEXT);
    return parts.map((part, i) => {
      const numbered = onCitationClick ? /^\[(\d{1,2})\]$/.exec(part) : null;
      if (numbered) {
        const n = Number(numbered[1]);
        return (
          <button
            key={i}
            type="button"
            className="citation-chip cursor-pointer align-baseline"
            onClick={() => onCitationClick?.(n)}
            aria-label={`Show source passage ${n}`}
          >
            {n}
          </button>
        );
      }
      if (TEXT_CITATION.test(part) && /^\[.*\]$/.test(part)) {
        return (
          <span key={i} className="citation-chip cursor-default" title="Source citation">
            {part}
          </span>
        );
      }
      return part;
    });
  }

  if (Array.isArray(node)) {
    return node.map((child, i) => (
      <React.Fragment key={i}>{renderWithCitations(child, onCitationClick)}</React.Fragment>
    ));
  }

  if (React.isValidElement(node)) {
    const element = node as React.ReactElement<{ children?: ReactNode }>;
    if (element.props && element.props.children) {
      return React.cloneElement(element, {
        children: renderWithCitations(element.props.children, onCitationClick),
      });
    }
  }

  return node;
}

interface MarkdownViewProps {
  children: string;
  className?: string;
  fontSize?: "compact" | "regular" | "large";
  fontFamily?: "sans" | "serif" | "mono";
  lineHeight?: "tight" | "normal" | "relaxed";
  renderKaTeX?: boolean;
  /** When set, numbered citations like [1] render as buttons that call this with the passage number. */
  onCitationClick?: CitationClick;
}

export default function MarkdownView({
  children,
  className,
  fontSize: propFontSize,
  fontFamily: propFontFamily,
  lineHeight: propLineHeight,
  renderKaTeX: propRenderKaTeX,
  onCitationClick,
}: MarkdownViewProps) {
  const { notesSettings } = useSettings();

  const fontSize = propFontSize ?? notesSettings.fontSize;
  const fontFamily = propFontFamily ?? notesSettings.fontFamily;
  const lineHeight = propLineHeight ?? notesSettings.lineHeight;
  const renderKaTeX = propRenderKaTeX ?? notesSettings.renderKaTeX;

  const fontClasses = cn(
    // Typeface
    fontFamily === "serif" && "font-serif [&_p]:font-serif [&_li]:font-serif [&_td]:font-serif",
    fontFamily === "mono" && "font-mono [&_p]:font-mono [&_li]:font-mono [&_td]:font-mono",
    fontFamily === "sans" && "font-sans [&_p]:font-sans [&_li]:font-sans [&_td]:font-sans",
    // Font Size
    fontSize === "compact" && "text-sm [&_p]:text-sm [&_li]:text-sm [&_td]:text-xs",
    fontSize === "regular" && "text-base [&_p]:text-base [&_li]:text-base [&_td]:text-sm",
    fontSize === "large" && "text-lg [&_p]:text-lg [&_li]:text-lg [&_td]:text-base",
    // Line Height
    lineHeight === "tight" && "leading-snug [&_p]:leading-snug [&_li]:leading-snug",
    lineHeight === "normal" && "leading-relaxed [&_p]:leading-relaxed [&_li]:leading-relaxed",
    lineHeight === "relaxed" && "leading-loose [&_p]:leading-loose [&_li]:leading-loose"
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
          p: ({ children, ...props }) => {
            return (
              <p {...props}>
                {renderWithCitations(children, onCitationClick)}
              </p>
            );
          },
          li: ({ children, ...props }) => {
            return (
              <li {...props}>
                {renderWithCitations(children, onCitationClick)}
              </li>
            );
          },
          blockquote: ({ children, ...props }) => {
            return (
              <blockquote {...props}>
                {renderWithCitations(children, onCitationClick)}
              </blockquote>
            );
          },
        }}
      >
        {children}
      </ReactMarkdown>
    </div>
  );
}
