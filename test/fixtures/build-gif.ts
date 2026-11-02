type FrameOptions = {
  readonly delayCs?: number;
  readonly x?: number;
  readonly y?: number;
  readonly width?: number;
  readonly height?: number;
  readonly interlaced?: boolean;
  readonly localColors?: number;
  readonly lzw?: number;
  readonly subBlocks?: readonly number[];
};

type GifOptions = {
  readonly width?: number;
  readonly height?: number;
  readonly signature?: string;
  readonly globalColors?: number;
};

export function ascii(text: string): number[] {
  return Array.from(text, (character) => character.charCodeAt(0));
}

export function u16(value: number): number[] {
  return [value & 255, (value >> 8) & 255];
}

export function gifHeader(options: GifOptions = {}): number[] {
  const { width = 10, height = 10, signature = "GIF89a", globalColors = 2 } = options;
  const packed = 0x80 | (Math.log2(globalColors) - 1);
  const table = new Array<number>(globalColors * 3).fill(0);
  return [...ascii(signature), ...u16(width), ...u16(height), packed, 0, 0, ...table];
}

export function netscapeLoop(loops = 0): number[] {
  return [0x21, 0xff, 11, ...ascii("NETSCAPE2.0"), 3, 1, ...u16(loops), 0];
}

export function graphicControl(delayCs = 5): number[] {
  return [0x21, 0xf9, 4, 0, ...u16(delayCs), 0, 0];
}

export function imageBlock(options: FrameOptions = {}): number[] {
  const { x = 0, y = 0, width = 10, height = 10, interlaced = false } = options;
  const { localColors = 0, lzw = 2, subBlocks = [2, 9, 9, 0] } = options;
  const localFlag = localColors > 0 ? 0x80 | (Math.log2(localColors) - 1) : 0;
  const packed = localFlag | (interlaced ? 0x40 : 0);
  const table = new Array<number>(localColors * 3).fill(0);
  return [
    0x2c,
    ...u16(x),
    ...u16(y),
    ...u16(width),
    ...u16(height),
    packed,
    ...table,
    lzw,
    ...subBlocks,
  ];
}

export function frame(options: FrameOptions = {}): number[] {
  return [...graphicControl(options.delayCs ?? 5), ...imageBlock(options)];
}

export function gif(...parts: readonly (readonly number[])[]): Uint8Array {
  return Uint8Array.from(parts.flat());
}

export function validGif(frames = 2): Uint8Array {
  const body = Array.from({ length: frames }, () => frame());
  return gif(gifHeader(), netscapeLoop(), ...body, [0x3b]);
}
