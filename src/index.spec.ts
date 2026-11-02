import { describe, expect, it } from "vitest";
import * as library from "./index";

describe("public library", () => {
  it("exposes the core and the function equivalent to the CLI", () => {
    expect(library).toHaveProperty("parseDiagram");
    expect(library).toHaveProperty("renderDiagramWithBinaries");
    expect(library).toHaveProperty("renderToDirectory");
    expect(library).toHaveProperty("createFontkitTextMeasurer");
  });
});
