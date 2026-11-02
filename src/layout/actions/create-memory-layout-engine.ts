import { fail } from "../../shared/fail";
import { ok } from "../../shared/ok";
import type {
  LayoutEdge,
  LayoutEngine,
  LayoutNode,
  LayoutRequest,
  LayoutRequestEdge,
} from "../data/layout-engine";

export function createMemoryLayoutEngine(options: { failure?: boolean } = {}): LayoutEngine {
  return {
    async layout(request) {
      if (options.failure === true) {
        return fail([{ code: "layout_failed", path: "$" }]);
      }
      const nodes = placeNodes(request);
      const edges = request.edges.map((edge) => routeEdge(edge, nodes, request));
      return ok({
        width: Math.max(...nodes.map((node) => node.x + node.width)),
        height: Math.max(...nodes.map((node) => node.y + node.height)),
        nodes,
        edges,
      });
    },
  };
}

function placeNodes(request: LayoutRequest): readonly LayoutNode[] {
  const widest = Math.max(...request.nodes.map((node) => node.width));
  const tallest = Math.max(...request.nodes.map((node) => node.height));
  let cursor = 0;
  return request.nodes.map((node) => {
    const placed =
      request.direction === "down"
        ? { ...node, x: (widest - node.width) / 2, y: cursor }
        : { ...node, x: cursor, y: (tallest - node.height) / 2 };
    const extent = request.direction === "down" ? node.height : node.width;
    cursor += extent + request.layerSpacing;
    return placed;
  });
}

function routeEdge(
  edge: LayoutRequestEdge,
  nodes: readonly LayoutNode[],
  request: LayoutRequest,
): LayoutEdge {
  const source = nodes.find((node) => node.key === edge.source) as LayoutNode;
  const target = nodes.find((node) => node.key === edge.target) as LayoutNode;
  const points = edge.source === edge.target ? selfLoop(source) : straight(source, target, request);
  const start = points[0] as { x: number; y: number };
  const label =
    edge.label === null ? null : { x: start.x - edge.label.width / 2, y: start.y, ...edge.label };
  return { key: edge.key, points, label };
}

function straight(source: LayoutNode, target: LayoutNode, request: LayoutRequest) {
  if (request.direction === "down") {
    return [
      { x: source.x + source.width / 2, y: source.y + source.height },
      { x: target.x + target.width / 2, y: target.y },
    ];
  }
  return [
    { x: source.x + source.width, y: source.y + source.height / 2 },
    { x: target.x, y: target.y + target.height / 2 },
  ];
}

function selfLoop(node: LayoutNode) {
  const right = node.x + node.width;
  return [
    { x: right, y: node.y + 10 },
    { x: right + 20, y: node.y + 10 },
    { x: right + 20, y: node.y + node.height - 10 },
    { x: right, y: node.y + node.height - 10 },
  ];
}
