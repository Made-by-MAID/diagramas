import { describe, expect, it } from "vitest";
import { fail } from "./fail";
import { ok } from "./ok";
import type { DiagramError } from "./result";
import { unwrapInto } from "./unwrap-into";

describe("unwrapInto", () => {
  it("returns the value of a success and collects nothing", () => {
    const errors: DiagramError[] = [];
    expect(unwrapInto(ok(1), errors, 0)).toBe(1);
    expect(errors).toEqual([]);
  });

  it("returns the fallback of a failure and collects its errors", () => {
    const errors: DiagramError[] = [];
    const failure = fail<number>([{ code: "invalid_type", path: "a" }]);
    expect(unwrapInto(failure, errors, 0)).toBe(0);
    expect(errors).toEqual([{ code: "invalid_type", path: "a" }]);
  });
});
