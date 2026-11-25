import katex from "katex";
import { KnowledgePipelineClient, type PipelineMath } from "./KnowledgePipelineClient";

// Server Component: KaTeX runs here (at build time for the static landing), so
// only the rendered markup ships to the browser, never the katex library.
const render = (tex: string, displayMode = false) =>
  katex.renderToString(tex, { displayMode, throwOnError: false });

const MATH: PipelineMath = {
  equation: render("P(a \\le x \\le b) = \\int_a^b |\\Psi(x, t)|^2 \\, dx = 1", true),
  psi: render("\\Psi(x, t)"),
  psiSq: render("|\\Psi(x, t)|^2"),
  x: render("x"),
  t: render("t"),
};

export function KnowledgePipeline() {
  return <KnowledgePipelineClient math={MATH} />;
}
