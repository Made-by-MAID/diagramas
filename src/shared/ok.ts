import type { Result } from "./result";

export function ok<T>(value: T): Result<T> {
  return { ok: true, value };
}
