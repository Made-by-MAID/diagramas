import { fail } from "../shared/fail";
import { ok } from "../shared/ok";
import type { DiagramError, Result } from "../shared/result";

export type CliOptions = {
  readonly input: string;
  readonly out: string;
  readonly fontsDir: string;
  readonly resvgPath?: string;
  readonly ffmpegPath?: string;
};

const FLAGS: Readonly<Record<string, keyof CliOptions>> = {
  "--input": "input",
  "--out": "out",
  "--fonts-dir": "fontsDir",
  "--resvg": "resvgPath",
  "--ffmpeg": "ffmpegPath",
};
const REQUIRED = ["--input", "--out", "--fonts-dir"];

export function parseCliArgs(args: readonly string[]): Result<CliOptions> {
  const errors: DiagramError[] = [];
  const values = new Map<string, string>();
  for (let index = 0; index < args.length; index += 2) {
    const flag = args[index] as string;
    const value = args[index + 1];
    if (!Object.hasOwn(FLAGS, flag)) {
      errors.push({ code: "unknown_field", path: flag });
    } else if (value === undefined) {
      errors.push({ code: "missing_field", path: flag });
    } else {
      values.set(flag, value);
    }
  }
  for (const flag of REQUIRED) {
    if (!values.has(flag)) {
      errors.push({ code: "missing_field", path: flag });
    }
  }
  if (errors.length > 0) {
    return fail(errors);
  }
  const options = Object.fromEntries(Array.from(values, ([flag, value]) => [FLAGS[flag], value]));
  return ok(options as CliOptions);
}
