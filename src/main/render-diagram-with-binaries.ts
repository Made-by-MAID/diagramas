import { type RenderedDiagram, renderDiagram } from "../flows/render-diagram";
import type { Result } from "../shared/result";
import { createRenderDeps, type RenderOptions } from "./create-render-deps";

export function renderDiagramWithBinaries(
  text: string,
  options: RenderOptions,
): Promise<Result<RenderedDiagram>> {
  return renderDiagram(text, createRenderDeps(options));
}
