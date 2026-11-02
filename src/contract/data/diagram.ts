import type { ThemeRef } from "../../theme/data/theme";

export type NodeShape = "process" | "terminal" | "decision" | "io" | "data";
export type Direction = "down" | "right";
export type EdgeEffect = "dash" | "packet";
export type NodeEffect = "pulse";
export type Fps = 10 | 20 | 25;
export type EdgeLine = "solid" | "dashed";

export type NodeStyle = {
  readonly fill?: string;
  readonly stroke?: string;
  readonly text?: string;
};

export type EdgeStyle = {
  readonly color?: string;
  readonly line?: EdgeLine;
};

export type DiagramNode = {
  readonly id: string;
  readonly label: string;
  readonly shape: NodeShape;
  readonly style: NodeStyle;
};

export type DiagramEdge = {
  readonly id: string;
  readonly from: string;
  readonly to: string;
  readonly label?: string;
  readonly style: EdgeStyle;
};

export type EdgeAnimation = { readonly edgeId: string; readonly effect: EdgeEffect };
export type NodeAnimation = { readonly nodeId: string; readonly effect: NodeEffect };

export type DiagramAnimation = {
  readonly durationMs: number;
  readonly fps: Fps;
  readonly loop: boolean;
  readonly edges: readonly EdgeAnimation[];
  readonly nodes: readonly NodeAnimation[];
};

export type Diagram = {
  readonly version: 1;
  readonly type: "flowchart";
  readonly title: string;
  readonly direction: Direction;
  readonly theme: ThemeRef;
  readonly nodes: readonly DiagramNode[];
  readonly edges: readonly DiagramEdge[];
  readonly animation?: DiagramAnimation;
};

export type ValidationContext = {
  readonly themeNames: readonly string[];
  readonly fontFamilies: readonly string[];
};
