# Roadmap

What the library does not do yet. There are no dates.

## New diagram types

Only `flowchart` exists today. Sequence, state and ERD (entity-relationship) are missing.

## Browser

The portable core (`maid-diagramas/core`) is already bundled for the browser in the tests, but these are missing:

- Playing the animation in the page, with `computeFrameState` in `requestAnimationFrame`.
- A `TextMeasurer` implementation for the browser: the current one, with fontkit, only runs on the server.
- Reviewing the obligations of the elkjs license (EPL-2.0) for anyone who distributes the package in web pages.

## Video

MP4 export. Today the animated output is GIF only.

## Verification with real binaries

Rendering with real `resvg` and `ffmpeg` has not been verified yet:

- The arguments of `build-resvg-args.ts` and `build-ffmpeg-args.ts` are tested, but have not run against both binaries together.
- `test/e2e/real-binaries.spec.ts` is skipped when a requirement is missing (see `docs/skipped-tests.md`).
- The prototype has not measured anything yet (see `docs/prototype.md`).
- The look of the shapes, the arrows and the animation has not been judged in PNG or GIF yet.

To close this item: install both binaries, point `DIAGRAMS_FONTS_DIR` at the Zilla Slab TTF files, and run `bun run test:coverage` and `bun run prototype`.

## Known limitations

- **Memory and disk of the binaries.** The library limits cover time, size and validity of the output. None of them limits the memory of `resvg` and `ffmpeg` or what they write to disk while running: the size is only checked after the process ends.
- **GIF pixel limit.** The limit is 131 million, but 80 full frames of 1280x1280 add up to 131,072,000. A GIF at the maximum size, with every frame full, is refused with `render_failed`. ffmpeg tends to crop frames, but this was not measured.
- **Process kept alive under Bun.** On load, elkjs assigns `self.onmessage`, and under Bun this keeps the process from exiting on its own. The CLI and the prototype call `process.exit`. Anyone using the library in a short script has to do the same.
