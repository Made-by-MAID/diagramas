export type FramePlan = {
  readonly frameCount: number;
  readonly delayCs: number;
  readonly totalDelayCs: number;
};

export function planFrames(durationMs: number, fps: number): FramePlan {
  const frameCount = Math.ceil((durationMs * fps) / 1000);
  const delayCs = 100 / fps;
  return { frameCount, delayCs, totalDelayCs: frameCount * delayCs };
}
