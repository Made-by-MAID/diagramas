import { describe, expect, it } from "vitest";
import { createNodeProcessRunner } from "./create-node-process-runner";

const runner = createNodeProcessRunner({ resvg: "/bin/sh", ffmpeg: "/nonexistent/ffmpeg" });

describe("createNodeProcessRunner", () => {
  it("reports a clean exit", async () => {
    const outcome = await runner.run({ binary: "resvg", args: ["-c", "exit 0"], timeoutMs: 5000 });
    expect(outcome).toBe("exited");
  });

  it("reports a failing exit", async () => {
    const outcome = await runner.run({ binary: "resvg", args: ["-c", "exit 3"], timeoutMs: 5000 });
    expect(outcome).toBe("failed");
  });

  it("kills a process on timeout", async () => {
    const outcome = await runner.run({ binary: "resvg", args: ["-c", "sleep 5"], timeoutMs: 50 });
    expect(outcome).toBe("timeout");
  });

  it("reports a binary that cannot start", async () => {
    const outcome = await runner.run({ binary: "ffmpeg", args: [], timeoutMs: 5000 });
    expect(outcome).toBe("failed");
  });

  it("does not hand the environment over to the child", async () => {
    process.env.DIAGRAMS_PROBE = "leak";
    const outcome = await runner.run({
      binary: "resvg",
      args: ["-c", 'test -z "$DIAGRAMS_PROBE"'],
      timeoutMs: 5000,
    });
    delete process.env.DIAGRAMS_PROBE;
    expect(outcome).toBe("exited");
  });
});
