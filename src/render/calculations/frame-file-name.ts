export function frameFileName(index: number, extension: "svg" | "png"): string {
  return `${String(index).padStart(3, "0")}.${extension}`;
}
