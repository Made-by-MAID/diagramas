import { buildFfmpegArgs } from "../render/calculations/build-ffmpeg-args";
import { checkGifOutput } from "../render/calculations/check-gif-output";
import { frameFileName } from "../render/calculations/frame-file-name";
import { processFailure } from "../render/calculations/process-failure";
import { renderLimits } from "../render/data/render-limits";
import type { RenderDeps, WorkspaceDirs } from "../render/data/render-ports";
import { fail } from "../shared/fail";
import type { Result } from "../shared/result";
import type { FrameSequence } from "./render-diagram-frames";
import { renderFramePng } from "./render-frame-png";
import { withRenderWorkspace } from "./with-render-workspace";

export function renderGif(sequence: FrameSequence, deps: RenderDeps): Promise<Result<Uint8Array>> {
  return withRenderWorkspace(deps.workspace, (dirs) => encodeGif(sequence, dirs, deps));
}

async function encodeGif(
  sequence: FrameSequence,
  dirs: WorkspaceDirs,
  deps: RenderDeps,
): Promise<Result<Uint8Array>> {
  const outputPath = `${dirs.root}/diagram.gif`;
  const args = buildFfmpegArgs({
    framesDir: dirs.frames,
    outputPath,
    fps: sequence.fps,
    frameCount: sequence.frames.length,
    loop: sequence.loop,
  });
  if (!args.ok) {
    return fail(args.errors);
  }
  for (const [index, svg] of sequence.frames.entries()) {
    const png = await renderFramePng(
      svg,
      {
        svgPath: `${dirs.frames}/${frameFileName(index, "svg")}`,
        pngPath: `${dirs.frames}/${frameFileName(index, "png")}`,
        resourcesDir: dirs.resources,
      },
      sequence.size,
      deps,
    );
    if (!png.ok) {
      return png;
    }
  }
  const outcome = await deps.runner.run({
    binary: "ffmpeg",
    args: args.value,
    timeoutMs: renderLimits.ffmpegTimeoutMs,
  });
  const failure = processFailure(outcome);
  if (failure !== null) {
    return fail(failure);
  }
  const output = await deps.workspace.readBytes(outputPath, renderLimits.gifBytes);
  return checkGifOutput(output, sequence.size);
}
