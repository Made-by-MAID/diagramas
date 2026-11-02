# ADR 0002: browserless renderer

**Status:** accepted.

## Context

The library needs to produce PNG and GIF on a server without a browser, from the SVG it produces itself.

## Decision

- PNG through the **resvg 0.49 binary**, as a child process, one process per frame.
- GIF through **ffmpeg**, with `palettegen` and `paletteuse`.
- No MP4 for now.
- The processes sit behind the `ProcessRunner` port. The binaries are wired at a single point, `src/main/create-render-deps.ts`.

## Why not the alternatives

- **`@resvg/resvg-js`:** uses a fork of resvg 0.34, behind the chosen version, and loads native code into the library process. One process per frame isolates a crash or a hang.
- **Chromium or Playwright:** a large attack surface and memory footprint for a headless server, on arm64 and amd64, and the SVG here needs no browser engine.
- **gifski:** AGPL license.

## Security at the edge

- Fixed arguments, built by `buildResvgArgs` and `buildFfmpegArgs`, with no shell and no text from the input. The only derived values are validated integers (frames per second, frame count, loop).
- resvg: `--use-fonts-dir`, `--skip-system-fonts`, `--resources-dir` pointing at an empty directory.
- ffmpeg: `-protocol_whitelist file`, `image2` PNG input, metadata stripped, no `drawtext`, `movie`, `lavfi` or `concat`.
- The child gets only `PATH` in its environment, with no stdin or output.
- Maximum time and maximum size as constants in `render-limits.ts`.
- The output is untrusted data: `validatePng` and `validateGif` walk the chunks without decoding. This includes each frame PNG before it reaches ffmpeg.
- Errors only with fixed codes, with no path and no stack trace.

## Consequences

- One process per frame costs one `fork` and one `exec` per frame; the real cost is still to be measured (`docs/prototype.md`).
- If memory gets tight in `palettegen`, the planned way out is a fixed palette, not implemented yet.
- **Limitation:** none of this has been run against the real binaries. See `docs/roadmap.md`.
