import type { NodeShape } from "../../contract/data/diagram";
import type { Box, Point } from "../../layout/data/layout-engine";
import { pointInShape } from "./point-in-shape";

export function clipEndpoint(shape: NodeShape, box: Box, point: Point, direction: Point): Point {
  const length = Math.hypot(direction.x, direction.y);
  if (length === 0) {
    return point;
  }
  const stepX = direction.x / length;
  const stepY = direction.y / length;
  const limit = Math.ceil(Math.max(box.width, box.height));
  for (let distance = 0; distance <= limit; distance += 1) {
    const candidate = { x: point.x + stepX * distance, y: point.y + stepY * distance };
    if (pointInShape(shape, box, candidate)) {
      return candidate;
    }
  }
  return point;
}
