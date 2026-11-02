import type { DiagramAnimation } from "../../contract/data/diagram";
import type { Scene } from "../../svg/data/scene";
import type { AnimationTimeline } from "../data/frame-state";

export function buildTimeline(animation: DiagramAnimation, scene: Scene): AnimationTimeline {
  const paths = new Map(scene.edges.map((edge) => [edge.id, edge.d]));
  const strokes = new Map(scene.nodes.map((node) => [node.id, node.stroke]));
  return {
    durationMs: animation.durationMs,
    accent: scene.theme.colors.accent,
    dashes: animation.edges
      .filter((edge) => edge.effect === "dash")
      .map(({ edgeId }) => ({ edgeId })),
    packets: animation.edges
      .filter((edge) => edge.effect === "packet")
      .map(({ edgeId }) => ({ edgeId, d: paths.get(edgeId) as string })),
    pulses: animation.nodes.map(({ nodeId }) => ({
      nodeId,
      stroke: strokes.get(nodeId) as string,
    })),
  };
}
