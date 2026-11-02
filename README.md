# maid-diagramas

A library for flow diagrams, static and animated. It validates a flowchart JSON, lays it out, builds a themed SVG, computes the animation and renders PNG and GIF without a browser.

It is meant for anyone who needs to generate diagrams from data, including from a JSON they do not control, on a server without a browser and, with the portable core, in web pages.

Only flowcharts exist today. Sequence, state and ERD diagrams are on the [roadmap](docs/roadmap.md).

**Status:** the core is tested. Rendering with real `resvg` and `ffmpeg` **has not been verified end to end yet**. See [skipped tests](docs/skipped-tests.md) and [prototype](docs/prototype.md).

## Requirements

- [Bun](https://bun.sh) 1.4.4 (`mise.toml`). The package exposes TypeScript directly, with no build step.
- For PNG and GIF: see [Using it without a browser](#using-it-without-a-browser).

## Installation

The package is not published on npm. To use it as a dependency:

```sh
bun add github:maid-anime-ai/maid-diagramas
```

To work on the code, clone the repository and run:

```sh
bun install --frozen-lockfile
```

## Examples

Minimal flowchart, without animation (produces only a PNG):

```json
{
  "version": 1,
  "type": "flowchart",
  "title": "Order",
  "direction": "down",
  "nodes": [
    { "id": "start", "label": "Start", "shape": "terminal" },
    { "id": "paid", "label": "Is it paid?", "shape": "decision" },
    { "id": "ship", "label": "Ship", "shape": "process" }
  ],
  "edges": [
    { "id": "e1", "from": "start", "to": "paid" },
    { "id": "e2", "from": "paid", "to": "ship", "label": "yes" }
  ]
}
```

The same flow with animation (produces a PNG and a GIF):

```json
{
  "version": 1,
  "type": "flowchart",
  "title": "Order",
  "direction": "down",
  "nodes": [
    { "id": "start", "label": "Start", "shape": "terminal" },
    { "id": "paid", "label": "Is it paid?", "shape": "decision" },
    { "id": "ship", "label": "Ship", "shape": "process" }
  ],
  "edges": [
    { "id": "e1", "from": "start", "to": "paid" },
    { "id": "e2", "from": "paid", "to": "ship", "label": "yes" }
  ],
  "animation": {
    "durationMs": 4000,
    "fps": 20,
    "loop": true,
    "edges": [{ "edgeId": "e1", "effect": "packet" }, { "edgeId": "e2", "effect": "dash" }],
    "nodes": [{ "nodeId": "paid", "effect": "pulse" }]
  }
}
```

## Using it without a browser

The PNG and the GIF come from two external programs, called as child processes. No browser engine is used. Each frame becomes an SVG, `resvg` turns each SVG into a PNG, and `ffmpeg` joins the PNGs into a GIF.

You need:

- [`resvg`](https://github.com/linebender/resvg) 0.49 and [`ffmpeg`](https://ffmpeg.org) on the PATH, or given as options.
- A directory with `ZillaSlab-Regular.ttf` and `ZillaSlab-Bold.ttf`. The fonts are not in this repository; download them from [mozilla/zilla-slab](https://github.com/mozilla/zilla-slab) (OFL-1.1 license).

### Command line

```sh
bun bin/maid-diagramas.ts --input flow.json --out output --fonts-dir /path/to/fonts
cat flow.json | bun bin/maid-diagramas.ts --input - --out output --fonts-dir /path/to/fonts
```

| Option        | Required | Description                                    |
| ------------- | -------- | ---------------------------------------------- |
| `--input`     | yes      | JSON file, or `-` for stdin                    |
| `--out`       | yes      | Output directory, created if it does not exist |
| `--fonts-dir` | yes      | Directory of the registered fonts              |
| `--resvg`     | no       | Path to the binary (default: `resvg` on PATH)  |
| `--ffmpeg`    | no       | Path to the binary (default: `ffmpeg` on PATH) |

It writes `diagram.png` and, if there is an `animation` block, `diagram.gif`. Standard output gets one JSON line:

```json
{"ok":true,"files":["diagram.png","diagram.gif"]}
{"ok":false,"errors":[{"code":"unknown_reference","path":"edges[3].to"}]}
```

Exit code: `0` success, `1` input or render refused, `2` invalid arguments. An unreadable input file is reported as `invalid_json`, without the path.

### Library

The function equivalent to the command line:

```ts
import { renderDiagramWithBinaries } from "maid-diagramas";

const result = await renderDiagramWithBinaries(jsonText, {
  fontsDir: "/path/to/fonts",
  // optional: resvgPath, ffmpegPath, themes, fontRegistry
});

if (result.ok) {
  result.value.png; // Uint8Array
  result.value.gif; // Uint8Array, or null without an animation block
} else {
  result.errors; // [{ code, path }]
}
```

`renderToDirectory(text, directory, render)` does the same and writes the files.

**Note:** under Bun, loading elkjs keeps the process from exiting on its own. In a service this does not matter; in a short script, call `process.exit` at the end.

## Portable core

`maid-diagramas/core` does not import `node:*` and does not touch the disk: validation, layout, SVG and the animation state at each instant. A test bundles this entry point for the browser and fails if `node:*` gets in.

```ts
import {
  computeFrameState,
  createElkLayoutEngine,
  parseDiagram,
  prepareDiagram,
  renderDiagramSvg,
} from "maid-diagramas/core";
```

## The JSON

```json
{
  "version": 1,
  "type": "flowchart",
  "title": "Flow with everything",
  "direction": "down",
  "theme": { "extends": "personal", "colors": { "accent": "#D9480F" } },
  "nodes": [
    { "id": "a", "label": "Start", "shape": "terminal" },
    { "id": "b", "label": "Continue?", "shape": "decision", "style": { "fill": "#FFFFFF" } }
  ],
  "edges": [{ "id": "e1", "from": "a", "to": "b", "label": "yes", "style": { "line": "dashed" } }],
  "animation": {
    "durationMs": 4000,
    "fps": 20,
    "loop": true,
    "edges": [{ "edgeId": "e1", "effect": "packet" }],
    "nodes": [{ "nodeId": "b", "effect": "pulse" }]
  }
}
```

- **Required:** `version`, `type`, `title`, `direction`, `nodes`, `edges`; in each node `id`, `label`, `shape`; in each edge `id`, `from`, `to`.
- **Optional:** `theme` (default `personal`, the name of the built-in theme; a bare name is also accepted), `style`, edge label and `animation`.
- **`direction`:** `down` or `right`.
- **Shapes:** `process` (rectangle), `terminal` (chamfered corners), `decision` (diamond), `io` (parallelogram), `data` (cylinder).
- **Node `style`:** `fill`, `stroke`, `text`. **Edge `style`:** `color`, `line` (`solid` or `dashed`).
- **Effects:** `dash` and `packet` on an edge (both can coexist), `pulse` on a node. **`fps`:** 10, 20 or 25 (default 20). **`loop`:** default `true`.

The validator is closed: an undeclared field is an error. Each error carries a code and the path of the field.

Theme: see [docs/theme.md](docs/theme.md).

## Limits

| What                | Limit                                    | Error                                 |
| ------------------- | ---------------------------------------- | ------------------------------------- |
| Input               | 256 KB                                   | `limit_exceeded`                      |
| Nodes / edges       | 200 / 400                                | `limit_exceeded`                      |
| Text (title, label) | 200 characters, no control characters    | `limit_exceeded`, `control_character` |
| Id                  | 64 characters; letters, digits, `_`, `-` | `limit_exceeded`, `invalid_id`        |
| Frames              | 80 (4 s at 20 frames/s)                  | `limit_exceeded`                      |
| Sum of delays       | 5 s                                      | `limit_exceeded`                      |
| GIF side            | 1280, scaling down to half               | `limit_exceeded`                      |
| PNG side            | 4096, scaling down to half               | `limit_exceeded`                      |
| SVG of each frame   | 512 KB                                   | `limit_exceeded`                      |
| PNG / GIF           | 8 MiB / 10 MB                            | `attachment_too_large`                |
| Time per process    | resvg 10 s, ffmpeg 60 s                  | `render_timeout`                      |

Render failures use only `render_failed`, `render_timeout`, `limit_exceeded`, `attachment_too_large` and `font_unavailable`, with no path and no stack trace.

## Security

The library treats the input JSON and the output of the binaries as untrusted data:

- **Allowlisted SVG:** elements and attributes outside the list refuse the whole document with `unsafe_svg`. There is no `script`, `foreignObject`, `style`, `use`, `filter`, `image`, `href`, `xlink:href`, `url()` or `javascript:`. Text only enters as an escaped text node. Details in [ADR 0003](docs/adr/0003-svg-allowlist.md).
- **Processes:** fixed arguments, no shell and no text from the input. The child gets only `PATH` in its environment. `resvg` does not read system fonts or external resources, and `ffmpeg` only accepts the `file` protocol. Details in [ADR 0002](docs/adr/0002-browserless-renderer.md).
- **Output validation:** `validatePng` and `validateGif` walk the file chunk by chunk, without decoding pixels, and check signature, dimensions and limits. This includes each frame PNG before it reaches `ffmpeg`.

**What it does not limit:** the memory of `resvg` and `ffmpeg` and what they write to disk while running. The size is only checked after the process ends. With untrusted input, enforce those limits from the outside.

## Checks

```sh
bun run check          # types, Biome, archwarden and structure
bun run test:coverage  # tests, with 100% required in calculations and shared/
```

The tests with real binaries need `resvg` and `ffmpeg` on the PATH and `DIAGRAMS_FONTS_DIR` set to the directory of the TTF fonts. Without them, they are skipped and listed in [docs/skipped-tests.md](docs/skipped-tests.md), which every full run rewrites.

## How to measure

```sh
DIAGRAMS_FONTS_DIR=/path/to/fonts bun run prototype
```

It renders 80 frames of two synthetic flowcharts, measures time and GIF size, compares the measured width with the rendered one and writes the result to [docs/prototype.md](docs/prototype.md). Without the binaries and the fonts, the report says that nothing was measured.

## Documents

- Decisions: [docs/adr/](docs/adr/)
- [Roadmap](docs/roadmap.md)
- [Theme](docs/theme.md)
- [Licenses](docs/licenses.md)
- [Measurement prototype](docs/prototype.md)

## License

[MIT](LICENSE). Dependencies remain under their own licenses, listed in [docs/licenses.md](docs/licenses.md).

The layout uses [elkjs](https://github.com/kieler/elkjs), unmodified, under the Eclipse Public License 2.0 (EPL-2.0). Notices in [NOTICE](NOTICE); source at https://github.com/kieler/elkjs and https://github.com/eclipse/elk.
