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
            <div className="w-full overflow-x-auto">
              <table {...props}>{children}</table>
            </div>
          ),
        }}
      >
        {children}
      </ReactMarkdown>
    </div>
  );
}
