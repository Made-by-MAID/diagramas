import { describe, expect, it } from "vitest";
import { processFailure } from "./process-failure";

describe("processFailure", () => {
  it("maps outcomes to fixed codes", () => {
    expect(processFailure("exited")).toBeNull();
    expect(processFailure("failed")).toEqual([{ code: "render_failed", path: "$" }]);
    expect(processFailure("timeout")).toEqual([{ code: "render_timeout", path: "$" }]);
  });
});
