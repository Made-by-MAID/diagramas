import { describe, expect, it } from "vitest";
import * as core from "./core";

const NODE_BUILTIN =
  /^(node:|fs$|path$|os$|child_process$|crypto$|stream$|buffer$|util$|url$|net$|http$|https$)/;

async function bundleForBrowser(entry: string) {
  const reached: string[] = [];
  const result = await Bun.build({
    entrypoints: [entry],
    target: "browser",
    plugins: [
      {
        name: "record-imports",
        setup(build) {
          build.onResolve({ filter: /.*/ }, (args) => {
            reached.push(args.path);
            return undefined;
          });
        },
      },
    ],
  });
  return { reached, result };
}

describe("portable core", () => {
  it("exports validation, layout, SVG and state(t)", () => {
    for (const name of [
      "parseDiagram",
      "resolveTheme",
      "prepareDiagram",
      "renderDiagramSvg",
      "renderDiagramFrames",
      "computeFrameState",
      "validatePng",
      "validateGif",
      "createElkLayoutEngine",
    ]) {
      expect(core).toHaveProperty(name);
    }
  });

  it("bundles for the browser without any Node builtin", async () => {
    const { reached, result } = await bundleForBrowser(`${import.meta.dirname}/core.ts`);
    expect(result.success).toBe(true);
    expect(reached.filter((path) => NODE_BUILTIN.test(path))).toEqual([]);
    const output = await (result.outputs[0] as Blob).text();
    expect(output).not.toMatch(/from\s*["']node:/);
    expect(output).not.toMatch(/require\(["']node:/);
    expect(reached).toContain("elkjs/lib/elk.bundled.js");
  });

  it("detects a Node builtin when one enters", async () => {
    const { reached } = await bundleForBrowser(
      `${import.meta.dirname}/../test/fixtures/imports-node-builtin.ts`,
    );
    expect(reached.filter((path) => NODE_BUILTIN.test(path))).toEqual(["node:fs"]);
  });
});
