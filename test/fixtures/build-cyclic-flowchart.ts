const SHAPES = ["process", "terminal", "decision", "io", "data"];

// A synthetic flowchart with accents and cycles, used by tests and by the prototype script.
export function buildCyclicFlowchart(size: number): string {
  const nodes = Array.from({ length: size }, (_, index) => ({
    id: `n${index}`,
    label: `Step nº ${index} — café`,
    shape: SHAPES[index % SHAPES.length],
  }));
  const edges = nodes.flatMap((node, index) => [
    { id: `f${index}`, from: node.id, to: `n${(index + 1) % size}` },
    ...(index % 5 === 4 ? [{ id: `b${index}`, from: node.id, to: `n${index - 4}` }] : []),
  ]);
  return JSON.stringify({
    version: 1,
    type: "flowchart",
    title: `Synthetic flowchart with ${size} nodes`,
    direction: "right",
    nodes,
    edges,
    animation: {
      durationMs: 4000,
      fps: 20,
      loop: true,
      edges: [
        { edgeId: "f0", effect: "dash" },
        { edgeId: "f1", effect: "packet" },
      ],
      nodes: [{ nodeId: "n2", effect: "pulse" }],
    },
  });
}
