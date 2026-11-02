import { describe, expect, it } from "vitest";
import { parseCliArgs } from "./parse-cli-args";

describe("parseCliArgs", () => {
  it("reads the required options", () => {
    expect(parseCliArgs(["--input", "a.json", "--out", "o", "--fonts-dir", "f"])).toEqual({
      ok: true,
      value: { input: "a.json", out: "o", fontsDir: "f" },
    });
  });

  it("uses - for stdin and accepts binary paths", () => {
    expect(
      parseCliArgs([
        "--input",
        "-",
        "--out",
        "o",
        "--fonts-dir",
        "f",
        "--resvg",
        "/r",
        "--ffmpeg",
        "/g",
      ]),
    ).toEqual({
      ok: true,
      value: { input: "-", out: "o", fontsDir: "f", resvgPath: "/r", ffmpegPath: "/g" },
    });
  });

  it("refuses a missing option", () => {
    expect(parseCliArgs(["--input", "a"])).toEqual({
      ok: false,
      errors: [
        { code: "missing_field", path: "--out" },
        { code: "missing_field", path: "--fonts-dir" },
      ],
    });
    expect(parseCliArgs([]).ok).toBe(false);
  });

  it("refuses an unknown option and a missing value", () => {
    const required = ["--input", "a", "--out", "o", "--fonts-dir", "f"];
    expect(parseCliArgs([...required, "--nope", "x"])).toEqual({
      ok: false,
      errors: [{ code: "unknown_field", path: "--nope" }],
    });
    expect(parseCliArgs([...required, "--resvg"])).toEqual({
      ok: false,
      errors: [{ code: "missing_field", path: "--resvg" }],
    });
  });
});
