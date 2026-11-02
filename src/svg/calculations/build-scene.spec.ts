import { describe, expect, it } from "vitest";
import type { Diagram } from "../../contract/data/diagram";
import { personalTheme } from "../../theme/data/personal-theme";
import { buildScene } from "./build-scene";

const diagram: Diagram = {
  version: 1,
  type: "flowchart",
  title: "Title",
  direction: "down",
  theme: { extends: "personal", colors: {}, font: {}, stroke: {}, spacing: {} },
  nodes: [
    { id: "a", label: "A", shape: "decision", style: { fill: "#111111" } },
    {
      id: "b",
      label: "B",
      shape: "process",
      style: { stroke: "#222222", text: "#333333" },
    },
  ],
  edges: [
    { id: "e", from: "a", to: "b", label: "yes", style: {} },
    { id: "f", from: "b", to: "a", style: { color: "#444444", line: "dashed" } },
  ],
};

const measured = {
  titleWidth: 50,
  nodes: [
    { lines: ["A"], width: 100, height: 60 },
    { lines: ["B", "b"], width: 100, height: 60 },
  ],
  edgeLabels: [{ lines: ["yes"], width: 24, height: 20 }, null],
};

const layout = {
  width: 100,
  height: 200,
  nodes: [
    { key: "n0", x: 0, y: 0, width: 100, height: 60 },
    { key: "n1", x: 0, y: 140, width: 100, height: 60 },
  ],
  edges: [
    {
      key: "e0",
      points: [
        { x: 25, y: 60 },
        { x: 25, y: 60 },
        { x: 25, y: 140 },
      ],
      label: { x: 30, y: 90, width: 24, height: 20 },
    },
    {
      key: "e1",
      points: [
        { x: 75, y: 140 },
        { x: 75, y: 60 },
      ],
      label: null,
    },
  ],
};

describe("buildScene", () => {
  const scene = buildScene(diagram, personalTheme, measured, layout);

  it("offsets the content by padding and title, and sizes the canvas", () => {
    expect(scene.width).toBe(100 + 2 * 32);
    expect(scene.nodes[0]?.x).toBe(32);
    expect(scene.nodes[0]?.y).toBeGreaterThan(32 + 26);
    expect(scene.height).toBe((scene.nodes[1]?.y as number) + 60 + 32);
  });

  it("widens the canvas for a long title and centers the content", () => {
    const wide = buildScene(diagram, personalTheme, { ...measured, titleWidth: 300 }, layout);
    expect(wide.width).toBe(300 + 2 * 32);
    expect(wide.nodes[0]?.x).toBe(32 + 100);
  });

  it("applies node and edge styles over the theme", () => {
    expect(scene.nodes[0]?.fill).toBe("#111111");
    expect(scene.nodes[0]?.stroke).toBe(personalTheme.colors.nodeStroke);
    expect(scene.nodes[0]?.textColor).toBe(personalTheme.colors.text);
    expect(scene.nodes[1]?.fill).toBe(personalTheme.colors.nodeFill);
    expect(scene.nodes[1]?.stroke).toBe("#222222");
    expect(scene.nodes[1]?.textColor).toBe("#333333");
    expect(scene.edges[0]?.color).toBe(personalTheme.colors.edge);
    expect(scene.edges[0]?.dashed).toBe(false);
    expect(scene.edges[1]?.color).toBe("#444444");
    expect(scene.edges[1]?.dashed).toBe(true);
  });

  it("centers each line of a label around the node", () => {
    const lines = scene.nodes[1]?.lines ?? [];
    expect(lines.map((line) => line.text)).toEqual(["B", "b"]);
    expect(lines[0]?.x).toBe(82);
    expect((lines[1]?.y as number) - (lines[0]?.y as number)).toBeCloseTo(20);
  });

  it("clips the edge to the real outline of the shape", () => {
    const start = scene.edges[0]?.points[0];
    // x=25 of a 100-wide diamond: the outline sits a quarter of the height above the box bottom.
    expect(start?.y).toBeCloseTo((scene.nodes[0]?.y as number) + 45, 0);
  });

  it("removes repeated points, writes the path and the arrow, and places the label", () => {
    expect(scene.edges[0]?.points.length).toBe(2);
    expect(scene.edges[0]?.d).toMatch(/^M \S+ \S+ L \S+ \S+$/);
    expect(scene.edges[0]?.arrow.split(" ").length).toBe(3);
    expect(scene.edges[0]?.label?.lines[0]?.text).toBe("yes");
    expect(scene.edges[1]?.label).toBeNull();
  });
});

describe("buildScene with a degenerate path", () => {
  it("keeps two points when the layout returned only repeated ones", () => {
    const point = { x: 50, y: 0 };
    const scene = buildScene(
      { ...diagram, edges: [{ id: "e", from: "a", to: "b", style: {} }] },
      personalTheme,
      { ...measured, edgeLabels: [null] },
      { ...layout, edges: [{ key: "e0", points: [point, point], label: null }] },
    );
    expect(scene.edges[0]?.points.length).toBe(2);
  });
});
