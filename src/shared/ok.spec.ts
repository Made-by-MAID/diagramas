import { describe, expect, it } from "vitest";
import { ok } from "./ok";

describe("ok", () => {
  it("wraps a value as a success", () => {
    expect(ok(3)).toEqual({ ok: true, value: 3 });
  });
});
