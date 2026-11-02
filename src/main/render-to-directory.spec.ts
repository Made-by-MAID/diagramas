import { existsSync, mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { renderToDirectory } from "./render-to-directory";

function render(result: Awaited<ReturnType<Parameters<typeof renderToDirectory>[2]>>) {
  return async () => result;
}

describe("renderToDirectory", () => {
  it("writes the PNG and the GIF and returns plain names", async () => {
    const directory = mkdtempSync(join(tmpdir(), "maid-diagramas-spec-"));
    const nested = join(directory, "a", "b");
    const result = await renderToDirectory(
      "{}",
      nested,
      render({
        ok: true,
        value: { png: new Uint8Array([1]), gif: new Uint8Array([2]) },
      }),
    );
    expect(result).toEqual({ ok: true, value: { files: ["diagram.png", "diagram.gif"] } });
    expect(readFileSync(join(nested, "diagram.png"))).toEqual(Buffer.from([1]));
    expect(readFileSync(join(nested, "diagram.gif"))).toEqual(Buffer.from([2]));
    rmSync(directory, { recursive: true });
  });

  it("writes only the PNG when there is no GIF", async () => {
    const directory = mkdtempSync(join(tmpdir(), "maid-diagramas-spec-"));
    const result = await renderToDirectory(
      "{}",
      directory,
      render({ ok: true, value: { png: new Uint8Array([1]), gif: null } }),
    );
    expect(result).toEqual({ ok: true, value: { files: ["diagram.png"] } });
    expect(existsSync(join(directory, "diagram.gif"))).toBe(false);
    rmSync(directory, { recursive: true });
  });

  it("passes errors through and writes nothing", async () => {
    const errors = [{ code: "render_failed", path: "$" }] as const;
    const result = await renderToDirectory(
      "{}",
      "/nonexistent/never",
      render({ ok: false, errors }),
    );
    expect(result).toEqual({ ok: false, errors });
  });

  it("hides a write failure behind a fixed code", async () => {
    const result = await renderToDirectory(
      "{}",
      "/proc/never/created",
      render({ ok: true, value: { png: new Uint8Array([1]), gif: null } }),
    );
    expect(result).toEqual({ ok: false, errors: [{ code: "render_failed", path: "$" }] });
  });
});
