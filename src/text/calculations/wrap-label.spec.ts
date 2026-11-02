import { describe, expect, it } from "vitest";
import { createMemoryTextMeasurer } from "../actions/create-memory-text-measurer";
import { wrapLabel } from "./wrap-label";

const style = { family: "F", weight: "regular", size: 10 } as const;
const measurer = createMemoryTextMeasurer();

describe("wrapLabel", () => {
  it("keeps a short text in one line", () => {
    expect(wrapLabel("abc def", style, 100, measurer, "p")).toEqual({
      ok: true,
      value: { lines: ["abc def"], width: 35 },
    });
  });

  it("breaks at spaces when the line would exceed the width", () => {
    expect(wrapLabel("abc def ghi", style, 40, measurer, "p")).toEqual({
      ok: true,
      value: { lines: ["abc def", "ghi"], width: 35 },
    });
  });

  it("gives a word wider than the limit its own line", () => {
    expect(wrapLabel("a bbbbbbbbbbbbbbbbbbbb c", style, 40, measurer, "p")).toEqual({
      ok: true,
      value: { lines: ["a", "bbbbbbbbbbbbbbbbbbbb", "c"], width: 100 },
    });
  });

  it("returns font_unavailable with the field path", () => {
    const missing = createMemoryTextMeasurer({ missingCharacters: "é" });
    expect(wrapLabel("café with milk", style, 40, missing, "nodes[2].label")).toEqual({
      ok: false,
      errors: [{ code: "font_unavailable", path: "nodes[2].label" }],
    });
    expect(wrapLabel("a fine café", style, 400, missing, "p")).toEqual({
      ok: false,
      errors: [{ code: "font_unavailable", path: "p" }],
    });
  });
});
