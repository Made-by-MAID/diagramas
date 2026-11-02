import { describe, expect, it } from "vitest";
import { formatNumber } from "./format-number";

describe("formatNumber", () => {
  it("uses a fixed precision", () => {
    expect(formatNumber(1)).toBe("1.00");
    expect(formatNumber(1.005)).toBe("1.00");
    expect(formatNumber(2 / 3)).toBe("0.67");
  });

  it("never writes a negative zero", () => {
    expect(formatNumber(-0)).toBe("0.00");
    expect(formatNumber(-0.001)).toBe("0.00");
    expect(formatNumber(-1.5)).toBe("-1.50");
  });

  it.each([Number.NaN, Number.POSITIVE_INFINITY])("refuses %s", (value) => {
    expect(() => formatNumber(value)).toThrow(RangeError);
  });
});
