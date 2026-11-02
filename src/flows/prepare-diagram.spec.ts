import { describe, expect, it } from "vitest";
import { createMemoryLayoutEngine } from "../layout/actions/create-memory-layout-engine";
import { createMemoryTextMeasurer } from "../text/actions/create-memory-text-measurer";
import { defaultFontRegistry } from "../theme/data/font-registry";
import { personalTheme } from "../theme/data/personal-theme";
import { prepareDiagram } from "./prepare-diagram";

const deps = {
  layoutEngine: createMemoryLayoutEngine(),
  textMeasurer: createMemoryTextMeasurer(),
  themes: [personalTheme],
  fontRegistry: defaultFontRegistry,
};

function input(extra: object = {}): string {
  return JSON.stringify({
    version: 1,
    type: "flowchart",
    title: "Title",
    direction: "down",
    nodes: [
      { id: "a", label: "A", shape: "process" },
      { id: "b", label: "B", shape: "terminal" },
    ],
    edges: [{ id: "e", from: "a", to: "b" }],
    ...extra,
  });
}

describe("prepareDiagram", () => {
  it("validates, measures and lays out a diagram into a scene", async () => {
    const result = await prepareDiagram(input(), deps);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.scene.nodes.length).toBe(2);
      expect(result.value.diagram.title).toBe("Title");
    }
  });

  it("returns contract errors", async () => {
    const result = await prepareDiagram("{", deps);
    expect(result).toEqual({ ok: false, errors: [{ code: "invalid_json", path: "$" }] });
  });

  it("returns an error when the theme is missing from what was passed", async () => {
    const result = await prepareDiagram(input({ theme: "other" }), {
      ...deps,
      themes: [{ ...personalTheme, name: "other" }],
    });
    expect(result.ok).toBe(true);
    const missing = await prepareDiagram(input(), { ...deps, themes: [] });
    expect(missing.ok).toBe(false);
  });

  it("refuses a theme passed by parameter with a font outside the registry", async () => {
    const result = await prepareDiagram(input(), { ...deps, fontRegistry: [] });
    expect(result).toEqual({
      ok: false,
      errors: [{ code: "unknown_font", path: "theme.font.family" }],
    });
  });

  it("returns font_unavailable with the path", async () => {
    const result = await prepareDiagram(input(), {
      ...deps,
      textMeasurer: createMemoryTextMeasurer({ missingCharacters: "A" }),
    });
    expect(result).toEqual({
      ok: false,
      errors: [{ code: "font_unavailable", path: "nodes[0].label" }],
    });
  });

  it("returns layout errors", async () => {
    const result = await prepareDiagram(input(), {
      ...deps,
      layoutEngine: createMemoryLayoutEngine({ failure: true }),
    });
    expect(result).toEqual({ ok: false, errors: [{ code: "layout_failed", path: "$" }] });
  });
});
