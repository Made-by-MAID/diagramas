import { animationLimits } from "../animation/data/animation-limits";
import { pngLimits } from "../output-validation/data/output-limits";
import { fail } from "../shared/fail";
import { ok } from "../shared/ok";
import type { Result } from "../shared/result";
import { buildSvg } from "../svg/calculations/build-svg";
import { fitOutputSize, type OutputSize } from "../svg/calculations/fit-output-size";
import { serializeSvg } from "../svg/calculations/serialize-svg";
import type { Scene } from "../svg/data/scene";

export type RenderedSvg = { readonly svg: string; readonly size: OutputSize };

export function renderDiagramSvg(scene: Scene): Result<RenderedSvg> {
  const size = fitOutputSize(scene.width, scene.height, pngLimits.side);
  if (!size.ok) {
    return fail(size.errors);
  }
  const svg = serializeSvg(buildSvg(scene, size.value));
  if (!svg.ok) {
    return fail(svg.errors);
  }
  if (new TextEncoder().encode(svg.value).length > animationLimits.frameSvgBytes) {
    return fail([{ code: "limit_exceeded", path: "$" }]);
  }
  return ok({ svg: svg.value, size: size.value });
}
