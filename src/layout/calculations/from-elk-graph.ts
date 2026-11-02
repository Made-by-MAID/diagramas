import type { ElkExtendedEdge, ElkLabel, ElkNode, ElkPoint } from "elkjs/lib/elk-api";
import { fail } from "../../shared/fail";
import { ok } from "../../shared/ok";
import type { Result } from "../../shared/result";
import type { Box, LayoutEdge, LayoutNode, LayoutResult } from "../data/layout-engine";

const LAYOUT_FAILED: Result<LayoutResult> = fail([{ code: "layout_failed", path: "$" }]);

export function fromElkGraph(graph: ElkNode): Result<LayoutResult> {
  const { width, height } = graph;
  if (!isFiniteNumber(width) || !isFiniteNumber(height)) {
    return LAYOUT_FAILED;
  }
  const nodes = (graph.children ?? []).map(toLayoutNode);
  const edges = (graph.edges ?? []).map(toLayoutEdge);
  if (nodes.includes(null) || edges.includes(null)) {
    return LAYOUT_FAILED;
  }
  return ok({
    width,
    height,
    nodes: nodes as LayoutNode[],
    edges: edges as LayoutEdge[],
  });
}

function toLayoutNode(node: ElkNode): LayoutNode | null {
  const box = toBox(node);
  return box === null ? null : { key: node.id, ...box };
}

function toLayoutEdge(edge: ElkExtendedEdge): LayoutEdge | null {
  const points = (edge.sections ?? []).flatMap((section) => [
    section.startPoint,
    ...(section.bendPoints ?? []),
    section.endPoint,
  ]);
  if (points.length < 2 || !points.every(isFinitePoint)) {
    return null;
  }
  const elkLabel = edge.labels?.[0];
  const label = elkLabel === undefined ? null : toBox(elkLabel);
  if (elkLabel !== undefined && label === null) {
    return null;
  }
  return { key: edge.id, points: points.map(({ x, y }) => ({ x, y })), label };
}

function toBox(shape: ElkNode | ElkLabel): Box | null {
  const { x, y, width, height } = shape;
  if (
    !isFiniteNumber(x) ||
    !isFiniteNumber(y) ||
    !isFiniteNumber(width) ||
    !isFiniteNumber(height)
  ) {
    return null;
  }
  return { x, y, width, height };
}

function isFinitePoint(point: ElkPoint): boolean {
  return isFiniteNumber(point.x) && isFiniteNumber(point.y);
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}
