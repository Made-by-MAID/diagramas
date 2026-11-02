import type { Direction } from "../../contract/data/diagram";
import type { Result } from "../../shared/result";

export type Point = { readonly x: number; readonly y: number };
export type Box = Point & { readonly width: number; readonly height: number };

export type LayoutRequestNode = {
  readonly key: string;
  readonly width: number;
  readonly height: number;
};

export type LayoutRequestEdge = {
  readonly key: string;
  readonly source: string;
  readonly target: string;
  readonly label: { readonly width: number; readonly height: number } | null;
};

// Numbers and generated keys only: nothing from the input reaches the layout engine.
export type LayoutRequest = {
  readonly direction: Direction;
  readonly nodeSpacing: number;
  readonly layerSpacing: number;
  readonly nodes: readonly LayoutRequestNode[];
  readonly edges: readonly LayoutRequestEdge[];
};

export type LayoutNode = Box & { readonly key: string };

export type LayoutEdge = {
  readonly key: string;
  readonly points: readonly Point[];
  readonly label: Box | null;
};

export type LayoutResult = {
  readonly width: number;
  readonly height: number;
  readonly nodes: readonly LayoutNode[];
  readonly edges: readonly LayoutEdge[];
};

export type LayoutEngine = {
  readonly layout: (request: LayoutRequest) => Promise<Result<LayoutResult>>;
};

export type MeasuredLabel = {
  readonly lines: readonly string[];
  readonly width: number;
  readonly height: number;
};

export type MeasuredDiagram = {
  readonly titleWidth: number;
  readonly nodes: readonly MeasuredLabel[];
  readonly edgeLabels: readonly (MeasuredLabel | null)[];
};
