import { describe, expect, it } from "vitest";
import { createMemoryProcessRunner } from "./create-memory-process-runner";

const request = { binary: "resvg", args: ["a"], timeoutMs: 1 } as const;

describe("createMemoryProcessRunner", () => {
  it("records calls and returns the fixed outcome", async () => {
    const runner = createMemoryProcessRunner(() => "failed");
    expect(await runner.run(request)).toBe("failed");
    expect(runner.calls).toEqual([request]);
  });

  it("defaults to success", async () => {
    expect(await createMemoryProcessRunner().run(request)).toBe("exited");
  });
});
