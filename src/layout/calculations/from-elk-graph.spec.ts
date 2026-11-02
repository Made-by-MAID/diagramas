import { describe, expect, it } from "vitest";
import { fromElkGraph } from "./from-elk-graph";

const graph = {
  id: "root",
  width: 200,
  height: 300,
  children: [
    { id: "n0", x: 10, y: 20, width: 80, height: 40 },
    { id: "n1", x: 10, y: 120, width: 80, height: 40 },
  ],
  edges: [
    {
      id: "e0",
      sources: ["n0"],
      targets: ["n1"],
      sections: [
        {
          id: "s",
          startPoint: { x: 50, y: 60 },
          bendPoints: [{ x: 50, y: 90 }],
          endPoint: { x: 50, y: 120 },
        },
      ],
      labels: [{ id: "l0", x: 55, y: 80, width: 10, height: 20 }],
    },
    {
      id: "e1",
      sources: ["n1"],
      targets: ["n0"],
      sections: [{ id: "t", startPoint: { x: 1, y: 2 }, endPoint: { x: 3, y: 4 } }],
    },
  ],
};

describe("fromElkGraph", () => {
  it("reads node boxes, edge paths and label positions", () => {
    expect(fromElkGraph(graph)).toEqual({
      ok: true,
      value: {
        width: 200,
        height: 300,
        nodes: [
          { key: "n0", x: 10, y: 20, width: 80, height: 40 },
          { key: "n1", x: 10, y: 120, width: 80, height: 40 },
        ],
        edges: [
          {
            key: "e0",
            points: [
              { x: 50, y: 60 },
              { x: 50, y: 90 },
              { x: 50, y: 120 },
            ],
            label: { x: 55, y: 80, width: 10, height: 20 },
          },
          {
            key: "e1",
            points: [
              { x: 1, y: 2 },
              { x: 3, y: 4 },
            ],
            label: null,
          },
        ],
      },
    });
  });

  it("refuses a coordinate that is not finite", () => {
    const broken = {
      ...graph,
      children: [{ id: "n0", x: Number.NaN, y: 0, width: 1, height: 1 }],
    };
    expect(fromElkGraph(broken)).toEqual({
      ok: false,
      errors: [{ code: "layout_failed", path: "$" }],
    });
    expect(fromElkGraph({ ...graph, width: Number.POSITIVE_INFINITY }).ok).toBe(false);
  });

  it("refuses a node without position and an edge without a path", () => {
    expect(fromElkGraph({ ...graph, children: [{ id: "n0" }] }).ok).toBe(false);
    expect(fromElkGraph({ ...graph, edges: [{ id: "e", sections: [] }] } as never).ok).toBe(false);
    expect(fromElkGraph({ ...graph, edges: [{ id: "e" }] } as never).ok).toBe(false);
    expect(fromElkGraph({ id: "r", width: 1, height: 1 }).ok).toBe(true);
    expect(fromElkGraph({ id: "r" }).ok).toBe(false);
  });

  it("refuses a label without a position and a path with bad points", () => {
    const edge = graph.edges[0];
    expect(
      fromElkGraph({ ...graph, edges: [{ ...edge, labels: [{ id: "l" }] }] as never }).ok,
    ).toBe(false);
    const section = {
      id: "s",
      startPoint: { x: Number.NaN, y: 0 },
      endPoint: { x: 1, y: 1 },
    };
    expect(fromElkGraph({ ...graph, edges: [{ id: "e", sections: [section] }] } as never).ok).toBe(
      false,
    );
  });
});
