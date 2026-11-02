import { describe, expect, it } from "vitest";
import {
  ascii,
  frame,
  gif,
  gifHeader,
  graphicControl,
  imageBlock,
  netscapeLoop,
  u16,
  validGif,
} from "../../../test/fixtures/build-gif";
import { validateGif } from "./validate-gif";

const expected = { width: 10, height: 10 };
const trailer = [0x3b];

function ruleOf(bytes: Uint8Array, size = expected) {
  const result = validateGif(bytes, size);
  return result.ok ? null : result.rule;
}

describe("validateGif", () => {
  it("accepts a valid GIF and reports its totals", () => {
    expect(validateGif(validGif(3), expected)).toEqual({
      ok: true,
      value: {
        width: 10,
        height: 10,
        frames: 3,
        pixels: 300,
        totalDelayCs: 15,
        loop: true,
      },
    });
  });

  it("accepts a GIF without loop, with a local color table and no global one", () => {
    const header = [...ascii("GIF89a"), ...u16(10), ...u16(10), 0, 0, 0];
    const bytes = gif(header, frame({ localColors: 4 }), trailer);
    const result = validateGif(bytes, expected);
    expect(result.ok && result.value.loop).toBe(false);
  });

  it("refuses a file above 10 MB", () => {
    expect(ruleOf(new Uint8Array(10_000_001))).toBe("gif_too_large");
  });

  it("requires the exact GIF89a signature", () => {
    expect(ruleOf(gif(gifHeader({ signature: "GIF87a" }), frame(), trailer))).toBe(
      "gif_bad_signature",
    );
    expect(ruleOf(new Uint8Array(4))).toBe("gif_bad_signature");
  });

  it("refuses a header cut short, in the screen or in its color table", () => {
    expect(ruleOf(gif(ascii("GIF89a"), [1, 0]))).toBe("gif_truncated");
    expect(ruleOf(gif(gifHeader().slice(0, 15)))).toBe("gif_truncated");
  });

  it("requires the requested dimensions, up to 1280 per side", () => {
    expect(ruleOf(gif(gifHeader({ width: 11 }), frame(), trailer))).toBe("gif_dimensions");
    expect(ruleOf(gif(gifHeader({ height: 11 }), frame(), trailer))).toBe("gif_dimensions");
    const big = { width: 1281, height: 10 };
    expect(ruleOf(gif(gifHeader(big), frame(), trailer), big)).toBe("gif_dimensions");
    const tall = { width: 10, height: 1281 };
    expect(ruleOf(gif(gifHeader(tall), frame(), trailer), tall)).toBe("gif_dimensions");
    const empty = { width: 0, height: 10 };
    expect(ruleOf(gif(gifHeader(empty), frame(), trailer), empty)).toBe("gif_dimensions");
    const flat = { width: 10, height: 0 };
    expect(ruleOf(gif(gifHeader(flat), frame(), trailer), flat)).toBe("gif_dimensions");
  });

  it("requires 1 to 80 frames", () => {
    expect(ruleOf(gif(gifHeader(), netscapeLoop(), trailer))).toBe("gif_frame_count");
    const many = Array.from({ length: 81 }, () => frame({ delayCs: 2 }));
    expect(ruleOf(gif(gifHeader(), ...many, trailer))).toBe("gif_frame_count");
    const eighty = Array.from({ length: 80 }, () => frame({ delayCs: 2 }));
    expect(ruleOf(gif(gifHeader(), ...eighty, trailer))).toBeNull();
  });

  it("limits the sum of pixels to 131 million", () => {
    const size = { width: 1280, height: 1280 };
    const fullFrame = frame({ width: 1280, height: 1280, delayCs: 2 });
    const eighty = Array.from({ length: 80 }, () => fullFrame);
    expect(ruleOf(gif(gifHeader(size), ...eighty, trailer), size)).toBe("gif_total_pixels");
    expect(ruleOf(gif(gifHeader(size), ...eighty.slice(1), trailer), size)).toBeNull();
  });

  it("requires the frame rectangle inside the screen and not empty", () => {
    expect(ruleOf(gif(gifHeader(), frame({ x: 1 }), trailer))).toBe("gif_frame_rectangle");
    expect(ruleOf(gif(gifHeader(), frame({ y: 1 }), trailer))).toBe("gif_frame_rectangle");
    expect(ruleOf(gif(gifHeader(), frame({ width: 0 }), trailer))).toBe("gif_frame_rectangle");
    expect(ruleOf(gif(gifHeader(), frame({ height: 0 }), trailer))).toBe("gif_frame_rectangle");
    expect(ruleOf(gif(gifHeader(), frame({ x: 5, width: 5 }), trailer))).toBeNull();
  });

  it("refuses interlacing", () => {
    expect(ruleOf(gif(gifHeader(), frame({ interlaced: true }), trailer))).toBe("gif_interlaced");
  });

  it("requires the LZW minimum code between 2 and 8", () => {
    expect(ruleOf(gif(gifHeader(), frame({ lzw: 1 }), trailer))).toBe("gif_lzw_code");
    expect(ruleOf(gif(gifHeader(), frame({ lzw: 9 }), trailer))).toBe("gif_lzw_code");
    expect(ruleOf(gif(gifHeader(), frame({ lzw: 2 }), trailer))).toBeNull();
    expect(ruleOf(gif(gifHeader(), frame({ lzw: 8 }), trailer))).toBeNull();
  });

  it("requires a delay from 2 to 100 centiseconds on each frame", () => {
    expect(ruleOf(gif(gifHeader(), frame({ delayCs: 1 }), trailer))).toBe("gif_delay");
    expect(ruleOf(gif(gifHeader(), frame({ delayCs: 101 }), trailer))).toBe("gif_delay");
    expect(ruleOf(gif(gifHeader(), frame({ delayCs: 100 }), trailer))).toBeNull();
    expect(ruleOf(gif(gifHeader(), imageBlock(), trailer))).toBe("gif_delay");
  });

  it("limits the sum of delays to 5 s", () => {
    const six = Array.from({ length: 6 }, () => frame({ delayCs: 100 }));
    expect(ruleOf(gif(gifHeader(), ...six, trailer))).toBe("gif_total_delay");
    expect(ruleOf(gif(gifHeader(), ...six.slice(1), trailer))).toBeNull();
  });

  it("refuses a graphic control without a frame, repeated or malformed", () => {
    expect(ruleOf(gif(gifHeader(), frame(), graphicControl(), trailer))).toBe(
      "gif_bad_graphic_control",
    );
    expect(ruleOf(gif(gifHeader(), graphicControl(), frame(), trailer))).toBe(
      "gif_bad_graphic_control",
    );
    expect(ruleOf(gif(gifHeader(), [0x21, 0xf9, 3, 0, 5, 0, 0], imageBlock(), trailer))).toBe(
      "gif_bad_graphic_control",
    );
    expect(ruleOf(gif(gifHeader(), [0x21, 0xf9, 4, 0, 5, 0, 0, 1], imageBlock(), trailer))).toBe(
      "gif_bad_graphic_control",
    );
  });

  it("allows one NETSCAPE2.0 extension, before the first frame, for the loop only", () => {
    expect(ruleOf(gif(gifHeader(), netscapeLoop(), netscapeLoop(), frame(), trailer))).toBe(
      "gif_bad_application",
    );
    expect(ruleOf(gif(gifHeader(), frame(), netscapeLoop(), trailer))).toBe("gif_bad_application");
    const other = [0x21, 0xff, 11, ...ascii("XMP DataXMP"), 1, 1, 0];
    expect(ruleOf(gif(gifHeader(), other, frame(), trailer))).toBe("gif_bad_application");
    const wrongSize = [0x21, 0xff, 10, ...ascii("NETSCAPE2."), 3, 1, 0, 0, 0];
    expect(ruleOf(gif(gifHeader(), wrongSize, frame(), trailer))).toBe("gif_bad_application");
    const notLoop = [0x21, 0xff, 11, ...ascii("NETSCAPE2.0"), 3, 2, 0, 0, 0];
    expect(ruleOf(gif(gifHeader(), notLoop, frame(), trailer))).toBe("gif_bad_application");
    const longData = [0x21, 0xff, 11, ...ascii("NETSCAPE2.0"), 4, 1, 0, 0, 0, 0];
    expect(ruleOf(gif(gifHeader(), longData, frame(), trailer))).toBe("gif_bad_application");
    const noEnd = [0x21, 0xff, 11, ...ascii("NETSCAPE2.0"), 3, 1, 0, 0, 1];
    expect(ruleOf(gif(gifHeader(), noEnd, frame(), trailer))).toBe("gif_bad_application");
  });

  it("refuses comments and plain text", () => {
    expect(ruleOf(gif(gifHeader(), [0x21, 0xfe, 1, 65, 0], frame(), trailer))).toBe("gif_comment");
    expect(ruleOf(gif(gifHeader(), [0x21, 0x01, 1, 65, 0], frame(), trailer))).toBe(
      "gif_plain_text",
    );
  });

  it("refuses any other block or extension", () => {
    expect(ruleOf(gif(gifHeader(), [0x21, 0x99, 0], frame(), trailer))).toBe("gif_unknown_block");
    expect(ruleOf(gif(gifHeader(), [0x55], frame(), trailer))).toBe("gif_unknown_block");
  });

  it("requires sub-blocks inside the file", () => {
    expect(ruleOf(gif(gifHeader(), frame({ subBlocks: [200, 1, 2] }), trailer))).toBe(
      "gif_truncated",
    );
    expect(ruleOf(gif(gifHeader(), frame({ subBlocks: [2, 1, 2] })))).toBe("gif_truncated");
  });

  it("refuses blocks cut short", () => {
    expect(ruleOf(gif(gifHeader(), [0x21]))).toBe("gif_truncated");
    expect(ruleOf(gif(gifHeader(), [0x21, 0xf9, 4, 0]))).toBe("gif_truncated");
    expect(ruleOf(gif(gifHeader(), [0x21, 0xff, 11, 65]))).toBe("gif_truncated");
    expect(ruleOf(gif(gifHeader(), [0x2c, 0, 0]))).toBe("gif_truncated");
    expect(ruleOf(gif(gifHeader(), graphicControl(), [0x2c, 0, 0]))).toBe("gif_truncated");
    expect(ruleOf(gif(gifHeader(), [0x21, 0xff]))).toBe("gif_truncated");
    expect(
      ruleOf(gif(gifHeader(), graphicControl(), imageBlock({ localColors: 4 }).slice(0, 14))),
    ).toBe("gif_truncated");
    expect(ruleOf(gif(gifHeader(), frame().slice(0, 18)))).toBe("gif_truncated");
  });

  it("requires a trailer as the last byte", () => {
    expect(ruleOf(gif(gifHeader(), frame()))).toBe("gif_truncated");
    expect(ruleOf(gif(gifHeader(), frame(), trailer, [0]))).toBe("gif_trailing_data");
    expect(ruleOf(gif(gifHeader(), frame(), trailer, trailer))).toBe("gif_trailing_data");
  });
});
