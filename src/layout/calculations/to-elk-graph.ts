import type { ElkNode } from "elkjs/lib/elk-api";
import type { LayoutRequest } from "../data/layout-engine";

export function toElkGraph(request: LayoutRequest): ElkNode {
  return {
    id: "root",
    layoutOptions: {
      "elk.algorithm": "layered",
      "elk.direction": request.direction === "down" ? "DOWN" : "RIGHT",
      "elk.edgeRouting": "ORTHOGONAL",
      "elk.randomSeed": "1",
      "elk.padding": "[top=0,left=0,bottom=0,right=0]",
      "elk.spacing.nodeNode": String(request.nodeSpacing),
      "elk.layered.spacing.nodeNodeBetweenLayers": String(request.layerSpacing),
      "elk.spacing.edgeNode": "20",
      "elk.spacing.edgeEdge": "14",
      "elk.spacing.edgeLabel": "4",
      "elk.layered.spacing.edgeNodeBetweenLayers": "24",
    },
    children: request.nodes.map((node) => ({
      id: node.key,
      width: node.width,
      height: node.height,
    })),
    edges: request.edges.map((edge, index) => ({
      id: edge.key,
      sources: [edge.source],
      targets: [edge.target],
      // ELK ignores a label without text: it reserves no room and leaves it at (0, 0).
      // The text is the generated id, never the input; the size comes from width and height.
      labels:
        edge.label === null
          ? []
          : [
              {
                id: `l${index}`,
                text: `l${index}`,
                width: edge.label.width,
                height: edge.label.height,
              },
            ],
    })),
  };
}
