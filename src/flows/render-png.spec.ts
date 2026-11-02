import { describe, expect, it } from "vitest";
import { validPng } from "../../test/fixtures/build-png";
import { createMemoryProcessRunner } from "../render/actions/create-memory-process-runner";
import { createMemoryRenderWorkspace } from "../render/actions/create-memory-render-workspace";
import type { ProcessOutcome } from "../render/data/render-ports";
import { renderPng } from "./render-png";

const size = { width: 10, height: 10 };

function setup(output: Uint8Array | null, outcome: ProcessOutcome = "exited") {
  const workspace = createMemoryRenderWorkspace();
  const runner = createMemoryProcessRunner((request) => {
    if (output !== null) {
      workspace.putBytes(request.args[request.args.length - 1] as string, output);
    }
    return outcome;
  });
  return { workspace, runner, fontsDir: "/fonts" };
}

describe("renderPng", () => {
  it("writes the SVG, calls resvg once and returns the validated bytes", async () => {
    const deps = setup(validPng());
    const result = await renderPng("<svg/>", size, deps);
    expect(result).toEqual({ ok: true, value: validPng() });
    expect(deps.runner.calls.length).toBe(1);
    expect(deps.runner.calls[0]?.binary).toBe("resvg");
    expect(deps.workspace.texts.get("/memory/diagram.svg")).toBe("<svg/>");
    expect(deps.workspace.removed).toEqual(["/memory"]);
  });

  it("maps a process failure and a timeout to fixed codes and still cleans up", async () => {
    const failed = setup(validPng(), "failed");
    expect(await renderPng("<svg/>", size, failed)).toEqual({
      ok: false,
      errors: [{ code: "render_failed", path: "$" }],
    });
    expect(failed.workspace.removed).toEqual(["/memory"]);
    expect(await renderPng("<svg/>", size, setup(validPng(), "timeout"))).toEqual({
      ok: false,
      errors: [{ code: "render_timeout", path: "$" }],
    });
  });

  it("refuses a missing or malformed output", async () => {
    const failed = { ok: false, errors: [{ code: "render_failed", path: "$" }] };
    expect(await renderPng("<svg/>", size, setup(null))).toEqual(failed);
    expect(await renderPng("<svg/>", size, setup(new Uint8Array(30)))).toEqual(failed);
    expect(await renderPng("<svg/>", { width: 11, height: 10 }, setup(validPng()))).toEqual(failed);
  });

  it("maps an output above the limit to attachment_too_large", async () => {
    const big = new Uint8Array(8 * 1024 * 1024 + 1);
    expect(await renderPng("<svg/>", size, setup(big))).toEqual({
      ok: false,
      errors: [{ code: "attachment_too_large", path: "$" }],
    });
  });

  it("cleans up and returns a fixed code when an action throws", async () => {
    const deps = setup(validPng());
    const runner = {
      run() {
        return Promise.reject(new Error("/secret/path"));
      },
    };
    expect(await renderPng("<svg/>", size, { ...deps, runner })).toEqual({
      ok: false,
      errors: [{ code: "render_failed", path: "$" }],
    });
    expect(deps.workspace.removed).toEqual(["/memory"]);
  });
});
