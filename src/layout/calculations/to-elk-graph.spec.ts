import { describe, expect, it } from "vitest";
import { toElkGraph } from "./to-elk-graph";

const request = {
  direction: "down",
  nodeSpacing: 40,
  layerSpacing: 60,
  nodes: [
    { key: "n0", width: 80, height: 40 },
    { key: "n1", width: 90, height: 50 },
  ],
  edges: [
    { key: "e0", source: "n0", target: "n1", label: null },
    { key: "e1", source: "n1", target: "n0", label: { width: 10, height: 20 } },
  ],
} as const;

describe("toElkGraph", () => {
  it("maps direction and spacing to fixed options", () => {
    const graph = toElkGraph(request);
    expect(graph.layoutOptions?.["elk.direction"]).toBe("DOWN");
    expect(graph.layoutOptions?.["elk.algorithm"]).toBe("layered");
    expect(graph.layoutOptions?.["elk.spacing.nodeNode"]).toBe("40");
    expect(toElkGraph({ ...request, direction: "right" }).layoutOptions?.["elk.direction"]).toBe(
      "RIGHT",
    );
  });

  it("carries only generated ids and numbers", () => {
    const graph = toElkGraph(request);
    expect(graph.children).toEqual([
      { id: "n0", width: 80, height: 40 },
      { id: "n1", width: 90, height: 50 },
    ]);
    expect(graph.edges).toEqual([
      { id: "e0", sources: ["n0"], targets: ["n1"], labels: [] },
      {
        id: "e1",
        sources: ["n1"],
        targets: ["n0"],
        labels: [{ id: "l1", width: 10, height: 20 }],
      },
    ]);
  });
});
