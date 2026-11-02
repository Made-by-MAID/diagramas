import { describe, expect, it } from "vitest";
import { createMemoryTextMeasurer } from "./create-memory-text-measurer";

describe("createMemoryTextMeasurer", () => {
  it("measures half the size per character, a bit more when bold", () => {
    const measurer = createMemoryTextMeasurer();
    const regular = measurer.measure("abcd", { family: "F", weight: "regular", size: 10 }, "p");
    const bold = measurer.measure("abcd", { family: "F", weight: "bold", size: 10 }, "p");
    expect(regular).toEqual({ ok: true, value: 20 });
    expect(bold).toEqual({ ok: true, value: 22 });
  });

  it("reports an unavailable family and a missing glyph", () => {
    const measurer = createMemoryTextMeasurer({
      unavailableFamilies: ["Gone"],
      missingCharacters: "ç",
    });
    const style = { family: "Gone", weight: "regular", size: 10 } as const;
    expect(measurer.measure("a", style, "p")).toEqual({
      ok: false,
      errors: [{ code: "font_unavailable", path: "p" }],
    });
    expect(measurer.measure("ç", { ...style, family: "F" }, "q")).toEqual({
      ok: false,
      errors: [{ code: "font_unavailable", path: "q" }],
    });
  });
});
