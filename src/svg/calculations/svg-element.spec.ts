import { describe, expect, it } from "vitest";
import { svgElement } from "./svg-element";

describe("svgElement", () => {
  it("builds a typed element", () => {
    expect(svgElement("rect", { x: 1 })).toEqual({ tag: "rect", attrs: { x: 1 }, children: [] });
    expect(svgElement("text", {}, ["a"])).toEqual({ tag: "text", attrs: {}, children: ["a"] });
  });
});
