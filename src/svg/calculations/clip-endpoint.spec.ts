import { describe, expect, it } from "vitest";
import { clipEndpoint } from "./clip-endpoint";

const box = { x: 0, y: 0, width: 100, height: 60 };

describe("clipEndpoint", () => {
  it("keeps a point already on the shape", () => {
    expect(clipEndpoint("process", box, { x: 50, y: 0 }, { x: 0, y: 1 })).toEqual({ x: 50, y: 0 });
  });

  it("moves the point inward until it touches a diamond", () => {
    const clipped = clipEndpoint("decision", box, { x: 25, y: 0 }, { x: 0, y: 1 });
    expect(clipped.x).toBe(25);
    expect(clipped.y).toBeCloseTo(15, 0);
  });

  it("keeps the point when the direction is null or never reaches the shape", () => {
    expect(clipEndpoint("decision", box, { x: 25, y: 0 }, { x: 0, y: 0 })).toEqual({
      x: 25,
      y: 0,
    });
    expect(clipEndpoint("decision", box, { x: 25, y: 0 }, { x: 0, y: -1 })).toEqual({
      x: 25,
      y: 0,
    });
  });
});
