import { describe, expect, it } from "vitest";
import { computeNodeSize } from "./compute-node-size";

describe("computeNodeSize", () => {
  it("gives a process the text plus padding, with a minimum", () => {
    expect(computeNodeSize("process", 100, 20)).toEqual({ width: 132, height: 44 });
    expect(computeNodeSize("process", 1, 1)).toEqual({ width: 80, height: 40 });
  });

  it("leaves room for the chamfer in a terminal", () => {
    expect(computeNodeSize("terminal", 100, 20).width).toBeGreaterThan(132);
  });

  it("inscribes the text in a decision diamond", () => {
    const { width, height } = computeNodeSize("decision", 100, 20);
    expect(100 / width + 20 / height).toBeLessThanOrEqual(1);
  });

  it("leaves room for the slant of an io and the caps of a data", () => {
    expect(computeNodeSize("io", 100, 20).width).toBeGreaterThan(132);
    expect(computeNodeSize("data", 100, 20).height).toBeGreaterThan(44);
  });
});
