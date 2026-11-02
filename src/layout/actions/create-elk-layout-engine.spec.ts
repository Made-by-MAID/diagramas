import { describe, expect, it } from "vitest";
import type { LayoutRequest } from "../data/layout-engine";
import { createElkLayoutEngine } from "./create-elk-layout-engine";

function cyclicRequest(size: number): LayoutRequest {
  const nodes = Array.from({ length: size }, (_, index) => ({
    key: `n${index}`,
    width: 80 + (index % 5) * 20,
    height: 40 + (index % 3) * 10,
  }));
  const edges = nodes.flatMap((node, index) => [
    {
      key: `e${index}`,
      source: node.key,
      target: `n${(index + 1) % size}`,
      label: index % 4 === 0 ? { width: 30, height: 20 } : null,
    },
    {
      key: `b${index}`,
      source: node.key,
      target: `n${(index * 7 + 3) % size}`,
      label: null,
    },
  ]);
  return { direction: "down", nodeSpacing: 40, layerSpacing: 60, nodes, edges };
}

describe("createElkLayoutEngine", () => {
  it("lays out 30 nodes with cycles: no overlap, finite values, every edge has a path", async () => {
    const request = cyclicRequest(30);
    const result = await createElkLayoutEngine().layout(request);
    expect(result.ok).toBe(true);
    if (!result.ok) {
      return;
    }
    const { nodes, edges, width, height } = result.value;
    expect(nodes.length).toBe(30);
    expect(edges.length).toBe(request.edges.length);
    expect(Number.isFinite(width) && Number.isFinite(height)).toBe(true);
    for (const a of nodes) {
      for (const b of nodes) {
        if (a.key !== b.key) {
          const apart =
            a.x + a.width <= b.x ||
            b.x + b.width <= a.x ||
            a.y + a.height <= b.y ||
            b.y + b.height <= a.y;
          expect(apart).toBe(true);
        }
      }
    }
    for (const edge of edges) {
      expect(edge.points.length).toBeGreaterThanOrEqual(2);
      for (const point of edge.points) {
        expect(Number.isFinite(point.x) && Number.isFinite(point.y)).toBe(true);
      }
    }
  });

  it("handles a self loop, and the right direction", async () => {
    const request: LayoutRequest = {
      direction: "right",
      nodeSpacing: 40,
      layerSpacing: 60,
      nodes: [{ key: "n0", width: 80, height: 40 }],
      edges: [{ key: "e0", source: "n0", target: "n0", label: null }],
    };
    const result = await createElkLayoutEngine().layout(request);
    expect(result.ok && result.value.edges[0]?.points.length).toBeGreaterThanOrEqual(2);
  });

  it("is deterministic", async () => {
    const request = cyclicRequest(12);
    const engine = createElkLayoutEngine();
    expect(await engine.layout(request)).toEqual(await engine.layout(request));
  });

  it("returns layout_failed when the engine refuses the graph", async () => {
    const request: LayoutRequest = {
      direction: "down",
      nodeSpacing: 40,
      layerSpacing: 60,
      nodes: [{ key: "n0", width: 80, height: 40 }],
      edges: [{ key: "e0", source: "n0", target: "ghost", label: null }],
    };
    expect(await createElkLayoutEngine().layout(request)).toEqual({
      ok: false,
      errors: [{ code: "layout_failed", path: "$" }],
    });
  });
});
