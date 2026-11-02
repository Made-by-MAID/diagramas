import { gifLimits, pngLimits } from "../../output-validation/data/output-limits";

export const renderLimits = {
  resvgTimeoutMs: 10_000,
  ffmpegTimeoutMs: 60_000,
  pngBytes: pngLimits.fileBytes,
  gifBytes: gifLimits.fileBytes,
  pngSide: pngLimits.side,
} as const;
