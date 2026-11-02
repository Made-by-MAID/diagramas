import { describe, expect, it } from "vitest";
import type { Scene } from "../svg/data/scene";
import { personalTheme } from "../theme/data/personal-theme";
import { renderDiagramFrames } from "./render-diagram-frames";

function scene(width = 500, label = "x"): Scene {
  return {
    width,
    height: 100,
    theme: personalTheme,
    title: { text: label, x: 0, y: 0 },
    nodes: [],
    edges: [
      {
        id: "e",
        d: "M 0 0 L 100 0",
        points: [],
        arrow: "0,0 1,1 2,2",
        color: "#000000",
        dashed: false,
        label: null,
      },
    ],
  };
}

const animation = {
  durationMs: 1000,
  fps: 20,
  loop: true,
  edges: [
    { edgeId: "e", effect: "dash" },
    { edgeId: "e", effect: "packet" },
  ],
  nodes: [],
} as const;

describe("renderDiagramFrames", () => {
  it("calculates every frame with a whole plan", () => {
    const result = renderDiagramFrames(scene(), animation);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.frames.length).toBe(20);
      expect(result.value.fps).toBe(20);
      expect(result.value.loop).toBe(true);
      expect(result.value.size).toEqual({ width: 500, height: 100 });
      expect(new Set(result.value.frames).size).toBe(20);
    }
  });

  it("is deterministic", () => {
    expect(renderDiagramFrames(scene(), animation)).toEqual(
      renderDiagramFrames(scene(), animation),
    );
  });

  it("scales the output to 1280 and refuses what would need more than half", () => {
    const fit = renderDiagramFrames(scene(2000), animation);
    expect(fit.ok && fit.value.size.width).toBe(1280);
    expect(renderDiagramFrames(scene(2600), animation)).toEqual({
      ok: false,
      errors: [{ code: "limit_exceeded", path: "$" }],
    });
  });

  it("refuses a frame above 512 KB", () => {
    expect(renderDiagramFrames(scene(500, "y".repeat(520 * 1024)), animation)).toEqual({
      ok: false,
      errors: [{ code: "limit_exceeded", path: "$" }],
    });
  });

  it("returns unsafe_svg instead of a bad frame", () => {
    expect(renderDiagramFrames(scene(500, "bad\u0002"), animation)).toEqual({
      ok: false,
      errors: [{ code: "unsafe_svg", path: "$" }],
    });
  });
});
