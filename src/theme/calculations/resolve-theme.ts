import { fail } from "../../shared/fail";
import { ok } from "../../shared/ok";
import type { Result } from "../../shared/result";
import type { Theme, ThemeRef } from "../data/theme";

export function resolveTheme(ref: ThemeRef, themes: readonly Theme[]): Result<Theme> {
  const base = themes.find((theme) => theme.name === ref.extends);
  if (base === undefined) {
    return fail([{ code: "unknown_theme", path: "theme.extends" }]);
  }
  return ok({
    name: base.name,
    colors: { ...base.colors, ...ref.colors },
    font: { ...base.font, ...ref.font },
    stroke: { ...base.stroke, ...ref.stroke },
    spacing: { ...base.spacing, ...ref.spacing },
  });
}
