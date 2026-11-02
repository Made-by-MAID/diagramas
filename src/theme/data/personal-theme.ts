import type { Theme } from "./theme";

// Single source of the default theme values. See docs/theme.md.
export const personalTheme: Theme = {
  name: "personal",
  colors: {
    background: "#F6F1E6",
    nodeFill: "#FBF8F1",
    nodeStroke: "#1F1B16",
    text: "#1F1B16",
    edge: "#3A342C",
    accent: "#E8590C",
  },
  font: { family: "Zilla Slab", size: 16, titleSize: 26 },
  stroke: { width: 2, cornerRadius: 0 },
  spacing: { node: 40, layer: 60, padding: 32 },
};
