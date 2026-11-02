import type { Diagram } from "../../contract/data/diagram";
import type { Theme } from "../../theme/data/theme";
import type { LayoutRequest, MeasuredDiagram } from "../data/layout-engine";

export function buildLayoutRequest(
  diagram: Pick<Diagram, "direction" | "nodes" | "edges">,
  theme: Theme,
  measured: MeasuredDiagram,
): LayoutRequest {
  const keys = new Map(diagram.nodes.map((node, index) => [node.id, `n${index}`]));
  return {
    direction: diagram.direction,
    nodeSpacing: theme.spacing.node,
    layerSpacing: theme.spacing.layer,
    nodes: measured.nodes.map((node, index) => ({
      key: `n${index}`,
      width: node.width,
      height: node.height,
    })),
    edges: diagram.edges.map((edge, index) => {
      const label = measured.edgeLabels[index] ?? null;
      return {
        key: `e${index}`,
        source: keys.get(edge.from) as string,
        target: keys.get(edge.to) as string,
        label: label === null ? null : { width: label.width, height: label.height },
      };
    }),
  };
}
