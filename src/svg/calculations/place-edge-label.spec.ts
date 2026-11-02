import { describe, expect, it } from "vitest";
import { placeEdgeLabel } from "./place-edge-label";

const bounds = { x: 0, y: 0, width: 400, height: 400 };
const label = { x: 0, y: 0, width: 30, height: 20 };
// A vertical edge from a node at the top to a node at the bottom.
const top = { x: 150, y: 0, width: 100, height: 40 };
const bottom = { x: 150, y: 200, width: 100, height: 40 };
const down = [
  { x: 200, y: 40 },
  { x: 200, y: 200 },
];
// A horizontal edge from a node on the left to a node on the right.
const left = { x: 0, y: 100, width: 60, height: 40 };
const right = { x: 300, y: 100, width: 60, height: 40 };
const across = [
  { x: 60, y: 120 },
  { x: 300, y: 120 },
];

describe("placeEdgeLabel", () => {
  it("moves a label left at the origin beside the middle of a vertical edge, on the right", () => {
    expect(placeEdgeLabel(label, down, top, bottom, bounds)).toEqual({
      x: 204,
      y: 110,
      width: 30,
      height: 20,
    });
  });

  it("moves a far label below the middle of a horizontal edge", () => {
    const far = { ...label, x: 350, y: 350 };
    expect(placeEdgeLabel(far, across, left, right, bounds)).toEqual({
      x: 165,
      y: 124,
      width: 30,
      height: 20,
    });
  });

  it("uses the longest segment of the route", () => {
    const route = [
      { x: 60, y: 120 },
      { x: 80, y: 120 },
      { x: 80, y: 300 },
      { x: 300, y: 300 },
      { x: 300, y: 140 },
    ];
    expect(placeEdgeLabel(label, route, left, right, bounds)).toMatchObject({ x: 175, y: 304 });
  });

  it("keeps a label the layout already put beside its edge", () => {
    const beside = { ...label, x: 206, y: 60 };
    expect(placeEdgeLabel(beside, down, top, bottom, bounds)).toEqual(beside);
  });

  it("keeps a wide label whose side is 4 px from a vertical edge", () => {
    const wide = { x: 204, y: 110, width: 160, height: 20 };
    expect(placeEdgeLabel(wide, down, top, bottom, bounds)).toEqual(wide);
  });

  it("moves a close label that covers the source or the target", () => {
    const onSource = { ...label, x: 190, y: 30 };
    expect(placeEdgeLabel(onSource, down, top, bottom, bounds)).toMatchObject({ x: 204, y: 110 });
    const onTarget = { ...label, x: 190, y: 190 };
    expect(placeEdgeLabel(onTarget, down, top, bottom, bounds)).toMatchObject({ x: 204, y: 110 });
  });

  it("takes the left side when the right side hits a node", () => {
    const blockingRight = { x: 210, y: 100, width: 100, height: 40 };
    expect(placeEdgeLabel(label, down, top, blockingRight, bounds)).toMatchObject({
      x: 166,
      y: 110,
    });
  });

  it("takes the side above when the side below hits a node", () => {
    const blockingBelow = { x: 150, y: 130, width: 40, height: 40 };
    expect(placeEdgeLabel(label, across, left, blockingBelow, bounds)).toMatchObject({
      x: 165,
      y: 96,
    });
  });

  it("slides along the segment when both sides hit a node at the middle", () => {
    const blockingMiddle = { x: 150, y: 100, width: 100, height: 40 };
    const placed = placeEdgeLabel(label, down, top, blockingMiddle, bounds);
    // The first free center going down is 32 px past the middle, before trying 32 px back up.
    expect(placed).toEqual({ x: 204, y: 142, width: 30, height: 20 });
  });

  it("falls back to the right of the middle when every place hits a node", () => {
    const everywhere = { x: 0, y: 0, width: 400, height: 400 };
    expect(placeEdgeLabel(label, down, everywhere, everywhere, bounds)).toMatchObject({
      x: 204,
      y: 110,
    });
  });

  it("places a label beside a short edge and a degenerate one", () => {
    const short = [
      { x: 200, y: 40 },
      { x: 200, y: 46 },
    ];
    const near = { x: 150, y: 46, width: 100, height: 40 };
    expect(placeEdgeLabel(label, short, top, near, bounds)).toMatchObject({ x: 204, y: 33 });
    const point = [{ x: 200, y: 300 }];
    expect(placeEdgeLabel(label, point, top, bottom, bounds)).toMatchObject({ x: 185, y: 304 });
    const repeated = [
      { x: 200, y: 300 },
      { x: 200, y: 300 },
    ];
    expect(placeEdgeLabel(label, repeated, top, bottom, bounds)).toMatchObject({ x: 185, y: 304 });
  });

  it("keeps the box inside the bounds, and at the top left edge when it does not fit", () => {
    const edge = [
      { x: 395, y: 0 },
      { x: 395, y: 400 },
    ];
    const none = { x: 0, y: 0, width: 0, height: 0 };
    expect(placeEdgeLabel(label, edge, none, none, bounds)).toMatchObject({ x: 370, y: 190 });
    const outside = { ...label, x: 396, y: -5 };
    expect(placeEdgeLabel(outside, edge, none, none, bounds)).toMatchObject({ x: 370, y: 0 });
    const huge = { x: 0, y: 0, width: 500, height: 500 };
    expect(placeEdgeLabel(huge, edge, none, none, bounds)).toMatchObject({ x: 0, y: 0 });
  });
});
