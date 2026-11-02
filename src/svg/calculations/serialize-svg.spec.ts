import { describe, expect, it } from "vitest";
import type { SvgElement } from "../data/svg-schema";
import { serializeSvg } from "./serialize-svg";
import { svgElement } from "./svg-element";

const unsafe = { ok: false, errors: [{ code: "unsafe_svg", path: "$" }] };

describe("serializeSvg", () => {
  it("writes elements, attributes in order and fixed-precision numbers", () => {
    const node = svgElement("g", { "data-node-id": "a" }, [
      svgElement("rect", { x: 1, y: 2.345, fill: "#000000" }),
    ]);
    expect(serializeSvg(node)).toEqual({
      ok: true,
      value: '<g data-node-id="a"><rect x="1.00" y="2.35" fill="#000000"/></g>',
    });
  });

  it("writes text only as an escaped text node", () => {
    const hostile = `<script>alert("x")</script><foreignObject><image href='y'/>`;
    const result = serializeSvg(svgElement("text", {}, [hostile]));
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value).not.toContain("<script");
      expect(result.value).not.toContain("<foreignObject");
      expect(result.value).not.toContain("<image");
      expect(result.value).toContain("&lt;script&gt;");
    }
  });

  it("escapes attribute values", () => {
    const result = serializeSvg(svgElement("g", { "data-node-id": `"><script>` }));
    expect(result).toEqual({ ok: true, value: '<g data-node-id="&quot;&gt;&lt;script&gt;"/>' });
  });

  it("refuses a tag outside the list even when types are bypassed", () => {
    for (const tag of ["script", "foreignObject", "style", "use", "filter", "image"]) {
      const forged = { tag, attrs: {}, children: [] } as unknown as SvgElement;
      expect(serializeSvg(forged)).toEqual(unsafe);
      expect(serializeSvg(svgElement("g", {}, [forged]))).toEqual(unsafe);
    }
  });

  it("refuses an attribute outside the list even when types are bypassed", () => {
    for (const attr of ["href", "xlink:href", "style", "onload"]) {
      const forged = { tag: "g", attrs: { [attr]: "x" }, children: [] } as unknown as SvgElement;
      expect(serializeSvg(forged)).toEqual(unsafe);
    }
  });

  it.each(["url(#a)", "URL(http://x)", "javascript:alert(1)"])("refuses the value %s", (value) => {
    expect(serializeSvg(svgElement("rect", { fill: value }))).toEqual(unsafe);
  });

  it("refuses a number that is not finite", () => {
    expect(serializeSvg(svgElement("rect", { x: Number.NaN }))).toEqual(unsafe);
  });

  it.each(["a\u0000b", "a\u0007b", "a\u001fb", "a\u007fb"])(
    "refuses control characters in text %j",
    (text) => {
      expect(serializeSvg(svgElement("text", {}, [text]))).toEqual(unsafe);
    },
  );

  it("refuses control characters in an attribute", () => {
    expect(serializeSvg(svgElement("g", { "data-node-id": "a\u0001" }))).toEqual(unsafe);
  });

  it("is deterministic", () => {
    const node = svgElement("g", {}, [svgElement("circle", { cx: 1 / 3, cy: 2 / 3, r: 1 })]);
    expect(serializeSvg(node)).toEqual(serializeSvg(node));
  });
});
