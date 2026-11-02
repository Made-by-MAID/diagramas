export const themeBounds = {
  font: {
    size: { min: 8, max: 48 },
    titleSize: { min: 8, max: 72 },
  },
  stroke: {
    width: { min: 0.5, max: 8 },
    cornerRadius: { min: 0, max: 32 },
  },
  spacing: {
    node: { min: 4, max: 200 },
    layer: { min: 4, max: 200 },
    padding: { min: 0, max: 200 },
  },
} as const;
