import { checkFields } from "../../shared/check-fields";
import { fail } from "../../shared/fail";
import { ok } from "../../shared/ok";
import type { DiagramError, Result } from "../../shared/result";
import { unwrapInto } from "../../shared/unwrap-into";
import { isHexColor } from "../../theme/calculations/is-hex-color";
import type { DiagramNode, NodeShape, NodeStyle } from "../data/diagram";
import { diagramLimits } from "../data/diagram-limits";
import { validateId } from "./validate-id";
import { validateText } from "./validate-text";

const SHAPES: readonly string[] = ["process", "terminal", "decision", "io", "data"];
const STYLE_COLORS = ["fill", "stroke", "text"];

export function validateNodes(value: unknown): Result<readonly DiagramNode[]> {
  if (!Array.isArray(value)) {
    return fail([{ code: "invalid_type", path: "nodes" }]);
  }
  if (value.length === 0) {
    return fail([{ code: "empty_list", path: "nodes" }]);
  }
  if (value.length > diagramLimits.nodes) {
    return fail([{ code: "limit_exceeded", path: "nodes" }]);
  }
  const errors: DiagramError[] = [];
  const nodes: DiagramNode[] = [];
  const seen = new Set<string>();
  value.forEach((item: unknown, index) => {
    const path = `nodes[${index}]`;
    const { record, errors: fieldErrors } = checkFields(
      item,
      path,
      ["id", "label", "shape", "style"],
      ["id", "label", "shape"],
    );
    errors.push(...fieldErrors);
    if (record === null || fieldErrors.length > 0) {
      return;
    }
    const id = unwrapInto(validateId(record.id, `${path}.id`), errors, "");
    if (seen.has(id)) {
      errors.push({ code: "duplicate_id", path: `${path}.id` });
    }
    seen.add(id);
    const label = unwrapInto(validateText(record.label, `${path}.label`), errors, "");
    if (!SHAPES.includes(record.shape as string)) {
      errors.push({ code: "unknown_shape", path: `${path}.shape` });
    }
    const style = validateStyle(record.style, `${path}.style`, errors);
    nodes.push({ id, label, shape: record.shape as NodeShape, style });
  });
  return errors.length > 0 ? fail(errors) : ok(nodes);
}

function validateStyle(value: unknown, path: string, errors: DiagramError[]): NodeStyle {
  if (value === undefined) {
    return {};
  }
  const { record, errors: fieldErrors } = checkFields(value, path, STYLE_COLORS, []);
  errors.push(...fieldErrors);
  if (record === null || fieldErrors.length > 0) {
    return {};
  }
  for (const [field, color] of Object.entries(record)) {
    if (!isHexColor(color)) {
      errors.push({ code: "invalid_color", path: `${path}.${field}` });
    }
  }
  return record as NodeStyle;
}
