import { describe, expect, it } from "vitest";
import { validPng } from "../../../test/fixtures/build-png";
import { checkPngOutput } from "./check-png-output";

const size = { width: 10, height: 10 };
const failed = { ok: false, errors: [{ code: "render_failed", path: "$" }] };
const tooLarge = { ok: false, errors: [{ code: "attachment_too_large", path: "$" }] };

describe("checkPngOutput", () => {
  it("returns valid bytes", () => {
    expect(checkPngOutput(validPng(), size)).toEqual({ ok: true, value: validPng() });
  });

  it("maps every refusal to a fixed code", () => {
    expect(checkPngOutput("missing", size)).toEqual(failed);
    expect(checkPngOutput("too_large", size)).toEqual(tooLarge);
    expect(checkPngOutput(new Uint8Array(30), size)).toEqual(failed);
    expect(checkPngOutput(new Uint8Array(8 * 1024 * 1024 + 1), size)).toEqual(tooLarge);
  });
});
