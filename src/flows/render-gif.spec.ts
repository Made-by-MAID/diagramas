import { describe, expect, it } from "vitest";
import { validGif } from "../../test/fixtures/build-gif";
import { validPng } from "../../test/fixtures/build-png";
import { createMemoryProcessRunner } from "../render/actions/create-memory-process-runner";
import { createMemoryRenderWorkspace } from "../render/actions/create-memory-render-workspace";
import type { ProcessOutcome, ProcessRequest } from "../render/data/render-ports";
import { renderGif } from "./render-gif";

const sequence = {
  size: { width: 10, height: 10 },
  fps: 20,
  loop: true,
  frames: ["<svg>0</svg>", "<svg>1</svg>"],
} as const;

type Setup = {
  readonly png?: Uint8Array | null;
  readonly gif?: Uint8Array | null;
  readonly outcome?: (request: ProcessRequest) => ProcessOutcome;
};

function setup({ png = validPng(), gif = validGif(2), outcome }: Setup = {}) {
  const workspace = createMemoryRenderWorkspace();
  const runner = createMemoryProcessRunner((request) => {
    const output = request.binary === "resvg" ? png : gif;
    if (output !== null) {
      workspace.putBytes(request.args[request.args.length - 1] as string, output);
    }
    return outcome?.(request) ?? "exited";
  });
  return { workspace, runner, fontsDir: "/fonts" };
}

describe("renderGif", () => {
  it("runs one resvg per frame, then one ffmpeg, and returns the validated GIF", async () => {
    const deps = setup();
    const result = await renderGif(sequence, deps);
    expect(result).toEqual({ ok: true, value: validGif(2) });
    expect(deps.runner.calls.map((call) => call.binary)).toEqual(["resvg", "resvg", "ffmpeg"]);
    expect(deps.workspace.texts.get("/memory/frames/000.svg")).toBe("<svg>0</svg>");
    expect(deps.workspace.texts.get("/memory/frames/001.svg")).toBe("<svg>1</svg>");
    expect(deps.runner.calls[2]?.args).toContain("/memory/frames/%03d.png");
    expect(deps.workspace.removed).toEqual(["/memory"]);
  });

  it("never puts SVG text on a command line", async () => {
    const deps = setup();
    await renderGif(sequence, deps);
    for (const call of deps.runner.calls) {
      expect(call.args.join(" ")).not.toContain("<svg");
    }
  });

  it("stops at a failing frame", async () => {
    const deps = setup({ outcome: () => "failed" });
    expect(await renderGif(sequence, deps)).toEqual({
      ok: false,
      errors: [{ code: "render_failed", path: "$" }],
    });
    expect(deps.runner.calls.length).toBe(1);
    expect(deps.workspace.removed).toEqual(["/memory"]);
  });

  it("refuses a frame PNG that is malformed or too large", async () => {
    expect((await renderGif(sequence, setup({ png: new Uint8Array(30) }))).ok).toBe(false);
    expect(await renderGif(sequence, setup({ png: new Uint8Array(8 * 1024 * 1024 + 1) }))).toEqual({
      ok: false,
      errors: [{ code: "attachment_too_large", path: "$" }],
    });
  });

  it("maps an ffmpeg timeout", async () => {
    function outcome(request: ProcessRequest): ProcessOutcome {
      return request.binary === "ffmpeg" ? "timeout" : "exited";
    }
    expect(await renderGif(sequence, setup({ outcome }))).toEqual({
      ok: false,
      errors: [{ code: "render_timeout", path: "$" }],
    });
  });

  it("refuses a missing, malformed or too large GIF", async () => {
    const failed = { ok: false, errors: [{ code: "render_failed", path: "$" }] };
    expect(await renderGif(sequence, setup({ gif: null }))).toEqual(failed);
    expect(await renderGif(sequence, setup({ gif: new Uint8Array(30) }))).toEqual(failed);
    expect(await renderGif(sequence, setup({ gif: new Uint8Array(10_000_001) }))).toEqual({
      ok: false,
      errors: [{ code: "attachment_too_large", path: "$" }],
    });
  });

  it("refuses a frame plan outside the integers", async () => {
    const frames = Array.from({ length: 81 }, () => "<svg/>");
    expect(await renderGif({ ...sequence, frames }, setup())).toEqual({
      ok: false,
      errors: [{ code: "limit_exceeded", path: "$" }],
    });
  });

  it("cleans up and returns a fixed code when an action throws", async () => {
    const deps = setup();
    const runner = {
      run() {
        return Promise.reject(new Error("/secret/path"));
      },
    };
    expect(await renderGif(sequence, { ...deps, runner })).toEqual({
      ok: false,
      errors: [{ code: "render_failed", path: "$" }],
    });
    expect(deps.workspace.removed).toEqual(["/memory"]);
  });
});
