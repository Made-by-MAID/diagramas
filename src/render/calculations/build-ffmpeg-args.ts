import { animationLimits } from "../../animation/data/animation-limits";
import { fail } from "../../shared/fail";
import { ok } from "../../shared/ok";
import type { Result } from "../../shared/result";

const FPS_VALUES = [10, 20, 25];
const FILTER =
  "split[frames][source];[frames]palettegen=max_colors=256:stats_mode=full[palette];[source][palette]paletteuse=dither=bayer:bayer_scale=3";

type GifEncoding = {
  readonly framesDir: string;
  readonly outputPath: string;
  readonly fps: number;
  readonly frameCount: number;
  readonly loop: boolean;
};

export function buildFfmpegArgs(encoding: GifEncoding): Result<readonly string[]> {
  const { framesDir, outputPath, fps, frameCount, loop } = encoding;
  const validFrames =
    Number.isInteger(frameCount) && frameCount >= 1 && frameCount <= animationLimits.frames;
  if (!FPS_VALUES.includes(fps) || !validFrames) {
    return fail([{ code: "limit_exceeded", path: "$" }]);
  }
  return ok([
    "-nostdin",
    "-protocol_whitelist",
    "file",
    "-f",
    "image2",
    "-c:v",
    "png",
    "-framerate",
    String(fps),
    "-i",
    `${framesDir}/%03d.png`,
    "-frames:v",
    String(frameCount),
    "-map_metadata",
    "-1",
    "-map_chapters",
    "-1",
    "-fflags",
    "+bitexact",
    "-flags:v",
    "+bitexact",
    "-threads",
    "2",
    "-vf",
    FILTER,
    "-loop",
    loop ? "0" : "-1",
    "-f",
    "gif",
    outputPath,
  ]);
}
