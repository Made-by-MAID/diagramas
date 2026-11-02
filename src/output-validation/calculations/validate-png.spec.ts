import { describe, expect, it } from "vitest";
import { buildPng, ihdr, validPng } from "../../../test/fixtures/build-png";
import { validatePng } from "./validate-png";

const idat = { type: "IDAT", data: [1] };
const iend = { type: "IEND" };

function ruleOf(bytes: Uint8Array, expected = { width: 10, height: 10 }) {
  const result = validatePng(bytes, expected);
  return result.ok ? null : result.rule;
}

describe("validatePng", () => {
  it("accepts a minimal PNG and reports its size", () => {
    expect(validatePng(validPng(), { width: 10, height: 10 })).toEqual({
      ok: true,
      value: { width: 10, height: 10 },
    });
  });

  it("accepts the optional chunks resvg may write", () => {
    const bytes = buildPng([
      ihdr(10, 10),
      { type: "gAMA", data: [0, 0, 0, 0] },
      { type: "sRGB", data: [0] },
      { type: "pHYs", data: [0, 0, 0, 0, 0, 0, 0, 0, 0] },
      { type: "PLTE", data: [0, 0, 0] },
      { type: "tRNS", data: [0] },
      idat,
      idat,
      iend,
    ]);
    expect(ruleOf(bytes)).toBeNull();
  });

  it("refuses a file above 8 MiB before reading it", () => {
    expect(ruleOf(new Uint8Array(8 * 1024 * 1024 + 1))).toBe("png_too_large");
  });

  it("refuses a bad signature, including a short file", () => {
    expect(ruleOf(new Uint8Array(20))).toBe("png_bad_signature");
    expect(ruleOf(validPng().slice(0, 4))).toBe("png_bad_signature");
  });

  it("requires IHDR first with 13 bytes", () => {
    expect(ruleOf(buildPng([idat, iend]))).toBe("png_ihdr_not_first");
    expect(ruleOf(buildPng([{ type: "IHDR", data: [1] }, idat, iend]))).toBe("png_ihdr_not_first");
    expect(ruleOf(buildPng([ihdr(10, 10), ihdr(10, 10), idat, iend]))).toBe("png_repeated_ihdr");
  });

  it("refuses dimensions out of range or different from the requested ones", () => {
    expect(ruleOf(validPng(4097, 10), { width: 4097, height: 10 })).toBe("png_dimensions");
    expect(ruleOf(validPng(10, 4097), { width: 10, height: 4097 })).toBe("png_dimensions");
    expect(ruleOf(validPng(0, 10), { width: 0, height: 10 })).toBe("png_dimensions");
    expect(ruleOf(validPng(10, 0), { width: 10, height: 0 })).toBe("png_dimensions");
    expect(ruleOf(validPng(11, 10))).toBe("png_dimensions");
    expect(ruleOf(validPng(10, 11))).toBe("png_dimensions");
  });

  it("refuses a chunk outside the list", () => {
    const bytes = buildPng([ihdr(10, 10), { type: "tEXt", data: [65] }, idat, iend]);
    expect(ruleOf(bytes)).toBe("png_unknown_chunk");
  });

  it("requires at least one IDAT and an IEND", () => {
    expect(ruleOf(buildPng([ihdr(10, 10), iend]))).toBe("png_missing_idat");
    expect(ruleOf(buildPng([ihdr(10, 10), idat]))).toBe("png_missing_iend");
  });

  it("refuses IEND with data", () => {
    const bytes = buildPng([ihdr(10, 10), idat, { type: "IEND", data: [1] }]);
    expect(ruleOf(bytes)).toBe("png_bad_iend");
  });

  it("refuses anything after IEND", () => {
    const bytes = new Uint8Array([...validPng(), 0]);
    expect(ruleOf(bytes)).toBe("png_trailing_data");
    expect(ruleOf(buildPng([ihdr(10, 10), idat, iend, idat]))).toBe("png_trailing_data");
  });

  it("refuses a chunk that runs past the end of the file", () => {
    const whole = validPng();
    expect(ruleOf(whole.slice(0, whole.length - 3))).toBe("png_truncated");
    expect(ruleOf(whole.slice(0, 10))).toBe("png_truncated");
    expect(ruleOf(whole.slice(0, 8))).toBe("png_truncated");
  });

  it("refuses a chunk with a length that cannot fit", () => {
    const bytes = validPng();
    bytes.set([0xff, 0xff, 0xff, 0xff], 8);
    expect(ruleOf(bytes)).toBe("png_truncated");
  });
});
