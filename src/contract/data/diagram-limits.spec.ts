import { describe, expect, it } from "vitest";
import { diagramLimits } from "./diagram-limits";

describe("diagramLimits", () => {
  it("states the limits of the contract", () => {
    expect(diagramLimits).toEqual({
      inputBytes: 256 * 1024,
      nodes: 200,
      edges: 400,
      textLength: 200,
      idLength: 64,
    });
  });
});
