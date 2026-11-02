import { describe, expect, it } from "vitest";
import { personalTheme } from "../../theme/data/personal-theme";
import { buildLayoutRequest } from "./build-layout-request";

describe("buildLayoutRequest", () => {
  it("translates ids from the input into generated keys and carries only numbers", () => {
    const request = buildLayoutRequest(
      {
        direction: "right",
        nodes: [
          { id: "<evil>", label: "x", shape: "io", style: {} },
          { id: "other", label: "y", shape: "io", style: {} },
        ],
        edges: [
          { id: "edge-with-text", from: "<evil>", to: "other", style: {} },
          { id: "labelled", from: "other", to: "<evil>", label: "z", style: {} },
        ],
      },
      personalTheme,
      {
        titleWidth: 1,
        nodes: [
          { lines: ["x"], width: 80, height: 40 },
          { lines: ["y"], width: 90, height: 50 },
        ],
        edgeLabels: [null, { lines: ["z"], width: 10, height: 20 }],
      },
    );
    expect(request).toEqual({
      direction: "right",
      nodeSpacing: 40,
      layerSpacing: 60,
      nodes: [
        { key: "n0", width: 80, height: 40 },
        { key: "n1", width: 90, height: 50 },
      ],
      edges: [
        { key: "e0", source: "n0", target: "n1", label: null },
        { key: "e1", source: "n1", target: "n0", label: { width: 10, height: 20 } },
      ],
    });
    expect(JSON.stringify(request)).not.toContain("evil");
  });
});
