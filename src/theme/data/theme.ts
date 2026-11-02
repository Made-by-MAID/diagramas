export type ThemeColors = {
  readonly background: string;
  readonly nodeFill: string;
  readonly nodeStroke: string;
  readonly text: string;
  readonly edge: string;
  readonly accent: string;
};

export type ThemeFont = {
  readonly family: string;
  readonly size: number;
  readonly titleSize: number;
};

export type ThemeStroke = {
  readonly width: number;
  readonly cornerRadius: number;
};

export type ThemeSpacing = {
  readonly node: number;
  readonly layer: number;
  readonly padding: number;
};

export type Theme = {
  readonly name: string;
  readonly colors: ThemeColors;
  readonly font: ThemeFont;
  readonly stroke: ThemeStroke;
  readonly spacing: ThemeSpacing;
};

export type ThemeOverrides = {
  readonly colors: Partial<ThemeColors>;
  readonly font: Partial<ThemeFont>;
  readonly stroke: Partial<ThemeStroke>;
  readonly spacing: Partial<ThemeSpacing>;
};

export type ThemeRef = ThemeOverrides & { readonly extends: string };

export type RegisteredFont = {
  readonly family: string;
  readonly regular: string;
  readonly bold: string;
};
