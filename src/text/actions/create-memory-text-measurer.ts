import { fail } from "../../shared/fail";
import { ok } from "../../shared/ok";
import type { TextMeasurer } from "../data/text-measurer";

type MemoryMeasurerOptions = {
  readonly unavailableFamilies?: readonly string[];
  readonly missingCharacters?: string;
};

export function createMemoryTextMeasurer(options: MemoryMeasurerOptions = {}): TextMeasurer {
  const unavailableFamilies = options.unavailableFamilies ?? [];
  const missingCharacters = options.missingCharacters ?? "";
  return {
    measure(text, style, path) {
      const missingGlyph = Array.from(text).some((character) =>
        missingCharacters.includes(character),
      );
      if (unavailableFamilies.includes(style.family) || missingGlyph) {
        return fail([{ code: "font_unavailable", path }]);
      }
      const ratio = style.weight === "bold" ? 0.55 : 0.5;
      return ok(Array.from(text).length * style.size * ratio);
    },
  };
}
