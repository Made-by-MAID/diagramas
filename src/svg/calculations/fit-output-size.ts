import { fail } from "../../shared/fail";
import { ok } from "../../shared/ok";
import type { Result } from "../../shared/result";

const MINIMUM_SCALE = 0.5;

export type OutputSize = { readonly width: number; readonly height: number };

export function fitOutputSize(width: number, height: number, maxSide: number): Result<OutputSize> {
  const scale = Math.min(1, maxSide / Math.max(width, height));
  if (scale < MINIMUM_SCALE) {
    return fail([{ code: "limit_exceeded", path: "$" }]);
  }
  return ok({
    width: Math.min(maxSide, Math.ceil(width * scale)),
    height: Math.min(maxSide, Math.ceil(height * scale)),
  });
}
