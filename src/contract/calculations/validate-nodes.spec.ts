import { describe, expect, it } from "vitest";
import { validateNodes } from "./validate-nodes";

function node(id: string, extra: object = {}) {
  return { id, label: "Label", shape: "process", ...extra };
}

function errorsOf(value: unknown) {
  const result = validateNodes(value);
  return result.ok ? [] : result.errors;
}

describe("validateNodes", () => {
  it("accepts every shape and an optional style", () => {
    const result = validateNodes([
      node("a"),
      node("b", { shape: "terminal" }),
      node("c", { shape: "decision" }),
      node("d", { shape: "io" }),
      node("e", { shape: "data", style: { fill: "#000000", stroke: "#111111", text: "#222222" } }),
    ]);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value[0]).toEqual({ id: "a", label: "Label", shape: "process", style: {} });
      expect(result.value[4]?.style).toEqual({
        fill: "#000000",
        stroke: "#111111",
        text: "#222222",
      });
    }
  });

  it("refuses a value that is not a list", () => {
    expect(errorsOf({})).toEqual([{ code: "invalid_type", path: "nodes" }]);
  });

  it("refuses an empty list", () => {
    expect(errorsOf([])).toEqual([{ code: "empty_list", path: "nodes" }]);
  });

  it("refuses more than 200 nodes", () => {
    const nodes = Array.from({ length: 201 }, (_, index) => node(`n${index}`));
    expect(errorsOf(nodes)).toEqual([{ code: "limit_exceeded", path: "nodes" }]);
  });

  it("refuses a duplicate id with the field path", () => {
    expect(errorsOf([node("a"), node("a")])).toEqual([
      { code: "duplicate_id", path: "nodes[1].id" },
    ]);
  });

  it("refuses an unknown shape", () => {
    expect(errorsOf([node("a", { shape: "hexagon" })])).toEqual([
      { code: "unknown_shape", path: "nodes[0].shape" },
    ]);
  });

  it("refuses an undeclared field and __proto__", () => {
    expect(errorsOf([node("a", { x: 1 })])).toEqual([
      { code: "unknown_field", path: "nodes[0].x" },
    ]);
    const hostile = JSON.parse('[{"id":"a","label":"b","shape":"io","__proto__":{"x":1}}]');
    expect(errorsOf(hostile)).toEqual([{ code: "forbidden_key", path: "nodes[0].__proto__" }]);
  });

  it("refuses a missing field and an item that is not an object", () => {
    expect(errorsOf([{ id: "a", shape: "io" }])).toEqual([
      { code: "missing_field", path: "nodes[0].label" },
    ]);
    expect(errorsOf([1])).toEqual([{ code: "invalid_type", path: "nodes[0]" }]);
  });

  it("refuses a bad id, a bad label and a bad style", () => {
    expect(
      errorsOf([{ id: "a b", label: "x\ny", shape: "io", style: { fill: "red", glow: 1 } }]),
    ).toEqual([
      { code: "invalid_id", path: "nodes[0].id" },
      { code: "control_character", path: "nodes[0].label" },
      { code: "unknown_field", path: "nodes[0].style.glow" },
    ]);
    expect(errorsOf([node("a", { style: { fill: "red" } })])).toEqual([
      { code: "invalid_color", path: "nodes[0].style.fill" },
    ]);
  });
});
