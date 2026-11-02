import { existsSync, readdirSync, writeFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { createNodeRenderWorkspace } from "./create-node-render-workspace";

describe("createNodeRenderWorkspace", () => {
  it("creates a private temporary directory with an empty resources folder", async () => {
    const workspace = createNodeRenderWorkspace();
    const dirs = await workspace.open();
    expect(readdirSync(dirs.resources)).toEqual([]);
    expect(existsSync(dirs.frames)).toBe(true);
    await workspace.writeText(`${dirs.frames}/000.svg`, "<svg/>");
    expect(readdirSync(dirs.frames)).toEqual(["000.svg"]);
    await workspace.remove(dirs.root);
    expect(existsSync(dirs.root)).toBe(false);
  });

  it("reads bytes up to a limit without loading a larger file", async () => {
    const workspace = createNodeRenderWorkspace();
    const dirs = await workspace.open();
    const path = `${dirs.root}/a.bin`;
    writeFileSync(path, new Uint8Array([1, 2, 3]));
    expect(await workspace.readBytes(path, 3)).toEqual(new Uint8Array([1, 2, 3]));
    expect(await workspace.readBytes(path, 2)).toBe("too_large");
    expect(await workspace.readBytes(`${dirs.root}/none`, 2)).toBe("missing");
    await workspace.remove(dirs.root);
  });
});
