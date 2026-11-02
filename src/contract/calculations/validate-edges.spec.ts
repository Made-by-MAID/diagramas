import { describe, expect, it } from "vitest";
import { validateEdges } from "./validate-edges";

const nodeIds = ["a", "b"];

function edge(id: string, extra: object = {}) {
  return { id, from: "a", to: "b", ...extra };
}

function errorsOf(value: unknown, ids: readonly string[] | null = nodeIds) {
  const result = validateEdges(value, ids);
  return result.ok ? [] : result.errors;
}

describe("validateEdges", () => {
  it("accepts an edge with a label and a style, and allows an empty list", () => {
    const result = validateEdges(
      [edge("e", { label: "yes", style: { color: "#000000", line: "dashed" } }), edge("f")],
      nodeIds,
    );
    expect(result).toEqual({
      ok: true,
      value: [
        {
          id: "e",
          from: "a",
          to: "b",
          label: "yes",
          style: { color: "#000000", line: "dashed" },
        },
        { id: "f", from: "a", to: "b", style: {} },
      ],
    });
    expect(validateEdges([], nodeIds)).toEqual({ ok: true, value: [] });
  });

  it("refuses a value that is not a list and an item that is not an object", () => {
    expect(errorsOf({})).toEqual([{ code: "invalid_type", path: "edges" }]);
    expect(errorsOf([1])).toEqual([{ code: "invalid_type", path: "edges[0]" }]);
  });

  it("refuses more than 400 edges", () => {
    const edges = Array.from({ length: 401 }, (_, index) => edge(`e${index}`));
    expect(errorsOf(edges)).toEqual([{ code: "limit_exceeded", path: "edges" }]);
  });

  it("reports an edge to a missing node with the field path", () => {
    const edges = [edge("e0"), edge("e1"), edge("e2"), edge("e3", { to: "ghost" })];
    expect(errorsOf(edges)).toEqual([{ code: "unknown_reference", path: "edges[3].to" }]);
    expect(errorsOf([edge("e", { from: "ghost" })])).toEqual([
      { code: "unknown_reference", path: "edges[0].from" },
    ]);
  });

  it("skips reference checks when the node list itself was invalid", () => {
    expect(errorsOf([edge("e", { to: "ghost" })], null)).toEqual([]);
  });

  it("refuses a duplicate id, an undeclared field and a bad style", () => {
    expect(errorsOf([edge("e"), edge("e")])).toEqual([
      { code: "duplicate_id", path: "edges[1].id" },
    ]);
    expect(errorsOf([edge("e", { weight: 1 })])).toEqual([
      { code: "unknown_field", path: "edges[0].weight" },
    ]);
    expect(errorsOf([edge("e", { style: { color: "red", line: "wavy" } })])).toEqual([
      { code: "invalid_color", path: "edges[0].style.color" },
      { code: "invalid_value", path: "edges[0].style.line" },
    ]);
    expect(errorsOf([edge("e", { style: { glow: 1 } })])).toEqual([
      { code: "unknown_field", path: "edges[0].style.glow" },
    ]);
  });

  it("refuses a bad label and a bad endpoint", () => {
    expect(errorsOf([edge("e", { label: "<\u0007>" })])).toEqual([
      { code: "control_character", path: "edges[0].label" },
    ]);
    expect(errorsOf([edge("e", { to: 3 })])).toEqual([
      { code: "invalid_type", path: "edges[0].to" },
    ]);
  });
});
