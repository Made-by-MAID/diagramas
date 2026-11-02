export type PngChunk = { readonly type: string; readonly data?: readonly number[] };

const SIGNATURE = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];

function u32(value: number): number[] {
  return [(value >>> 24) & 255, (value >>> 16) & 255, (value >>> 8) & 255, value & 255];
}

function ascii(text: string): number[] {
  return Array.from(text, (character) => character.charCodeAt(0));
}

export function ihdr(width: number, height: number): PngChunk {
  return { type: "IHDR", data: [...u32(width), ...u32(height), 8, 6, 0, 0, 0] };
}

export function buildPng(chunks: readonly PngChunk[]): Uint8Array {
  const bytes = [...SIGNATURE];
  for (const chunk of chunks) {
    const data = chunk.data ?? [];
    bytes.push(...u32(data.length), ...ascii(chunk.type), ...data, 0, 0, 0, 0);
  }
  return Uint8Array.from(bytes);
}

export function validPng(width = 10, height = 10): Uint8Array {
  return buildPng([ihdr(width, height), { type: "IDAT", data: [1, 2, 3] }, { type: "IEND" }]);
}
