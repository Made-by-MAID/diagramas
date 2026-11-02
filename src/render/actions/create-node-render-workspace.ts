import { mkdir, mkdtemp, readFile, rm, stat, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import type { RenderWorkspace } from "../data/render-ports";

export function createNodeRenderWorkspace(): RenderWorkspace {
  return {
    async open() {
      const root = await mkdtemp(join(tmpdir(), "maid-diagramas-"));
      const frames = join(root, "frames");
      const resources = join(root, "empty");
      await mkdir(frames);
      await mkdir(resources);
      return { root, frames, resources };
    },
    async writeText(path, text) {
      await writeFile(path, text, { encoding: "utf8", flag: "wx", mode: 0o600 });
    },
    async readBytes(path, maxBytes) {
      try {
        const { size } = await stat(path);
        if (size > maxBytes) {
          return "too_large";
        }
        return new Uint8Array(await readFile(path));
      } catch {
        return "missing";
      }
    },
    async remove(root) {
      await rm(root, { recursive: true, force: true });
    },
  };
}
