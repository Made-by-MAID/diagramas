import { describe, expect, it } from "vitest";
import { createMemoryRenderWorkspace } from "../render/actions/create-memory-render-workspace";
import { ok } from "../shared/ok";
import { withRenderWorkspace } from "./with-render-workspace";

const failed = { ok: false, errors: [{ code: "render_failed", path: "$" }] };

describe("withRenderWorkspace", () => {
  it("runs the work and removes the workspace", async () => {
    const workspace = createMemoryRenderWorkspace();
    expect(await withRenderWorkspace(workspace, async (dirs) => ok(dirs.root))).toEqual(
      ok("/memory"),
    );
    expect(workspace.removed).toEqual(["/memory"]);
  });

  it("hides a throw behind a fixed code and still removes the workspace", async () => {
    const workspace = createMemoryRenderWorkspace();
    const result = await withRenderWorkspace(workspace, () =>
      Promise.reject(new Error("/secret/path")),
    );
    expect(result).toEqual(failed);
    expect(workspace.removed).toEqual(["/memory"]);
  });

  it("returns a fixed code when the workspace cannot open", async () => {
    const workspace = {
      ...createMemoryRenderWorkspace(),
      open: () => Promise.reject(new Error("/secret/path")),
    };
    expect(await withRenderWorkspace(workspace, async () => ok(1))).toEqual(failed);
  });
});
