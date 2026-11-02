import type { DiagramError, Result } from "./result";

export function unwrapInto<T>(result: Result<T>, errors: DiagramError[], fallback: T): T {
  if (result.ok) {
    return result.value;
  }
  errors.push(...result.errors);
  return fallback;
}
