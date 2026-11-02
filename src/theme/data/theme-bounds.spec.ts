import { describe, expect, it } from "vitest";
import { themeBounds } from "./theme-bounds";

describe("themeBounds", () => {
  it("declares a non-empty range for every numeric field", () => {
    for (const group of Object.values(themeBounds)) {
      for (const range of Object.values(group)) {
        expect(range.min).toBeLessThan(range.max);
      }
    }
  });
});
