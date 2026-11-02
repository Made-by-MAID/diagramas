import { buildTimeline } from "../animation/calculations/build-timeline";
import { computeFrameState } from "../animation/calculations/compute-frame-state";
import { planFrames } from "../animation/calculations/plan-frames";
import { animationLimits } from "../animation/data/animation-limits";
import type { DiagramAnimation, Fps } from "../contract/data/diagram";
import { fail } from "../shared/fail";
import { ok } from "../shared/ok";
import type { Result } from "../shared/result";
import { buildSvg } from "../svg/calculations/build-svg";
import { fitOutputSize, type OutputSize } from "../svg/calculations/fit-output-size";
import { serializeSvg } from "../svg/calculations/serialize-svg";
import type { Scene } from "../svg/data/scene";

export type FrameSequence = {
  readonly size: OutputSize;
  readonly fps: Fps;
  readonly loop: boolean;
  readonly frames: readonly string[];
};

export function renderDiagramFrames(
  scene: Scene,
  animation: DiagramAnimation,
): Result<FrameSequence> {
  const size = fitOutputSize(scene.width, scene.height, animationLimits.sideGif);
  if (!size.ok) {
    return fail(size.errors);
  }
  const timeline = buildTimeline(animation, scene);
  const { frameCount } = planFrames(animation.durationMs, animation.fps);
  const encoder = new TextEncoder();
  const frames: string[] = [];
  for (let index = 0; index < frameCount; index += 1) {
    const state = computeFrameState(timeline, (index * animation.durationMs) / frameCount);
    const svg = serializeSvg(buildSvg(scene, size.value, state));
    if (!svg.ok) {
      return fail(svg.errors);
    }
    if (encoder.encode(svg.value).length > animationLimits.frameSvgBytes) {
      return fail([{ code: "limit_exceeded", path: "$" }]);
    }
    frames.push(svg.value);
  }
  return ok({ size: size.value, fps: animation.fps, loop: animation.loop, frames });
}
