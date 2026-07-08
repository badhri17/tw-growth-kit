# AGENTS.md

This file provides guidance to Codex (Codex.ai/code) when working with code in this repository.

## Project Context

**Growth Kit** is a premium custom component bundle for the **Salla Themes Marketplace**, targeting Arabic-speaking (primarily Saudi) merchants. The goal is to make Salla store home pages feel premium and conversion-optimized, differentiating from the basic built-in theme components.

- **Platform:** Salla Twilight Engine — 60,000+ merchants
- **Bundle v1 components:** 5 (Hero, Story Slider, Before & After, Featured Product, Collection Components)
- **Language priority:** Arabic-first (RTL default), LTR as fallback

## Commands

```bash
pnpm dev              # Start dev server with live demo page (hot reload)
pnpm build            # Production build → dist/ (one JS file per component)
pnpm preview          # Preview production build locally

pnpm tw-create-component <name>   # Scaffold a new component (kebab-case name)
pnpm tw-delete-component <name>   # Remove a component and its bundle entry
```

There is no test runner configured in this project.

To preview only specific components during dev, uncomment and edit the `components` array in `vite.config.ts`:
```ts
sallaDemoPlugin({ components: ['hero', 'table-list'] })
```

## Architecture

This is a **Salla Twilight custom component bundle** — Web Components built with [Lit](https://lit.dev/) + TypeScript, deployed to Salla's e-commerce platform. Merchants configure components via the Salla admin panel; the platform injects saved config into each component at runtime.

### How components get built and registered

Three Vite plugins from `@salla.sa/twilight-bundles` drive the build:

| Plugin | Role |
|---|---|
| `sallaTransformPlugin` | Transforms `src/components/*/index.ts` — injects the Salla registration call |
| `sallaBuildPlugin` | Bundles each component into a separate `dist/<name>.js`; marks `lit` as external |
| `sallaDemoPlugin` | Spins up a demo page for development |

The transform plugin appends `ClassName.registerSallaComponent(key)` to each component file, which calls `window.Salla.bundles.registerComponent(key, { component, dynamicTagName })`. The static method lives on the shared `GrowthElement` base class (statics inherit), with a polling fallback for contexts where `Salla` loads after the component file executes.

⚠️ The transform takes `ClassName` from the **first `class <word>` token in the file — comments included**. Never write the word "class" followed by another word (even inside a doc comment) above the component class declaration, or registration silently targets the wrong name.

### Shared code — `src/shared/`

Cross-component code has a single source of truth in `src/shared/`:

- `growth-element.ts` — `GrowthElement` base class (extends `LitElement`) that every component extends: the `registerSallaComponent` bridge plus protected helpers `_t` (multilang), `_lang`, `_pickValue` (dropdowns), `_num` / `_toLatinDigits` (numbers, Arabic-Indic digit aware).
- `product.ts` — Salla product plumbing: `sallaGlobal`, `pickerSelection`, `fetchProductDetails`, `parseMoney`, `formatMoney`, and the `ResolvedProduct` shape.
- `types.ts` — `MaybeMultiLang`.

Component isolation in `dist/` is preserved by `duplicateSharedPerComponentPlugin` in `vite.config.ts`: it tags every `src/shared/*` import with the importing component (`?gk=<name>`) so Rollup inlines a private copy into each `dist/<name>.js`. **Do not remove it** — without it the multi-entry build splits shared modules into hashed chunk files (`dist/growth-element-<hash>.js`), breaking the one-self-contained-file-per-component contract. Corollary: module-level state in `src/shared/` is per-component at runtime, never shared across components.

### `twilight-bundle.json` — the source of truth for the admin UI

Every component must have an entry in `twilight-bundle.json`. This file defines:
- Bundle metadata (name, description, author)
- Per-component: `name` (matches the folder in `src/components/`), a UUID `key`, and a `fields` array

The `fields` array drives what the Salla merchant panel renders as settings. Field types include `string`, `boolean`, `items` (dropdown), `collection`, and `static` (UI-only dividers/titles). All merchant-facing `label`, `placeholder`, and `title` values must be written in **Arabic**. The create/delete scripts keep `twilight-bundle.json` in sync with `src/components/`.

### Component structure

Each component lives in `src/components/<name>/` with `index.ts` as the entry point. Optional `style.ts` and `types.ts` can be co-located.

Every component must:
1. Extend `GrowthElement` (from `src/shared/growth-element`) and export the class as default
2. Declare a single `@property({ type: Object }) config?` that receives all merchant settings
3. Have a matching entry in `twilight-bundle.json`

```ts
import { GrowthElement } from "../../shared/growth-element";

export default class MyComponent extends GrowthElement {
  @property({ type: Object })
  config?: { title?: string; /* ... */ };

  static styles = css`/* ... */`;

  render() {
    return html`<div>${this._t(this.config?.title)}</div>`;
  }
}
```

### Handling multilanguage values

Fields marked `multilanguage: true` arrive as `string | { ar?: string; en?: string } | null`. Resolve with the inherited `this._t(value)` from `GrowthElement` — never re-implement it per component.

### Handling dropdown-list values

`items` fields (dropdowns) can arrive as a plain string **or** as `[{ label, value }]` — resolve with the inherited `this._pickValue(value, fallback)`. Numeric fields (which may arrive as strings, Arabic-Indic digits, or dropdown arrays) go through the inherited `this._num(value, fallback)`. Both live on `GrowthElement`.

### Windows-specific note

`vite.config.ts` includes `fixWindowsDemoFsUrlsPlugin` which patches `/@fs/C:/...` style URLs in the demo HTML. Required for the demo to work on Windows — do not remove.

## Bundle v1 — Component Lineup

| # | Arabic Name | English Name | Notes |
|---|---|---|---|
| 1 | واجهة المتجر | Store Hero | Single background (video/image/gradient) + headline + CTA. RTL/LTR. No multi-image. |
| 2 | سلايدر القصة | Story Slider | Multi-image carousel for brand storytelling. Handles all multi-slide scenarios. |
| 3 | سلايدر قبل وبعد | Before & After | Draggable visual comparison between two images. |
| 4 | المنتج المميز | Featured Product | Cinematic single-product spotlight with buy button. |
| 5 | مكونات المجموعة | Collection Components | **Flagship.** Swiper coverflow carousel: 3 visible slides, centered active at full size/opacity, sides shrink ~70–80% with reduced opacity. Title + description sync below with fade transitions. RTL default. Dual-use: store home page (product groups/seasonal) or product landing page (bundle/kit). |

## Design Principles

- **RTL-first** — Arabic is the default direction. All layouts, animations, and Swiper configs must work RTL out of the box.
- **Mobile-first** — Mobile is the primary canvas; desktop is the optional enhancement. This holds in **three places that must stay in sync**:
  1. **CSS** — write the mobile layout as the base rule, then layer desktop overrides inside `@media (min-width: 768px)`. Never the reverse (`max-width` overrides).
  2. **`twilight-bundle.json` fields** — when a setting has separate mobile/desktop values, the **mobile field comes first and is the primary** (concrete default, no `inherit` option). The **desktop field comes second, is labeled "(اختياري)"**, and offers an `inherit` option (`"نفس الجوال"`) as its default so desktop reuses the mobile value unless overridden. Group the desktop fields under a `static` divider titled `سطح المكتب — تخصيص اختياري`.

     **Section-header icons:** prefix `static` title/note dividers with a flat inline-SVG icon (feather/lucide style) — **never an emoji** (emojis read cheap in the panel). Use `stroke='currentColor'` and `em`-based sizing so the icon inherits the header's colour and scales with its font-size. Canonical set already in `twilight-bundle.json`: monitor → desktop, smartphone → mobile, palette → colours, gear → advanced options, zap → flash/crossover, lightbulb → tip notes. Copy the matching `<svg>` from an existing divider rather than reinventing it.
  3. **Component logic** — resolve the mobile value first, then `desktop === "inherit" ? mobileValue : desktopValue`. See `Hero` (`height_mobile`/`height_desktop`) and `story-slider` (`aspect_ratio_mobile`/`aspect_ratio_desktop`) for the canonical pattern.
- **Component independence** — Each component must be self-contained, responsive, and cross-browser compatible.
- **Merchant configurability** — Every visual decision a merchant might want to change goes into `twilight-bundle.json` fields with sensible defaults.
- **Premium feel** — Animations and transitions distinguish this bundle from basic built-in components.
- **Conversion-optimized** — Component designs are grounded in CRO research (Baymard, NNGroup, CXL).
- **Popup anti-pattern** — Never show popups immediately on page load. Always include configurable delay defaults (time-based and page-count-based) in `twilight-bundle.json`.

## Naming Conventions

- All merchant-facing labels, titles, and placeholders in `twilight-bundle.json` must be in **Arabic**.
- Code identifiers (variable names, CSS classes, TypeScript types, file names) stay in **English**.

## Git Commits

- Never add `Co-Authored-By: Claude` or any AI co-author trailer to commit messages.

## Salla Documentation

Fetch docs directly — avoid search, direct URLs return better structured content:

- **Index of all doc pages:** `https://docs.salla.dev/llms.txt`
- Append `.md` to any doc ID for structured content:
  - `https://docs.salla.dev/421921m0.md` — twilight.json / bundle config
  - `https://docs.salla.dev/422558m0.md` — Home Page
  - `https://docs.salla.dev/422580m0.md` — Components overview
  - `https://docs.salla.dev/422689m0.md` — Twilight Web Components
  - `https://docs.salla.dev/422690m0.md` — Customize Web Components

### Field schema reference (ground truth)

Salla's official docs don't document every field property exhaustively. When you need to know what `type`/`format`/`source` values exist, or look up advanced features like conditional visibility, picker sources, or validation, **read theme-raed's `twilight.json` directly** — it's the most complete real-world example:

- **theme-raed twilight.json:** `https://raw.githubusercontent.com/SallaApp/theme-raed/master/twilight.json`

Examples of features documented only there:
- **Conditional fields** — `"conditions": [{ "id": "<other_field_id>", "operation": "=", "value": <val> }]` hides a field unless the condition matches. Works for sibling fields and across nesting (a field inside a `collection` can reference a top-level field by id). `value` accepts the literal stored value: `true`/`false` for booleans, the `value` string for an `items` selection.
- **Picker sources** for `items` dropdowns: `"source": "products" | "categories" | "brands" | "pages" | "blog_articles" | ...`
- **Variable-list links** — multi-source link pickers via `"format": "variable-list"` + a `sources` array.

#### ⚠️ Conditional-field gotchas (READ before adding/duplicating a conditional field)

Two hard rules — getting these wrong has bitten this project repeatedly:

1. **Conditions are single-value `=` only.** There is no OR / array value / `!=` / `in`. A field can be shown for exactly **one** value of the controlling field. To show a field for *several* values (e.g. show it for `inside`/`floating`/`split` but hide it in `background`), you must **duplicate the field once per value**, each with its own `conditions` entry. If a field is relevant in *all* values, give it **no** condition (one field).

2. **Each duplicated copy MUST have a UNIQUE `id` — distinct `key`s are NOT enough.** Salla's admin form builder keys field state and condition gating by `id`. When 2+ conditional fields share one `id`, gating **silently breaks**: the field renders **zero times** for one selected value and **N times** (all copies stacked) for another. (Statics with unique ids in the same group keep working — that's the tell.) So name copies `bg_effect`, `bg_effect_floating`, `bg_effect_split`, … and resolve the active one in the component by reading the controlling value (`layout === "floating" ? c.bg_effect_floating : …`). Canonical examples: featured-product (`bg_effect*`, `aspect_ratio*`, `image_fit*`) and testimonials (`photo_aspect`/`card_aspect`).

- **External preview images in field `value` HTML must be hosted on a reliable CDN** (e.g. `cdn.files.salla.network`). A dead host (`d.top4top.io` returned HTTP 000) renders as a broken image in the merchant panel. Verify the URL is live before adding it.

## Deferred Components (Post-v1)

Do not build these now — planned for future sub-bundles:

- **Urgency Kit:** Announcement Marquee Bar, Countdown Flash Sale Banner
- **Storefront Polish:** Visual Menu Grid, Cinematic Block
- **Trust Builder:** Live Activity Feed, Trust Wall, Why Us Strip
- **v2:** Smart Compare, Spin the Wheel
