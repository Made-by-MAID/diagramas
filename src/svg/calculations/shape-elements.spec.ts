import { describe, expect, it } from "vitest";
import type { NodeShape } from "../../contract/data/diagram";
import { serializeSvg } from "./serialize-svg";
import { shapeElements } from "./shape-elements";

function node(shape: NodeShape) {
  return {
    id: "a",
    shape,
    x: 10,
    y: 20,
    width: 100,
    height: 60,
    fill: "#111111",
    stroke: "#222222",
    textColor: "#333333",
    lines: [],
  };
}

const stroke = { width: 2, cornerRadius: 0 };
const shapes: readonly NodeShape[] = ["process", "terminal", "decision", "io", "data"];

describe("shapeElements", () => {
  it("draws five different outlines with cornerRadius 0", () => {
    const outlines = shapes.map((shape) =>
      JSON.stringify(shapeElements(node(shape), stroke, "#222222")),
    );
    expect(new Set(outlines).size).toBe(5);
  });

  it("does not depend on rounding for the terminal: it has chamfers", () => {
    const [outline] = shapeElements(node("terminal"), stroke, "#222222");
    expect(outline?.tag).toBe("polygon");
    expect(outline?.attrs.rx).toBeUndefined();
    expect(String(outline?.attrs.points).split(" ").length).toBe(8);
  });

  it("draws a process as a rectangle with the corner radius of the theme", () => {
    const [outline] = shapeElements(node("process"), { width: 2, cornerRadius: 4 }, "#222222");
    expect(outline?.tag).toBe("rect");
    expect(outline?.attrs.rx).toBe(4);
  });

  it("draws a decision with 4 points and an io with 4 slanted points", () => {
    const [decision] = shapeElements(node("decision"), stroke, "#222222");
    expect(String(decision?.attrs.points).split(" ").length).toBe(4);
    const [io] = shapeElements(node("io"), stroke, "#222222");
    expect(String(io?.attrs.points).split(" ").length).toBe(4);
  });

  it("draws a data with a body and an inner cap line", () => {
    const elements = shapeElements(node("data"), stroke, "#222222");
    expect(elements.length).toBe(2);
    expect(elements[0]?.tag).toBe("path");
    expect(elements[0]?.attrs.d).toContain("A");
  });

  it("uses the given stroke and serializes safely", () => {
    for (const shape of shapes) {
      for (const element of shapeElements(node(shape), stroke, "#ABCDEF")) {
        expect(element.attrs.stroke).toBe("#ABCDEF");
        expect(serializeSvg(element).ok).toBe(true);
      }
    }
  });
});
