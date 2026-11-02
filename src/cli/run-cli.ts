import type { WrittenFiles } from "../main/render-to-directory";
import type { Result } from "../shared/result";
import { type CliOptions, parseCliArgs } from "./parse-cli-args";

export type CliDeps = {
  readonly readFile: (path: string) => Promise<string>;
  readonly readStdin: () => Promise<string>;
  readonly writeLine: (line: string) => void;
  readonly render: (
    text: string,
    out: string,
    options: CliOptions,
  ) => Promise<Result<WrittenFiles>>;
};

const EXIT_OK = 0;
const EXIT_FAILED = 1;
const EXIT_USAGE = 2;

export async function runCli(args: readonly string[], deps: CliDeps): Promise<number> {
  const options = parseCliArgs(args);
  if (!options.ok) {
    deps.writeLine(JSON.stringify({ ok: false, errors: options.errors }));
    return EXIT_USAGE;
  }
  const { input, out } = options.value;
  let text: string;
  try {
    text = input === "-" ? await deps.readStdin() : await deps.readFile(input);
  } catch {
    deps.writeLine(JSON.stringify({ ok: false, errors: [{ code: "invalid_json", path: "$" }] }));
    return EXIT_FAILED;
  }
  const result = await deps.render(text, out, options.value);
  if (!result.ok) {
    deps.writeLine(JSON.stringify({ ok: false, errors: result.errors }));
    return EXIT_FAILED;
  }
  deps.writeLine(JSON.stringify({ ok: true, files: result.value.files }));
  return EXIT_OK;
}
