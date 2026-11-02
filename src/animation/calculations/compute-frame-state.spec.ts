import { svgPathProperties } from "svg-path-properties";
import { describe, expect, it } from "vitest";
import type { AnimationTimeline } from "../data/frame-state";
import { computeFrameState } from "./compute-frame-state";

const d = "M 0 0 L 100 0 L 100 100";
const timeline: AnimationTimeline = {
  durationMs: 4000,
  accent: "#FF0000",
  dashes: [{ edgeId: "e" }],
  packets: [{ edgeId: "e", d }],
  pulses: [{ nodeId: "n", stroke: "#000000" }],
};

describe("computeFrameState", () => {
  it("gives the same result for the same t", () => {
    expect(computeFrameState(timeline, 1234)).toEqual(computeFrameState(timeline, 1234));
  });

  it("changes offset and scale between two distinct instants", () => {
    const a = computeFrameState(timeline, 500);
    const b = computeFrameState(timeline, 900);
    expect(a.dashes[0]?.dashOffset).not.toBe(b.dashes[0]?.dashOffset);
    expect(a.pulses[0]?.scale).not.toBe(b.pulses[0]?.scale);
  });

  it("repeats at the end of the duration so that the loop has no jump", () => {
    expect(computeFrameState(timeline, 4000)).toEqual(computeFrameState(timeline, 0));
    expect(computeFrameState(timeline, 4100)).toEqual(computeFrameState(timeline, 100));
    expect(computeFrameState(timeline, -100)).toEqual(computeFrameState(timeline, 3900));
  });

  it("treats a t that is not finite as the start", () => {
    expect(computeFrameState(timeline, Number.NaN)).toEqual(computeFrameState(timeline, 0));
  });

  it("completes whole dash cycles in one duration", () => {
    function at(t: number) {
      return computeFrameState(timeline, t).dashes[0]?.dashOffset as number;
    }
    expect(at(0)).toBeCloseTo(0);
    expect(at(2000)).toBeCloseTo(-80);
  });

  it("keeps at least one dash cycle in a short animation", () => {
    const short = { ...timeline, durationMs: 100 };
    expect(computeFrameState(short, 50).dashes[0]?.dashOffset).toBeCloseTo(-10);
  });

  it("keeps the packet on the path, with the angle of the tangent", () => {
    const properties = new svgPathProperties(d);
    for (const t of [0, 400, 1000, 1999, 2001, 3000, 3999]) {
      const packet = computeFrameState(timeline, t).packets[0];
      const length = (t / 4000) * properties.getTotalLength();
      const expected = properties.getPointAtLength(length);
      const tangent = properties.getTangentAtLength(length);
      expect(packet?.x).toBeCloseTo(expected.x, 6);
      expect(packet?.y).toBeCloseTo(expected.y, 6);
      expect(packet?.angle).toBeCloseTo((Math.atan2(tangent.y, tangent.x) * 180) / Math.PI, 6);
    }
    expect(computeFrameState(timeline, 400).packets[0]?.angle).toBeCloseTo(0);
    expect(computeFrameState(timeline, 3000).packets[0]?.angle).toBeCloseTo(90);
  });

  it("pulses from the base scale and color up to the accent and back", () => {
    const start = computeFrameState(timeline, 0).pulses[0];
    const middle = computeFrameState(timeline, 2000).pulses[0];
    expect(start).toEqual({ nodeId: "n", scale: 1, stroke: "#000000" });
    expect(middle?.scale).toBeCloseTo(1.06);
    expect(middle?.stroke).toBe("#FF0000");
  });

  it("returns empty lists for no effects", () => {
    const empty = { ...timeline, dashes: [], packets: [], pulses: [] };
    expect(computeFrameState(empty, 10)).toEqual({ dashes: [], packets: [], pulses: [] });
  });
});
