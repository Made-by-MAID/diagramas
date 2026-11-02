import type { DiagramError } from "../../shared/result";
import type { ProcessOutcome } from "../data/render-ports";

export function processFailure(outcome: ProcessOutcome): readonly DiagramError[] | null {
  if (outcome === "exited") {
    return null;
  }
  return [{ code: outcome === "timeout" ? "render_timeout" : "render_failed", path: "$" }];
}
