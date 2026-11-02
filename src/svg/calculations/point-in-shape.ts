import type { NodeShape } from "../../contract/data/diagram";
import type { Box, Point } from "../../layout/data/layout-engine";
import { shapeMetrics } from "../../layout/data/shape-metrics";

const TOLERANCE = 0.5;

export function pointInShape(shape: NodeShape, box: Box, point: Point): boolean {
  const left = point.x - box.x;
  const right = box.x + box.width - point.x;
  const top = point.y - box.y;
  const bottom = box.y + box.height - point.y;
  if (Math.min(left, right, top, bottom) < -TOLERANCE) {
    return false;
  }
  if (shape === "terminal") {
    return insideChamfers(left, right, top, bottom);
  }
  if (shape === "decision") {
    const horizontal = Math.abs(point.x - box.x - box.width / 2) / (box.width / 2);
    const vertical = Math.abs(point.y - box.y - box.height / 2) / (box.height / 2);
    return horizontal + vertical <= 1 + TOLERANCE / Math.min(box.width, box.height);
  }
  if (shape === "io") {
    const slant = shapeMetrics.ioSlant;
    return (
      left >= (slant * bottom) / box.height - TOLERANCE &&
      right >= (slant * top) / box.height - TOLERANCE
    );
  }
  if (shape === "data") {
    const offset = Math.abs(point.x - box.x - box.width / 2) / (box.width / 2);
    const cap = shapeMetrics.dataCap * (1 - Math.sqrt(Math.max(0, 1 - offset * offset)));
    return top >= cap - TOLERANCE && bottom >= cap - TOLERANCE;
  }
  return true;
}

function insideChamfers(left: number, right: number, top: number, bottom: number): boolean {
  const chamfer = shapeMetrics.terminalChamfer - TOLERANCE;
  return Math.min(left, right) + Math.min(top, bottom) >= chamfer;
}
