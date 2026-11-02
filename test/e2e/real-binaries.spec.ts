import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { renderDiagramWithBinaries } from "../../src/main/render-diagram-with-binaries";
import { validateGif } from "../../src/output-validation/calculations/validate-gif";
import { validatePng } from "../../src/output-validation/calculations/validate-png";

const fixture = readFileSync(
  join(import.meta.dirname, "../fixtures/sample-flowchart.json"),
  "utf8",
);
const fontsDir = process.env.DIAGRAMS_FONTS_DIR ?? "";

function missingRequirement(): string | null {
  const missing = ["resvg", "ffmpeg"].filter((binary) => Bun.which(binary) === null);
  if (missing.length > 0) {
    return `binary missing from PATH: ${missing.join(", ")}`;
  }
  if (!existsSync(join(fontsDir, "ZillaSlab-Regular.ttf"))) {
    return "DIAGRAMS_FONTS_DIR does not point to a directory with ZillaSlab-Regular.ttf";
  }
  return null;
}

describe("real binaries", () => {
  it("renders the sample fixture into a validated PNG and GIF", {
    timeout: 300_000,
  }, async (context) => {
    const reason = missingRequirement();
    if (reason !== null) {
      context.skip(reason);
    }
    const result = await renderDiagramWithBinaries(fixture, { fontsDir });
    expect(result.ok).toBe(true);
    if (!result.ok || result.value.gif === null) {
      throw new Error("expected PNG and GIF");
    }
    const view = new DataView(result.value.png.buffer, result.value.png.byteOffset);
    const size = { width: view.getUint32(16), height: view.getUint32(20) };
    expect(validatePng(result.value.png, size).ok).toBe(true);
    const gifView = new DataView(result.value.gif.buffer, result.value.gif.byteOffset);
    const gifSize = { width: gifView.getUint16(6, true), height: gifView.getUint16(8, true) };
    const gif = validateGif(result.value.gif, gifSize);
    expect(gif.ok && gif.value.frames).toBe(80);
  });
});
