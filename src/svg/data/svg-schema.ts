export const allowedSvgTags = [
  "svg",
  "g",
  "title",
  "rect",
  "path",
  "polygon",
  "circle",
  "text",
  "tspan",
] as const;

export const allowedSvgAttributes = [
  "xmlns",
  "width",
  "height",
  "viewBox",
  "x",
  "y",
  "d",
  "points",
  "cx",
  "cy",
  "r",
  "rx",
  "fill",
  "stroke",
  "stroke-width",
  "stroke-dasharray",
  "stroke-dashoffset",
  "stroke-linejoin",
  "font-family",
  "font-size",
  "font-weight",
  "text-anchor",
  "transform",
  "data-node-id",
  "data-shape",
  "data-edge-id",
  "data-role",
  "data-target",
] as const;

export type SvgTag = (typeof allowedSvgTags)[number];
export type SvgAttribute = (typeof allowedSvgAttributes)[number];
export type SvgAttributes = Partial<Record<SvgAttribute, string | number>>;

export type SvgElement = {
  readonly tag: SvgTag;
  readonly attrs: SvgAttributes;
  readonly children: readonly (SvgElement | string)[];
};
