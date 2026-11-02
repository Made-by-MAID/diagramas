import { describe, expect, it } from "vitest";
import { checkFields } from "./check-fields";

describe("checkFields", () => {
  it("accepts an object with declared fields", () => {
    const result = checkFields({ a: 1 }, "root", ["a", "b"], ["a"]);
    expect(result).toEqual({ record: { a: 1 }, errors: [] });
  });

  it.each([[null], [[]], ["x"], [3]])("refuses a non-object %j", (value) => {
    const result = checkFields(value, "root", [], []);
    expect(result.record).toBeNull();
    expect(result.errors).toEqual([{ code: "invalid_type", path: "root" }]);
  });

  it("names the root as $ when the path is empty", () => {
    expect(checkFields(1, "", [], []).errors[0]?.path).toBe("$");
  });

  it("reports an undeclared field with its path", () => {
    const result = checkFields({ a: 1, z: 2 }, "root", ["a"], []);
    expect(result.errors).toEqual([{ code: "unknown_field", path: "root.z" }]);
  });

  it("reports a missing field with its path", () => {
    const result = checkFields({}, "", ["a"], ["a"]);
    expect(result.errors).toEqual([{ code: "missing_field", path: "a" }]);
  });

  it.each(["__proto__", "constructor", "prototype"])("refuses the key %s", (key) => {
    const value = JSON.parse(`{"${key}": {}}`);
    const result = checkFields(value, "", [key], []);
    expect(result.errors).toEqual([{ code: "forbidden_key", path: key }]);
  });
});
