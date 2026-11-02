import { readFileSync } from "node:fs";
import { join } from "node:path";
import { create, type Font } from "fontkit";
import { fail } from "../../shared/fail";
import { ok } from "../../shared/ok";
import type { RegisteredFont } from "../../theme/data/theme";
import type { TextMeasurer, TextStyle } from "../data/text-measurer";

export function createFontkitTextMeasurer(
  fontsDir: string,
  registry: readonly RegisteredFont[],
): TextMeasurer {
  const loaded = new Map<string, Font | null>();

  function fontFor(style: TextStyle): Font | null {
    const registered = registry.find((font) => font.family === style.family);
    if (registered === undefined) {
      return null;
    }
    const file = style.weight === "bold" ? registered.bold : registered.regular;
    const cached = loaded.get(file);
    if (cached !== undefined) {
      return cached;
    }
    const font = loadFont(join(fontsDir, file));
    loaded.set(file, font);
    return font;
  }

  return {
    measure(text, style, path) {
      const font = fontFor(style);
      if (font === null) {
        return fail([{ code: "font_unavailable", path }]);
      }
      for (const character of text) {
        if (!font.hasGlyphForCodePoint(character.codePointAt(0) as number)) {
          return fail([{ code: "font_unavailable", path }]);
        }
      }
      return ok((font.layout(text).advanceWidth / font.unitsPerEm) * style.size);
    },
  };
}

function loadFont(path: string): Font | null {
  try {
    return create(readFileSync(path)) as Font;
  } catch {
    return null;
  }
}
