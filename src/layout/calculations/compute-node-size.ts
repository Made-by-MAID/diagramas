import type { NodeShape } from "../../contract/data/diagram";
import { shapeMetrics } from "../data/shape-metrics";

export function computeNodeSize(
  shape: NodeShape,
  textWidth: number,
  textHeight: number,
): { readonly width: number; readonly height: number } {
  const baseWidth = textWidth + 2 * shapeMetrics.paddingX;
  const baseHeight = textHeight + 2 * shapeMetrics.paddingY;
  return {
    width: Math.max(shapeMetrics.minWidth, Math.ceil(baseWidth + extraWidth(shape, baseWidth))),
    height: Math.max(
      shapeMetrics.minHeight,
      Math.ceil(baseHeight + extraHeight(shape, baseHeight)),
    ),
  };
}

function extraWidth(shape: NodeShape, baseWidth: number): number {
  if (shape === "decision") {
    return baseWidth;
  }
  if (shape === "io") {
    return 2 * shapeMetrics.ioSlant;
  }
  return shape === "terminal" ? 2 * shapeMetrics.terminalChamfer : 0;
}

function extraHeight(shape: NodeShape, baseHeight: number): number {
  if (shape === "decision") {
    return baseHeight;
  }
  return shape === "data" ? 2 * shapeMetrics.dataCap : 0;
}
