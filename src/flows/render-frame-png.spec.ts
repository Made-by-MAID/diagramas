import { describe, expect, it } from "vitest";
import { validPng } from "../../test/fixtures/build-png";
import { createMemoryProcessRunner } from "../render/actions/create-memory-process-runner";
import { createMemoryRenderWorkspace } from "../render/actions/create-memory-render-workspace";
import { renderFramePng } from "./render-frame-png";

const paths = { svgPath: "/memory/0.svg", pngPath: "/memory/0.png", resourcesDir: "/memory/empty" };

describe("renderFramePng", () => {
  it("writes the SVG, runs resvg with a timeout and validates the bytes", async () => {
    const workspace = createMemoryRenderWorkspace();
    const runner = createMemoryProcessRunner(() => {
      workspace.putBytes(paths.pngPath, validPng());
      return "exited";
    });
    const result = await renderFramePng(
      "<svg/>",
      paths,
      { width: 10, height: 10 },
      { workspace, runner, fontsDir: "/fonts" },
    );
    expect(result.ok).toBe(true);
    expect(workspace.texts.get(paths.svgPath)).toBe("<svg/>");
    expect(runner.calls[0]?.timeoutMs).toBeGreaterThan(0);
    expect(runner.calls[0]?.args).toContain("/fonts");
  });

  it("returns the fixed code of a process failure", async () => {
    const result = await renderFramePng(
      "<svg/>",
      paths,
      { width: 10, height: 10 },
      {
        workspace: createMemoryRenderWorkspace(),
        runner: createMemoryProcessRunner(() => "timeout"),
        fontsDir: "/fonts",
      },
    );
    expect(result).toEqual({ ok: false, errors: [{ code: "render_timeout", path: "$" }] });
  });
});
