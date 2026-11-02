import { describe, expect, it } from "vitest";
import { validateDiagram } from "./validate-diagram";

const context = { themeNames: ["personal"], fontFamilies: ["Zilla Slab"] };

function diagram(extra: object = {}) {
  return {
    version: 1,
    type: "flowchart",
    title: "Title",
    direction: "down",
    nodes: [
      { id: "a", label: "A", shape: "process" },
      { id: "b", label: "B", shape: "terminal" },
    ],
    edges: [{ id: "e", from: "a", to: "b" }],
    ...extra,
  };
}

function errorsOf(value: unknown) {
  const result = validateDiagram(value, context);
  return result.ok ? [] : result.errors;
}

describe("validateDiagram", () => {
  it("accepts a minimal diagram and defaults to the personal theme", () => {
    const result = validateDiagram(diagram(), context);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.title).toBe("Title");
      expect(result.value.direction).toBe("down");
      expect(result.value.theme).toEqual({
        extends: "personal",
        colors: {},
        font: {},
        stroke: {},
        spacing: {},
      });
      expect(result.value.animation).toBeUndefined();
    }
  });

  it("accepts a theme by name and by extends with overrides", () => {
    const byName = validateDiagram(diagram({ theme: "personal", direction: "right" }), context);
    expect(byName.ok && byName.value.theme.extends).toBe("personal");
    const overridden = validateDiagram(
      diagram({ theme: { extends: "personal", colors: { accent: "#112233" } } }),
      context,
    );
    expect(overridden.ok && overridden.value.theme.colors).toEqual({ accent: "#112233" });
  });

  it("refuses an unknown theme name by either form", () => {
    expect(errorsOf(diagram({ theme: "nope" }))).toEqual([
      { code: "unknown_theme", path: "theme" },
    ]);
    expect(errorsOf(diagram({ theme: { extends: "nope" } }))).toEqual([
      { code: "unknown_theme", path: "theme.extends" },
    ]);
  });

  it("refuses a malformed theme", () => {
    expect(errorsOf(diagram({ theme: { extends: "personal", x: 1 } }))).toEqual([
      { code: "unknown_field", path: "theme.x" },
    ]);
    expect(errorsOf(diagram({ theme: { colors: {} } }))).toEqual([
      { code: "missing_field", path: "theme.extends" },
    ]);
    expect(errorsOf(diagram({ theme: { extends: 1 } }))).toEqual([
      { code: "unknown_theme", path: "theme.extends" },
    ]);
    expect(errorsOf(diagram({ theme: 1 }))).toEqual([{ code: "invalid_type", path: "theme" }]);
    expect(errorsOf(diagram({ theme: { extends: "personal", colors: { text: "x" } } }))).toEqual([
      { code: "invalid_color", path: "theme.colors.text" },
    ]);
  });

  it("carries a valid animation", () => {
    const result = validateDiagram(
      diagram({ animation: { durationMs: 1000, nodes: [{ nodeId: "a", effect: "pulse" }] } }),
      context,
    );
    expect(result.ok && result.value.animation?.fps).toBe(20);
  });

  it("refuses an animation that points to a missing edge", () => {
    const animation = { durationMs: 1000, edges: [{ edgeId: "x", effect: "dash" }] };
    expect(errorsOf(diagram({ animation }))).toEqual([
      { code: "unknown_reference", path: "animation.edges[0].edgeId" },
    ]);
  });

  it("reports other errors even when the animation is valid", () => {
    const animation = { durationMs: 1000, nodes: [{ nodeId: "a", effect: "pulse" }] };
    expect(errorsOf(diagram({ animation, title: "" }))).toEqual([
      { code: "invalid_value", path: "title" },
    ]);
  });

  it("does not check animation references when nodes are invalid", () => {
    const animation = { durationMs: 1000, edges: [{ edgeId: "x", effect: "dash" }] };
    expect(errorsOf(diagram({ animation, nodes: [] }))).toEqual([
      { code: "empty_list", path: "nodes" },
    ]);
  });

  it.each([
    [{ version: 2 }, "unknown_version", "version"],
    [{ version: "1" }, "unknown_version", "version"],
    [{ type: "sequence" }, "unknown_type", "type"],
    [{ direction: "up" }, "invalid_value", "direction"],
    [{ title: "" }, "invalid_value", "title"],
    [{ color: "red" }, "unknown_field", "color"],
    [{ nodes: [] }, "empty_list", "nodes"],
  ])("refuses %j", (extra, code, path) => {
    expect(errorsOf(diagram(extra))).toEqual([{ code, path }]);
  });

  it("refuses __proto__ at the root and a non-object root", () => {
    const hostile = JSON.parse('{"__proto__":{"polluted":1},"version":1}');
    expect(errorsOf(hostile)).toEqual(
      expect.arrayContaining([{ code: "forbidden_key", path: "__proto__" }]),
    );
    expect(errorsOf([])).toEqual([{ code: "invalid_type", path: "$" }]);
    expect(({} as Record<string, unknown>).polluted).toBeUndefined();
  });

  it("reports a missing version alone", () => {
    expect(errorsOf({})).toContainEqual({ code: "missing_field", path: "version" });
  });

  it("reports an edge to a missing node", () => {
    const edges = [{ id: "e", from: "a", to: "ghost" }];
    expect(errorsOf(diagram({ edges }))).toEqual([
      { code: "unknown_reference", path: "edges[0].to" },
    ]);
  });
});
