import { join } from "node:path";

// The npm package carries WOFF subsets: enough for metrics, not for resvg, which needs TTF or OTF.
export const zillaFontsDir = join(
  import.meta.dirname,
  "../../node_modules/@fontsource/zilla-slab/files",
);

export const zillaRegistry = [
  {
    family: "Zilla Slab",
    regular: "zilla-slab-latin-400-normal.woff",
    bold: "zilla-slab-latin-700-normal.woff",
  },
];
