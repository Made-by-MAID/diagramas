import { describe, expect, it } from "vitest";
import { animationLimits } from "./animation-limits";

describe("animationLimits", () => {
  it("states the limits of an animation", () => {
    expect(animationLimits).toEqual({
      frames: 80,
      totalDelayCs: 500,
      sideGif: 1280,
      frameSvgBytes: 512 * 1024,
    });
  });
});
