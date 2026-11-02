import { describe, expect, it } from "vitest";
import { frame, gif, gifHeader, netscapeLoop } from "../../test/fixtures/build-gif";
import { validPng } from "../../test/fixtures/build-png";
import { createMemoryLayoutEngine } from "../layout/actions/create-memory-layout-engine";
import { createMemoryProcessRunner } from "../render/actions/create-memory-process-runner";
import { createMemoryRenderWorkspace } from "../render/actions/create-memory-render-workspace";
import type { Scene } from "../svg/data/scene";
import { createMemoryTextMeasurer } from "../text/actions/create-memory-text-measurer";
import { defaultFontRegistry } from "../theme/data/font-registry";
import { personalTheme } from "../theme/data/personal-theme";
import { prepareDiagram } from "./prepare-diagram";
import { renderDiagram } from "./render-diagram";
import { renderDiagramSvg } from "./render-diagram-svg";

const animation = { durationMs: 200, nodes: [{ nodeId: "a", effect: "pulse" }] };

function input(extra: object = {}): string {
  return JSON.stringify({
    version: 1,
    type: "flowchart",
    title: "T",
    direction: "down",
    nodes: [{ id: "a", label: "A", shape: "process" }],
    edges: [],
    ...extra,
  });
}

const baseDeps = {
  layoutEngine: createMemoryLayoutEngine(),
  textMeasurer: createMemoryTextMeasurer(),
  themes: [personalTheme],
  fontRegistry: defaultFontRegistry,
  fontsDir: "/fonts",
};

async function sizeOf(text: string): Promise<{ width: number; height: number }> {
  const prepared = await prepareDiagram(text, baseDeps);
  const scene = (prepared as { value: { scene: Scene } }).value.scene;
  const svg = renderDiagramSvg(scene);
  return (svg as { value: { size: { width: number; height: number } } }).value.size;
}

function setup(size: { width: number; height: number }, frames = 4, gifOk = true) {
  const workspace = createMemoryRenderWorkspace();
  const body = Array.from({ length: frames }, () => frame(size));
  const gifBytes = gif(gifHeader(size), netscapeLoop(), ...body, [0x3b]);
  const runner = createMemoryProcessRunner((request) => {
    const output = request.binary === "resvg" ? validPng(size.width, size.height) : gifBytes;
    workspace.putBytes(request.args[request.args.length - 1] as string, output);
    return request.binary === "ffmpeg" && !gifOk ? "failed" : "exited";
  });
  return { ...baseDeps, workspace, runner };
}

describe("renderDiagram", () => {
  it("returns only a PNG when there is no animation block", async () => {
    const text = input();
    const deps = setup(await sizeOf(text));
    const result = await renderDiagram(text, deps);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.png.length).toBeGreaterThan(0);
      expect(result.value.gif).toBeNull();
    }
    expect(deps.runner.calls.map((call) => call.binary)).toEqual(["resvg"]);
  });

  it("returns a PNG and a GIF with an animation block", async () => {
    const text = input({ animation });
    const deps = setup(await sizeOf(text));
    const result = await renderDiagram(text, deps);
    expect(result.ok && result.value.gif?.length).toBeGreaterThan(0);
    expect(deps.runner.calls.filter((call) => call.binary === "ffmpeg").length).toBe(1);
  });

  it("returns contract errors before touching any binary", async () => {
    const deps = setup({ width: 1, height: 1 });
    const result = await renderDiagram(input({ nodes: [] }), deps);
    expect(result).toEqual({ ok: false, errors: [{ code: "empty_list", path: "nodes" }] });
    expect(deps.runner.calls).toEqual([]);
  });

  it("propagates a PNG failure", async () => {
    const deps = setup({ width: 1, height: 1 });
    expect(await renderDiagram(input(), deps)).toEqual({
      ok: false,
      errors: [{ code: "render_failed", path: "$" }],
    });
  });

  it("propagates a GIF failure", async () => {
    const text = input({ animation });
    const deps = setup(await sizeOf(text), 4, false);
    expect(await renderDiagram(text, deps)).toEqual({
      ok: false,
      errors: [{ code: "render_failed", path: "$" }],
    });
  });

  it("propagates a size refused by the static SVG and by the frames", async () => {
    const huge = { ...personalTheme, spacing: { ...personalTheme.spacing, padding: 200 } };
    const wide = { ...setup({ width: 1, height: 1 }), themes: [huge] };
    const long = "x".repeat(200);
    const tooWide = input({
      nodes: [{ id: "a", label: long, shape: "process" }],
      title: "x".repeat(200),
    });
    const deps = {
      ...wide,
      textMeasurer: {
        measure() {
          return { ok: true, value: 9000 } as const;
        },
      },
    };
    expect(await renderDiagram(tooWide, deps)).toEqual({
      ok: false,
      errors: [{ code: "limit_exceeded", path: "$" }],
    });
    const framesRefused = {
      ...wide,
      textMeasurer: {
        measure() {
          return { ok: true, value: 3000 } as const;
        },
      },
    };
    const animated = input({ animation });
    const result = await renderDiagram(animated, framesRefused);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.errors[0]?.code).toBe("limit_exceeded");
    }
  });

  it("hides an unexpected throw behind a fixed code", async () => {
    const deps = {
      ...setup({ width: 1, height: 1 }),
      layoutEngine: {
        layout() {
          return Promise.reject(new Error("/secret/path"));
        },
      },
    };
    expect(await renderDiagram(input(), deps)).toEqual({
      ok: false,
      errors: [{ code: "render_failed", path: "$" }],
    });
  });
});
