import { shapeMetrics } from "../../layout/data/shape-metrics";
import type { ThemeStroke } from "../../theme/data/theme";
import type { SceneNode } from "../data/scene";
import type { SvgAttributes, SvgElement } from "../data/svg-schema";
import { formatNumber } from "./format-number";
import { svgElement } from "./svg-element";

type Corner = readonly [number, number];

export function shapeElements(
  node: SceneNode,
  stroke: ThemeStroke,
  strokeColor: string,
): readonly SvgElement[] {
  const paint: SvgAttributes = {
    fill: node.fill,
    stroke: strokeColor,
    "stroke-width": stroke.width,
    "stroke-linejoin": "miter",
  };
  const right = node.x + node.width;
  const bottom = node.y + node.height;
  switch (node.shape) {
    case "process":
      return [
        svgElement("rect", {
          x: node.x,
          y: node.y,
          width: node.width,
          height: node.height,
          rx: stroke.cornerRadius,
          ...paint,
        }),
      ];
    case "terminal": {
      // The default theme has no rounded corners, so chamfers are what set a terminal apart.
      const cut = shapeMetrics.terminalChamfer;
      return [
        polygon(
          [
            [node.x + cut, node.y],
            [right - cut, node.y],
            [right, node.y + cut],
            [right, bottom - cut],
            [right - cut, bottom],
            [node.x + cut, bottom],
            [node.x, bottom - cut],
            [node.x, node.y + cut],
          ],
          paint,
        ),
      ];
    }
    case "decision": {
      const centerX = node.x + node.width / 2;
      const centerY = node.y + node.height / 2;
      return [
        polygon(
          [
            [centerX, node.y],
            [right, centerY],
            [centerX, bottom],
            [node.x, centerY],
          ],
          paint,
        ),
      ];
    }
    case "io": {
      const slant = shapeMetrics.ioSlant;
      return [
        polygon(
          [
            [node.x + slant, node.y],
            [right, node.y],
            [right - slant, bottom],
            [node.x, bottom],
          ],
          paint,
        ),
      ];
    }
    case "data":
      return dataElements(node, paint);
  }
}

function polygon(corners: readonly Corner[], paint: SvgAttributes): SvgElement {
  const points = corners.map(([x, y]) => `${formatNumber(x)},${formatNumber(y)}`).join(" ");
  return svgElement("polygon", { points, ...paint });
}

function dataElements(node: SceneNode, paint: SvgAttributes): readonly SvgElement[] {
  const rx = formatNumber(node.width / 2);
  const ry = formatNumber(shapeMetrics.dataCap);
  const left = formatNumber(node.x);
  const right = formatNumber(node.x + node.width);
  const top = formatNumber(node.y + shapeMetrics.dataCap);
  const bottom = formatNumber(node.y + node.height - shapeMetrics.dataCap);
  const arc = `A ${rx} ${ry} 0.00`;
  return [
    svgElement("path", {
      d: `M ${left} ${top} ${arc} 0 1 ${right} ${top} L ${right} ${bottom} ${arc} 0 1 ${left} ${bottom} Z`,
      ...paint,
    }),
    svgElement("path", {
      d: `M ${left} ${top} ${arc} 0 0 ${right} ${top}`,
      ...paint,
      fill: "none",
    }),
  ];
}
