import { parseDiagram } from "../contract/calculations/parse-diagram";
import type { Diagram } from "../contract/data/diagram";
import { buildLayoutRequest } from "../layout/calculations/build-layout-request";
import { measureDiagram } from "../layout/calculations/measure-diagram";
import type { LayoutEngine } from "../layout/data/layout-engine";
import { fail } from "../shared/fail";
import { ok } from "../shared/ok";
import type { Result } from "../shared/result";
import { buildScene } from "../svg/calculations/build-scene";
import type { Scene } from "../svg/data/scene";
import type { TextMeasurer } from "../text/data/text-measurer";
import { resolveTheme } from "../theme/calculations/resolve-theme";
import { validateTheme } from "../theme/calculations/validate-theme";
import type { RegisteredFont, Theme } from "../theme/data/theme";

export type PrepareDeps = {
  readonly layoutEngine: LayoutEngine;
  readonly textMeasurer: TextMeasurer;
  readonly themes: readonly Theme[];
  readonly fontRegistry: readonly RegisteredFont[];
};

export type PreparedDiagram = {
  readonly diagram: Diagram;
  readonly theme: Theme;
  readonly scene: Scene;
};

export async function prepareDiagram(
  text: string,
  deps: PrepareDeps,
): Promise<Result<PreparedDiagram>> {
  const fontFamilies = deps.fontRegistry.map((font) => font.family);
  const themeNames = deps.themes.map((theme) => theme.name);
  const diagram = parseDiagram(text, { themeNames, fontFamilies });
  if (!diagram.ok) {
    return diagram;
  }
  const resolved = resolveTheme(diagram.value.theme, deps.themes);
  if (!resolved.ok) {
    return fail(resolved.errors);
  }
  const theme = validateTheme(resolved.value, fontFamilies);
  if (!theme.ok) {
    return theme;
  }
  const measured = measureDiagram(diagram.value, theme.value, deps.textMeasurer);
  if (!measured.ok) {
    return fail(measured.errors);
  }
  const request = buildLayoutRequest(diagram.value, theme.value, measured.value);
  const layout = await deps.layoutEngine.layout(request);
  if (!layout.ok) {
    return fail(layout.errors);
  }
  const scene = buildScene(diagram.value, theme.value, measured.value, layout.value);
  return ok({ diagram: diagram.value, theme: theme.value, scene });
}
