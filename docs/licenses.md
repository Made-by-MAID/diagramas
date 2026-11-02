# License inventory

The library is distributed under the MIT License ([LICENSE](../LICENSE)). Dependencies are used without modification and remain under their own licenses; the notices are in [NOTICE](../NOTICE).

Exact versions, checked against the `package.json` of each installed package. `bun run check` fails if a direct dependency is missing from this list.

## Runtime dependencies

| Package               | Version | License                     | Note                                                                                                   |
| --------------------- | ------- | --------------------------- | ------------------------------------------------------------------------------------------------------ |
| `elkjs`               | 0.12.1  | EPL-2.0 OR GPL-3.0-or-later | Used under EPL-2.0, without modification. Notices in `NOTICE`. Source: https://github.com/kieler/elkjs |
| `svg-path-properties` | 2.2.0   | ISC                         | Position and tangent along the edge path                                                               |
| `fontkit`             | 2.0.4   | MIT                         | Only at the edge (text measurement), outside the core                                                  |

### Transitive (all come from `fontkit`)

| Package              | Version | License    |
| -------------------- | ------- | ---------- |
| `@swc/helpers`       | 0.5.23  | Apache-2.0 |
| `tslib`              | 2.9.1   | 0BSD       |
| `brotli`             | 1.3.3   | MIT        |
| `base64-js`          | 1.5.1   | MIT        |
| `clone`              | 2.1.2   | MIT        |
| `dfa`                | 1.2.0   | MIT        |
| `fast-deep-equal`    | 3.1.3   | MIT        |
| `restructure`        | 3.0.2   | MIT        |
| `tiny-inflate`       | 1.0.3   | MIT        |
| `unicode-properties` | 1.4.1   | MIT        |
| `unicode-trie`       | 2.0.0   | MIT        |
| `pako`               | 0.2.9   | MIT        |

## Development dependencies (not distributed)

| Package                     | Version | License           | Use                          |
| --------------------------- | ------- | ----------------- | ---------------------------- |
| `@biomejs/biome`            | 2.6.4   | MIT OR Apache-2.0 | Formatting and lint          |
| `@fontsource/zilla-slab`    | 5.3.0   | OFL-1.1           | Real metrics in tests (WOFF) |
| `@types/bun`                | 1.4.4   | MIT               | Types                        |
| `@types/fontkit`            | 2.0.9   | MIT               | Types                        |
| `@vitest/coverage-istanbul` | 5.0.5   | MIT               | Coverage                     |
| `archwarden`                | 0.37.0  | MIT OR Apache-2.0 | Structure rules              |
| `husky`                     | 9.1.7   | MIT               | Git hook                     |
| `typescript`                | 7.0.2   | Apache-2.0        | Types                        |
| `vitest`                    | 5.0.5   | MIT               | Tests                        |

Transitive development dependencies were not inventoried one by one: they are not part of what is distributed.

## External binaries (not npm dependencies)

| Binary | Version used           | License                                                     | Note                                           |
| ------ | ---------------------- | ----------------------------------------------------------- | ---------------------------------------------- |
| resvg  | 0.49                   | Apache-2.0 OR MIT (check on installation)                   | Installed by the user, outside this repository |
| ffmpeg | whichever is installed | LGPL or GPL, depending on the build (check on installation) | Installed by the user, outside this repository |

The binary licenses are indicative: check the ones of the build you install.

## Fonts

This repository **does not version or distribute font files**. The default theme uses Zilla Slab (Copyright 2017, The Mozilla Foundation), under the SIL Open Font License 1.1 (OFL-1.1):

- **In the tests:** the WOFF files of `@fontsource/zilla-slab` 5.3.0, a development dependency, which ships the OFL text in its own `LICENSE` file. Package integrity, recorded in `bun.lock`: `sha512-xbdDx5OESJDQqp3GIp4pjBgI+qpcg4AxnHLN15ekfJbG+ZYaOXg3uBjDpYlkuPQpey91afxHBNaqZgzluJ2FWA==`.
- **To produce PNG and GIF:** the user downloads the TTF files (https://github.com/mozilla/zilla-slab) and passes their directory. Anyone who redistributes the fonts must include the OFL text with them.

## Forbidden

`gifski` (AGPL), `@resvg/resvg-js` (uses a fork of resvg 0.34), Playwright and Chromium. `bun run check` fails if any of them appears in `package.json` or `bun.lock`.
