import type { Diagram, DiagramEdge, DiagramNode } from "../../contract/data/diagram";
import type {
  Box,
  LayoutEdge,
  LayoutNode,
  LayoutResult,
  MeasuredDiagram,
  MeasuredLabel,
  Point,
} from "../../layout/data/layout-engine";
import { shapeMetrics } from "../../layout/data/shape-metrics";
import type { Theme } from "../../theme/data/theme";
import type { Scene, SceneEdge, SceneLine, SceneNode } from "../data/scene";
import { clipEndpoint } from "./clip-endpoint";
import { formatNumber } from "./format-number";
import { placeEdgeLabel } from "./place-edge-label";

const TITLE_GAP = 20;
const ARROW_LENGTH = 10;
const ARROW_HALF_WIDTH = 5;
const BASELINE_RATIO = 0.35;

export function buildScene(
  diagram: Pick<Diagram, "title" | "nodes" | "edges">,
  theme: Theme,
  measured: MeasuredDiagram,
  layout: LayoutResult,
): Scene {
  const { padding } = theme.spacing;
  const contentWidth = Math.max(layout.width, measured.titleWidth);
  const width = contentWidth + 2 * padding;
  const offset = {
    x: padding + (contentWidth - layout.width) / 2,
    y: padding + theme.font.titleSize * shapeMetrics.lineHeightRatio + TITLE_GAP,
  };
  const layoutNodes = new Map(layout.nodes.map((node) => [node.key, node]));
  const layoutEdges = new Map(layout.edges.map((edge) => [edge.key, edge]));

  const nodes = diagram.nodes.map((node, index) =>
    toSceneNode(
      node,
      layoutNodes.get(`n${index}`) as LayoutNode,
      measured.nodes[index] as MeasuredLabel,
      offset,
      theme,
    ),
  );
  const nodesById = new Map(nodes.map((node) => [node.id, node]));
  const bounds = { ...offset, width: layout.width, height: layout.height };
  const edges = diagram.edges.map((edge, index) =>
    toSceneEdge(
      edge,
      layoutEdges.get(`e${index}`) as LayoutEdge,
      measured.edgeLabels[index] as MeasuredLabel | null,
      nodesById.get(edge.from) as SceneNode,
      nodesById.get(edge.to) as SceneNode,
      offset,
      bounds,
      theme,
    ),
  );
  return {
    width,
    height: offset.y + layout.height + padding,
    theme,
    title: { text: diagram.title, x: width / 2, y: padding + theme.font.titleSize },
    nodes,
    edges,
  };
}

function toSceneNode(
  node: DiagramNode,
  placed: LayoutNode,
  measured: MeasuredLabel,
  offset: Point,
  theme: Theme,
): SceneNode {
  const box = {
    x: placed.x + offset.x,
    y: placed.y + offset.y,
    width: placed.width,
    height: placed.height,
  };
  return {
    id: node.id,
    shape: node.shape,
    ...box,
    fill: node.style.fill ?? theme.colors.nodeFill,
    stroke: node.style.stroke ?? theme.colors.nodeStroke,
    textColor: node.style.text ?? theme.colors.text,
    lines: centeredLines(
      measured.lines,
      box.x + box.width / 2,
      box.y + box.height / 2,
      theme.font.size,
    ),
  };
}

function toSceneEdge(
  edge: DiagramEdge,
  placed: LayoutEdge,
  measuredLabel: MeasuredLabel | null,
  source: SceneNode,
  target: SceneNode,
  offset: Point,
  bounds: Box,
  theme: Theme,
): SceneEdge {
  const moved = placed.points.map((point) => ({ x: point.x + offset.x, y: point.y + offset.y }));
  const unique = moved.filter(
    (point, index) =>
      index === 0 ||
      point.x !== (moved[index - 1] as Point).x ||
      point.y !== (moved[index - 1] as Point).y,
  );
  const route = unique.length < 2 ? moved : unique;
  const points = clipRoute(route, source, target);
  const label =
    placed.label === null
      ? null
      : placeEdgeLabel(
          { ...placed.label, x: placed.label.x + offset.x, y: placed.label.y + offset.y },
          points,
          source,
          target,
          bounds,
        );
  return {
    id: edge.id,
    d: toPathData(points),
    points,
    arrow: toArrow(points),
    color: edge.style.color ?? theme.colors.edge,
    dashed: edge.style.line === "dashed",
    label:
      label === null || measuredLabel === null
        ? null
        : {
            ...label,
            lines: centeredLines(
              measuredLabel.lines,
              label.x + label.width / 2,
              label.y + label.height / 2,
              theme.font.size,
            ),
          },
  };
}

function clipRoute(
  route: readonly Point[],
  source: SceneNode,
  target: SceneNode,
): readonly Point[] {
  const first = route[0] as Point;
  const second = route[1] as Point;
  const last = route[route.length - 1] as Point;
  const beforeLast = route[route.length - 2] as Point;
  const start = clipEndpoint(source.shape, source, first, difference(first, second));
  const end = clipEndpoint(target.shape, target, last, difference(last, beforeLast));
  return [start, ...route.slice(1, -1), end];
}

function difference(to: Point, from: Point): Point {
  return { x: to.x - from.x, y: to.y - from.y };
}

function toPathData(points: readonly Point[]): string {
  const [start, ...rest] = points.map(
    (point) => `${formatNumber(point.x)} ${formatNumber(point.y)}`,
  );
  return `M ${start} L ${rest.join(" L ")}`;
}

function toArrow(points: readonly Point[]): string {
  const tip = points[points.length - 1] as Point;
  const before = points[points.length - 2] as Point;
  const angle = Math.atan2(tip.y - before.y, tip.x - before.x);
  const baseX = tip.x - ARROW_LENGTH * Math.cos(angle);
  const baseY = tip.y - ARROW_LENGTH * Math.sin(angle);
  const sideX = ARROW_HALF_WIDTH * Math.sin(angle);
  const sideY = ARROW_HALF_WIDTH * Math.cos(angle);
  return [
    [tip.x, tip.y],
    [baseX + sideX, baseY - sideY],
    [baseX - sideX, baseY + sideY],
  ]
    .map(([x, y]) => `${formatNumber(x as number)},${formatNumber(y as number)}`)
    .join(" ");
}

function centeredLines(
  lines: readonly string[],
  centerX: number,
  centerY: number,
  fontSize: number,
): readonly SceneLine[] {
  const lineHeight = fontSize * shapeMetrics.lineHeightRatio;
  const firstY = centerY - ((lines.length - 1) * lineHeight) / 2 + fontSize * BASELINE_RATIO;
  return lines.map((text, index) => ({ text, x: centerX, y: firstY + index * lineHeight }));
}
