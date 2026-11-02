# Measurement prototype

**Not measured.** No number in this report exists, because the prototype could not run in this environment.

Reason:

- `resvg` is not on the PATH of this environment.
- `DIAGRAMS_FONTS_DIR` does not point to a directory with `ZillaSlab-Regular.ttf` and `ZillaSlab-Bold.ttf`.

Still to measure: time per frame and in total, GIF size, appearance (aliasing and banding) and measured against rendered width for accented text.

How to measure, on a machine with `resvg` 0.49 and `ffmpeg` on the PATH and the Zilla Slab TTF fonts in a directory:

```sh
DIAGRAMS_FONTS_DIR=/path/to/fonts bun run prototype
```

The script rewrites this file with the result.
