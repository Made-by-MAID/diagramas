# ADR 0004: text measurement

**Status:** accepted.

## Context

The layout needs the width of the labels before rendering. Without a browser, the font metrics must be read. The options are fontkit or a generated metrics table.

## Decision

Use **fontkit** at the edge, behind the `TextMeasurer` port.

- `createFontkitTextMeasurer(fontsDir, registry)` opens only files from the registry and uses the advance of `font.layout(text)`, which includes kerning.
- Measurement is synchronous. The font is loaded and cached the first time.
- A family outside the registry, a missing file or a missing glyph return `font_unavailable` with the field path (`nodes[2].label`). There is no silent fallback.
- Labels are normalized to NFC in the contract, so that an accented letter has a single spelling in measurement and in the SVG.

## Alternatives

**Generated metrics table:** portable and with no runtime dependency, but it is one more artifact to maintain for each font, and without kerning it lands further from the resvg result. It is still the likely path for the browser, where fontkit does not go: another implementation of the port is enough.

## Consequences

- Fontkit stays outside the core. The bundling test and archwarden enforce this.
- The tests use WOFF files from `@fontsource/zilla-slab`: the Latin subset, which covers accented Latin letters.
- resvg needs TTF or OTF, and the default registry points to `ZillaSlab-Regular.ttf` and `ZillaSlab-Bold.ttf`. The library user provides that directory; this repository does not distribute fonts.
- The measurer and resvg have different shaping engines. The real difference was not measured: it is the last column of the prototype (`docs/prototype.md`).
