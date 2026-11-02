import { describe, expect, it } from "vitest";
import { effectMetrics } from "./effect-metrics";

describe("effectMetrics", () => {
  it("declares positive metrics", () => {
    for (const value of Object.values(effectMetrics)) {
      expect(value).toBeGreaterThan(0);
    }
  });
});
