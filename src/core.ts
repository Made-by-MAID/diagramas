// Portable entry: no node:*, no disk. Tested by core.spec.ts, which bundles it for the browser.

export { buildTimeline } from "./animation/calculations/build-timeline";
export { computeFrameState } from "./animation/calculations/compute-frame-state";
export { planFrames } from "./animation/calculations/plan-frames";
export type { AnimationTimeline, FrameState } from "./animation/data/frame-state";
export { parseDiagram } from "./contract/calculations/parse-diagram";
export { validateDiagram } from "./contract/calculations/validate-diagram";
export type { Diagram } from "./contract/data/diagram";
export { diagramLimits } from "./contract/data/diagram-limits";
export { type PrepareDeps, type PreparedDiagram, prepareDiagram } from "./flows/prepare-diagram";
export { type FrameSequence, renderDiagramFrames } from "./flows/render-diagram-frames";
export { type RenderedSvg, renderDiagramSvg } from "./flows/render-diagram-svg";
export { createElkLayoutEngine } from "./layout/actions/create-elk-layout-engine";
export { createMemoryLayoutEngine } from "./layout/actions/create-memory-layout-engine";
export type { LayoutEngine } from "./layout/data/layout-engine";
export { validateGif } from "./output-validation/calculations/validate-gif";
export { validatePng } from "./output-validation/calculations/validate-png";
export { gifLimits, pngLimits } from "./output-validation/data/output-limits";
export type { DiagramError, ErrorCode, Result } from "./shared/result";
export { createMemoryTextMeasurer } from "./text/actions/create-memory-text-measurer";
export type { TextMeasurer } from "./text/data/text-measurer";
export { resolveTheme } from "./theme/calculations/resolve-theme";
export { defaultFontRegistry } from "./theme/data/font-registry";
export { personalTheme } from "./theme/data/personal-theme";
export type { RegisteredFont, Theme } from "./theme/data/theme";
