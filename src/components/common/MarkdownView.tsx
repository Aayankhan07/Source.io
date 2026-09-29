import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";

export default function MarkdownView({ children }: { children: string }) {
  return (
    <div className="prose-invert-tight max-w-none">
      <ReactMarkdown
        remarkPlugins={[remarkGfm, remarkMath]}
        rehypePlugins={[rehypeKatex]}
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
            return <h1 id={id} className="scroll-mt-24 group relative font-display" {...props}>{children}</h1>;
          },
          h2: ({ children, ...props }) => {
            const text = String(children ?? "");
            const id = text.toLowerCase().replace(/[^\w\s-]/g, "").replace(/\s+/g, "-");
            return <h2 id={id} className="scroll-mt-24 group relative font-display" {...props}>{children}</h2>;
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
