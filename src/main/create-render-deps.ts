import type { PrepareDeps } from "../flows/prepare-diagram";
import { createElkLayoutEngine } from "../layout/actions/create-elk-layout-engine";
import { createNodeProcessRunner } from "../render/actions/create-node-process-runner";
import { createNodeRenderWorkspace } from "../render/actions/create-node-render-workspace";
import type { RenderDeps } from "../render/data/render-ports";
import { createFontkitTextMeasurer } from "../text/actions/create-fontkit-text-measurer";
import { defaultFontRegistry } from "../theme/data/font-registry";
import { personalTheme } from "../theme/data/personal-theme";
import type { RegisteredFont, Theme } from "../theme/data/theme";

export type RenderOptions = {
  readonly fontsDir: string;
  readonly resvgPath?: string;
  readonly ffmpegPath?: string;
  readonly themes?: readonly Theme[];
  readonly fontRegistry?: readonly RegisteredFont[];
};

// The only place where the real binaries and adapters are wired.
export function createRenderDeps(options: RenderOptions): PrepareDeps & RenderDeps {
  const fontRegistry = options.fontRegistry ?? defaultFontRegistry;
  return {
    layoutEngine: createElkLayoutEngine(),
    textMeasurer: createFontkitTextMeasurer(options.fontsDir, fontRegistry),
    themes: options.themes ?? [personalTheme],
    fontRegistry,
    runner: createNodeProcessRunner({
      resvg: options.resvgPath ?? "resvg",
      ffmpeg: options.ffmpegPath ?? "ffmpeg",
    }),
    workspace: createNodeRenderWorkspace(),
    fontsDir: options.fontsDir,
  };
}
