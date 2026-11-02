// Measurement prototype, outside the core: renders 80 frames of two fixtures with the real
// binaries and writes docs/prototype.md. Without the binaries, it writes that nothing was measured.
import { spawnSync } from "node:child_process";
import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  statSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { inflateSync } from "node:zlib";
import { prepareDiagram } from "../src/flows/prepare-diagram";
import { renderDiagramFrames } from "../src/flows/render-diagram-frames";
import { createRenderDeps } from "../src/main/create-render-deps";
import { buildFfmpegArgs } from "../src/render/calculations/build-ffmpeg-args";
import { buildResvgArgs } from "../src/render/calculations/build-resvg-args";
import { frameFileName } from "../src/render/calculations/frame-file-name";
import { buildCyclicFlowchart } from "../test/fixtures/build-cyclic-flowchart";

const REPORT = "docs/prototype.md";
const OUTPUT_DIR = "out/prototype";
const ACCENTED_SAMPLES = ["São Paulo", "Façade", "Crème brûlée à la carte", "Naïve café"];

function notMeasured(reasons: readonly string[]): string {
  return [
    "# Measurement prototype",
    "",
    "**Not measured.** No number in this report exists, because the prototype could not run in this environment.",
    "",
    "Reason:",
    "",
    ...reasons.map((reason) => `- ${reason}`),
    "",
    "Still to measure: time per frame and in total, GIF size, appearance (aliasing and banding) and measured against rendered width for accented text.",
    "",
    "How to measure, on a machine with `resvg` 0.49 and `ffmpeg` on the PATH and the Zilla Slab TTF fonts in a directory:",
    "",
    "```sh",
    "DIAGRAMS_FONTS_DIR=/path/to/fonts bun run prototype",
    "```",
    "",
    "The script rewrites this file with the result.",
    "",
  ].join("\n");
}

function reasonsNotToMeasure(fontsDir: string): readonly string[] {
  const reasons = ["resvg", "ffmpeg"]
    .filter((binary) => Bun.which(binary) === null)
    .map((binary) => `\`${binary}\` is not on the PATH of this environment.`);
  if (!existsSync(join(fontsDir, "ZillaSlab-Regular.ttf"))) {
    reasons.push(
      "`DIAGRAMS_FONTS_DIR` does not point to a directory with `ZillaSlab-Regular.ttf` and `ZillaSlab-Bold.ttf`.",
    );
  }
  return reasons;
}

function run(binary: string, args: readonly string[]): void {
  const result = spawnSync(binary, [...args], { stdio: "ignore" });
  if (result.status !== 0) {
    throw new Error(`${binary} failed with status ${result.status}`);
  }
}

// Ink width of an 8-bit RGB or RGBA non-interlaced PNG: first and last column differing from pixel 0.
function inkWidth(png: Uint8Array): number {
  const view = new DataView(png.buffer, png.byteOffset, png.byteLength);
  const width = view.getUint32(16);
  const height = view.getUint32(20);
  const channels = png[25] === 6 ? 4 : 3;
  const idat: Uint8Array[] = [];
  for (let position = 8; position < png.length; ) {
    const length = view.getUint32(position);
    if (String.fromCharCode(...png.subarray(position + 4, position + 8)) === "IDAT") {
      idat.push(png.subarray(position + 8, position + 8 + length));
    }
    position += 12 + length;
  }
  const raw = inflateSync(Buffer.concat(idat));
  const stride = width * channels;
  let previous = new Uint8Array(stride);
  let first = width;
  let last = -1;
  let background: Uint8Array | null = null;
  for (let row = 0; row < height; row += 1) {
    const filter = raw[row * (stride + 1)] as number;
    const line = Uint8Array.from(raw.subarray(row * (stride + 1) + 1, (row + 1) * (stride + 1)));
    for (let index = 0; index < stride; index += 1) {
      const left = index >= channels ? (line[index - channels] as number) : 0;
      const up = previous[index] as number;
      const upLeft = index >= channels ? (previous[index - channels] as number) : 0;
      const estimate = left + up - upLeft;
      const paeth =
        Math.abs(estimate - left) <= Math.abs(estimate - up) &&
        Math.abs(estimate - left) <= Math.abs(estimate - upLeft)
          ? left
          : Math.abs(estimate - up) <= Math.abs(estimate - upLeft)
            ? up
            : upLeft;
      const predictors = [0, left, up, Math.floor((left + up) / 2), paeth];
      line[index] = ((line[index] as number) + (predictors[filter] as number)) & 255;
    }
    background ??= line.slice(0, channels);
    for (let column = 0; column < width; column += 1) {
      const differs = (background as Uint8Array).some(
        (value, channel) => value !== line[column * channels + channel],
      );
      if (differs) {
        first = Math.min(first, column);
        last = Math.max(last, column);
      }
    }
    previous = line;
  }
  return last < first ? 0 : last - first + 1;
}

async function measureFixture(size: number, fontsDir: string, work: string): Promise<string> {
  const deps = createRenderDeps({ fontsDir });
  const prepared = await prepareDiagram(buildCyclicFlowchart(size), deps);
  if (!prepared.ok || prepared.value.diagram.animation === undefined) {
    throw new Error("fixture failed to prepare");
  }
  const frames = renderDiagramFrames(prepared.value.scene, prepared.value.diagram.animation);
  if (!frames.ok) {
    throw new Error("fixture failed to calculate frames");
  }
  const framesDir = join(work, `frames-${size}`);
  const emptyDir = join(work, "empty");
  mkdirSync(framesDir, { recursive: true });
  mkdirSync(emptyDir, { recursive: true });
  const times: number[] = [];
  for (const [index, svg] of frames.value.frames.entries()) {
    const svgPath = join(framesDir, frameFileName(index, "svg"));
    const pngPath = join(framesDir, frameFileName(index, "png"));
    writeFileSync(svgPath, svg);
    const start = performance.now();
    run("resvg", buildResvgArgs({ fontsDir, resourcesDir: emptyDir, svgPath, pngPath }));
    times.push(performance.now() - start);
  }
  mkdirSync(OUTPUT_DIR, { recursive: true });
  const outputPath = join(OUTPUT_DIR, `flow-${size}-nodes.gif`);
  rmSync(outputPath, { force: true });
  const args = buildFfmpegArgs({
    framesDir,
    outputPath,
    fps: frames.value.fps,
    frameCount: frames.value.frames.length,
    loop: frames.value.loop,
  });
  if (!args.ok) {
    throw new Error("frame plan refused");
  }
  const ffmpegStart = performance.now();
  run("ffmpeg", args.value);
  const ffmpegMs = performance.now() - ffmpegStart;
  const resvgTotal = times.reduce((sum, time) => sum + time, 0);
  return [
    `| ${size} | ${frames.value.size.width}x${frames.value.size.height} | ${frames.value.frames.length}`,
    `${(resvgTotal / times.length).toFixed(1)} ms | ${Math.max(...times).toFixed(1)} ms`,
    `${((resvgTotal + ffmpegMs) / 1000).toFixed(2)} s | ${(statSync(outputPath).size / 1024).toFixed(0)} KiB |`,
  ].join(" | ");
}

function measureTextWidth(text: string, fontsDir: string, work: string): string {
  const deps = createRenderDeps({ fontsDir });
  const style = { family: "Zilla Slab", weight: "regular", size: 64 } as const;
  const measured = deps.textMeasurer.measure(text, style, "$");
  if (!measured.ok) {
    throw new Error("sample failed to measure");
  }
  const svgPath = join(work, "sample.svg");
  const pngPath = join(work, "sample.png");
  const emptyDir = join(work, "empty");
  mkdirSync(emptyDir, { recursive: true });
  writeFileSync(
    svgPath,
    `<svg xmlns="http://www.w3.org/2000/svg" width="2400" height="120"><rect width="2400" height="120" fill="#FFFFFF"/><text x="40" y="84" font-family="Zilla Slab" font-size="64" fill="#000000">${text}</text></svg>`,
  );
  run("resvg", buildResvgArgs({ fontsDir, resourcesDir: emptyDir, svgPath, pngPath }));
  const rendered = inkWidth(new Uint8Array(readFileSync(pngPath)));
  const difference = ((rendered - measured.value) / measured.value) * 100;
  return `| ${text} | ${measured.value.toFixed(1)} | ${rendered} | ${difference.toFixed(1)}% |`;
}

const fontsDir = process.env.DIAGRAMS_FONTS_DIR ?? "";
const reasons = reasonsNotToMeasure(fontsDir);
if (reasons.length > 0) {
  writeFileSync(REPORT, notMeasured(reasons));
  process.stdout.write(`not measured: ${reasons.join(" ")}\n`);
} else {
  const work = mkdtempSync(join(tmpdir(), "maid-diagramas-prototype-"));
  const rows = [await measureFixture(20, fontsDir, work), await measureFixture(30, fontsDir, work)];
  const widths = ACCENTED_SAMPLES.map((text) => measureTextWidth(text, fontsDir, work));
  rmSync(work, { recursive: true });
  writeFileSync(
    REPORT,
    [
      "# Measurement prototype",
      "",
      "Generated by `bun run prototype`. Eighty frames, 4 s at 20 frames/s.",
      "",
      "| Nodes | Dimensions | Frames | resvg mean per frame | resvg worst frame | Total | GIF |",
      "| --- | --- | --- | --- | --- | --- | --- |",
      ...rows,
      "",
      "## Measured against rendered width (size 64)",
      "",
      "The rendered width is that of the ink in the image; the measured one is the advance. A difference of a few pixels is expected, because the advance includes the side bearings of the glyphs.",
      "",
      "| Text | Measured (px) | Rendered (px) | Difference |",
      "| --- | --- | --- | --- |",
      ...widths,
      "",
      "## Appearance",
      "",
      `Judge by eye in \`${OUTPUT_DIR}/\`: aliasing on diagonals and color banding. The script does not judge appearance; record here what is seen.`,
      "",
    ].join("\n"),
  );
  process.stdout.write(`measured: see ${REPORT}\n`);
}

// Exit explicitly: under Bun, loading elkjs sets self.onmessage, which keeps the process alive.
process.exit(0);
