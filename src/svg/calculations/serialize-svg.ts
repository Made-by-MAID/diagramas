import { fail } from "../../shared/fail";
import { ok } from "../../shared/ok";
import type { Result } from "../../shared/result";
import { allowedSvgAttributes, allowedSvgTags, type SvgElement } from "../data/svg-schema";
import { escapeXml } from "./escape-xml";
import { formatNumber } from "./format-number";

const TAGS: readonly string[] = allowedSvgTags;
const ATTRIBUTES: readonly string[] = allowedSvgAttributes;
const FORBIDDEN_VALUE = /url\(|javascript:/i;
const CONTROL_CHARACTERS = /\p{Cc}/u;

export function serializeSvg(root: SvgElement): Result<string> {
  const text = writeElement(root);
  return text === null ? fail([{ code: "unsafe_svg", path: "$" }]) : ok(text);
}

function writeElement(element: SvgElement): string | null {
  if (!TAGS.includes(element.tag)) {
    return null;
  }
  let attributes = "";
  for (const [name, value] of Object.entries(element.attrs)) {
    const written = writeValue(value);
    if (!ATTRIBUTES.includes(name) || written === null) {
      return null;
    }
    attributes += ` ${name}="${written}"`;
  }
  if (element.children.length === 0) {
    return `<${element.tag}${attributes}/>`;
  }
  let body = "";
  for (const child of element.children) {
    const written = typeof child === "string" ? writeText(child) : writeElement(child);
    if (written === null) {
      return null;
    }
    body += written;
  }
  return `<${element.tag}${attributes}>${body}</${element.tag}>`;
}

function writeValue(value: string | number): string | null {
  if (typeof value === "number") {
    return Number.isFinite(value) ? formatNumber(value) : null;
  }
  return FORBIDDEN_VALUE.test(value) ? null : writeText(value);
}

function writeText(text: string): string | null {
  return CONTROL_CHARACTERS.test(text) ? null : escapeXml(text);
}
