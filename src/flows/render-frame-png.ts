import type { ExpectedSize } from "../output-validation/data/output-check";
import { buildResvgArgs } from "../render/calculations/build-resvg-args";
import { checkPngOutput } from "../render/calculations/check-png-output";
import { processFailure } from "../render/calculations/process-failure";
import { renderLimits } from "../render/data/render-limits";
import type { RenderDeps } from "../render/data/render-ports";
import { fail } from "../shared/fail";
import type { Result } from "../shared/result";

type FramePaths = {
  readonly svgPath: string;
  readonly pngPath: string;
  readonly resourcesDir: string;
};

export async function renderFramePng(
  svg: string,
  paths: FramePaths,
  size: ExpectedSize,
  deps: RenderDeps,
): Promise<Result<Uint8Array>> {
  await deps.workspace.writeText(paths.svgPath, svg);
  const outcome = await deps.runner.run({
    binary: "resvg",
    args: buildResvgArgs({ fontsDir: deps.fontsDir, ...paths }),
    timeoutMs: renderLimits.resvgTimeoutMs,
  });
  const failure = processFailure(outcome);
  if (failure !== null) {
    return fail(failure);
  }
  const output = await deps.workspace.readBytes(paths.pngPath, renderLimits.pngBytes);
  return checkPngOutput(output, size);
}
