import { spawn } from "node:child_process";
import type { ProcessOutcome, ProcessRunner, RenderBinary } from "../data/render-ports";

export function createNodeProcessRunner(
  binaries: Readonly<Record<RenderBinary, string>>,
): ProcessRunner {
  return {
    run(request) {
      return new Promise<ProcessOutcome>((resolve) => {
        const child = spawn(binaries[request.binary], [...request.args], {
          shell: false,
          stdio: "ignore",
          env: { PATH: process.env.PATH ?? "" },
        });
        const timer = setTimeout(() => {
          child.kill("SIGKILL");
          resolve("timeout");
        }, request.timeoutMs);
        child.once("error", () => {
          clearTimeout(timer);
          resolve("failed");
        });
        child.once("close", (code) => {
          clearTimeout(timer);
          resolve(code === 0 ? "exited" : "failed");
        });
      });
    },
  };
}
