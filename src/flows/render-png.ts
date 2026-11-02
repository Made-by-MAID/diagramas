import type { ExpectedSize } from "../output-validation/data/output-check";
import type { RenderDeps } from "../render/data/render-ports";
import type { Result } from "../shared/result";
import { renderFramePng } from "./render-frame-png";
import { withRenderWorkspace } from "./with-render-workspace";

export function renderPng(
  svg: string,
  size: ExpectedSize,
  deps: RenderDeps,
): Promise<Result<Uint8Array>> {
  return withRenderWorkspace(deps.workspace, (dirs) =>
    renderFramePng(
      svg,
      {
        svgPath: `${dirs.root}/diagram.svg`,
        pngPath: `${dirs.root}/diagram.png`,
        resourcesDir: dirs.resources,
      },
      size,
      deps,
    ),
  );
}
