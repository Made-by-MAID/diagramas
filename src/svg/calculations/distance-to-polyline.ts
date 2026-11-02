import type { Box, Point } from "../../layout/data/layout-engine";

// Shortest distance from the edge of a box to a polyline: zero when they touch or cross.
export function distanceToPolyline(box: Box, points: readonly Point[]): number {
  const segments =
    points.length === 1
      ? [[points[0] as Point, points[0] as Point] as const]
      : points.slice(1).map((end, index) => [points[index] as Point, end] as const);
  return Math.min(...segments.map(([start, end]) => distanceToSegment(box, start, end)));
}

function distanceToSegment(box: Box, start: Point, end: Point): number {
  if (segmentCrossesBox(box, start, end)) {
    return 0;
  }
  const corners = [
    { x: box.x, y: box.y },
    { x: box.x + box.width, y: box.y },
    { x: box.x, y: box.y + box.height },
    { x: box.x + box.width, y: box.y + box.height },
  ];
  return Math.min(
    pointToBox(start, box),
    pointToBox(end, box),
    ...corners.map((corner) => pointToSegment(corner, start, end)),
  );
}

// Liang-Barsky: clips the segment against the box and reports whether anything is left.
function segmentCrossesBox(box: Box, start: Point, end: Point): boolean {
  const dx = end.x - start.x;
  const dy = end.y - start.y;
  const sides: readonly (readonly [number, number])[] = [
    [-dx, start.x - box.x],
    [dx, box.x + box.width - start.x],
    [-dy, start.y - box.y],
    [dy, box.y + box.height - start.y],
  ];
  let enter = 0;
  let leave = 1;
  for (const [step, room] of sides) {
    if (step === 0) {
      if (room < 0) {
        return false;
      }
    } else if (step < 0) {
      enter = Math.max(enter, room / step);
    } else {
      leave = Math.min(leave, room / step);
    }
  }
  return enter <= leave;
}

function pointToBox(point: Point, box: Box): number {
  const dx = Math.max(box.x - point.x, 0, point.x - (box.x + box.width));
  const dy = Math.max(box.y - point.y, 0, point.y - (box.y + box.height));
  return Math.hypot(dx, dy);
}

function pointToSegment(point: Point, start: Point, end: Point): number {
  const dx = end.x - start.x;
  const dy = end.y - start.y;
  const squared = dx * dx + dy * dy;
  const along =
    squared === 0
      ? 0
      : Math.min(Math.max(((point.x - start.x) * dx + (point.y - start.y) * dy) / squared, 0), 1);
  return Math.hypot(point.x - (start.x + along * dx), point.y - (start.y + along * dy));
}
