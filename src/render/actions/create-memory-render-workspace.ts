import type { RenderWorkspace } from "../data/render-ports";

export type MemoryRenderWorkspace = RenderWorkspace & {
  readonly texts: ReadonlyMap<string, string>;
  readonly removed: readonly string[];
  readonly putBytes: (path: string, bytes: Uint8Array) => void;
};

export function createMemoryRenderWorkspace(): MemoryRenderWorkspace {
  const texts = new Map<string, string>();
  const files = new Map<string, Uint8Array>();
  const removed: string[] = [];
  return {
    texts,
    removed,
    putBytes(path, bytes) {
      files.set(path, bytes);
    },
    async open() {
      return { root: "/memory", frames: "/memory/frames", resources: "/memory/empty" };
    },
    async writeText(path, text) {
      texts.set(path, text);
    },
    async readBytes(path, maxBytes) {
      const bytes = files.get(path);
      if (bytes === undefined) {
        return "missing";
      }
      return bytes.length > maxBytes ? "too_large" : bytes;
    },
    async remove(root) {
      removed.push(root);
    },
  };
}
