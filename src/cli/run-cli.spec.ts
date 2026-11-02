import { describe, expect, it } from "vitest";
import { runCli } from "./run-cli";

function io(overrides: Partial<Parameters<typeof runCli>[1]> = {}) {
  const output: string[] = [];
  const seen: { text?: string; fontsDir?: string; out?: string } = {};
  return {
    output,
    seen,
    deps: {
      readFile: async (path: string) => `file:${path}`,
      readStdin: async () => "stdin",
      writeLine(line: string) {
        output.push(line);
      },
      async render(text: string, out: string, options: { fontsDir: string }) {
        seen.text = text;
        seen.out = out;
        seen.fontsDir = options.fontsDir;
        return { ok: true, value: { files: ["diagram.png"] } } as const;
      },
      ...overrides,
    },
  };
}

const args = ["--input", "a.json", "--out", "o", "--fonts-dir", "f"];

describe("runCli", () => {
  it("renders a file and prints a JSON line", async () => {
    const { deps, output, seen } = io();
    expect(await runCli(args, deps)).toBe(0);
    expect(seen).toEqual({ text: "file:a.json", out: "o", fontsDir: "f" });
    expect(JSON.parse(output[0] as string)).toEqual({ ok: true, files: ["diagram.png"] });
  });

  it("reads stdin for -", async () => {
    const { deps, seen } = io();
    await runCli(["--input", "-", "--out", "o", "--fonts-dir", "f"], deps);
    expect(seen.text).toBe("stdin");
  });

  it("prints errors with codes and exits 1", async () => {
    const { deps, output } = io({
      render: async () => ({ ok: false, errors: [{ code: "render_failed", path: "$" }] }),
    });
    expect(await runCli(args, deps)).toBe(1);
    expect(JSON.parse(output[0] as string)).toEqual({
      ok: false,
      errors: [{ code: "render_failed", path: "$" }],
    });
  });

  it("exits 2 for bad arguments", async () => {
    const { deps, output } = io();
    expect(await runCli(["--nope"], deps)).toBe(2);
    expect(JSON.parse(output[0] as string).ok).toBe(false);
  });

  it("hides a read failure behind a fixed code", async () => {
    const { deps, output } = io({
      readFile: async () => {
        throw new Error("/secret/path");
      },
    });
    expect(await runCli(args, deps)).toBe(1);
    expect(output[0]).not.toContain("secret");
    expect(JSON.parse(output[0] as string).errors[0].code).toBe("invalid_json");
  });
});
