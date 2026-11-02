import { describe, expect, it } from "vitest";
import { isHexColor } from "./is-hex-color";

describe("isHexColor", () => {
  it("is a guard for the theme colors", () => {
    expect(isHexColor("#F6F1E6")).toBe(true);
  });

  it.each(["#000000", "#F6F1E6", "#abcdef"])("accepts %s", (value) => {
    expect(isHexColor(value)).toBe(true);
  });

  it.each(["#FFF", "red", "url(#a)", "#12345G", "#1234567", 3, null])("refuses %s", (value) => {
    expect(isHexColor(value)).toBe(false);
  });
});
