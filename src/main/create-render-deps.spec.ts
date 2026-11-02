import { describe, expect, it } from "vitest";
import { createRenderDeps } from "./create-render-deps";

describe("createRenderDeps", () => {
  it("wires the real adapters, with defaults for binaries and themes", () => {
    const deps = createRenderDeps({ fontsDir: "/fonts" });
    expect(deps.fontsDir).toBe("/fonts");
    expect(deps.themes.map((theme) => theme.name)).toEqual(["personal"]);
    expect(deps.fontRegistry[0]?.family).toBe("Zilla Slab");
    expect(typeof deps.runner.run).toBe("function");
    expect(typeof deps.layoutEngine.layout).toBe("function");
  });

  it("accepts themes and fonts by parameter", () => {
    const fontRegistry = [{ family: "F", regular: "f.ttf", bold: "fb.ttf" }];
    const deps = createRenderDeps({
      fontsDir: "/fonts",
      resvgPath: "/opt/resvg",
      ffmpegPath: "/opt/ffmpeg",
      themes: [],
      fontRegistry,
    });
    expect(deps.themes).toEqual([]);
    expect(deps.fontRegistry).toEqual(fontRegistry);
  });
});
