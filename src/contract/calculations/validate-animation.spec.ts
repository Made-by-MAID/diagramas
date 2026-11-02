import { describe, expect, it } from "vitest";
import { validateAnimation } from "./validate-animation";

const ids = { nodeIds: ["a"], edgeIds: ["e"] };

function animation(extra: object = {}) {
  return { durationMs: 4000, edges: [{ edgeId: "e", effect: "dash" }], ...extra };
}

function errorsOf(value: unknown) {
  const result = validateAnimation(value, ids);
  return result.ok ? [] : result.errors;
}

describe("validateAnimation", () => {
  it("applies the default fps and loop", () => {
    expect(validateAnimation(animation(), ids)).toEqual({
      ok: true,
      value: {
        durationMs: 4000,
        fps: 20,
        loop: true,
        edges: [{ edgeId: "e", effect: "dash" }],
        nodes: [],
      },
    });
  });

  it("accepts dash and packet on one edge, pulse on a node, and each fps", () => {
    for (const fps of [10, 20, 25]) {
      const result = validateAnimation(
        {
          durationMs: 1000,
          fps,
          loop: false,
          edges: [
            { edgeId: "e", effect: "dash" },
            { edgeId: "e", effect: "packet" },
          ],
          nodes: [{ nodeId: "a", effect: "pulse" }],
        },
        ids,
      );
      expect(result.ok).toBe(true);
    }
  });

  it("refuses an fps outside the list", () => {
    expect(errorsOf(animation({ fps: 30 }))).toEqual([
      { code: "invalid_fps", path: "animation.fps" },
    ]);
  });

  it("refuses an unknown id with the field path", () => {
    expect(errorsOf(animation({ edges: [{ edgeId: "x", effect: "dash" }] }))).toEqual([
      { code: "unknown_reference", path: "animation.edges[0].edgeId" },
    ]);
    expect(errorsOf(animation({ nodes: [{ nodeId: "x", effect: "pulse" }] }))).toEqual([
      { code: "unknown_reference", path: "animation.nodes[0].nodeId" },
    ]);
  });

  it("refuses an unknown effect, including one of the other kind", () => {
    expect(errorsOf(animation({ edges: [{ edgeId: "e", effect: "pulse" }] }))).toEqual([
      { code: "unknown_effect", path: "animation.edges[0].effect" },
    ]);
    expect(errorsOf(animation({ nodes: [{ nodeId: "a", effect: "spin" }] }))).toEqual([
      { code: "unknown_effect", path: "animation.nodes[0].effect" },
    ]);
  });

  it("refuses the same effect twice on one target", () => {
    const edges = [
      { edgeId: "e", effect: "dash" },
      { edgeId: "e", effect: "dash" },
    ];
    expect(errorsOf(animation({ edges }))).toEqual([
      { code: "duplicate_id", path: "animation.edges[1]" },
    ]);
    const nodes = [
      { nodeId: "a", effect: "pulse" },
      { nodeId: "a", effect: "pulse" },
    ];
    expect(errorsOf(animation({ nodes }))).toEqual([
      { code: "duplicate_id", path: "animation.nodes[1]" },
    ]);
  });

  it("accepts the maximum of 80 frames and refuses more", () => {
    expect(errorsOf(animation({ durationMs: 4000, fps: 20 }))).toEqual([]);
    expect(errorsOf(animation({ durationMs: 4001, fps: 20 }))).toEqual([
      { code: "limit_exceeded", path: "animation.durationMs" },
    ]);
  });

  it("refuses more than 5 s of delays", () => {
    expect(errorsOf(animation({ durationMs: 5100, fps: 10 }))).toEqual([
      { code: "limit_exceeded", path: "animation.durationMs" },
    ]);
  });

  it("refuses a duration that is not a positive integer", () => {
    expect(errorsOf(animation({ durationMs: 1.5 }))).toEqual([
      { code: "invalid_value", path: "animation.durationMs" },
    ]);
    expect(errorsOf(animation({ durationMs: 0 }))).toEqual([
      { code: "invalid_value", path: "animation.durationMs" },
    ]);
  });

  it("refuses an animation without effects", () => {
    expect(errorsOf({ durationMs: 1000 })).toEqual([{ code: "empty_list", path: "animation" }]);
  });

  it("refuses an undeclared field, a bad loop and malformed lists", () => {
    expect(errorsOf(animation({ speed: 2 }))).toEqual([
      { code: "unknown_field", path: "animation.speed" },
    ]);
    expect(errorsOf(animation({ loop: "yes" }))).toEqual([
      { code: "invalid_type", path: "animation.loop" },
    ]);
    expect(errorsOf(animation({ edges: 1 }))).toEqual([
      { code: "invalid_type", path: "animation.edges" },
    ]);
    expect(errorsOf(animation({ nodes: {} }))).toEqual([
      { code: "invalid_type", path: "animation.nodes" },
    ]);
    expect(errorsOf(animation({ edges: [1] }))).toEqual([
      { code: "invalid_type", path: "animation.edges[0]" },
    ]);
    expect(errorsOf(animation({ nodes: [{ nodeId: "a", effect: "pulse", x: 1 }] }))).toEqual([
      { code: "unknown_field", path: "animation.nodes[0].x" },
    ]);
    expect(errorsOf(1)).toEqual([{ code: "invalid_type", path: "animation" }]);
  });

  it("refuses a list above the structural limits", () => {
    const edges = Array.from({ length: 401 }, () => ({ edgeId: "e", effect: "dash" }));
    expect(errorsOf(animation({ edges }))).toEqual([
      { code: "limit_exceeded", path: "animation.edges" },
    ]);
    const nodes = Array.from({ length: 201 }, () => ({ nodeId: "a", effect: "pulse" }));
    expect(errorsOf(animation({ nodes }))).toEqual([
      { code: "limit_exceeded", path: "animation.nodes" },
    ]);
  });
});
