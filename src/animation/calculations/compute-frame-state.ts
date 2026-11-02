import { svgPathProperties } from "svg-path-properties";
import { effectMetrics } from "../data/effect-metrics";
import type { AnimationTimeline, FrameState, PacketState } from "../data/frame-state";
import { blendColor } from "./blend-color";

export function computeFrameState(timeline: AnimationTimeline, timeMs: number): FrameState {
  const progress = progressAt(timeMs, timeline.durationMs);
  const dashOffset = dashOffsetAt(progress, timeline.durationMs);
  const pulse = (1 - Math.cos(2 * Math.PI * progress)) / 2;
  return {
    dashes: timeline.dashes.map(({ edgeId }) => ({ edgeId, dashOffset })),
    packets: timeline.packets.map(({ edgeId, d }) => packetAt(edgeId, d, progress)),
    pulses: timeline.pulses.map(({ nodeId, stroke }) => ({
      nodeId,
      scale: 1 + effectMetrics.pulseScale * pulse,
      stroke: blendColor(stroke, timeline.accent, pulse),
    })),
  };
}

function progressAt(timeMs: number, durationMs: number): number {
  const time = Number.isFinite(timeMs) ? timeMs : 0;
  return (((time % durationMs) + durationMs) % durationMs) / durationMs;
}

function dashOffsetAt(progress: number, durationMs: number): number {
  // A whole number of cycles per duration makes the last frame meet the first one.
  const cycles = Math.max(1, Math.round(durationMs / effectMetrics.dashCycleMs));
  return -progress * cycles * (effectMetrics.dashLength + effectMetrics.dashGap);
}

function packetAt(edgeId: string, d: string, progress: number): PacketState {
  const properties = new svgPathProperties(d);
  const length = progress * properties.getTotalLength();
  const point = properties.getPointAtLength(length);
  const tangent = properties.getTangentAtLength(length);
  return {
    edgeId,
    x: point.x,
    y: point.y,
    angle: (Math.atan2(tangent.y, tangent.x) * 180) / Math.PI,
  };
}
