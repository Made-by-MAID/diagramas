import { describe, expect, it } from "vitest";
import type { NodeShape } from "../../contract/data/diagram";
import { personalTheme } from "../../theme/data/personal-theme";
import type { Scene } from "../data/scene";
import { buildSvg } from "./build-svg";
import { serializeSvg } from "./serialize-svg";

const shapes: readonly NodeShape[] = ["process", "terminal", "decision", "io", "data"];

function sceneWith(label: string): Scene {
  return {
    width: 400.5,
    height: 300,
    theme: personalTheme,
    title: { text: label, x: 200, y: 40 },
    nodes: shapes.map((shape, index) => ({
      id: `n${index}`,
      shape,
      x: 10,
      y: 50 * index,
      width: 100,
      height: 40,
      fill: "#111111",
      stroke: "#222222",
      textColor: "#333333",
      lines: [{ text: label, x: 60, y: 50 * index + 20 }],
    })),
    edges: [
      {
        id: "e0",
        d: "M 0 0 L 10 0",
        points: [
          { x: 0, y: 0 },
          { x: 10, y: 0 },
        ],
        arrow: "10,0 0,4 0,-4",
        color: "#444444",
        dashed: false,
        label: {
          x: 1,
          y: 1,
          width: 20,
          height: 20,
          lines: [{ text: label, x: 11, y: 11 }],
        },
      },
      {
        id: "e1",
        d: "M 0 5 L 10 5",
        points: [],
        arrow: "10,5 0,9 0,1",
        color: "#444444",
        dashed: true,
        label: null,
      },
    ],
  };
}

function render(label: string, frame?: Parameters<typeof buildSvg>[2]): string {
  const result = serializeSvg(buildSvg(sceneWith(label), { width: 401, height: 300 }, frame));
  if (!result.ok) {
    throw new Error("unexpected unsafe svg");
  }
  return result.value;
}

describe("buildSvg", () => {
  it("writes the output size, the viewBox and the background", () => {
    const svg = render("x");
    expect(svg).toContain('width="401.00" height="300.00" viewBox="0.00 0.00 400.50 300.00"');
    expect(svg).toContain(`fill="${personalTheme.colors.background}"`);
    expect(svg.startsWith("<svg ")).toBe(true);
  });

  it("marks every node and edge", () => {
    const svg = render("x");
    for (const shape of shapes) {
      expect(svg).toContain(`data-shape="${shape}"`);
    }
    expect(svg).toContain('data-node-id="n0"');
    expect(svg).toContain('data-edge-id="e0"');
    expect(svg).toContain('data-edge-id="e1"');
  });

  it("uses Regular for labels and Bold for the title", () => {
    const svg = render("x");
    expect(svg).toMatch(/data-role="title"[^>]*font-weight="700"/);
    expect(svg).toMatch(/data-role="label"[^>]*font-weight="400"/);
    expect(svg).toContain('font-family="Zilla Slab"');
  });

  it.each([
    "<script>alert(1)</script>",
    "<foreignObject>x</foreignObject>",
    "<image href='http://evil/x.png'/>",
    `"><script>`,
    "url(#x)",
  ])("keeps the hostile label %s as inert text", (label) => {
    const svg = render(label);
    for (const forbidden of [
      "<script",
      "<foreignObject",
      "<image",
      "<style",
      "<use",
      "<!DOCTYPE",
    ]) {
      expect(svg).not.toContain(forbidden);
    }
    expect(svg).not.toMatch(/\shref="/);
    expect(svg).not.toMatch(/\s\w+="[^"]*url\(/);
  });

  it("gives the same bytes for the same input", () => {
    expect(render("café")).toBe(render("café"));
  });

  it("dashes a static edge marked dashed, and not the others", () => {
    const svg = render("x");
    expect(svg).toMatch(/data-edge-id="e1"><path[^>]*stroke-dasharray="6 4"/);
    expect(svg).not.toMatch(/data-edge-id="e0"><path[^>]*stroke-dasharray/);
    expect(svg).not.toContain("stroke-dashoffset");
  });

  it("applies the dash state of a frame", () => {
    const svg = render("x", {
      dashes: [{ edgeId: "e0", dashOffset: -7.5 }],
      packets: [],
      pulses: [],
    });
    expect(svg).toMatch(
      /data-edge-id="e0"><path[^>]*stroke-dasharray="12 8"[^>]*stroke-dashoffset="-7.50"/,
    );
  });

  it("draws the packet of a frame over the path", () => {
    const svg = render("x", {
      dashes: [],
      packets: [{ edgeId: "e0", x: 5, y: 6, angle: 90 }],
      pulses: [],
    });
    expect(svg).toContain('data-role="packet" data-target="e0"');
    expect(svg).toContain('transform="translate(5.00 6.00) rotate(90.00)"');
    expect(svg).toContain(`fill="${personalTheme.colors.accent}"`);
  });

  it("scales a pulsing node around its center and changes its stroke", () => {
    const svg = render("x", {
      dashes: [],
      packets: [],
      pulses: [{ nodeId: "n0", scale: 1.5, stroke: "#ABCDEF" }],
    });
    expect(svg).toContain(
      'data-node-id="n0" data-shape="process" transform="translate(60.00 20.00) scale(1.5000) translate(-60.00 -20.00)"',
    );
    expect(svg).toContain('stroke="#ABCDEF"');
    expect(svg).toMatch(/data-node-id="n1" data-shape="terminal">/);
  });

  it("does not change geometry between frames, only the animated attributes", () => {
    const base = render("x");
    const frame = render("x", {
      dashes: [],
      packets: [],
      pulses: [{ nodeId: "n1", scale: 1, stroke: "#222222" }],
    });
    expect(frame.replace(/ transform="translate\([^"]*"/, "")).toBe(base);
  });
});
