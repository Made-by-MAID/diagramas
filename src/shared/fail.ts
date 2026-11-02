import type { DiagramError, Result } from "./result";

export function fail<T>(errors: readonly DiagramError[]): Result<T> {
  return { ok: false, errors };
}
