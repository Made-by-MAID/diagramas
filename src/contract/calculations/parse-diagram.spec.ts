import { describe, expect, it } from "vitest";
import { parseDiagram } from "./parse-diagram";

const context = { themeNames: ["personal"], fontFamilies: ["Zilla Slab"] };

const minimal = JSON.stringify({
  version: 1,
  type: "flowchart",
  title: "t",
  direction: "down",
  nodes: [{ id: "a", label: "A", shape: "process" }],
  edges: [],
});

describe("parseDiagram", () => {
  it("parses and validates a text", () => {
    expect(parseDiagram(minimal, context).ok).toBe(true);
  });

  it("refuses invalid JSON without echoing it", () => {
    expect(parseDiagram("{nope", context)).toEqual({
      ok: false,
      errors: [{ code: "invalid_json", path: "$" }],
    });
  });

  it("refuses an input above 256 KB, counted in bytes", () => {
    expect(parseDiagram(" ".repeat(256 * 1024 + 1), context)).toEqual({
      ok: false,
      errors: [{ code: "limit_exceeded", path: "$" }],
    });
    expect(parseDiagram("é".repeat(128 * 1024 + 1), context)).toEqual({
      ok: false,
      errors: [{ code: "limit_exceeded", path: "$" }],
    });
  });

  it("refuses __proto__ arriving through JSON", () => {
    const result = parseDiagram('{"version":1,"__proto__":{"x":1}}', context);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.errors).toContainEqual({ code: "forbidden_key", path: "__proto__" });
    }
  });
});
