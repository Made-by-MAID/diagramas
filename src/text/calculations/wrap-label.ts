import { fail } from "../../shared/fail";
import { ok } from "../../shared/ok";
import type { DiagramError, Result } from "../../shared/result";
import { unwrapInto } from "../../shared/unwrap-into";
import type { TextMeasurer, TextStyle } from "../data/text-measurer";

export type WrappedLabel = {
  readonly lines: readonly string[];
  readonly width: number;
};

export function wrapLabel(
  label: string,
  style: TextStyle,
  maxWidth: number,
  measurer: TextMeasurer,
  path: string,
): Result<WrappedLabel> {
  const errors: DiagramError[] = [];
  const lines: string[] = [];
  let current = "";
  for (const word of label.split(" ")) {
    const candidate = current === "" ? word : `${current} ${word}`;
    const width = unwrapInto(measurer.measure(candidate, style, path), errors, 0);
    if (width > maxWidth && current !== "") {
      lines.push(current);
      current = word;
    } else {
      current = candidate;
    }
  }
  lines.push(current);
  const widths = lines.map((line) => unwrapInto(measurer.measure(line, style, path), errors, 0));
  return errors.length > 0 ? fail(errors.slice(0, 1)) : ok({ lines, width: Math.max(...widths) });
}
