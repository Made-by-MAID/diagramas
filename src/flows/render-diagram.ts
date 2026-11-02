import type { RenderDeps } from "../render/data/render-ports";
import { fail } from "../shared/fail";
import { ok } from "../shared/ok";
import type { Result } from "../shared/result";
import { type PrepareDeps, prepareDiagram } from "./prepare-diagram";
import { renderDiagramFrames } from "./render-diagram-frames";
import { renderDiagramSvg } from "./render-diagram-svg";
import { renderGif } from "./render-gif";
import { renderPng } from "./render-png";

export type RenderedDiagram = {
  readonly png: Uint8Array;
  readonly gif: Uint8Array | null;
};

export async function renderDiagram(
  text: string,
  deps: PrepareDeps & RenderDeps,
): Promise<Result<RenderedDiagram>> {
  try {
    return await renderValidated(text, deps);
  } catch {
    return fail([{ code: "render_failed", path: "$" }]);
  }
}

async function renderValidated(
  text: string,
  deps: PrepareDeps & RenderDeps,
): Promise<Result<RenderedDiagram>> {
  const prepared = await prepareDiagram(text, deps);
  if (!prepared.ok) {
    return prepared;
  }
  const { diagram, scene } = prepared.value;
  const svg = renderDiagramSvg(scene);
  if (!svg.ok) {
    return svg;
  }
  // Frames are calculated first so that a refused animation costs no process at all.
  const sequence =
    diagram.animation === undefined ? null : renderDiagramFrames(scene, diagram.animation);
  if (sequence !== null && !sequence.ok) {
    return sequence;
  }
  const png = await renderPng(svg.value.svg, svg.value.size, deps);
  if (!png.ok) {
    return png;
  }
  if (sequence === null) {
    return ok({ png: png.value, gif: null });
  }
  const gif = await renderGif(sequence.value, deps);
  return gif.ok ? ok({ png: png.value, gif: gif.value }) : gif;
}
