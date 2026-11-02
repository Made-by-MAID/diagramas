import type { ProcessOutcome, ProcessRequest, ProcessRunner } from "../data/render-ports";

export type MemoryProcessRunner = ProcessRunner & { readonly calls: readonly ProcessRequest[] };

export function createMemoryProcessRunner(
  handler: (request: ProcessRequest) => ProcessOutcome = () => "exited",
): MemoryProcessRunner {
  const calls: ProcessRequest[] = [];
  return {
    calls,
    async run(request) {
      calls.push(request);
      return handler(request);
    },
  };
}
