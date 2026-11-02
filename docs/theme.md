# Theme

The theme is data: the library receives it as a parameter and reads nothing from outside at run time.

- Values of the default theme, called `personal`: `src/theme/data/personal-theme.ts`. Paper-colored background, dark ink, orange accent, nothing rounded, and Zilla Slab.
- Font registry (family to files): `src/theme/data/font-registry.ts`. A family outside the registry is refused with `unknown_font`, so a URL never reaches the SVG.
- Numeric limits: `src/theme/data/theme-bounds.ts`.

## Use in the diagram

```json
{ "theme": "personal" }
{ "theme": { "extends": "personal", "colors": { "accent": "#112233" }, "font": { "size": 18 } } }
```

An override changes only the overridden field. Without `theme`, `personal` applies.

## Custom theme

Pass the `themes` list to `renderDiagramWithBinaries` (and `fontRegistry`, if the theme uses another font). A diagram picks the theme by its `name` field. The list replaces the default one: keep `personalTheme` in it if any diagram omits `theme`. The chosen theme goes through `validateTheme`, with the same rules for `#RRGGBB` colors, registered font and limits.
