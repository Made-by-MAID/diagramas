import { describe, expect, it } from "vitest";
import { createMemoryLayoutEngine } from "./create-memory-layout-engine";

const request = {
  direction: "down",
  nodeSpacing: 10,
  layerSpacing: 20,
  nodes: [
    { key: "n0", width: 80, height: 40 },
    { key: "n1", width: 100, height: 40 },
  ],
  edges: [
    { key: "e0", source: "n0", target: "n1", label: { width: 10, height: 20 } },
    { key: "e1", source: "n1", target: "n1", label: null },
  ],
} as const;

describe("createMemoryLayoutEngine", () => {
  it("stacks nodes down, centered, with straight edges", async () => {
    const result = await createMemoryLayoutEngine().layout(request);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.nodes[0]).toEqual({ key: "n0", x: 10, y: 0, width: 80, height: 40 });
      expect(result.value.nodes[1]).toEqual({ key: "n1", x: 0, y: 60, width: 100, height: 40 });
      expect(result.value.edges[0]?.points).toEqual([
        { x: 50, y: 40 },
        { x: 50, y: 60 },
      ]);
      expect(result.value.edges[0]?.label).toEqual({ x: 45, y: 40, width: 10, height: 20 });
      expect(result.value.edges[1]?.points.length).toBe(4);
    }
  });

  it("places nodes in a row for right", async () => {
    const result = await createMemoryLayoutEngine().layout({ ...request, direction: "right" });
    expect(result.ok && result.value.nodes[1]).toEqual({
      key: "n1",
      x: 100,
      y: 0,
      width: 100,
      height: 40,
    });
    expect(result.ok && result.value.edges[0]?.points[1]).toEqual({ x: 100, y: 20 });
  });

  it("can be told to fail", async () => {
    const result = await createMemoryLayoutEngine({ failure: true }).layout(request);
    expect(result).toEqual({ ok: false, errors: [{ code: "layout_failed", path: "$" }] });
  });
});
