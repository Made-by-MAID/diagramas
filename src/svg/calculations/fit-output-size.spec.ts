import { describe, expect, it } from "vitest";
import { fitOutputSize } from "./fit-output-size";

describe("fitOutputSize", () => {
  it("rounds up and keeps a size that fits", () => {
    expect(fitOutputSize(640.2, 480, 1280)).toEqual({
      ok: true,
      value: { width: 641, height: 480 },
    });
  });

  it("scales down to the maximum side", () => {
    expect(fitOutputSize(2000, 1000, 1280)).toEqual({
      ok: true,
      value: { width: 1280, height: 640 },
    });
    expect(fitOutputSize(1000, 2000, 1280)).toEqual({
      ok: true,
      value: { width: 640, height: 1280 },
    });
  });

  it("refuses a scale below one half, where text stops being readable", () => {
    expect(fitOutputSize(2560, 100, 1280).ok).toBe(true);
    expect(fitOutputSize(2561, 100, 1280)).toEqual({
      ok: false,
      errors: [{ code: "limit_exceeded", path: "$" }],
    });
  });
});
