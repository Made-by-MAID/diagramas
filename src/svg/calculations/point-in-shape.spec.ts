import { describe, expect, it } from "vitest";
import { pointInShape } from "./point-in-shape";

const box = { x: 0, y: 0, width: 100, height: 60 };

describe("pointInShape", () => {
  it("treats a process as its box", () => {
    expect(pointInShape("process", box, { x: 0, y: 0 })).toBe(true);
    expect(pointInShape("process", box, { x: -2, y: 0 })).toBe(false);
    expect(pointInShape("process", box, { x: 0, y: 70 })).toBe(false);
  });

  it("cuts the corners of a terminal", () => {
    expect(pointInShape("terminal", box, { x: 1, y: 1 })).toBe(false);
    expect(pointInShape("terminal", box, { x: 99, y: 59 })).toBe(false);
    expect(pointInShape("terminal", box, { x: 50, y: 0 })).toBe(true);
    expect(pointInShape("terminal", box, { x: 0, y: 30 })).toBe(true);
    expect(pointInShape("terminal", box, { x: -3, y: 30 })).toBe(false);
  });

  it("uses the diamond of a decision", () => {
    expect(pointInShape("decision", box, { x: 50, y: 0 })).toBe(true);
    expect(pointInShape("decision", box, { x: 5, y: 5 })).toBe(false);
    expect(pointInShape("decision", box, { x: 50, y: 30 })).toBe(true);
  });

  it("uses the slanted sides of an io", () => {
    expect(pointInShape("io", box, { x: 1, y: 1 })).toBe(false);
    expect(pointInShape("io", box, { x: 99, y: 59 })).toBe(false);
    expect(pointInShape("io", box, { x: 50, y: 30 })).toBe(true);
    expect(pointInShape("io", box, { x: 1, y: 59 })).toBe(true);
    expect(pointInShape("io", box, { x: 50, y: 90 })).toBe(false);
  });

  it("uses the curved caps of a data", () => {
    expect(pointInShape("data", box, { x: 1, y: 1 })).toBe(false);
    expect(pointInShape("data", box, { x: 1, y: 59 })).toBe(false);
    expect(pointInShape("data", box, { x: 50, y: 0 })).toBe(true);
    expect(pointInShape("data", box, { x: 50, y: 60 })).toBe(true);
    expect(pointInShape("data", box, { x: 1, y: 30 })).toBe(true);
    expect(pointInShape("data", box, { x: 120, y: 30 })).toBe(false);
  });
});
