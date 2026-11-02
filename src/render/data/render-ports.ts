export type RenderBinary = "resvg" | "ffmpeg";

export type ProcessRequest = {
  readonly binary: RenderBinary;
  readonly args: readonly string[];
  readonly timeoutMs: number;
};

export type ProcessOutcome = "exited" | "failed" | "timeout";

export type ProcessRunner = {
  readonly run: (request: ProcessRequest) => Promise<ProcessOutcome>;
};

export type WorkspaceDirs = {
  readonly root: string;
  readonly frames: string;
  readonly resources: string;
};

export type ReadOutcome = Uint8Array | "too_large" | "missing";

export type RenderWorkspace = {
  readonly open: () => Promise<WorkspaceDirs>;
  readonly writeText: (path: string, text: string) => Promise<void>;
  readonly readBytes: (path: string, maxBytes: number) => Promise<ReadOutcome>;
  readonly remove: (root: string) => Promise<void>;
};

export type RenderDeps = {
  readonly runner: ProcessRunner;
  readonly workspace: RenderWorkspace;
  readonly fontsDir: string;
};
