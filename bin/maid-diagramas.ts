#!/usr/bin/env bun
import { createReadStream } from "node:fs";
import { readBoundedText } from "../src/cli/read-bounded-text";
import { runCli } from "../src/cli/run-cli";
import { diagramLimits } from "../src/contract/data/diagram-limits";
import { renderDiagramWithBinaries } from "../src/main/render-diagram-with-binaries";
import { renderToDirectory } from "../src/main/render-to-directory";

const exitCode = await runCli(process.argv.slice(2), {
  readFile: (path) => readBoundedText(createReadStream(path), diagramLimits.inputBytes),
  readStdin: () => readBoundedText(process.stdin, diagramLimits.inputBytes),
  writeLine: (line) => process.stdout.write(`${line}\n`),
  render: (text, out, options) =>
    renderToDirectory(text, out, (input) => renderDiagramWithBinaries(input, options)),
});

// Exit explicitly: under Bun, loading elkjs sets self.onmessage, which keeps the process alive.
process.stdout.write("", () => process.exit(exitCode));
