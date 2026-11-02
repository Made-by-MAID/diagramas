import type { DiagramError } from "./result";

const FORBIDDEN_KEYS = ["__proto__", "constructor", "prototype"];

export type CheckedFields = {
  readonly record: Readonly<Record<string, unknown>> | null;
  readonly errors: readonly DiagramError[];
};

export function checkFields(
  value: unknown,
  path: string,
  allowed: readonly string[],
  required: readonly string[],
): CheckedFields {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return { record: null, errors: [{ code: "invalid_type", path: path === "" ? "$" : path }] };
  }
  const record = value as Readonly<Record<string, unknown>>;
  const errors: DiagramError[] = [];
  for (const key of Object.keys(record)) {
    if (FORBIDDEN_KEYS.includes(key)) {
      errors.push({ code: "forbidden_key", path: childPath(path, key) });
    } else if (!allowed.includes(key)) {
      errors.push({ code: "unknown_field", path: childPath(path, key) });
    }
  }
  for (const key of required) {
    if (!Object.hasOwn(record, key)) {
      errors.push({ code: "missing_field", path: childPath(path, key) });
    }
  }
  return { record, errors };
}

function childPath(path: string, key: string): string {
  return path === "" ? key : `${path}.${key}`;
}
