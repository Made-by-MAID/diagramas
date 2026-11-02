import { describe, expect, it } from "vitest";
import { personalTheme } from "../data/personal-theme";
import { validateTheme } from "./validate-theme";

describe("validateTheme", () => {
  it("accepts the personal theme", () => {
    expect(validateTheme(personalTheme, ["Zilla Slab"])).toEqual({
      ok: true,
      value: personalTheme,
    });
  });

  it("refuses a theme with a font outside the registry", () => {
    expect(validateTheme(personalTheme, [])).toEqual({
      ok: false,
      errors: [{ code: "unknown_font", path: "theme.font.family" }],
    });
  });

  it("refuses a theme without a name", () => {
    expect(validateTheme({ ...personalTheme, name: "" }, ["Zilla Slab"])).toEqual({
      ok: false,
      errors: [{ code: "invalid_value", path: "theme.name" }],
    });
  });
});
