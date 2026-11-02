import { describe, expect, it } from "vitest";
import { personalTheme } from "../../theme/data/personal-theme";
import { buildTimeline } from "./build-timeline";

describe("buildTimeline", () => {
  it("joins declared effects with the geometry of the scene", () => {
    const edge = {
      id: "e",
      d: "M 0 0 L 1 1",
      points: [],
      arrow: "",
      color: "#000000",
      dashed: false,
      label: null,
    };
    const node = {
      id: "n",
      shape: "process",
      x: 0,
      y: 0,
      width: 1,
      height: 1,
      fill: "#000000",
      stroke: "#111111",
      textColor: "#000000",
      lines: [],
    } as const;
    const timeline = buildTimeline(
      {
        durationMs: 1000,
        fps: 20,
        loop: true,
        edges: [
          { edgeId: "e", effect: "dash" },
          { edgeId: "e", effect: "packet" },
        ],
        nodes: [{ nodeId: "n", effect: "pulse" }],
      },
      {
        width: 1,
        height: 1,
        theme: personalTheme,
        title: { text: "t", x: 0, y: 0 },
        nodes: [node],
        edges: [edge],
      },
    );
    expect(timeline).toEqual({
      durationMs: 1000,
      accent: personalTheme.colors.accent,
      dashes: [{ edgeId: "e" }],
      packets: [{ edgeId: "e", d: "M 0 0 L 1 1" }],
      pulses: [{ nodeId: "n", stroke: "#111111" }],
    });
  });
});
