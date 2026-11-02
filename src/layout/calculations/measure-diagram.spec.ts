import { describe, expect, it } from "vitest";
import type { Diagram } from "../../contract/data/diagram";
import { createMemoryTextMeasurer } from "../../text/actions/create-memory-text-measurer";
import { personalTheme } from "../../theme/data/personal-theme";
import { measureDiagram } from "./measure-diagram";

const diagram: Diagram = {
  version: 1,
  type: "flowchart",
  title: "Title",
  direction: "down",
  theme: { extends: "personal", colors: {}, font: {}, stroke: {}, spacing: {} },
  nodes: [
    { id: "a", label: "Start", shape: "terminal", style: {} },
    { id: "b", label: "End", shape: "process", style: {} },
  ],
  edges: [
    { id: "e", from: "a", to: "b", label: "yes", style: {} },
    { id: "f", from: "b", to: "a", style: {} },
  ],
};

describe("measureDiagram", () => {
  it("measures the title in bold and every label in regular", () => {
    const result = measureDiagram(diagram, personalTheme, createMemoryTextMeasurer());
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.titleWidth).toBeCloseTo(5 * 26 * 0.55);
      expect(result.value.nodes[0]?.lines).toEqual(["Start"]);
      expect(result.value.nodes[0]?.width).toBeGreaterThan(0);
      expect(result.value.edgeLabels[0]).toEqual({ lines: ["yes"], width: 24, height: 20 });
      expect(result.value.edgeLabels[1]).toBeNull();
    }
  });

  it.each([
    ["T", "title"],
    ["S", "nodes[0].label"],
    ["s", "edges[0].label"],
  ])("reports font_unavailable for %s at %s", (missingCharacters, path) => {
    const measurer = createMemoryTextMeasurer({ missingCharacters });
    expect(measureDiagram(diagram, personalTheme, measurer)).toEqual({
      ok: false,
      errors: [{ code: "font_unavailable", path }],
    });
  });
});
