import { describe, expect, it } from "vitest";
import { escapeXml } from "./escape-xml";

describe("escapeXml", () => {
  it("escapes the five special characters", () => {
    expect(escapeXml(`<a href="x" b='y'>&`)).toBe(
      "&lt;a href=&quot;x&quot; b=&apos;y&apos;&gt;&amp;",
    );
  });

  it("keeps accents as they are", () => {
    expect(escapeXml("café façade")).toBe("café façade");
  });
});
