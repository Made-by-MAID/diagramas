type ResvgPaths = {
  readonly fontsDir: string;
  readonly resourcesDir: string;
  readonly svgPath: string;
  readonly pngPath: string;
};

export function buildResvgArgs(paths: ResvgPaths): readonly string[] {
  return [
    "--use-fonts-dir",
    paths.fontsDir,
    "--skip-system-fonts",
    "--resources-dir",
    paths.resourcesDir,
    paths.svgPath,
    paths.pngPath,
  ];
}
