export function blendColor(from: string, to: string, ratio: number): string {
  let blended = "#";
  for (const offset of [1, 3, 5]) {
    const start = Number.parseInt(from.slice(offset, offset + 2), 16);
    const end = Number.parseInt(to.slice(offset, offset + 2), 16);
    const channel = Math.round(start + (end - start) * ratio);
    blended += channel.toString(16).padStart(2, "0").toUpperCase();
  }
  return blended;
}
