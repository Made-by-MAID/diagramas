import { describe, expect, it } from "vitest";
import { personalTheme } from "../theme/data/personal-theme";
import { renderDiagramSvg } from "./render-diagram-svg";

function sceneOf(width: number, label = "x") {
  return {
    width,
    height: 100,
    theme: personalTheme,
    title: { text: label, x: 0, y: 0 },
    nodes: [],
    edges: [],
  };
}

describe("renderDiagramSvg", () => {
  it("writes a static SVG with its size", () => {
    const result = renderDiagramSvg(sceneOf(500));
    expect(result.ok && result.value.size).toEqual({ width: 500, height: 100 });
    expect(result.ok && result.value.svg.startsWith("<svg ")).toBe(true);
  });

  it("refuses a canvas that does not fit in a PNG", () => {
    expect(renderDiagramSvg(sceneOf(8193))).toEqual({
      ok: false,
      errors: [{ code: "limit_exceeded", path: "$" }],
    });
  });

  it("refuses an SVG above the byte limit", () => {
    expect(renderDiagramSvg(sceneOf(500, "x".repeat(600 * 1024)))).toEqual({
      ok: false,
      errors: [{ code: "limit_exceeded", path: "$" }],
    });
  });

  it("returns unsafe_svg instead of a bad document", () => {
    expect(renderDiagramSvg(sceneOf(500, "bad\u0001"))).toEqual({
      ok: false,
      errors: [{ code: "unsafe_svg", path: "$" }],
    });
  });
});
