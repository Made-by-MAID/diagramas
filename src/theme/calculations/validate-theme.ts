import { fail } from "../../shared/fail";
import { ok } from "../../shared/ok";
import type { Result } from "../../shared/result";
import type { Theme } from "../data/theme";
import { validateThemeOverrides } from "./validate-theme-overrides";

export function validateTheme(theme: Theme, fontFamilies: readonly string[]): Result<Theme> {
  if (theme.name === "") {
    return fail([{ code: "invalid_value", path: "theme.name" }]);
  }
  const { colors, font, stroke, spacing } = theme;
  const checked = validateThemeOverrides({ colors, font, stroke, spacing }, "theme", fontFamilies);
  return checked.ok ? ok(theme) : fail(checked.errors);
}
