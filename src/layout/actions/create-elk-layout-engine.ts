import ELK from "elkjs/lib/elk.bundled.js";
import { fail } from "../../shared/fail";
import { fromElkGraph } from "../calculations/from-elk-graph";
import { toElkGraph } from "../calculations/to-elk-graph";
import type { LayoutEngine } from "../data/layout-engine";

export function createElkLayoutEngine(): LayoutEngine {
  const elk = new ELK();
  return {
    async layout(request) {
      try {
        return fromElkGraph(await elk.layout(toElkGraph(request)));
      } catch {
        return fail([{ code: "layout_failed", path: "$" }]);
      }
    },
  };
}
