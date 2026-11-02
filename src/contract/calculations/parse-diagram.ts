import { fail } from "../../shared/fail";
import type { Result } from "../../shared/result";
import type { Diagram, ValidationContext } from "../data/diagram";
import { diagramLimits } from "../data/diagram-limits";
import { validateDiagram } from "./validate-diagram";

export function parseDiagram(text: string, context: ValidationContext): Result<Diagram> {
  if (text.length > diagramLimits.inputBytes) {
    return fail([{ code: "limit_exceeded", path: "$" }]);
  }
  if (new TextEncoder().encode(text).length > diagramLimits.inputBytes) {
    return fail([{ code: "limit_exceeded", path: "$" }]);
  }
  try {
    return validateDiagram(JSON.parse(text), context);
  } catch {
    return fail([{ code: "invalid_json", path: "$" }]);
  }
}
