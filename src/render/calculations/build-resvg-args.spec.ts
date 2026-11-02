import { describe, expect, it } from "vitest";
import { buildResvgArgs } from "./build-resvg-args";

describe("buildResvgArgs", () => {
  it("uses only the fixed flags, with fonts and resources confined", () => {
    expect(
      buildResvgArgs({
        fontsDir: "/fonts",
        resourcesDir: "/tmp/w/empty",
        svgPath: "/tmp/w/000.svg",
        pngPath: "/tmp/w/000.png",
      }),
    ).toEqual([
      "--use-fonts-dir",
      "/fonts",
      "--skip-system-fonts",
      "--resources-dir",
      "/tmp/w/empty",
      "/tmp/w/000.svg",
      "/tmp/w/000.png",
    ]);
  });
});
