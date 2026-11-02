import { describe, expect, it } from "vitest";
import { frameFileName } from "./frame-file-name";

describe("frameFileName", () => {
  it("pads the index to the pattern ffmpeg reads", () => {
    expect(frameFileName(0, "png")).toBe("000.png");
    expect(frameFileName(79, "svg")).toBe("079.svg");
  });
});
