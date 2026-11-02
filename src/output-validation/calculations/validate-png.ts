import type { ExpectedSize, OutputCheck, PngRule } from "../data/output-check";
import { pngLimits } from "../data/output-limits";

const SIGNATURE = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];
const ALLOWED_CHUNKS = ["IHDR", "PLTE", "tRNS", "gAMA", "sRGB", "pHYs", "IDAT", "IEND"];
const CHUNK_OVERHEAD = 12;
const IHDR_LENGTH = 13;

export function validatePng(
  bytes: Uint8Array,
  expected: ExpectedSize,
): OutputCheck<ExpectedSize, PngRule> {
  if (bytes.length > pngLimits.fileBytes) {
    return reject("png_too_large");
  }
  if (bytes.length < SIGNATURE.length || !SIGNATURE.every((byte, i) => bytes[i] === byte)) {
    return reject("png_bad_signature");
  }
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  let position = SIGNATURE.length;
  let sawIhdr = false;
  let sawIdat = false;
  let sawIend = false;
  while (position < bytes.length && !sawIend) {
    if (position + CHUNK_OVERHEAD > bytes.length) {
      return reject("png_truncated");
    }
    const length = view.getUint32(position);
    const end = position + CHUNK_OVERHEAD + length;
    if (end > bytes.length) {
      return reject("png_truncated");
    }
    const type = String.fromCharCode(...bytes.subarray(position + 4, position + 8));
    if (!sawIhdr) {
      if (type !== "IHDR" || length !== IHDR_LENGTH) {
        return reject("png_ihdr_not_first");
      }
      const width = view.getUint32(position + 8);
      const height = view.getUint32(position + 12);
      if (!validSize(width, height, expected)) {
        return reject("png_dimensions");
      }
      sawIhdr = true;
    } else if (type === "IHDR") {
      return reject("png_repeated_ihdr");
    }
    if (!ALLOWED_CHUNKS.includes(type)) {
      return reject("png_unknown_chunk");
    }
    if (type === "IEND") {
      if (length !== 0) {
        return reject("png_bad_iend");
      }
      if (!sawIdat) {
        return reject("png_missing_idat");
      }
      sawIend = true;
    }
    sawIdat = sawIdat || type === "IDAT";
    position = end;
  }
  if (position < bytes.length) {
    return reject("png_trailing_data");
  }
  if (!sawIend) {
    return reject(sawIhdr ? "png_missing_iend" : "png_truncated");
  }
  return { ok: true, value: { width: expected.width, height: expected.height } };
}

function validSize(width: number, height: number, expected: ExpectedSize): boolean {
  return (
    width > 0 &&
    height > 0 &&
    width <= pngLimits.side &&
    height <= pngLimits.side &&
    width === expected.width &&
    height === expected.height
  );
}

function reject(rule: PngRule): OutputCheck<ExpectedSize, PngRule> {
  return { ok: false, rule };
}
