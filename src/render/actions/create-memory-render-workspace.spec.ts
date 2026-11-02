import { describe, expect, it } from "vitest";
import { createMemoryRenderWorkspace } from "./create-memory-render-workspace";

describe("createMemoryRenderWorkspace", () => {
  it("opens directories, stores and reads files, and removes them", async () => {
    const workspace = createMemoryRenderWorkspace();
    const dirs = await workspace.open();
    expect(dirs).toEqual({ root: "/memory", frames: "/memory/frames", resources: "/memory/empty" });
    await workspace.writeText("/memory/a.svg", "<svg/>");
    expect(workspace.texts.get("/memory/a.svg")).toBe("<svg/>");
    workspace.putBytes("/memory/a.png", new Uint8Array(3));
    expect(await workspace.readBytes("/memory/a.png", 3)).toEqual(new Uint8Array(3));
    expect(await workspace.readBytes("/memory/a.png", 2)).toBe("too_large");
    expect(await workspace.readBytes("/memory/b.png", 2)).toBe("missing");
    await workspace.remove("/memory");
    expect(workspace.removed).toEqual(["/memory"]);
  });
});
