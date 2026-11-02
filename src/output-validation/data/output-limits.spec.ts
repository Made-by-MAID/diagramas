import { describe, expect, it } from "vitest";
import { gifLimits, pngLimits } from "./output-limits";

describe("output limits", () => {
  it("states the limits of the PNG", () => {
    expect(pngLimits).toEqual({ fileBytes: 8 * 1024 * 1024, side: 4096 });
  });

  it("states the limits of the GIF", () => {
    expect(gifLimits.fileBytes).toBe(10_000_000);
    expect(gifLimits.totalPixels).toBe(131_000_000);
    expect(gifLimits.frames).toBe(80);
  });
});
