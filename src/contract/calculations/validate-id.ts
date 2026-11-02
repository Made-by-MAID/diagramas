import { fail } from "../../shared/fail";
import { ok } from "../../shared/ok";
import type { Result } from "../../shared/result";
import { diagramLimits } from "../data/diagram-limits";

const FORBIDDEN_IDS = ["__proto__", "constructor", "prototype"];

export function validateId(value: unknown, path: string): Result<string> {
  if (typeof value !== "string") {
    return fail([{ code: "invalid_type", path }]);
  }
  if (value.length > diagramLimits.idLength) {
    return fail([{ code: "limit_exceeded", path }]);
  }
  if (FORBIDDEN_IDS.includes(value)) {
    return fail([{ code: "forbidden_key", path }]);
  }
  if (!/^[A-Za-z0-9_-]+$/.test(value)) {
    return fail([{ code: "invalid_id", path }]);
  }
  return ok(value);
}
