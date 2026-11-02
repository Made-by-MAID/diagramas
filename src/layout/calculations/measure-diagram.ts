import type { Diagram } from "../../contract/data/diagram";
import { fail } from "../../shared/fail";
import { ok } from "../../shared/ok";
import type { DiagramError, Result } from "../../shared/result";
import { unwrapInto } from "../../shared/unwrap-into";
import { wrapLabel } from "../../text/calculations/wrap-label";
import type { TextMeasurer, TextStyle } from "../../text/data/text-measurer";
import type { Theme } from "../../theme/data/theme";
import type { MeasuredDiagram, MeasuredLabel } from "../data/layout-engine";
import { shapeMetrics } from "../data/shape-metrics";
import { computeNodeSize } from "./compute-node-size";

const NO_LABEL = { lines: [], width: 0 };

export function measureDiagram(
  diagram: Pick<Diagram, "title" | "nodes" | "edges">,
  theme: Theme,
  measurer: TextMeasurer,
): Result<MeasuredDiagram> {
  const errors: DiagramError[] = [];
  const family = theme.font.family;
  const labelStyle: TextStyle = { family, weight: "regular", size: theme.font.size };
  const titleStyle: TextStyle = { family, weight: "bold", size: theme.font.titleSize };
  const lineHeight = theme.font.size * shapeMetrics.lineHeightRatio;

  const titleWidth = unwrapInto(measurer.measure(diagram.title, titleStyle, "title"), errors, 0);

  const nodes = diagram.nodes.map((node, index): MeasuredLabel => {
    const path = `nodes[${index}].label`;
    const wrapped = unwrapInto(
      wrapLabel(node.label, labelStyle, shapeMetrics.maxLabelWidth, measurer, path),
      errors,
      NO_LABEL,
    );
    const textHeight = wrapped.lines.length * lineHeight;
    const size = computeNodeSize(node.shape, wrapped.width, textHeight);
    return { lines: wrapped.lines, ...size };
  });

  const edgeLabels = diagram.edges.map((edge, index): MeasuredLabel | null => {
    if (edge.label === undefined) {
      return null;
    }
    const path = `edges[${index}].label`;
    const wrapped = unwrapInto(
      wrapLabel(edge.label, labelStyle, shapeMetrics.maxEdgeLabelWidth, measurer, path),
      errors,
      NO_LABEL,
    );
    return {
      lines: wrapped.lines,
      width: Math.ceil(wrapped.width),
      height: Math.ceil(wrapped.lines.length * lineHeight),
    };
  });

  return errors.length > 0 ? fail(errors) : ok({ titleWidth, nodes, edgeLabels });
}
