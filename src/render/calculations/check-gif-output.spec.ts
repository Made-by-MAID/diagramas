import { describe, expect, it } from "vitest";
import { validGif } from "../../../test/fixtures/build-gif";
import { checkGifOutput } from "./check-gif-output";

const size = { width: 10, height: 10 };
const failed = { ok: false, errors: [{ code: "render_failed", path: "$" }] };
const tooLarge = { ok: false, errors: [{ code: "attachment_too_large", path: "$" }] };

describe("checkGifOutput", () => {
  it("returns valid bytes", () => {
    expect(checkGifOutput(validGif(), size)).toEqual({ ok: true, value: validGif() });
  });

  it("maps every refusal to a fixed code", () => {
    expect(checkGifOutput("missing", size)).toEqual(failed);
    expect(checkGifOutput("too_large", size)).toEqual(tooLarge);
    expect(checkGifOutput(new Uint8Array(30), size)).toEqual(failed);
    expect(checkGifOutput(new Uint8Array(10_000_001), size)).toEqual(tooLarge);
  });
});
