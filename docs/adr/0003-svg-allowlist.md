# ADR 0003: allowlisted SVG

**Status:** accepted.

## Context

Labels come from a JSON the library does not control, sometimes generated automatically: they are potentially hostile input, and the SVG goes to a renderer and, in the future, to a web page.

## Decision

- **Own builder** (`svgElement`, `serializeSvg`), with no XML concatenation.
- **Allowlist** of elements and attributes in `svg/data/svg-schema.ts`, applied twice: by the type at compile time and by `serializeSvg` at run time, which refuses the whole document with `unsafe_svg`.
- **Outside the list:** DOCTYPE, `script`, `foreignObject`, `style`, `use`, `filter`, `image`, `href`, `xlink:href`.
- **No `url()`:** the serializer refuses `url(` and `javascript:` in any value. That is why arrowheads are polygons, not `marker`.
- **Text** only as an escaped text node. Control characters are refused in the contract and, again, in the serializer.
- **Ids** only with letters, digits, `_` and `-`; `__proto__`, `constructor` and `prototype` are refused, and ids never become object keys.
- **Numbers** with a fixed precision of 2 decimal places (4 for the pulse scale), never `-0`.
- **Determinism:** same input, same bytes. No clock, no randomness and no key order taken from the input.

## Output dimensions

The SVG keeps the layout `viewBox`, and `width` and `height` are reduced to fit the limit: 1280 per side for the GIF, 4096 for the PNG. Below half scale, where size 16 text would become 8, the result is `limit_exceeded`. This way a large flowchart still becomes a GIF, without illegible text.

## Consequences

A new element requires changing the list and its test, on purpose.
