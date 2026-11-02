# ADR 0001: stack and structure

**Status:** accepted.

## Context

The library was designed to run on a server without a browser and, in the future, in web pages. The project prefers functional design, with data, calculations and actions kept apart, and TDD.

## Decision

- **Tools:** Bun (installation and execution), TypeScript, Biome, Vitest with istanbul coverage, archwarden and husky. Pinned versions (`bunfig.toml` with `exact = true`).
- **Modules by concept** in `src/`: `contract`, `theme`, `text`, `layout`, `svg`, `animation`, `render` and `output-validation`, each with `data/`, `calculations/` and `actions/` as needed. `flows/` orchestrates, `main/` wires the real implementations, `cli/` is the command-line edge, `shared/` is only pure, generic code.
- **Ports:** layout, text measurement, processes and the workspace are interfaces with a real and an in-memory implementation.
- **Style:** functions declared with `function`, never inside a `const`. A kebab-case file exports the camelCase function of the same name, with a `.spec` beside it.
- **Verification:** `bun run check` runs types, Biome, archwarden (`arch.config.json`) and `scripts/check-structure.ts` (exact versions, forbidden packages, function style, license inventory, required documents). Calculations and `shared/` require 100% coverage.

## Consequences and exceptions

- Type-only files have no `.spec`: there is nothing to call. archwarden enforces this with `skip_type_only`.
- Files in `data/` export constants named after the data, not functions.
- `core.ts` and `index.ts` are entry points and only re-export.
- **Vitest runs with `bun --bun`,** without Node. Coverage is istanbul because v8 coverage depends on the V8 inspector, which Bun does not have.
