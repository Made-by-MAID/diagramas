import { describe, expect, it } from "vitest";
import { validateText } from "./validate-text";

describe("validateText", () => {
  it("returns the text in NFC so that accents have one spelling", () => {
    expect(validateText("a\u0303o", "p")).toEqual({ ok: true, value: "\u00e3o" });
  });

  it("refuses a non-string", () => {
    expect(validateText(1, "p")).toEqual({
      ok: false,
      errors: [{ code: "invalid_type", path: "p" }],
    });
  });

  it("refuses an empty text", () => {
    expect(validateText("", "p")).toEqual({
      ok: false,
      errors: [{ code: "invalid_value", path: "p" }],
    });
  });

  it.each(["a\nb", "a\tb", "a\u0000b", "a\u007fb", "a\u0085b", "a b", "a‮b", "\ud800"])(
    "refuses control characters in %j",
    (text) => {
      expect(validateText(text, "p")).toEqual({
        ok: false,
        errors: [{ code: "control_character", path: "p" }],
      });
    },
  );

  it("counts characters, not UTF-16 units, up to the limit", () => {
    expect(validateText("😀".repeat(200), "p").ok).toBe(true);
    expect(validateText("a".repeat(201), "p")).toEqual({
      ok: false,
      errors: [{ code: "limit_exceeded", path: "p" }],
    });
  });
});
