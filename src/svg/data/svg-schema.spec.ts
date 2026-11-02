import { describe, expect, it } from "vitest";
import { allowedSvgAttributes, allowedSvgTags } from "./svg-schema";

describe("svg schema", () => {
  it("does not allow dangerous elements", () => {
    for (const tag of ["script", "foreignObject", "style", "use", "filter", "image", "a"]) {
      expect(allowedSvgTags).not.toContain(tag);
    }
  });

  it("does not allow references, styles or handlers", () => {
    for (const attribute of ["href", "xlink:href", "style", "onload", "class", "src"]) {
      expect(allowedSvgAttributes).not.toContain(attribute);
    }
  });
});
