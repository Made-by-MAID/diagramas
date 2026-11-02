import { describe, expect, it } from "vitest";
import { personalTheme } from "../data/personal-theme";
import { resolveTheme } from "./resolve-theme";

const emptyOverrides = { colors: {}, font: {}, stroke: {}, spacing: {} };

describe("resolveTheme", () => {
  it("picks a theme by name", () => {
    const result = resolveTheme({ extends: "personal", ...emptyOverrides }, [personalTheme]);
    expect(result).toEqual({ ok: true, value: personalTheme });
  });

  it("changes only the overridden field", () => {
    const result = resolveTheme(
      {
        extends: "personal",
        colors: { accent: "#112233" },
        font: { size: 20 },
        stroke: { cornerRadius: 4 },
        spacing: { node: 10 },
      },
      [personalTheme],
    );
    expect(result).toEqual({
      ok: true,
      value: {
        ...personalTheme,
        colors: { ...personalTheme.colors, accent: "#112233" },
        font: { ...personalTheme.font, size: 20 },
        stroke: { ...personalTheme.stroke, cornerRadius: 4 },
        spacing: { ...personalTheme.spacing, node: 10 },
      },
    });
  });

  it("refuses an unknown theme", () => {
    expect(resolveTheme({ extends: "nope", ...emptyOverrides }, [personalTheme])).toEqual({
      ok: false,
      errors: [{ code: "unknown_theme", path: "theme.extends" }],
    });
  });
});
