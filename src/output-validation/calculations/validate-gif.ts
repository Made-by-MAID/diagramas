import type { ExpectedSize, GifRule, GifSummary, OutputCheck } from "../data/output-check";
import { gifLimits } from "../data/output-limits";

const SIGNATURE = "GIF89a";
const SCREEN_END = 13;
const IMAGE_DESCRIPTOR_LENGTH = 10;
const APPLICATION_NAME = "NETSCAPE2.0";

const INTRODUCER_EXTENSION = 0x21;
const INTRODUCER_IMAGE = 0x2c;
const TRAILER = 0x3b;
const LABEL_GRAPHIC_CONTROL = 0xf9;
const LABEL_APPLICATION = 0xff;
const LABEL_COMMENT = 0xfe;
const LABEL_PLAIN_TEXT = 0x01;

type Step = { readonly next: number } | { readonly rule: GifRule };

// Walks the block structure without ever decoding pixels: the bytes are untrusted.
export function validateGif(
  bytes: Uint8Array,
  expected: ExpectedSize,
): OutputCheck<GifSummary, GifRule> {
  if (bytes.length > gifLimits.fileBytes) {
    return reject("gif_too_large");
  }
  if (ascii(bytes, 0, SIGNATURE.length) !== SIGNATURE) {
    return reject("gif_bad_signature");
  }
  if (bytes.length < SCREEN_END) {
    return reject("gif_truncated");
  }
  const width = u16(bytes, 6);
  const height = u16(bytes, 8);
  if (!validSize(width, height, expected)) {
    return reject("gif_dimensions");
  }
  let position = SCREEN_END + colorTableLength(bytes[10] as number);
  if (position > bytes.length) {
    return reject("gif_truncated");
  }

  let frames = 0;
  let pixels = 0;
  let totalDelayCs = 0;
  let pendingDelay: number | null = null;
  let loop = false;
  let sawTrailer = false;

  while (position < bytes.length && !sawTrailer) {
    const introducer = bytes[position];
    if (introducer === TRAILER) {
      if (position !== bytes.length - 1) {
        return reject("gif_trailing_data");
      }
      sawTrailer = true;
    } else if (introducer === INTRODUCER_IMAGE) {
      if (pendingDelay === null || pendingDelay < gifLimits.minDelayCs) {
        return reject(
          position + IMAGE_DESCRIPTOR_LENGTH > bytes.length ? "gif_truncated" : "gif_delay",
        );
      }
      if (pendingDelay > gifLimits.maxDelayCs) {
        return reject("gif_delay");
      }
      const step = walkImage(bytes, position, width, height);
      if ("rule" in step) {
        return reject(step.rule);
      }
      frames += 1;
      pixels += u16(bytes, position + 5) * u16(bytes, position + 7);
      totalDelayCs += pendingDelay;
      pendingDelay = null;
      if (frames > gifLimits.frames) {
        return reject("gif_frame_count");
      }
      if (pixels > gifLimits.totalPixels) {
        return reject("gif_total_pixels");
      }
      if (totalDelayCs > gifLimits.totalDelayCs) {
        return reject("gif_total_delay");
      }
      position = step.next;
    } else if (introducer === INTRODUCER_EXTENSION) {
      if (position + 2 > bytes.length) {
        return reject("gif_truncated");
      }
      const label = bytes[position + 1];
      if (label === LABEL_GRAPHIC_CONTROL) {
        const step = walkGraphicControl(bytes, position, pendingDelay);
        if ("rule" in step) {
          return reject(step.rule);
        }
        pendingDelay = u16(bytes, position + 4);
        position = step.next;
      } else if (label === LABEL_APPLICATION) {
        const step = walkApplication(bytes, position, frames > 0 || loop);
        if ("rule" in step) {
          return reject(step.rule);
        }
        loop = true;
        position = step.next;
      } else if (label === LABEL_COMMENT) {
        return reject("gif_comment");
      } else if (label === LABEL_PLAIN_TEXT) {
        return reject("gif_plain_text");
      } else {
        return reject("gif_unknown_block");
      }
    } else {
      return reject("gif_unknown_block");
    }
  }

  if (!sawTrailer) {
    return reject("gif_truncated");
  }
  if (pendingDelay !== null) {
    return reject("gif_bad_graphic_control");
  }
  if (frames === 0) {
    return reject("gif_frame_count");
  }
  return { ok: true, value: { width, height, frames, pixels, totalDelayCs, loop } };
}

function walkGraphicControl(
  bytes: Uint8Array,
  position: number,
  pendingDelay: number | null,
): Step {
  const end = position + 8;
  if (end > bytes.length) {
    return { rule: "gif_truncated" };
  }
  if (pendingDelay !== null || bytes[position + 2] !== 4 || bytes[position + 7] !== 0) {
    return { rule: "gif_bad_graphic_control" };
  }
  return { next: end };
}

function walkApplication(bytes: Uint8Array, position: number, misplaced: boolean): Step {
  const nameStart = position + 3;
  if (nameStart > bytes.length) {
    return { rule: "gif_truncated" };
  }
  if (bytes[position + 2] !== APPLICATION_NAME.length) {
    return { rule: "gif_bad_application" };
  }
  const dataStart = nameStart + APPLICATION_NAME.length;
  const end = dataStart + 5;
  if (end > bytes.length) {
    return { rule: "gif_truncated" };
  }
  const isLoop =
    ascii(bytes, nameStart, APPLICATION_NAME.length) === APPLICATION_NAME &&
    bytes[dataStart] === 3 &&
    bytes[dataStart + 1] === 1 &&
    bytes[dataStart + 4] === 0;
  return misplaced || !isLoop ? { rule: "gif_bad_application" } : { next: end };
}

function walkImage(bytes: Uint8Array, position: number, width: number, height: number): Step {
  const dataStart = position + IMAGE_DESCRIPTOR_LENGTH;
  if (dataStart > bytes.length) {
    return { rule: "gif_truncated" };
  }
  const x = u16(bytes, position + 1);
  const y = u16(bytes, position + 3);
  const frameWidth = u16(bytes, position + 5);
  const frameHeight = u16(bytes, position + 7);
  if (frameWidth === 0 || frameHeight === 0 || x + frameWidth > width || y + frameHeight > height) {
    return { rule: "gif_frame_rectangle" };
  }
  const packed = bytes[position + 9] as number;
  if ((packed & 0x40) !== 0) {
    return { rule: "gif_interlaced" };
  }
  const lzwPosition = dataStart + colorTableLength(packed);
  if (lzwPosition >= bytes.length) {
    return { rule: "gif_truncated" };
  }
  const lzw = bytes[lzwPosition] as number;
  if (lzw < gifLimits.minLzwCode || lzw > gifLimits.maxLzwCode) {
    return { rule: "gif_lzw_code" };
  }
  return walkSubBlocks(bytes, lzwPosition + 1);
}

function walkSubBlocks(bytes: Uint8Array, start: number): Step {
  let position = start;
  while (position < bytes.length) {
    const size = bytes[position] as number;
    position += 1;
    if (size === 0) {
      return { next: position };
    }
    position += size;
  }
  return { rule: "gif_truncated" };
}

function colorTableLength(packed: number): number {
  return (packed & 0x80) === 0 ? 0 : 3 * 2 ** ((packed & 0x07) + 1);
}

function validSize(width: number, height: number, expected: ExpectedSize): boolean {
  return (
    width > 0 &&
    height > 0 &&
    width <= gifLimits.side &&
    height <= gifLimits.side &&
    width === expected.width &&
    height === expected.height
  );
}

function u16(bytes: Uint8Array, position: number): number {
  return (bytes[position] as number) | ((bytes[position + 1] as number) << 8);
}

function ascii(bytes: Uint8Array, start: number, length: number): string {
  return String.fromCharCode(...bytes.subarray(start, start + length));
}

function reject(rule: GifRule): OutputCheck<GifSummary, GifRule> {
  return { ok: false, rule };
}
