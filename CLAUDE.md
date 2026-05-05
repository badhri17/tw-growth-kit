# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

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

The transform plugin injects `ClassName.registerSallaComponent(key)` into each component, which calls `window.Salla.bundles.registerComponent(key, { component, dynamicTagName })`. The `Hero` component includes a manual `registerSallaComponent` static method with a polling fallback for contexts where `Salla` loads after the component file executes — follow this pattern for robustness in demo mode.

### `twilight-bundle.json` — the source of truth for the admin UI

Every component must have an entry in `twilight-bundle.json`. This file defines:
- Bundle metadata (name, description, author)
- Per-component: `name` (matches the folder in `src/components/`), a UUID `key`, and a `fields` array

The `fields` array drives what the Salla merchant panel renders as settings. Field types include `string`, `boolean`, `items` (dropdown), `collection`, and `static` (UI-only dividers/titles). All merchant-facing `label`, `placeholder`, and `title` values must be written in **Arabic**. The create/delete scripts keep `twilight-bundle.json` in sync with `src/components/`.

### Component structure

Each component lives in `src/components/<name>/` with `index.ts` as the entry point. Optional `style.ts` and `types.ts` can be co-located.

Every component must:
1. Extend `LitElement` and export the class as default
2. Declare a single `@property({ type: Object }) config?` that receives all merchant settings
3. Have a matching entry in `twilight-bundle.json`

```ts
export default class MyComponent extends LitElement {
  @property({ type: Object })
  config?: { title?: string; /* ... */ };

  static styles = css`/* ... */`;

  render() {
    return html`<div>${this.config?.title}</div>`;
  }
}
```

### Handling multilanguage values

Fields marked `multilanguage: true` arrive as `string | { ar?: string; en?: string } | null`. Resolve using a helper like `_t()` in `Hero`:

```ts
private _t(val: MaybeMultiLang): string {
  if (!val) return "";
  if (typeof val === "string") return val;
  const lang = document.documentElement.lang?.startsWith("en") ? "en" : "ar";
  return (val[lang] || val.ar || val.en || "").trim();
}
```

### Handling dropdown-list values

`items` fields (dropdowns) can arrive as a plain string **or** as `[{ label, value }]`. Use a `_pickValue` guard:

```ts
private _pickValue<T extends string>(val: unknown, fallback: T): T {
  if (typeof val === "string" && val) return val as T;
  if (Array.isArray(val) && val[0]?.value) return val[0].value as T;
  return fallback;
}
```

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
- **Component independence** — Each component must be self-contained, responsive, and cross-browser compatible.
- **Merchant configurability** — Every visual decision a merchant might want to change goes into `twilight-bundle.json` fields with sensible defaults.
- **Premium feel** — Animations and transitions distinguish this bundle from basic built-in components.
- **Conversion-optimized** — Component designs are grounded in CRO research (Baymard, NNGroup, CXL).
- **Popup anti-pattern** — Never show popups immediately on page load. Always include configurable delay defaults (time-based and page-count-based) in `twilight-bundle.json`.

## Naming Conventions

- All merchant-facing labels, titles, and placeholders in `twilight-bundle.json` must be in **Arabic**.
- Code identifiers (variable names, CSS classes, TypeScript types, file names) stay in **English**.

## Salla Documentation

Fetch docs directly — avoid search, direct URLs return better structured content:

- **Index of all doc pages:** `https://docs.salla.dev/llms.txt`
- Append `.md` to any doc ID for structured content:
  - `https://docs.salla.dev/421921m0.md` — twilight.json / bundle config
  - `https://docs.salla.dev/422558m0.md` — Home Page
  - `https://docs.salla.dev/422580m0.md` — Components overview
  - `https://docs.salla.dev/422689m0.md` — Twilight Web Components
  - `https://docs.salla.dev/422690m0.md` — Customize Web Components

## Deferred Components (Post-v1)

Do not build these now — planned for future sub-bundles:

- **Urgency Kit:** Announcement Marquee Bar, Countdown Flash Sale Banner
- **Storefront Polish:** Visual Menu Grid, Cinematic Block
- **Trust Builder:** Live Activity Feed, Trust Wall, Why Us Strip
- **v2:** Smart Compare, Spin the Wheel
