import { describe, expect, it } from "vitest";
import { shapeMetrics } from "./shape-metrics";

describe("shapeMetrics", () => {
  it("declares positive metrics", () => {
    for (const value of Object.values(shapeMetrics)) {
      expect(value).toBeGreaterThan(0);
    }
  });
});
