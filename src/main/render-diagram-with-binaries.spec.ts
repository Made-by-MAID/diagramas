import { describe, expect, it } from "vitest";
import { renderDiagramWithBinaries } from "./render-diagram-with-binaries";

describe("renderDiagramWithBinaries", () => {
  it("returns contract errors using the real composition", async () => {
    const result = await renderDiagramWithBinaries("{", { fontsDir: "/nonexistent" });
    expect(result).toEqual({ ok: false, errors: [{ code: "invalid_json", path: "$" }] });
  });

  it("returns font_unavailable when the fonts directory has no registered font", async () => {
    const text = JSON.stringify({
      version: 1,
      type: "flowchart",
      title: "t",
      direction: "down",
      nodes: [{ id: "a", label: "A", shape: "process" }],
      edges: [],
    });
    const result = await renderDiagramWithBinaries(text, { fontsDir: "/nonexistent" });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.errors[0]).toEqual({ code: "font_unavailable", path: "title" });
    }
  });
});
