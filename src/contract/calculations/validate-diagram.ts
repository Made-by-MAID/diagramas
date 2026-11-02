import { checkFields } from "../../shared/check-fields";
import { fail } from "../../shared/fail";
import { ok } from "../../shared/ok";
import type { DiagramError, Result } from "../../shared/result";
import { unwrapInto } from "../../shared/unwrap-into";
import { validateThemeOverrides } from "../../theme/calculations/validate-theme-overrides";
import type { ThemeRef } from "../../theme/data/theme";
import type { Diagram, Direction, ValidationContext } from "../data/diagram";
import { validateAnimation } from "./validate-animation";
import { validateEdges } from "./validate-edges";
import { validateNodes } from "./validate-nodes";
import { validateText } from "./validate-text";

const DEFAULT_THEME = "personal";
const NO_OVERRIDES = { colors: {}, font: {}, stroke: {}, spacing: {} };

export function validateDiagram(value: unknown, context: ValidationContext): Result<Diagram> {
  const { record, errors: fieldErrors } = checkFields(
    value,
    "",
    ["version", "type", "title", "direction", "theme", "nodes", "edges", "animation"],
    ["version", "type", "title", "direction", "nodes", "edges"],
  );
  if (record === null || fieldErrors.length > 0) {
    return fail(fieldErrors);
  }
  if (record.version !== 1) {
    return fail([{ code: "unknown_version", path: "version" }]);
  }
  const errors: DiagramError[] = [];
  if (record.type !== "flowchart") {
    errors.push({ code: "unknown_type", path: "type" });
  }
  const title = unwrapInto(validateText(record.title, "title"), errors, "");
  if (record.direction !== "down" && record.direction !== "right") {
    errors.push({ code: "invalid_value", path: "direction" });
  }
  const theme = validateThemeRef(record.theme, context, errors);
  const nodes = validateNodes(record.nodes);
  const nodeIds = nodes.ok ? nodes.value.map((node) => node.id) : null;
  const edges = validateEdges(record.edges, nodeIds);
  const validNodes = unwrapInto(nodes, errors, []);
  const validEdges = unwrapInto(edges, errors, []);
  const base = {
    version: 1,
    type: "flowchart",
    title,
    direction: record.direction as Direction,
    theme,
    nodes: validNodes,
    edges: validEdges,
  } as const;
  if (record.animation === undefined) {
    return errors.length > 0 ? fail(errors) : ok(base);
  }
  if (nodes.ok && edges.ok) {
    const animation = validateAnimation(record.animation, {
      nodeIds: validNodes.map((node) => node.id),
      edgeIds: validEdges.map((edge) => edge.id),
    });
    if (animation.ok && errors.length === 0) {
      return ok({ ...base, animation: animation.value });
    }
    errors.push(...(animation.ok ? [] : animation.errors));
  }
  return fail(errors);
}

function validateThemeRef(
  value: unknown,
  context: ValidationContext,
  errors: DiagramError[],
): ThemeRef {
  const fallback = { extends: DEFAULT_THEME, ...NO_OVERRIDES };
  if (value === undefined) {
    return fallback;
  }
  if (typeof value === "string") {
    if (!context.themeNames.includes(value)) {
      errors.push({ code: "unknown_theme", path: "theme" });
    }
    return { extends: value, ...NO_OVERRIDES };
  }
  const { record, errors: fieldErrors } = checkFields(
    value,
    "theme",
    ["extends", "colors", "font", "stroke", "spacing"],
    ["extends"],
  );
  errors.push(...fieldErrors);
  if (record === null || fieldErrors.length > 0) {
    return fallback;
  }
  const { extends: base, ...rest } = record;
  if (!context.themeNames.includes(base as string)) {
    errors.push({ code: "unknown_theme", path: "theme.extends" });
  }
  const overrides = unwrapInto(
    validateThemeOverrides(rest, "theme", context.fontFamilies),
    errors,
    NO_OVERRIDES,
  );
  return { extends: base as string, ...overrides };
}
