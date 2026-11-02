import { dirname, join } from "node:path";
import { describe, expect, it } from "vitest";
import { createFontkitTextMeasurer } from "./create-fontkit-text-measurer";

const fontsDir = join(
  dirname(import.meta.dirname),
  "../../node_modules/@fontsource/zilla-slab/files",
);
const registry = [
  {
    family: "Zilla Slab",
    regular: "zilla-slab-latin-400-normal.woff",
    bold: "zilla-slab-latin-700-normal.woff",
  },
  { family: "Gone", regular: "gone.ttf", bold: "gone-bold.ttf" },
];
const regular = { family: "Zilla Slab", weight: "regular", size: 16 } as const;

describe("createFontkitTextMeasurer", () => {
  const measurer = createFontkitTextMeasurer(fontsDir, registry);

  it("measures accented text with real metrics, proportionally to the size", () => {
    const small = measurer.measure("naïve façade", regular, "p");
    const large = measurer.measure("naïve façade", { ...regular, size: 32 }, "p");
    expect(small.ok && small.value).toBeGreaterThan(30);
    expect(small.ok && large.ok && large.value / small.value).toBeCloseTo(2, 5);
  });

  it("gives different widths to regular and bold and to different texts", () => {
    const text = measurer.measure("Hello, world", regular, "p");
    const bold = measurer.measure("Hello, world", { ...regular, weight: "bold" }, "p");
    const other = measurer.measure("Hello", regular, "p");
    expect(text.ok && bold.ok && text.value !== bold.value).toBe(true);
    expect(text.ok && other.ok && text.value > other.value).toBe(true);
  });

  it("returns font_unavailable for a glyph the font does not have", () => {
    expect(measurer.measure("日本語", regular, "nodes[1].label")).toEqual({
      ok: false,
      errors: [{ code: "font_unavailable", path: "nodes[1].label" }],
    });
  });

  it("returns font_unavailable for an unregistered family and a missing file", () => {
    expect(measurer.measure("a", { ...regular, family: "Nope" }, "title")).toEqual({
      ok: false,
      errors: [{ code: "font_unavailable", path: "title" }],
    });
    expect(measurer.measure("a", { ...regular, family: "Gone" }, "title")).toEqual({
      ok: false,
      errors: [{ code: "font_unavailable", path: "title" }],
    });
  });
});
