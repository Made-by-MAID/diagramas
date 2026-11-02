import { checkFields } from "../../shared/check-fields";
import { fail } from "../../shared/fail";
import { ok } from "../../shared/ok";
import type { DiagramError, Result } from "../../shared/result";
import { unwrapInto } from "../../shared/unwrap-into";
import { isHexColor } from "../../theme/calculations/is-hex-color";
import type { DiagramEdge, EdgeStyle } from "../data/diagram";
import { diagramLimits } from "../data/diagram-limits";
import { validateId } from "./validate-id";
import { validateText } from "./validate-text";

const LINES = ["solid", "dashed"];

export function validateEdges(
  value: unknown,
  nodeIds: readonly string[] | null,
): Result<readonly DiagramEdge[]> {
  if (!Array.isArray(value)) {
    return fail([{ code: "invalid_type", path: "edges" }]);
  }
  if (value.length > diagramLimits.edges) {
    return fail([{ code: "limit_exceeded", path: "edges" }]);
  }
  const errors: DiagramError[] = [];
  const edges: DiagramEdge[] = [];
  const seen = new Set<string>();
  value.forEach((item: unknown, index) => {
    const path = `edges[${index}]`;
    const { record, errors: fieldErrors } = checkFields(
      item,
      path,
      ["id", "from", "to", "label", "style"],
      ["id", "from", "to"],
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
    const from = validateEndpoint(record.from, `${path}.from`, nodeIds, errors);
    const to = validateEndpoint(record.to, `${path}.to`, nodeIds, errors);
    const style = validateStyle(record.style, `${path}.style`, errors);
    if (record.label === undefined) {
      edges.push({ id, from, to, style });
    } else {
      const label = unwrapInto(validateText(record.label, `${path}.label`), errors, "");
      edges.push({ id, from, to, label, style });
    }
  });
  return errors.length > 0 ? fail(errors) : ok(edges);
}

function validateEndpoint(
  value: unknown,
  path: string,
  nodeIds: readonly string[] | null,
  errors: DiagramError[],
): string {
  const id = validateId(value, path);
  if (!id.ok) {
    errors.push(...id.errors);
    return "";
  }
  if (nodeIds !== null && !nodeIds.includes(id.value)) {
    errors.push({ code: "unknown_reference", path });
  }
  return id.value;
}

function validateStyle(value: unknown, path: string, errors: DiagramError[]): EdgeStyle {
  if (value === undefined) {
    return {};
  }
  const { record, errors: fieldErrors } = checkFields(value, path, ["color", "line"], []);
  errors.push(...fieldErrors);
  if (record === null || fieldErrors.length > 0) {
    return {};
  }
  if (Object.hasOwn(record, "color") && !isHexColor(record.color)) {
    errors.push({ code: "invalid_color", path: `${path}.color` });
  }
  if (Object.hasOwn(record, "line") && !LINES.includes(record.line as string)) {
    errors.push({ code: "invalid_value", path: `${path}.line` });
  }
  return record as EdgeStyle;
}
