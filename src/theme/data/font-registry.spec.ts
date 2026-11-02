import { describe, expect, it } from "vitest";
import { defaultFontRegistry } from "./font-registry";

describe("defaultFontRegistry", () => {
  it("registers Zilla Slab by plain file names, never by URL", () => {
    const zilla = defaultFontRegistry.find((font) => font.family === "Zilla Slab");
    expect(zilla).toEqual({
      family: "Zilla Slab",
      regular: "ZillaSlab-Regular.ttf",
      bold: "ZillaSlab-Bold.ttf",
    });
  });
});
