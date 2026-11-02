import { fail } from "../../shared/fail";
import { ok } from "../../shared/ok";
import type { Result } from "../../shared/result";
import { diagramLimits } from "../data/diagram-limits";

// Cc control, Cf format (bidi overrides included), Cs lone surrogates, Zl and Zp line breaks.
const CONTROL_CHARACTERS = /[\p{Cc}\p{Cf}\p{Cs}\p{Zl}\p{Zp}]/u;

export function validateText(value: unknown, path: string): Result<string> {
  if (typeof value !== "string") {
    return fail([{ code: "invalid_type", path }]);
  }
  if (value === "") {
    return fail([{ code: "invalid_value", path }]);
  }
  if (CONTROL_CHARACTERS.test(value)) {
    return fail([{ code: "control_character", path }]);
  }
  const normalized = value.normalize("NFC");
  if (Array.from(normalized).length > diagramLimits.textLength) {
    return fail([{ code: "limit_exceeded", path }]);
  }
  return ok(normalized);
}
