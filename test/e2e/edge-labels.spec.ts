import { describe, expect, it } from "vitest";
import { type PrepareDeps, prepareDiagram } from "../../src/flows/prepare-diagram";
import { renderDiagramSvg } from "../../src/flows/render-diagram-svg";
import { createElkLayoutEngine } from "../../src/layout/actions/create-elk-layout-engine";
import type { Box, LayoutResult, Point } from "../../src/layout/data/layout-engine";
import { distanceToPolyline } from "../../src/svg/calculations/distance-to-polyline";
import type { Scene } from "../../src/svg/data/scene";
import { createFontkitTextMeasurer } from "../../src/text/actions/create-fontkit-text-measurer";
import { personalTheme } from "../../src/theme/data/personal-theme";
import { zillaFontsDir, zillaRegistry } from "../fixtures/zilla-test-fonts";

const MAX_DISTANCE = 12;

const loopWithQuestion = {
  title: "Loop with a question",
  nodes: [
    { id: "a", label: "Início", shape: "terminal" },
    { id: "b", label: "Continua?", shape: "decision" },
    { id: "c", label: "Processar", shape: "process" },
    { id: "d", label: "Fim", shape: "terminal" },
  ],
  edges: [
    { id: "e1", from: "a", to: "b" },
    { id: "e2", from: "b", to: "c", label: "sim" },
    { id: "e3", from: "c", to: "b" },
    { id: "e4", from: "b", to: "d", label: "não" },
  ],
};

const cycleWithShortLabels = {
  title: "Cycle with short labels",
  nodes: [
    { id: "order", label: "Order", shape: "terminal" },
    { id: "valid", label: "Valid?", shape: "decision" },
    { id: "paid", label: "Paid?", shape: "decision" },
    { id: "review", label: "Review", shape: "process" },
    { id: "ship", label: "Ship", shape: "io" },
    { id: "end", label: "End", shape: "terminal" },
  ],
  edges: [
    { id: "f1", from: "order", to: "valid" },
    { id: "f2", from: "valid", to: "paid", label: "yes" },
    { id: "f3", from: "valid", to: "review", label: "no" },
    { id: "f4", from: "review", to: "valid", label: "retry" },
    { id: "f5", from: "paid", to: "ship", label: "yes" },
    { id: "f6", from: "paid", to: "review", label: "no" },
    { id: "f7", from: "ship", to: "end", label: "ok" },
  ],
};

type Prepared = {
  readonly layout: LayoutResult;
  readonly scene: Scene;
};

async function prepare(flow: object, direction: string): Promise<Prepared> {
  const elk = createElkLayoutEngine();
  let layout: LayoutResult | null = null;
  const deps: PrepareDeps = {
    layoutEngine: {
      async layout(request) {
        const result = await elk.layout(request);
        layout = result.ok ? result.value : null;
        return result;
      },
    },
    textMeasurer: createFontkitTextMeasurer(zillaFontsDir, zillaRegistry),
    themes: [personalTheme],
    fontRegistry: zillaRegistry,
  };
  const text = JSON.stringify({ version: 1, type: "flowchart", direction, ...flow });
  const prepared = await prepareDiagram(text, deps);
  if (!prepared.ok || layout === null) {
    throw new Error("the diagram must lay out");
  }
  return { layout, scene: prepared.value.scene };
}

function overlaps(a: Box, b: Box): boolean {
  return a.x < b.x + b.width && b.x < a.x + a.width && a.y < b.y + b.height && b.y < a.y + a.height;
}

function contains(outer: Box, inner: Box): boolean {
  return (
    inner.x >= outer.x &&
    inner.y >= outer.y &&
    inner.x + inner.width <= outer.x + outer.width &&
    inner.y + inner.height <= outer.y + outer.height
  );
}

function numbers(text: string): readonly number[] {
  return (text.match(/-?\d+(\.\d+)?/g) ?? []).map(Number);
}

function pathPoints(d: string): readonly Point[] {
  const values = numbers(d);
  return values.flatMap((x, index) =>
    index % 2 === 0 ? [{ x, y: values[index + 1] as number }] : [],
  );
}

function attribute(element: string, name: string): number {
  return Number(new RegExp(` ${name}="([^"]+)"`).exec(element)?.[1]);
}

const cases = [
  ["the loop with a question", loopWithQuestion],
  ["the cycle with short labels", cycleWithShortLabels],
] as const;

describe.each(cases)("edge labels of %s", (_, flow) => {
  const labelled = flow.edges.flatMap((edge, index) => ("label" in edge ? [{ edge, index }] : []));

  describe.each(["down", "right"])("direction %s", (direction) => {
    it("gets from the layout engine a label box beside its own edge, in reserved space", async () => {
      const { layout } = await prepare(flow, direction);
      const bounds = { x: 0, y: 0, width: layout.width, height: layout.height };
      for (const { edge, index } of labelled) {
        const placed = layout.edges[index];
        const label = placed?.label as Box;
        expect(contains(bounds, label), `${edge.id} inside the layout`).toBe(true);
        expect(
          distanceToPolyline(label, placed?.points ?? []),
          `${edge.id} distance to its edge`,
        ).toBeLessThanOrEqual(MAX_DISTANCE);
        for (const node of layout.nodes) {
          expect(overlaps(label, node), `${edge.id} over node ${node.key}`).toBe(false);
        }
      }
    });

    it("places each label of the scene beside its own arrow", async () => {
      const { layout, scene } = await prepare(flow, direction);
      const first = scene.nodes[0] as Box;
      const firstPlaced = layout.nodes[0] as Box;
      const bounds = {
        x: first.x - firstPlaced.x,
        y: first.y - firstPlaced.y,
        width: layout.width,
        height: layout.height,
      };
      const nodes = new Map(scene.nodes.map((node) => [node.id, node]));
      for (const { edge, index } of labelled) {
        const sceneEdge = scene.edges[index];
        const label = sceneEdge?.label as Box;
        expect(contains(bounds, label), `${edge.id} inside the layout`).toBe(true);
        expect(
          distanceToPolyline(label, sceneEdge?.points ?? []),
          `${edge.id} distance to its arrow`,
        ).toBeLessThanOrEqual(MAX_DISTANCE);
        expect(overlaps(label, nodes.get(edge.from) as Box), `${edge.id} over its source`).toBe(
          false,
        );
        expect(overlaps(label, nodes.get(edge.to) as Box), `${edge.id} over its target`).toBe(
          false,
        );
      }
    });

    it("draws the rect and the text of each label inside the viewBox, beside the arrow", async () => {
      const { scene } = await prepare(flow, direction);
      const rendered = renderDiagramSvg(scene);
      if (!rendered.ok) {
        throw new Error("the svg must render");
      }
      const { svg } = rendered.value;
      const [, , viewWidth, viewHeight] = numbers(/viewBox="([^"]+)"/.exec(svg)?.[1] ?? "");
      const viewBox = { x: 0, y: 0, width: viewWidth as number, height: viewHeight as number };
      for (const { edge } of labelled) {
        const group = new RegExp(`<g data-edge-id="${edge.id}">(.*?)</g>`).exec(svg)?.[1] ?? "";
        const path = pathPoints(/<path d="([^"]+)"/.exec(group)?.[1] ?? "");
        const rect = /<rect [^>]+>/.exec(group)?.[0] ?? "";
        const box = {
          x: attribute(rect, "x"),
          y: attribute(rect, "y"),
          width: attribute(rect, "width"),
          height: attribute(rect, "height"),
        };
        const tspans = [...group.matchAll(/<tspan x="([^"]+)" y="([^"]+)"/g)];
        expect(tspans.length, `${edge.id} has text`).toBeGreaterThan(0);
        expect(contains(viewBox, box), `${edge.id} rect inside the viewBox`).toBe(true);
        expect(distanceToPolyline(box, path), `${edge.id} rect to its arrow`).toBeLessThanOrEqual(
          MAX_DISTANCE,
        );
        for (const [, x, y] of tspans) {
          const anchor = { x: Number(x), y: Number(y), width: 0, height: 0 };
          expect(contains(viewBox, anchor), `${edge.id} text inside the viewBox`).toBe(true);
          expect(contains(box, anchor), `${edge.id} text on its rect`).toBe(true);
        }
      }
    });
  });
});
