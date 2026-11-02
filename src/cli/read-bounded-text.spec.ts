import { Readable } from "node:stream";
import { describe, expect, it } from "vitest";
import { readBoundedText } from "./read-bounded-text";

describe("readBoundedText", () => {
  it("reads a stream into text", async () => {
    expect(await readBoundedText(Readable.from([Buffer.from("café")]), 100)).toBe("café");
  });

  it("stops one byte after the limit, so that the contract refuses the size", async () => {
    const stream = Readable.from([
      Buffer.alloc(50, 97),
      Buffer.alloc(50, 97),
      Buffer.alloc(50, 97),
    ]);
    expect((await readBoundedText(stream, 60)).length).toBe(61);
  });
});
