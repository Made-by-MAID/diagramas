import { checkFields } from "../../shared/check-fields";
import { fail } from "../../shared/fail";
import { ok } from "../../shared/ok";
import type { DiagramError, Result } from "../../shared/result";
import type { ThemeOverrides } from "../data/theme";
import { themeBounds } from "../data/theme-bounds";
import { isHexColor } from "./is-hex-color";

const COLOR_FIELDS = ["background", "nodeFill", "nodeStroke", "text", "edge", "accent"];

type Range = { readonly min: number; readonly max: number };

export function validateThemeOverrides(
  value: unknown,
  path: string,
  fontFamilies: readonly string[],
): Result<ThemeOverrides> {
  const { record, errors: rootErrors } = checkFields(
    value,
    path,
    ["colors", "font", "stroke", "spacing"],
    [],
  );
  const errors = [...rootErrors];
  if (record === null) {
    return fail(errors);
  }
  const colors = checkGroup(record.colors, `${path}.colors`, COLOR_FIELDS, errors);
  const font = checkGroup(record.font, `${path}.font`, ["family", "size", "titleSize"], errors);
  const stroke = checkGroup(record.stroke, `${path}.stroke`, ["width", "cornerRadius"], errors);
  const spacing = checkGroup(
    record.spacing,
    `${path}.spacing`,
    ["node", "layer", "padding"],
    errors,
  );

  for (const [field, color] of Object.entries(colors)) {
    if (COLOR_FIELDS.includes(field) && !isHexColor(color)) {
      errors.push({ code: "invalid_color", path: `${path}.colors.${field}` });
    }
  }
  if (Object.hasOwn(font, "family") && !fontFamilies.includes(font.family as string)) {
    errors.push({ code: "unknown_font", path: `${path}.font.family` });
  }
  checkNumbers(font, themeBounds.font, `${path}.font`, errors);
  checkNumbers(stroke, themeBounds.stroke, `${path}.stroke`, errors);
  checkNumbers(spacing, themeBounds.spacing, `${path}.spacing`, errors);

  if (errors.length > 0) {
    return fail(errors);
  }
  return ok({ colors, font, stroke, spacing } as ThemeOverrides);
}

function checkGroup(
  value: unknown,
  path: string,
  allowed: readonly string[],
  errors: DiagramError[],
): Readonly<Record<string, unknown>> {
  if (value === undefined) {
    return {};
  }
  const checked = checkFields(value, path, allowed, []);
  errors.push(...checked.errors);
  return checked.record ?? {};
}

function checkNumbers(
  group: Readonly<Record<string, unknown>>,
  bounds: Readonly<Record<string, Range>>,
  path: string,
  errors: DiagramError[],
): void {
  for (const [field, range] of Object.entries(bounds)) {
    if (!Object.hasOwn(group, field)) {
      continue;
    }
    const value = group[field];
    if (typeof value !== "number" || !Number.isFinite(value)) {
      errors.push({ code: "invalid_type", path: `${path}.${field}` });
    } else if (value < range.min || value > range.max) {
      errors.push({ code: "invalid_value", path: `${path}.${field}` });
    }
  }
}
