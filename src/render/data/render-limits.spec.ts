import { describe, expect, it } from "vitest";
import { renderLimits } from "./render-limits";

describe("renderLimits", () => {
  it("declares timeouts and output sizes as constants", () => {
    expect(renderLimits.resvgTimeoutMs).toBeGreaterThan(0);
    expect(renderLimits.ffmpegTimeoutMs).toBeGreaterThan(renderLimits.resvgTimeoutMs);
    expect(renderLimits.pngBytes).toBe(8 * 1024 * 1024);
    expect(renderLimits.gifBytes).toBe(10_000_000);
  });
});
