import type { Box, Point } from "../../layout/data/layout-engine";
import { distanceToPolyline } from "./distance-to-polyline";

const MAX_DISTANCE = 12;
const GAP = 4;
const SLIDE_STEP = 4;

// Keeps the label the layout gave when it sits beside its edge; otherwise puts it beside the
// longest segment, on the first side that clears both nodes. Always inside the bounds.
export function placeEdgeLabel(
  label: Box,
  points: readonly Point[],
  source: Box,
  target: Box,
  bounds: Box,
): Box {
  const fits =
    distanceToPolyline(label, points) <= MAX_DISTANCE &&
    !overlaps(label, source) &&
    !overlaps(label, target);
  if (fits) {
    return clamp(label, bounds);
  }
  const [start, end] = longestSegment(points);
  const dx = end.x - start.x;
  const dy = end.y - start.y;
  const length = Math.hypot(dx, dy);
  const vertical = Math.abs(dy) > Math.abs(dx);
  const shift = vertical ? { x: label.width / 2 + GAP, y: 0 } : { x: 0, y: label.height / 2 + GAP };
  const candidates = slides(length).flatMap((slide) => {
    const along = length === 0 ? 0 : 0.5 + slide / length;
    const center = { x: start.x + along * dx, y: start.y + along * dy };
    return [1, -1].map((side) =>
      clamp(
        {
          x: center.x + side * shift.x - label.width / 2,
          y: center.y + side * shift.y - label.height / 2,
          width: label.width,
          height: label.height,
        },
        bounds,
      ),
    );
  });
  return (
    candidates.find((box) => !overlaps(box, source) && !overlaps(box, target)) ??
    (candidates[0] as Box)
  );
}

function longestSegment(points: readonly Point[]): readonly [Point, Point] {
  let best: readonly [Point, Point] = [points[0] as Point, (points[1] ?? points[0]) as Point];
  for (let index = 1; index < points.length - 1; index += 1) {
    const segment = [points[index] as Point, points[index + 1] as Point] as const;
    if (segmentLength(segment) > segmentLength(best)) {
      best = segment;
    }
  }
  return best;
}

function segmentLength([start, end]: readonly [Point, Point]): number {
  return Math.hypot(end.x - start.x, end.y - start.y);
}

// Offsets from the middle of the segment: 0, +4, -4, +8, -8... while the center stays on it.
function slides(length: number): readonly number[] {
  const steps = Math.floor(length / 2 / SLIDE_STEP);
  return [
    0,
    ...Array.from({ length: steps }, (_, index) => [
      (index + 1) * SLIDE_STEP,
      -(index + 1) * SLIDE_STEP,
    ]).flat(),
  ];
}

function overlaps(a: Box, b: Box): boolean {
  return a.x < b.x + b.width && b.x < a.x + a.width && a.y < b.y + b.height && b.y < a.y + a.height;
}

function clamp(box: Box, bounds: Box): Box {
  return {
    ...box,
    x: Math.max(Math.min(box.x, bounds.x + bounds.width - box.width), bounds.x),
    y: Math.max(Math.min(box.y, bounds.y + bounds.height - box.height), bounds.y),
  };
}
