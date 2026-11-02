import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { type PrepareDeps, prepareDiagram } from "../../src/flows/prepare-diagram";
import { renderDiagramFrames } from "../../src/flows/render-diagram-frames";
import { renderDiagramSvg } from "../../src/flows/render-diagram-svg";
import { createElkLayoutEngine } from "../../src/layout/actions/create-elk-layout-engine";
import { createMemoryLayoutEngine } from "../../src/layout/actions/create-memory-layout-engine";
import { createFontkitTextMeasurer } from "../../src/text/actions/create-fontkit-text-measurer";
import { createMemoryTextMeasurer } from "../../src/text/actions/create-memory-text-measurer";
import { defaultFontRegistry } from "../../src/theme/data/font-registry";
import { personalTheme } from "../../src/theme/data/personal-theme";
import { buildCyclicFlowchart } from "../fixtures/build-cyclic-flowchart";
import { zillaFontsDir, zillaRegistry } from "../fixtures/zilla-test-fonts";

const fixture = readFileSync(
  join(import.meta.dirname, "../fixtures/sample-flowchart.json"),
  "utf8",
);

const memoryDeps: PrepareDeps = {
  layoutEngine: createMemoryLayoutEngine(),
  textMeasurer: createMemoryTextMeasurer(),
  themes: [personalTheme],
  fontRegistry: defaultFontRegistry,
};

const realDeps: PrepareDeps = {
  layoutEngine: createElkLayoutEngine(),
  textMeasurer: createFontkitTextMeasurer(zillaFontsDir, zillaRegistry),
  themes: [personalTheme],
  fontRegistry: zillaRegistry,
};

describe.each([
  ["memory ports", memoryDeps],
  ["real layout and metrics", realDeps],
])("sample fixture with %s", (_, deps) => {
  it("goes from JSON to SVG and to 80 frames", async () => {
    const prepared = await prepareDiagram(fixture, deps);
    expect(prepared.ok).toBe(true);
    if (!prepared.ok) {
      return;
    }
    const { diagram, scene } = prepared.value;
    expect(new Set(diagram.nodes.map((node) => node.shape)).size).toBe(5);
    expect(diagram.nodes.length).toBe(20);

    const svg = renderDiagramSvg(scene);
    expect(svg.ok).toBe(true);
    if (!svg.ok || diagram.animation === undefined) {
      return;
    }
    expect(svg.value.svg).toContain("Start the order");
    expect(svg.value.svg.match(/data-node-id=/g)?.length).toBe(20);
    expect(svg.value.svg.match(/data-edge-id=/g)?.length).toBe(24);

    const frames = renderDiagramFrames(scene, diagram.animation);
    expect(frames.ok).toBe(true);
    if (!frames.ok) {
      return;
    }
    expect(frames.value.frames.length).toBe(80);
    expect(frames.value.size.width).toBeLessThanOrEqual(1280);
    expect(frames.value.size.height).toBeLessThanOrEqual(1280);
    for (const frame of frames.value.frames) {
      expect(new TextEncoder().encode(frame).length).toBeLessThanOrEqual(512 * 1024);
    }
    expect(new Set(frames.value.frames).size).toBe(80);
    expect(frames.value.frames[0]).toMatch(/data-role="packet"/);
    expect(frames.value.frames[0]).toMatch(/stroke-dashoffset/);
    expect(frames.value.frames[10]).toMatch(/scale\(1\.\d{4}\)/);
  });

  it("gives the same bytes on two runs", async () => {
    const first = await prepareDiagram(fixture, deps);
    const second = await prepareDiagram(fixture, deps);
    if (!first.ok || !second.ok) {
      throw new Error("fixture must be valid");
    }
    expect(renderDiagramSvg(first.value.scene)).toEqual(renderDiagramSvg(second.value.scene));
  });
});

describe("layout under real metrics", () => {
  it.each([20, 30])("keeps %i nodes inside the GIF limits", async (size) => {
    const prepared = await prepareDiagram(buildCyclicFlowchart(size), realDeps);
    if (!prepared.ok) {
      throw new Error(JSON.stringify(prepared.errors));
    }
    const { scene, diagram } = prepared.value;
    const frames = renderDiagramFrames(
      scene,
      diagram.animation as NonNullable<typeof diagram.animation>,
    );
    expect(frames.ok).toBe(true);
  });

  it("refuses a glyph the font does not have, with the field path", async () => {
    const text = fixture.replace("Start the order", "開始");
    const prepared = await prepareDiagram(text, realDeps);
    expect(prepared).toEqual({
      ok: false,
      errors: [{ code: "font_unavailable", path: "nodes[0].label" }],
    });
  });
});
