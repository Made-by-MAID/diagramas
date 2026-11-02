export const pngLimits = {
  fileBytes: 8 * 1024 * 1024,
  side: 4096,
} as const;

export const gifLimits = {
  fileBytes: 10_000_000,
  side: 1280,
  frames: 80,
  totalPixels: 131_000_000,
  minDelayCs: 2,
  maxDelayCs: 100,
  totalDelayCs: 500,
  minLzwCode: 2,
  maxLzwCode: 8,
} as const;
