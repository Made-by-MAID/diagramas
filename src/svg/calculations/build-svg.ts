import { effectMetrics } from "../../animation/data/effect-metrics";
import type {
  EdgeDashState,
  FrameState,
  NodePulseState,
  PacketState,
} from "../../animation/data/frame-state";
import type { Scene, SceneEdge, SceneLine, SceneNode } from "../data/scene";
import type { SvgAttributes, SvgElement } from "../data/svg-schema";
import type { OutputSize } from "./fit-output-size";
import { formatNumber } from "./format-number";
import { shapeElements } from "./shape-elements";
import { svgElement } from "./svg-element";

const STATIC_DASH = "6 4";
const NO_FRAME: FrameState = { dashes: [], packets: [], pulses: [] };

export function buildSvg(scene: Scene, size: OutputSize, frame: FrameState = NO_FRAME): SvgElement {
  const { theme } = scene;
  const viewBox = ["0", "0", scene.width, scene.height].map(Number).map(formatNumber).join(" ");
  const dashes = new Map(frame.dashes.map((dash) => [dash.edgeId, dash]));
  const pulses = new Map(frame.pulses.map((pulse) => [pulse.nodeId, pulse]));
  return svgElement(
    "svg",
    {
      xmlns: "http://www.w3.org/2000/svg",
      width: size.width,
      height: size.height,
      viewBox,
    },
    [
      svgElement("title", {}, [scene.title.text]),
      svgElement("rect", {
        x: 0,
        y: 0,
        width: scene.width,
        height: scene.height,
        fill: theme.colors.background,
      }),
      textElement(scene, "title", [scene.title], theme.colors.text, 700, theme.font.titleSize),
      ...scene.edges.map((edge) => edgeElement(scene, edge, dashes.get(edge.id))),
      ...scene.nodes.map((node) => nodeElement(scene, node, pulses.get(node.id))),
      ...frame.packets.map((packet) => packetElement(scene, packet)),
    ],
  );
}

function textElement(
  scene: Scene,
  role: string,
  lines: readonly SceneLine[],
  color: string,
  weight: number,
  size: number,
): SvgElement {
  return svgElement(
    "text",
    {
      "data-role": role,
      fill: color,
      "font-family": scene.theme.font.family,
      "font-size": size,
      "font-weight": String(weight),
      "text-anchor": "middle",
    },
    lines.map((line) => svgElement("tspan", { x: line.x, y: line.y }, [line.text])),
  );
}

function edgeElement(scene: Scene, edge: SceneEdge, dash: EdgeDashState | undefined): SvgElement {
  const { theme } = scene;
  const children: SvgElement[] = [
    svgElement("path", {
      d: edge.d,
      fill: "none",
      stroke: edge.color,
      "stroke-width": theme.stroke.width,
      "stroke-linejoin": "miter",
      ...dashAttributes(edge, dash),
    }),
    svgElement("polygon", { points: edge.arrow, fill: edge.color }),
  ];
  if (edge.label !== null) {
    children.push(
      svgElement("rect", {
        x: edge.label.x,
        y: edge.label.y,
        width: edge.label.width,
        height: edge.label.height,
        fill: theme.colors.background,
      }),
      textElement(scene, "label", edge.label.lines, theme.colors.text, 400, theme.font.size),
    );
  }
  return svgElement("g", { "data-edge-id": edge.id }, children);
}

function dashAttributes(edge: SceneEdge, dash: EdgeDashState | undefined): SvgAttributes {
  if (dash !== undefined) {
    return {
      "stroke-dasharray": `${effectMetrics.dashLength} ${effectMetrics.dashGap}`,
      "stroke-dashoffset": dash.dashOffset,
    };
  }
  return edge.dashed ? { "stroke-dasharray": STATIC_DASH } : {};
}

function nodeElement(scene: Scene, node: SceneNode, pulse: NodePulseState | undefined): SvgElement {
  const attributes: SvgAttributes = { "data-node-id": node.id, "data-shape": node.shape };
  const centerX = formatNumber(node.x + node.width / 2);
  const centerY = formatNumber(node.y + node.height / 2);
  const inverseX = formatNumber(-(node.x + node.width / 2));
  const inverseY = formatNumber(-(node.y + node.height / 2));
  const animated: SvgAttributes =
    pulse === undefined
      ? {}
      : {
          transform: `translate(${centerX} ${centerY}) scale(${pulse.scale.toFixed(4)}) translate(${inverseX} ${inverseY})`,
        };
  return svgElement("g", { ...attributes, ...animated }, [
    ...shapeElements(node, scene.theme.stroke, pulse?.stroke ?? node.stroke),
    textElement(scene, "label", node.lines, node.textColor, 400, scene.theme.font.size),
  ]);
}

function packetElement(scene: Scene, packet: PacketState): SvgElement {
  const half = effectMetrics.packetLength / 2;
  const side = effectMetrics.packetWidth / 2;
  const points = [
    [half, 0],
    [-half, side],
    [-half, -side],
  ]
    .map(([x, y]) => `${formatNumber(x as number)},${formatNumber(y as number)}`)
    .join(" ");
  return svgElement("polygon", {
    "data-role": "packet",
    "data-target": packet.edgeId,
    points,
    fill: scene.theme.colors.accent,
    transform: `translate(${formatNumber(packet.x)} ${formatNumber(packet.y)}) rotate(${formatNumber(packet.angle)})`,
  });
}
