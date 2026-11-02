import { describe, expect, it } from "vitest";
import { validateThemeOverrides } from "./validate-theme-overrides";

const fonts = ["Zilla Slab", "Other"];

function errorsOf(value: unknown) {
  const result = validateThemeOverrides(value, "theme", fonts);
  return result.ok ? [] : result.errors;
}

describe("validateThemeOverrides", () => {
  it("keeps only what was overridden", () => {
    const result = validateThemeOverrides(
      { colors: { accent: "#112233" }, font: { family: "Other" }, stroke: { width: 3 } },
      "theme",
      fonts,
    );
    expect(result).toEqual({
      ok: true,
      value: {
        colors: { accent: "#112233" },
        font: { family: "Other" },
        stroke: { width: 3 },
        spacing: {},
      },
    });
  });

  it("accepts an empty override", () => {
    const result = validateThemeOverrides({}, "theme", fonts);
    expect(result).toEqual({ ok: true, value: { colors: {}, font: {}, stroke: {}, spacing: {} } });
  });

  it("refuses a color that is not #RRGGBB", () => {
    expect(errorsOf({ colors: { text: "url(#x)" } })).toEqual([
      { code: "invalid_color", path: "theme.colors.text" },
    ]);
  });

  it("refuses a font that is not registered, such as a URL", () => {
    expect(errorsOf({ font: { family: "https://evil.example/x.ttf" } })).toEqual([
      { code: "unknown_font", path: "theme.font.family" },
    ]);
  });

  it("refuses a non-numeric value", () => {
    expect(errorsOf({ font: { size: "16" } })).toEqual([
      { code: "invalid_type", path: "theme.font.size" },
    ]);
    expect(errorsOf({ spacing: { node: Number.NaN } })).toEqual([
      { code: "invalid_type", path: "theme.spacing.node" },
    ]);
  });

  it("refuses a number out of range on either side", () => {
    expect(errorsOf({ stroke: { width: 99 } })).toEqual([
      { code: "invalid_value", path: "theme.stroke.width" },
    ]);
    expect(errorsOf({ spacing: { padding: -1 } })).toEqual([
      { code: "invalid_value", path: "theme.spacing.padding" },
    ]);
  });

  it("refuses an undeclared field at each level", () => {
    expect(errorsOf({ colors: { glow: "#000000" } })).toEqual([
      { code: "unknown_field", path: "theme.colors.glow" },
    ]);
    expect(errorsOf({ fonts: {} })).toEqual([{ code: "unknown_field", path: "theme.fonts" }]);
  });

  it("refuses a group that is not an object", () => {
    expect(errorsOf({ colors: 1 })).toEqual([{ code: "invalid_type", path: "theme.colors" }]);
    expect(errorsOf(1)).toEqual([{ code: "invalid_type", path: "theme" }]);
  });
});
