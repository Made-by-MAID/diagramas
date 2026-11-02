import { describe, expect, it } from "vitest";
import { distanceToPolyline } from "./distance-to-polyline";

const box = { x: 10, y: 10, width: 20, height: 10 };

describe("distanceToPolyline", () => {
  it("is zero when the polyline crosses the box or starts inside it", () => {
    expect(
      distanceToPolyline(box, [
        { x: 0, y: 15 },
        { x: 40, y: 15 },
      ]),
    ).toBe(0);
    expect(
      distanceToPolyline(box, [
        { x: 20, y: 15 },
        { x: 20, y: 100 },
      ]),
    ).toBe(0);
  });

  it("measures from the nearest side, not from the center", () => {
    const vertical = [
      { x: 34, y: 0 },
      { x: 34, y: 100 },
    ];
    expect(distanceToPolyline(box, vertical)).toBe(4);
    const horizontal = [
      { x: 100, y: 5 },
      { x: 0, y: 5 },
    ];
    expect(distanceToPolyline(box, horizontal)).toBe(5);
  });

  it("measures from a corner to a segment that passes diagonally", () => {
    const diagonal = [
      { x: 30, y: 30 },
      { x: 40, y: 20 },
    ];
    expect(distanceToPolyline(box, diagonal)).toBeCloseTo(Math.SQRT2 * 5, 6);
  });

  it("measures from an endpoint when the segment stops short of the box", () => {
    const short = [
      { x: 50, y: 15 },
      { x: 60, y: 15 },
    ];
    expect(distanceToPolyline(box, short)).toBe(20);
  });

  it("takes the nearest segment of a polyline", () => {
    const route = [
      { x: 100, y: 100 },
      { x: 100, y: 23 },
      { x: 20, y: 23 },
    ];
    expect(distanceToPolyline(box, route)).toBe(3);
  });

  it("handles a parallel segment that misses the box on either side", () => {
    expect(
      distanceToPolyline(box, [
        { x: 40, y: 0 },
        { x: 40, y: 30 },
      ]),
    ).toBe(10);
    expect(
      distanceToPolyline(box, [
        { x: 0, y: 30 },
        { x: 40, y: 30 },
      ]),
    ).toBe(10);
  });

  it("handles a single point, a repeated point and an empty polyline", () => {
    expect(distanceToPolyline(box, [{ x: 30, y: 26 }])).toBe(6);
    expect(
      distanceToPolyline(box, [
        { x: 0, y: 10 },
        { x: 0, y: 10 },
      ]),
    ).toBe(10);
    expect(distanceToPolyline(box, [])).toBe(Number.POSITIVE_INFINITY);
  });
});
