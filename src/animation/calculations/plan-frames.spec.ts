import { describe, expect, it } from "vitest";
import { planFrames } from "./plan-frames";

describe("planFrames", () => {
  it("computes frames and delays in integers", () => {
    expect(planFrames(4000, 20)).toEqual({ frameCount: 80, delayCs: 5, totalDelayCs: 400 });
    expect(planFrames(1000, 10)).toEqual({ frameCount: 10, delayCs: 10, totalDelayCs: 100 });
    expect(planFrames(1000, 25)).toEqual({ frameCount: 25, delayCs: 4, totalDelayCs: 100 });
  });

  it("rounds up to a whole frame", () => {
    expect(planFrames(130, 20).frameCount).toBe(3);
    expect(planFrames(1, 10).frameCount).toBe(1);
  });
});
