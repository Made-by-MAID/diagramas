import type { NodeShape } from "../../contract/data/diagram";
import type { Box, Point } from "../../layout/data/layout-engine";
import type { Theme } from "../../theme/data/theme";

export type SceneLine = { readonly text: string; readonly x: number; readonly y: number };

export type SceneNode = Box & {
  readonly id: string;
  readonly shape: NodeShape;
  readonly fill: string;
  readonly stroke: string;
  readonly textColor: string;
  readonly lines: readonly SceneLine[];
};

export type SceneEdgeLabel = Box & { readonly lines: readonly SceneLine[] };

export type SceneEdge = {
  readonly id: string;
  readonly d: string;
  readonly points: readonly Point[];
  readonly arrow: string;
  readonly color: string;
  readonly dashed: boolean;
  readonly label: SceneEdgeLabel | null;
};

export type Scene = {
  readonly width: number;
  readonly height: number;
  readonly theme: Theme;
  readonly title: SceneLine;
  readonly nodes: readonly SceneNode[];
  readonly edges: readonly SceneEdge[];
};
