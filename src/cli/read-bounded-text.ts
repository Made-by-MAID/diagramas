import type { Readable } from "node:stream";

export async function readBoundedText(stream: Readable, maxBytes: number): Promise<string> {
  const chunks: Buffer[] = [];
  let total = 0;
  for await (const chunk of stream) {
    chunks.push(chunk as Buffer);
    total += (chunk as Buffer).length;
    if (total > maxBytes) {
      break;
    }
  }
  return Buffer.concat(chunks)
    .subarray(0, maxBytes + 1)
    .toString("utf8");
}
