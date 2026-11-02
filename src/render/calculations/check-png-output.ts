import { validatePng } from "../../output-validation/calculations/validate-png";
import type { ExpectedSize } from "../../output-validation/data/output-check";
import { fail } from "../../shared/fail";
import { ok } from "../../shared/ok";
import type { Result } from "../../shared/result";
import type { ReadOutcome } from "../data/render-ports";

export function checkPngOutput(output: ReadOutcome, size: ExpectedSize): Result<Uint8Array> {
  if (output === "too_large") {
    return fail([{ code: "attachment_too_large", path: "$" }]);
  }
  if (output === "missing") {
    return fail([{ code: "render_failed", path: "$" }]);
  }
  const check = validatePng(output, size);
  if (check.ok) {
    return ok(output);
  }
  const code = check.rule === "png_too_large" ? "attachment_too_large" : "render_failed";
  return fail([{ code, path: "$" }]);
}
