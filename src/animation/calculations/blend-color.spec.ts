import { describe, expect, it } from "vitest";
import { blendColor } from "./blend-color";

describe("blendColor", () => {
  it("returns each end at 0 and 1", () => {
    expect(blendColor("#000000", "#FFFFFF", 0)).toBe("#000000");
    expect(blendColor("#000000", "#FFFFFF", 1)).toBe("#FFFFFF");
  });

  it("blends channel by channel with two hex digits", () => {
    expect(blendColor("#000000", "#FFFFFF", 0.5)).toBe("#808080");
    expect(blendColor("#102030", "#102030", 0.3)).toBe("#102030");
    expect(blendColor("#000000", "#0A0000", 0.5)).toBe("#050000");
  });
});
