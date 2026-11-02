import type { RenderWorkspace, WorkspaceDirs } from "../render/data/render-ports";
import { fail } from "../shared/fail";
import type { Result } from "../shared/result";

export async function withRenderWorkspace<T>(
  workspace: RenderWorkspace,
  work: (dirs: WorkspaceDirs) => Promise<Result<T>>,
): Promise<Result<T>> {
  try {
    const dirs = await workspace.open();
    try {
      return await work(dirs);
    } finally {
      await workspace.remove(dirs.root);
    }
  } catch {
    return fail([{ code: "render_failed", path: "$" }]);
  }
}
