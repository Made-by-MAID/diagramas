import { join } from "node:path";
import { describe, expect, it } from "vitest";

const BIN = join(import.meta.dirname, "../../bin/maid-diagramas.ts");

async function run(args: readonly string[], stdin = ""): Promise<{ code: number; out: string }> {
  const child = Bun.spawn([process.execPath, BIN, ...args], {
    stdin: new Blob([stdin]),
    stdout: "pipe",
    stderr: "pipe",
  });
  const out = await new Response(child.stdout).text();
  return { code: await child.exited, out };
}

describe("command line", () => {
  it("exits 2 with a JSON line for bad arguments", async () => {
    const { code, out } = await run([]);
    expect(code).toBe(2);
    expect(JSON.parse(out).ok).toBe(false);
  });

  it("reads stdin and reports contract errors without a stack trace", async () => {
    const { code, out } = await run(
      ["--input", "-", "--out", "/tmp/never", "--fonts-dir", "/none"],
      "{",
    );
    expect(code).toBe(1);
    expect(JSON.parse(out)).toEqual({ ok: false, errors: [{ code: "invalid_json", path: "$" }] });
  });

  it("reports an unreadable file with a fixed code and no path", async () => {
    const { code, out } = await run([
      "--input",
      "/nonexistent/x.json",
      "--out",
      "/tmp/never",
      "--fonts-dir",
      "/none",
    ]);
    expect(code).toBe(1);
    expect(out).not.toContain("nonexistent");
  });
});
