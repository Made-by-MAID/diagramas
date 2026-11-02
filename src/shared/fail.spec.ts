import { describe, expect, it } from "vitest";
import { fail } from "./fail";

describe("fail", () => {
  it("wraps errors as a failure", () => {
    const errors = [{ code: "invalid_type" as const, path: "a" }];
    expect(fail(errors)).toEqual({ ok: false, errors });
  });
});
