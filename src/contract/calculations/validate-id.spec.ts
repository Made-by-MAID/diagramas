import { describe, expect, it } from "vitest";
import { validateId } from "./validate-id";

describe("validateId", () => {
  it("accepts a plain id", () => {
    expect(validateId("node_1-a", "p")).toEqual({ ok: true, value: "node_1-a" });
  });

  it.each([
    [1, "invalid_type"],
    ["a b", "invalid_id"],
    ["", "invalid_id"],
    ["<script>", "invalid_id"],
    ["__proto__", "forbidden_key"],
    ["constructor", "forbidden_key"],
    ["a".repeat(65), "limit_exceeded"],
  ])("refuses %j with %s", (value, code) => {
    expect(validateId(value, "p")).toEqual({ ok: false, errors: [{ code, path: "p" }] });
  });
});
