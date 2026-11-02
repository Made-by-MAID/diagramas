import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import type { RenderedDiagram } from "../flows/render-diagram";
import { fail } from "../shared/fail";
import { ok } from "../shared/ok";
import type { Result } from "../shared/result";

export type WrittenFiles = { readonly files: readonly string[] };

export async function renderToDirectory(
  text: string,
  directory: string,
  render: (text: string) => Promise<Result<RenderedDiagram>>,
): Promise<Result<WrittenFiles>> {
  const rendered = await render(text);
  if (!rendered.ok) {
    return rendered;
  }
  const { png, gif } = rendered.value;
  const outputs: readonly (readonly [string, Uint8Array])[] =
    gif === null
      ? [["diagram.png", png]]
      : [
          ["diagram.png", png],
          ["diagram.gif", gif],
        ];
  try {
    await mkdir(directory, { recursive: true });
    for (const [name, bytes] of outputs) {
      await writeFile(join(directory, name), bytes);
    }
  } catch {
    return fail([{ code: "render_failed", path: "$" }]);
  }
  return ok({ files: outputs.map(([name]) => name) });
}
