"use client";
import React, { ReactNode } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import { cn } from "@/lib/utils";
import { useSettings } from "@/features/settings/context/SettingsContext";

// Matches citations like [p. 14, §1.2], [p. 18], [Page 4, §2], [§3.4], [Passage §1.1]
const CITATION_REGEX = /(\[(?:p\.|pp\.|page|passage|§)[\w\s.,§\-]+\])/gi;

function renderWithCitations(node: ReactNode): ReactNode {
  if (typeof node === "string") {
    if (!CITATION_REGEX.test(node)) return node;
    const parts = node.split(CITATION_REGEX);
    return parts.map((part, i) => {
      if (CITATION_REGEX.test(part)) {
        return (
          <span
            key={i}
            className="citation-chip cursor-default"
            title="Source Grounded Citation"
          >
            {part}
          </span>
        );
      }
      return part;
    });
  }

  if (Array.isArray(node)) {
    return node.map((child, i) => (
      <React.Fragment key={i}>{renderWithCitations(child)}</React.Fragment>
    ));
  }

  if (React.isValidElement(node)) {
    const element = node as React.ReactElement<{ children?: ReactNode }>;
    if (element.props && element.props.children) {
      return React.cloneElement(element, {
        children: renderWithCitations(element.props.children),
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
                {renderWithCitations(children)}
              </p>
            );
          },
          li: ({ children, ...props }) => {
            return (
              <li {...props}>
                {renderWithCitations(children)}
              </li>
            );
          },
          blockquote: ({ children, ...props }) => {
            return (
              <blockquote {...props}>
                {renderWithCitations(children)}
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
