import type { SvgAttributes, SvgElement, SvgTag } from "../data/svg-schema";

export function svgElement(
  tag: SvgTag,
  attrs: SvgAttributes,
  children: readonly (SvgElement | string)[] = [],
): SvgElement {
  return { tag, attrs, children };
}
