import { LitElement as M, css as X, html as s, nothing as h } from "lit";
import { property as j, state as N } from "lit/decorators.js";
function B(n, e) {
  if (typeof n == "string") return n;
  if (!n || typeof n != "object") return "";
  const t = n[e] || n.ar || n.en || "";
  return typeof t == "string" ? t.trim() : "";
}
function T(n) {
  return n.replace(/[٠-٩]/g, (e) => String(e.charCodeAt(0) - 1632)).replace(/[۰-۹]/g, (e) => String(e.charCodeAt(0) - 1776));
}
class V extends M {
  /**
   * Twilight transform injects `Component.registerSallaComponent(...)`.
   * Statics inherit, so `this` is the concrete component. The polling
   * fallback handles preview contexts where `Salla` loads after the
   * component file executes.
   */
  static registerSallaComponent(e) {
    const t = String(e || "").trim(), a = t.toLowerCase().replace(/[^a-z0-9._-]/g, "-"), r = a.includes("-") ? a : `salla-${a || "component"}`, i = () => `${r}-${Math.random().toString(36).substring(2, 8)}`, o = () => {
      var c;
      const l = (c = window.Salla) == null ? void 0 : c.bundles;
      return l && typeof l.registerComponent == "function" ? (l.registerComponent(t, {
        component: this,
        dynamicTagName: i()
      }), !0) : !1;
    };
    if (o()) return;
    const d = window.setInterval(() => {
      o() && window.clearInterval(d);
    }, 100);
    window.setTimeout(() => window.clearInterval(d), 5e3);
  }
  /** Resolved document language. */
  _lang() {
    return (document.documentElement.lang || "ar").toLowerCase().startsWith("en") ? "en" : "ar";
  }
  /** Pull the store-language string out of a Salla multilanguage value. */
  localizedString(e) {
    return B(e, this._lang());
  }
  /** Dropdown-list values from settings may come as [{ label, value }]. */
  _pickValue(e, t) {
    if (typeof e == "string" && e) return e;
    if (Array.isArray(e) && e.length > 0) {
      const a = e[0];
      if (a && typeof a.value == "string" && a.value)
        return a.value;
    }
    return t;
  }
  /** See module-level toLatinDigits; exposed for subclasses. */
  _toLatinDigits(e) {
    return T(e);
  }
  /** Coerce a config number that may arrive as a string (Arabic-Indic
      digits included) or as a [{ value }] dropdown selection. */
  _num(e, t) {
    if (typeof e == "number" && !Number.isNaN(e)) return e;
    if (typeof e == "string" && e.trim() !== "") {
      const a = Number(T(e.trim()));
      if (!Number.isNaN(a)) return a;
    }
    if (Array.isArray(e) && e.length > 0) {
      const a = e[0];
      if ((a == null ? void 0 : a.value) !== void 0) return this._num(a.value, t);
    }
    return t;
  }
}
function E() {
  const n = window;
  return n.salla ?? n.Salla ?? null;
}
function R(n) {
  if (!n) return null;
  if (typeof n == "string" || typeof n == "number") {
    const o = Number(n);
    return !o || Number.isNaN(o) ? null : { id: o, label: "" };
  }
  const e = Array.isArray(n) ? n[0] : n;
  if (!e) return null;
  if (typeof e == "string" || typeof e == "number") {
    const o = Number(e);
    return !o || Number.isNaN(o) ? null : { id: o, label: "" };
  }
  if (typeof e != "object") return null;
  const t = e, a = t.value ?? t.id ?? t.product_id;
  if (a == null) return null;
  const r = typeof a == "number" ? a : Number(a);
  if (!r || Number.isNaN(r)) return null;
  const i = String(t.label ?? t.name ?? t.title ?? "").trim();
  return { id: r, label: i };
}
function L(n) {
  if (typeof n == "number") return Number.isNaN(n) ? void 0 : n;
  if (n && typeof n == "object") {
    const a = n;
    return L(a.amount ?? a.value ?? a.price);
  }
  if (typeof n != "string") return;
  const e = T(n).replace(/[^0-9.,]/g, "").replace(/,/g, "");
  if (!e) return;
  const t = parseFloat(e);
  return Number.isNaN(t) ? void 0 : t;
}
async function Y(n, e = "") {
  var k, g, $, p, b, x, w, y, I, P, A;
  const t = E();
  if (!t) throw new Error("Salla SDK unavailable");
  typeof t.onReady == "function" && await t.onReady();
  const a = ((k = t.product) == null ? void 0 : k.getDetails) ?? (($ = (g = t.product) == null ? void 0 : g.api) == null ? void 0 : $.getDetails);
  if (typeof a != "function")
    throw new Error("getDetails unavailable");
  const r = await a.call(t.product, n), i = (r == null ? void 0 : r.data) ?? r;
  if (!i) throw new Error("empty product payload");
  const o = ((p = i.image) == null ? void 0 : p.url) || ((b = i.image) == null ? void 0 : b.thumbnail) || Array.isArray(i.images) && (((x = i.images[0]) == null ? void 0 : x.url) || i.images[0]) || i.thumbnail || i.main_image || "", d = i.url || ((w = i.urls) == null ? void 0 : w.customer) || ((y = i.urls) == null ? void 0 : y.product) || i.permalink || `/p${n}`, l = L(i.price), c = L(i.regular_price), u = L(i.sale_price);
  let f = c ?? l, _ = l ?? c;
  u !== void 0 && u > 0 && (_ = u, (f === void 0 || f <= u) && (f = c ?? l ?? u));
  const S = (!!(i.is_on_sale ?? i.on_sale ?? i.has_offer) || u !== void 0) && f !== void 0 && _ !== void 0 && _ < f, m = i.currency || ((I = i.price) == null ? void 0 : I.currency) || ((P = i.regular_price) == null ? void 0 : P.currency) || void 0;
  return {
    name: String(i.name || i.title || e || `#${n}`),
    image: o || void 0,
    imageAlt: String(((A = i.image) == null ? void 0 : A.alt) || i.name || ""),
    url: d,
    regular: f,
    sale: S ? _ : void 0,
    onSale: S,
    currency: m
  };
}
const F = X`
  :host {
    display: block;
    font-family: inherit;
    direction: inherit;

    /* Size containment: the host's width is taken from its container, never
       from its contents. Stops the crossover marquee's max-content track from
       forcing an ancestor grid/flex item — e.g. Salla's component card —
       wider than the viewport and pushing other sections off-screen.
       Width-only containment; height still grows with content. */
    container-type: inline-size;
    min-width: 0;
    max-width: 100%;

    /* Tunable CSS custom properties — themes/merchants can override at :root. */
    --ba-bg: #f5f5f5;
    --ba-title-color: #212529;
    --ba-text-color: #4b5563;
    --ba-card-radius: 20px;
    --ba-handle-bg: #ffffff;
    --ba-handle-icon: #000000;
    --ba-line-color: #ffffff;
    --ba-label-bg: rgba(255, 255, 255, 0.95);
    --ba-label-text: #333333;
    --ba-nav-bg: rgba(255, 255, 255, 0.95);
    --ba-nav-icon: #000000;
    --ba-chip-bg: rgba(255, 255, 255, 0.95);
    --ba-chip-color: #111111;
    --ba-aspect: 1 / 1;
    --ba-ease: cubic-bezier(0.4, 0, 0.2, 1);
  }

  *,
  *::before,
  *::after {
    box-sizing: border-box;
  }

  .ba-section {
    width: 100%;
    padding: clamp(2.5rem, 6vw, 4rem) clamp(1rem, 3vw, 1.5rem);
    background-color: var(--ba-bg);
    display: flex;
    flex-direction: column;
    align-items: center;
    position: relative;
  }

  /* --- Header --- */
  .ba-header {
    width: 100%;
    max-width: 720px;
    text-align: center;
    margin-bottom: clamp(2rem, 5vw, 3.5rem);
  }
  .ba-title {
    font-size: clamp(2rem, 5vw, 4rem);
    font-weight: 900;
    color: var(--ba-title-color);
    margin: 0 0 0.5rem;
    line-height: 1.15;
  }
  .ba-title:dir(rtl) {
    line-height: 1.3;
  }
  .ba-subtitle {
    font-size: clamp(0.95rem, 1.4vw, 1.125rem);
    color: var(--ba-text-color);
    line-height: 1.7;
    margin: 0;
    max-width: 60ch;
    margin-inline: auto;
  }

  /* --- Stage (positioning context for nav + track) --- */
  .ba-stage {
    position: relative;
    width: 100%;
    max-width: 1200px;
    padding: 1rem 3.5rem;
  }
  @media (min-width: 1024px) {
    .ba-stage {
      max-width: 1000px;
      padding: 1rem 5rem;
    }
  }
  @media (max-width: 480px) {
    .ba-stage {
      padding: 0.5rem 2.5rem;
    }
  }

  /* --- Track holds slides absolutely; height comes from aspect ratio --- */
  .ba-track {
    position: relative;
    width: 100%;
    max-width: 550px;
    margin-inline: auto;
    aspect-ratio: var(--ba-aspect);
    overflow: visible;
  }

  /* --- Slide positioning model
     active   → centred, full scale, interactive
     prev/next→ peek at the sides on desktop (coverflow); hidden on mobile/single
     far      → fully hidden
  --- */
  .ba-slide {
    position: absolute;
    inset: 0;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    /* Snappy carousel default — used after the entrance has settled. */
    transition: transform 0.55s var(--ba-ease),
      opacity 0.4s var(--ba-ease), filter 0.35s var(--ba-ease);
    opacity: 0;
    pointer-events: none;
    filter: blur(0);
    will-change: transform, opacity, filter;
  }

  /* Slower, more cinematic timing during the first reveal (until [data-entered]). */
  .ba-section:not([data-entered]) .ba-slide {
    transition: transform 1s cubic-bezier(0.16, 1, 0.3, 1),
      opacity 0.65s cubic-bezier(0.22, 1, 0.36, 1),
      filter 0.6s cubic-bezier(0.22, 1, 0.36, 1);
  }
  .ba-slide[data-pos="active"] {
    opacity: 1;
    pointer-events: auto;
    z-index: 3;
    transform: translateX(0) scale(1);
  }
  .ba-slide[data-pos="prev"] {
    transform: translateX(-105%) scale(0.95);
    opacity: 0;
  }
  .ba-slide[data-pos="next"] {
    transform: translateX(105%) scale(0.95);
    opacity: 0;
  }
  .ba-slide[data-pos="far"] {
    transform: translateX(0) scale(0.9);
    opacity: 0;
  }
  /* RTL flips horizontal direction of side slides. */
  .ba-slide:dir(rtl)[data-pos="prev"] {
    transform: translateX(105%) scale(0.95);
  }
  .ba-slide:dir(rtl)[data-pos="next"] {
    transform: translateX(-105%) scale(0.95);
  }

  /* Mobile / tablet peek: side slides poke in just enough to hint at the carousel.
     Smaller peek + tighter scale than desktop coverflow so the active slide
     stays visually dominant on a narrow viewport. */
  @media (max-width: 1023px) {
    .ba-slide[data-pos="prev"] {
      transform: translateX(-88%) scale(0.82);
      opacity: 0.45;
      z-index: 1;
    }
    .ba-slide[data-pos="next"] {
      transform: translateX(88%) scale(0.82);
      opacity: 0.45;
      z-index: 1;
    }
    .ba-slide:dir(rtl)[data-pos="prev"] {
      transform: translateX(88%) scale(0.82);
    }
    .ba-slide:dir(rtl)[data-pos="next"] {
      transform: translateX(-88%) scale(0.82);
    }
  }

  /* Coverflow on desktop: prev & next peek at the sides */
  @media (min-width: 1024px) {
    .ba-section[data-layout="coverflow"] .ba-slide[data-pos="prev"] {
      transform: translateX(-62%) scale(0.78);
      opacity: 0.6;
      z-index: 1;
    }
    .ba-section[data-layout="coverflow"] .ba-slide[data-pos="next"] {
      transform: translateX(62%) scale(0.78);
      opacity: 0.6;
      z-index: 1;
    }
    .ba-section[data-layout="coverflow"] .ba-slide:dir(rtl)[data-pos="prev"] {
      transform: translateX(62%) scale(0.78);
    }
    .ba-section[data-layout="coverflow"] .ba-slide:dir(rtl)[data-pos="next"] {
      transform: translateX(-62%) scale(0.78);
    }
  }

  /* --- ENTRANCE: stacked, blurred deck → breathe → spread to positions ---
     Override every position-based transform while data-entrance="enter".
     The slight rotation on prev/next sells the "deck of cards" feel.
  --- */
  .ba-section[data-entrance="enter"] .ba-slide,
  .ba-section[data-entrance="enter"] .ba-slide[data-pos],
  .ba-section[data-entrance="enter"][data-layout] .ba-slide[data-pos] {
    transform: translateY(28px) scale(0.86);
    opacity: 0;
    filter: blur(18px);
  }
  .ba-section[data-entrance="enter"] .ba-slide[data-pos="prev"] {
    transform: translateY(34px) scale(0.82) rotate(-4deg);
  }
  .ba-section[data-entrance="enter"] .ba-slide[data-pos="next"] {
    transform: translateY(34px) scale(0.82) rotate(4deg);
  }
  .ba-section[data-entrance="enter"] .ba-slide[data-pos="far"] {
    transform: translateY(40px) scale(0.78);
    filter: blur(24px);
  }

  /* Stagger active vs side slides as they spread out.
     Only applies during the very first reveal (before [data-entered]). */
  .ba-section[data-entrance="ready"]:not([data-entered])
    .ba-slide[data-pos="active"] {
    transition-delay: 0.08s;
  }
  .ba-section[data-entrance="ready"]:not([data-entered])
    .ba-slide[data-pos="prev"],
  .ba-section[data-entrance="ready"]:not([data-entered])
    .ba-slide[data-pos="next"] {
    transition-delay: 0.26s;
  }

  /* --- Comparison card --- */
  .ba-card {
    position: relative;
    width: 100%;
    height: 100%;
    border-radius: var(--ba-card-radius);
    overflow: hidden;
    cursor: ew-resize;
    user-select: none;
    -webkit-user-select: none;
    background: #e5e7eb;
    box-shadow:
      0 24px 60px -28px rgba(0, 0, 0, 0.35),
      0 8px 20px -10px rgba(0, 0, 0, 0.18);
    --pos: 50%;
  }
  .ba-slide:not([data-pos="active"]) .ba-card {
    cursor: default;
    pointer-events: none;
  }

  .ba-card img {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    object-fit: cover;
    display: block;
    pointer-events: none;
  }
  .ba-after {
    z-index: 1;
  }
  .ba-before {
    z-index: 2;
    clip-path: inset(0 calc(100% - var(--pos)) 0 0);
  }
  /* Mirror: before sits on the right portion */
  .ba-card[data-reverse] .ba-before {
    clip-path: inset(0 0 0 var(--pos));
  }

  /* --- Slider line + handle --- */
  .ba-slider-line {
    position: absolute;
    top: 0;
    left: var(--pos);
    transform: translateX(-50%);
    width: 4px;
    height: 100%;
    background: var(--ba-line-color);
    z-index: 3;
    pointer-events: none;
    transition: opacity 0.3s var(--ba-ease);
  }
  .ba-handle {
    position: absolute;
    top: 50%;
    left: var(--pos);
    transform: translate(-50%, -50%);
    width: 60px;
    height: 60px;
    background: var(--ba-handle-bg);
    border-radius: 50%;
    z-index: 4;
    display: flex;
    align-items: center;
    justify-content: center;
    pointer-events: none;
    box-shadow:
      0 8px 24px -8px rgba(0, 0, 0, 0.4),
      0 2px 6px -2px rgba(0, 0, 0, 0.25);
    transition: opacity 0.3s var(--ba-ease);
  }
  .ba-handle::before,
  .ba-handle::after {
    content: "";
    position: absolute;
    width: 0;
    height: 0;
    border-style: solid;
  }
  .ba-handle::before {
    left: 14px;
    border-width: 10px 10px 10px 0;
    border-color: transparent var(--ba-handle-icon) transparent transparent;
  }
  .ba-handle::after {
    right: 14px;
    border-width: 10px 0 10px 10px;
    border-color: transparent transparent transparent var(--ba-handle-icon);
  }

  /* Hide the slider chrome on non-active slides */
  .ba-slide:not([data-pos="active"]) .ba-slider-line,
  .ba-slide:not([data-pos="active"]) .ba-handle {
    opacity: 0;
  }

  /* --- Labels --- */
  .ba-label {
    position: absolute;
    top: 20px;
    padding: 8px 20px;
    background: var(--ba-label-bg);
    border-radius: 20px;
    font-size: clamp(0.85rem, 1.2vw, 1.1rem);
    font-weight: 700;
    color: var(--ba-label-text);
    z-index: 5;
    pointer-events: none;
    backdrop-filter: blur(4px);
    -webkit-backdrop-filter: blur(4px);
  }
  .ba-label-before {
    left: 20px;
  }
  .ba-label-after {
    right: 20px;
  }

  /* --- Per-slide caption (inside the card) --- */
  .ba-caption {
    position: absolute;
    bottom: 18px;
    left: 18px;
    right: 18px;
    text-align: center;
    z-index: 5;
    background: rgba(0, 0, 0, 0.55);
    color: #ffffff;
    font-weight: 600;
    font-size: clamp(0.85rem, 1.2vw, 1rem);
    padding: 8px 14px;
    border-radius: 12px;
    pointer-events: none;
    backdrop-filter: blur(6px);
    -webkit-backdrop-filter: blur(6px);
  }

  /* --- Product chip overlay (anchored to the bottom of the card) --- */
  .ba-product-chip {
    position: absolute;
    bottom: 14px;
    inset-inline-start: 14px;
    max-width: calc(100% - 28px);
    z-index: 6;
    display: inline-flex;
    align-items: center;
    gap: 10px;
    padding: 8px 14px 8px 8px;
    background: var(--ba-chip-bg);
    color: var(--ba-chip-color);
    text-decoration: none;
    border-radius: 14px;
    backdrop-filter: blur(10px);
    -webkit-backdrop-filter: blur(10px);
    box-shadow: 0 14px 32px -16px rgba(0, 0, 0, 0.5),
      0 2px 6px -2px rgba(0, 0, 0, 0.18);
    transition: transform 0.25s var(--ba-ease), box-shadow 0.25s var(--ba-ease);
    pointer-events: auto;
  }
  /* In RTL the chip lives on the right with mirrored interior padding. */
  .ba-product-chip:dir(rtl) {
    padding: 8px 8px 8px 14px;
  }
  .ba-product-chip:hover {
    transform: translateY(-2px);
    box-shadow: 0 22px 40px -18px rgba(0, 0, 0, 0.55),
      0 4px 10px -3px rgba(0, 0, 0, 0.22);
  }
  .ba-slide:not([data-pos="active"]) .ba-product-chip {
    pointer-events: none;
  }
  .ba-product-chip__thumb {
    width: 44px;
    height: 44px;
    border-radius: 10px;
    object-fit: cover;
    flex-shrink: 0;
    background: rgba(0, 0, 0, 0.06);
    display: block;
  }
  /* Skeleton shimmer while we're fetching product details. */
  .ba-product-chip__thumb--skeleton {
    background: linear-gradient(
        90deg,
        rgba(0, 0, 0, 0.06) 0%,
        rgba(0, 0, 0, 0.12) 50%,
        rgba(0, 0, 0, 0.06) 100%
      )
      0 0 / 200% 100%;
    animation: ba-chip-shimmer 1.4s ease-in-out infinite;
  }
  .ba-product-chip--loading {
    cursor: progress;
    opacity: 0.92;
  }
  @keyframes ba-chip-shimmer {
    0% {
      background-position: 200% 0;
    }
    100% {
      background-position: -200% 0;
    }
  }
  @media (prefers-reduced-motion: reduce) {
    .ba-product-chip__thumb--skeleton {
      animation: none;
    }
  }
  .ba-product-chip__name {
    font-weight: 700;
    font-size: 0.92rem;
    line-height: 1.3;
    color: inherit;
    /* Clamp to 2 lines so long product names don't blow the card open. */
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
    text-overflow: ellipsis;
    max-width: 180px;
  }
  .ba-product-chip__arrow {
    width: 16px;
    height: 16px;
    flex-shrink: 0;
    fill: none;
    stroke: currentColor;
    stroke-width: 2.5;
    stroke-linecap: round;
    stroke-linejoin: round;
    opacity: 0.65;
  }
  .ba-product-chip:dir(rtl) .ba-product-chip__arrow {
    transform: rotate(180deg);
  }
  @media (max-width: 480px) {
    .ba-product-chip__thumb {
      width: 38px;
      height: 38px;
    }
    .ba-product-chip__name {
      font-size: 0.85rem;
      max-width: 140px;
    }
  }

  /* --- Navigation buttons --- */
  .ba-nav {
    position: absolute;
    top: 50%;
    transform: translateY(-50%);
    width: 50px;
    height: 50px;
    border: 1px solid rgba(255, 255, 255, 0.5);
    background: var(--ba-nav-bg);
    border-radius: 50%;
    cursor: pointer;
    z-index: 10;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: transform 0.25s var(--ba-ease), box-shadow 0.25s var(--ba-ease),
      filter 0.25s var(--ba-ease);
    box-shadow: 0 6px 18px -6px rgba(0, 0, 0, 0.3);
  }
  .ba-nav:hover {
    transform: translateY(-50%) scale(1.1);
    filter: brightness(1.05);
    box-shadow: 0 10px 28px -8px rgba(0, 0, 0, 0.45);
  }
  .ba-nav:disabled {
    opacity: 0.35;
    cursor: not-allowed;
    transform: translateY(-50%);
    box-shadow: none;
  }
  .ba-nav svg {
    width: 22px;
    height: 22px;
    stroke: var(--ba-nav-icon);
    fill: none;
    stroke-width: 2.5;
    stroke-linecap: round;
    stroke-linejoin: round;
  }
  .ba-nav-prev {
    left: 0;
  }
  .ba-nav-next {
    right: 0;
  }
  .ba-nav-prev svg {
    transform: rotate(180deg);
  }
  /* RTL: swap nav button sides so the prev arrow points "back" (rightward) */
  .ba-nav-prev:dir(rtl) {
    left: auto;
    right: 0;
  }
  .ba-nav-next:dir(rtl) {
    right: auto;
    left: 0;
  }
  .ba-nav-prev:dir(rtl) svg {
    transform: rotate(0deg);
  }
  .ba-nav-next:dir(rtl) svg {
    transform: rotate(180deg);
  }

  /* --- Pagination dots --- */
  .ba-dots {
    display: flex;
    gap: 10px;
    justify-content: center;
    margin-top: 28px;
  }
  .ba-dot {
    width: 10px;
    height: 10px;
    border-radius: 50%;
    border: none;
    padding: 0;
    background: var(--ba-handle-icon);
    opacity: 0.35;
    cursor: pointer;
    transition: opacity 0.25s var(--ba-ease), transform 0.25s var(--ba-ease);
  }
  .ba-dot[aria-current="true"] {
    opacity: 1;
    transform: scale(1.25);
  }
  .ba-dot:hover {
    opacity: 0.7;
  }

  /* --- Header entrance: fade + de-blur (with a hair of Y for life) --- */
  .ba-header > * {
    will-change: opacity, filter, transform;
  }
  .ba-header[data-anim="ready"] > * {
    opacity: 0;
    filter: blur(14px);
    transform: translateY(8px);
  }
  .ba-header[data-anim="in"] > * {
    opacity: 1;
    filter: blur(0);
    transform: translateY(0);
    transition: opacity 0.95s cubic-bezier(0.22, 1, 0.36, 1),
      filter 0.85s cubic-bezier(0.22, 1, 0.36, 1),
      transform 0.95s cubic-bezier(0.22, 1, 0.36, 1);
  }
  .ba-header[data-anim="in"] > *:nth-child(1) {
    transition-delay: 0.08s;
  }
  .ba-header[data-anim="in"] > *:nth-child(2) {
    transition-delay: 0.26s;
  }

  /* ============================================================
     Crossover mode (وضع العبور)
     Two identical marquee tracks overlap: the bottom one renders
     "before" images, the top one "after" images. Each lane is
     clipped at the centre line, so a card crossing the glowing
     divider is split live — before on one side, after on the other.
     Pure CSS animation; both tracks start the same frame so they
     stay in sync.
  ============================================================ */
  .ba-x {
    width: 100%;
    max-width: 1200px;
    /* Card width: merchant-picked base, clamped so two cards + divider
       always fit on a narrow phone. */
    --x-w: min(var(--ba-x-item-w, 260px), 62vw);
  }

  @media (min-width: 768px) {
    .ba-x {
      /* On desktop we use the desktop width variables, clamped against desktop viewport so it doesn't break containers. */
      --x-w: min(var(--ba-x-item-w-desktop, 360px), 40vw);
    }
  }

  /* Before/after pills above the strip, one per side (like the design).
     Forced LTR so "first child = left pill" holds; the before/after side
     swap is driven entirely by data-before-side (set in JS from the
     document direction + the reverse toggle). */
  .ba-x-pills {
    display: flex;
    direction: ltr;
    justify-content: space-between;
    align-items: center;
    margin-bottom: clamp(1rem, 3vw, 1.75rem);
    padding-inline: 4px;
  }
  .ba-x[data-before-side="right"] .ba-x-pills {
    flex-direction: row-reverse;
  }
  .ba-x-pill {
    background: var(--ba-label-bg);
    color: var(--ba-label-text);
    font-weight: 700;
    font-size: clamp(0.8rem, 1.2vw, 1rem);
    letter-spacing: 0.04em;
    padding: 8px 22px;
    border-radius: 999px;
    box-shadow: 0 4px 14px -6px rgba(0, 0, 0, 0.25);
  }

  @media (min-width: 768px) {
    .ba-x-pill {
      font-size: 1.15rem;
      padding: 10px 28px;
    }
  }

  .ba-x-stage {
    position: relative;
    width: 100%;
    overflow: hidden;
    /* Forced LTR: the track must stay left-aligned for the physical
       translateX keyframes + clip-path inset() math to hold in RTL docs. */
    direction: ltr;
    /* Vertical breathing room lets the divider extend past the cards. */
    padding-block: clamp(20px, 3.5vw, 34px);
  }

  .ba-x-lane--after {
    position: absolute;
    inset: 0;
    padding-block: inherit;
  }
  /* Clip each lane to its half of the stage. inset() is physical,
     so the sides come from data-before-side (computed in JS from
     document direction + the reverse toggle). */
  .ba-x[data-before-side="left"] .ba-x-lane--before {
    clip-path: inset(0 50% 0 0);
  }
  .ba-x[data-before-side="left"] .ba-x-lane--after {
    clip-path: inset(0 0 0 50%);
  }
  .ba-x[data-before-side="right"] .ba-x-lane--before {
    clip-path: inset(0 0 0 50%);
  }
  .ba-x[data-before-side="right"] .ba-x-lane--after {
    clip-path: inset(0 50% 0 0);
  }

  /* Track = two identical groups; shifting by -50% (one group) loops
     seamlessly. Cards always flow from the "before" side toward the
     "after" side. */
  .ba-x-track {
    display: flex;
    width: max-content;
    will-change: transform;
    animation: ba-x-flow-left var(--ba-x-duration, 40s) linear infinite;
  }
  .ba-x[data-before-side="left"] .ba-x-track {
    animation-name: ba-x-flow-right;
  }
  @keyframes ba-x-flow-left {
    from { transform: translateX(0); }
    to { transform: translateX(-50%); }
  }
  @keyframes ba-x-flow-right {
    from { transform: translateX(-50%); }
    to { transform: translateX(0); }
  }
  .ba-x[data-pause-hover]:hover .ba-x-track {
    animation-play-state: paused;
  }
  /* Off-screen (host attribute set by IntersectionObserver): freeze the
     continuous marquee + divider glow so they don't burn compositor time. */
  :host([out-of-view]) .ba-x-track,
  :host([out-of-view]) .ba-x-divider {
    animation-play-state: paused;
  }

  /* Each group carries its own trailing gap so two groups tile with a
     period of exactly 50% of the track. */
  .ba-x-group {
    display: flex;
    gap: var(--ba-x-gap, 20px);
    padding-inline-end: var(--ba-x-gap, 20px);
  }

  .ba-x-card {
    flex: 0 0 auto;
    width: var(--x-w);
    aspect-ratio: var(--ba-aspect);
    border-radius: var(--ba-card-radius);
    overflow: hidden;
    background: #e5e7eb;
    box-shadow: 0 14px 36px -20px rgba(0, 0, 0, 0.35);
  }
  .ba-x-card img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    display: block;
    pointer-events: none;
    user-select: none;
    -webkit-user-select: none;
  }

  /* --- Glowing centre divider --- */
  .ba-x-divider {
    position: absolute;
    top: 0;
    bottom: 0;
    left: 50%;
    width: clamp(5px, 0.6vw, 7px);
    transform: translateX(-50%);
    border-radius: 999px;
    /* Bright core over the tinted edges so the line reads clearly on any image. */
    background: linear-gradient(
        90deg,
        transparent 0%,
        rgba(255, 255, 255, 0.85) 50%,
        transparent 100%
      ),
      linear-gradient(
        180deg,
        transparent 0%,
        var(--ba-x-divider-color, #7eb6ff) 10%,
        var(--ba-x-divider-color, #7eb6ff) 90%,
        transparent 100%
      );
    box-shadow:
      0 0 14px var(--ba-x-divider-color, #7eb6ff),
      0 0 36px color-mix(in srgb, var(--ba-x-divider-color, #7eb6ff) 75%, transparent),
      0 0 80px color-mix(in srgb, var(--ba-x-divider-color, #7eb6ff) 45%, transparent);
    z-index: 5;
    pointer-events: none;
    animation: ba-x-glow 2.6s ease-in-out infinite;
  }
  @keyframes ba-x-glow {
    0%, 100% {
      box-shadow:
        0 0 14px var(--ba-x-divider-color, #7eb6ff),
        0 0 36px color-mix(in srgb, var(--ba-x-divider-color, #7eb6ff) 75%, transparent),
        0 0 80px color-mix(in srgb, var(--ba-x-divider-color, #7eb6ff) 45%, transparent);
    }
    50% {
      box-shadow:
        0 0 20px var(--ba-x-divider-color, #7eb6ff),
        0 0 52px color-mix(in srgb, var(--ba-x-divider-color, #7eb6ff) 90%, transparent),
        0 0 110px color-mix(in srgb, var(--ba-x-divider-color, #7eb6ff) 60%, transparent);
    }
  }

  /* --- Entrance: fade + rise, reusing the header's anim gate --- */
  .ba-x[data-anim="ready"] .ba-x-pills,
  .ba-x[data-anim="ready"] .ba-x-stage {
    opacity: 0;
    transform: translateY(16px);
    filter: blur(10px);
  }
  .ba-x[data-anim="in"] .ba-x-pills,
  .ba-x[data-anim="in"] .ba-x-stage {
    opacity: 1;
    transform: translateY(0);
    filter: blur(0);
    transition: opacity 0.95s cubic-bezier(0.22, 1, 0.36, 1),
      filter 0.85s cubic-bezier(0.22, 1, 0.36, 1),
      transform 0.95s cubic-bezier(0.22, 1, 0.36, 1);
  }
  .ba-x[data-anim="in"] .ba-x-stage {
    transition-delay: 0.18s;
  }

  /* --- Empty state --- */
  .ba-empty {
    width: 100%;
    padding: 60px 20px;
    text-align: center;
    color: #888;
    background: var(--ba-bg);
  }

  /* --- Reduced motion --- */
  @media (prefers-reduced-motion: reduce) {
    .ba-slide,
    .ba-product-chip,
    .ba-nav,
    .ba-dot,
    .ba-handle,
    .ba-slider-line {
      transition: none !important;
    }
    .ba-header[data-anim] > * {
      opacity: 1 !important;
      filter: blur(0) !important;
      transform: none !important;
      transition: none !important;
    }
    .ba-section[data-entrance="enter"] .ba-slide,
    .ba-section[data-entrance="enter"] .ba-slide[data-pos],
    .ba-section[data-entrance="enter"][data-layout] .ba-slide[data-pos] {
      transform: none !important;
      opacity: 1 !important;
      filter: blur(0) !important;
    }
    .ba-x-track,
    .ba-x-divider {
      animation: none !important;
    }
    .ba-x[data-anim] .ba-x-pills,
    .ba-x[data-anim] .ba-x-stage {
      opacity: 1 !important;
      transform: none !important;
      filter: blur(0) !important;
      transition: none !important;
    }
  }

  /* --- Mobile fine-tuning --- */
  @media (max-width: 640px) {
    .ba-handle {
      width: 48px;
      height: 48px;
    }
    .ba-handle::before {
      left: 12px;
      border-width: 8px 8px 8px 0;
    }
    .ba-handle::after {
      right: 12px;
      border-width: 8px 0 8px 8px;
    }
    .ba-nav {
      width: 42px;
      height: 42px;
    }
    .ba-nav svg {
      width: 18px;
      height: 18px;
    }
    .ba-label {
      font-size: 0.85rem;
      padding: 6px 14px;
      top: 14px;
    }
    .ba-label-before {
      left: 14px;
    }
    .ba-label-after {
      right: 14px;
    }
  }
`;
var O = Object.defineProperty, z = (n, e, t, a) => {
  for (var r = void 0, i = n.length - 1, o; i >= 0; i--)
    (o = n[i]) && (r = o(e, t, r) || r);
  return r && O(e, t, r), r;
};
const D = class D extends V {
  constructor() {
    super(...arguments), this._activeIndex = 0, this._positions = [], this._animState = "ready", this._entranceState = "enter", this._entranceDone = !1, this._dragging = !1, this._autoplayTimer = null, this._entranceFinishTimer = null, this._hoverPaused = !1, this._hasInitializedActive = !1, this._inView = !0, this._io = null, this._productCache = /* @__PURE__ */ new Map(), this._goPrev = () => {
      var a;
      const e = this._slides().length;
      if (e <= 1) return;
      const t = ((a = this.config) == null ? void 0 : a.loop) !== !1;
      this._activeIndex === 0 ? t && (this._activeIndex = e - 1) : this._activeIndex -= 1;
    }, this._goNext = () => {
      var a;
      const e = this._slides().length;
      if (e <= 1) return;
      const t = ((a = this.config) == null ? void 0 : a.loop) !== !1;
      this._activeIndex === e - 1 ? t && (this._activeIndex = 0) : this._activeIndex += 1;
    }, this._goTo = (e) => {
      const t = this._slides().length;
      e < 0 || e >= t || (this._activeIndex = e);
    }, this._dragListenersBound = !1, this._onDown = (e) => {
      const t = e.currentTarget, a = t == null ? void 0 : t.closest(".ba-slide");
      !a || a.dataset.pos !== "active" || (this._dragging = !0, this._bindDragListeners(), e.preventDefault(), this._updatePosition(e));
    }, this._onMove = (e) => {
      this._dragging && ("touches" in e && e.preventDefault(), this._updatePosition(e));
    }, this._onUp = () => {
      this._dragging = !1, this._unbindDragListeners();
    }, this._onCardClick = (e) => {
      var a;
      const t = (a = e.currentTarget) == null ? void 0 : a.closest(
        ".ba-slide"
      );
      !t || t.dataset.pos !== "active" || this._updatePosition(e);
    }, this._onHoverIn = () => {
      this._hoverPaused = !0;
    }, this._onHoverOut = () => {
      this._hoverPaused = !1;
    };
  }
  // ------------------------------------------------------------
  // Helpers
  // ------------------------------------------------------------
  /** Filter slides that have at least one valid image so we don't render blanks. */
  _slides() {
    var t;
    const e = (t = this.config) == null ? void 0 : t.slides;
    return Array.isArray(e) ? e.filter(
      (a) => a && typeof a == "object" && (a.before_image || a.after_image)
    ) : [];
  }
  /**
   * Kick off (or no-op if already done/in-flight) a fetch for the picked
   * product. Resolves the Salla SDK ready-promise first so the API is
   * available even when this component loads before the storefront JS.
   */
  async _fetchProduct(e, t) {
    if (!this._productCache.has(e) && (this._productCache.set(e, { status: "loading", label: t }), this.requestUpdate(), !!E())) {
      try {
        const a = await Y(e, t);
        this._productCache.set(e, { status: "loaded", data: a });
      } catch (a) {
        console.warn("[growth-before-after] product fetch failed", e, a), this._productCache.set(e, { status: "failed" });
      }
      this.requestUpdate();
    }
  }
  /**
   * Returns the chip data for a slide:
   *   - null   → no product picked, or fetch failed
   *   - object with `loading: true` and a `name` → render skeleton chip
   *   - object with `loading: false` and full data → render real chip
   * Side-effect: triggers a fetch if this id hasn't been seen yet.
   */
  _resolveProduct(e) {
    if (e.show_product === !1) return null;
    const t = R(e.product);
    if (!t)
      return !e.product || Array.isArray(e.product) && e.product.length === 0 || console.warn(
        "[growth-before-after] could not parse picker selection",
        e.product
      ), null;
    const a = this._productCache.get(t.id);
    return a ? a.status === "loading" ? { name: a.label || "", url: "", loading: !0 } : a.status === "failed" ? t.label ? { name: t.label, url: "", loading: !0 } : null : { ...a.data, loading: !1 } : (this._fetchProduct(t.id, t.label), t.label ? { name: t.label, url: "", loading: !0 } : { name: "", url: "", loading: !0 });
  }
  /**
   * Render the product chip. While loading we render a non-clickable
   * skeleton with a shimmer thumbnail and the label we have from the
   * picker so the chip appears immediately instead of popping in late.
   */
  _renderProductChip(e) {
    const t = this.localizedString(e.name), a = s`<svg
      class="ba-product-chip__arrow"
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <path d="m9 6 6 6-6 6" />
    </svg>`, r = e.image ? s`<img
          class="ba-product-chip__thumb"
          src=${e.image}
          alt=${e.imageAlt || ""}
          loading="lazy"
          draggable="false"
        />` : s`<span class="ba-product-chip__thumb ba-product-chip__thumb--skeleton"></span>`, i = s`<span class="ba-product-chip__name"
      >${t}</span
    >`;
    return e.loading || !e.url ? s`<span class="ba-product-chip ba-product-chip--loading">
        ${r}${i}${a}
      </span>` : s`<a
      class="ba-product-chip"
      href=${e.url}
      aria-label=${t || "View product"}
    >
      ${r}${i}${a}
    </a>`;
  }
  // ------------------------------------------------------------
  // Lifecycle
  // ------------------------------------------------------------
  connectedCallback() {
    var a;
    super.connectedCallback(), this._animState = "ready", this._entranceState = "enter", this._entranceDone = !1;
    const e = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches, t = ((a = this.config) == null ? void 0 : a.enable_entrance_anim) === !1;
    e || t ? (this._animState = "in", this._entranceState = "ready", this._entranceDone = !0) : requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        this._animState = "in", this._entranceState = "ready", this._entranceFinishTimer = window.setTimeout(() => {
          this._entranceDone = !0, this._entranceFinishTimer = null;
        }, 1350);
      });
    }), "IntersectionObserver" in window && (this._io = new IntersectionObserver(
      (r) => {
        const i = r[0];
        i && (this._inView = i.isIntersecting, this.toggleAttribute("out-of-view", !this._inView), this._teardownAutoplay(), this._inView && this._setupAutoplay());
      },
      { threshold: 0.15 }
    ), this._io.observe(this));
  }
  disconnectedCallback() {
    var e;
    super.disconnectedCallback(), this._teardownAutoplay(), (e = this._io) == null || e.disconnect(), this._io = null, this._entranceFinishTimer && (clearTimeout(this._entranceFinishTimer), this._entranceFinishTimer = null), this._unbindDragListeners();
  }
  willUpdate(e) {
    var i, o;
    if (!e.has("config")) return;
    const t = this._slides(), a = this._num((i = this.config) == null ? void 0 : i.initial_position, 50), r = Math.max(0, Math.min(100, a));
    if (t.length !== this._positions.length && (this._positions = t.map(
      (d, l) => l < this._positions.length ? this._positions[l] : r
    )), !this._hasInitializedActive && t.length > 0) {
      const d = this._num((o = this.config) == null ? void 0 : o.initial_slide, NaN), l = Number.isNaN(d) ? Math.floor(t.length / 2) : Math.max(0, Math.min(t.length - 1, Math.round(d) - 1));
      this._activeIndex = l, this._hasInitializedActive = !0;
    } else this._activeIndex >= t.length && (this._activeIndex = Math.max(0, t.length - 1));
    this._teardownAutoplay(), this._setupAutoplay();
  }
  // ------------------------------------------------------------
  // Autoplay
  // ------------------------------------------------------------
  _setupAutoplay() {
    const e = this.config || {};
    if (e.crossover_enabled || !e.autoplay || !this._inView || this._slides().length < 2) return;
    const t = Math.max(1, this._num(e.autoplay_delay, 5));
    this._autoplayTimer = window.setInterval(() => {
      this._hoverPaused || this._dragging || this._goNext();
    }, t * 1e3);
  }
  _teardownAutoplay() {
    this._autoplayTimer && (clearInterval(this._autoplayTimer), this._autoplayTimer = null);
  }
  /**
   * Determine each slide's visual position relative to the active one.
   * Handles loop-aware wrap so the carousel always shows prev/active/next.
   */
  _slidePos(e) {
    var r;
    const t = this._slides().length;
    if (t === 0) return "far";
    if (e === this._activeIndex) return "active";
    let a = e - this._activeIndex;
    return ((r = this.config) == null ? void 0 : r.loop) !== !1 && (a > t / 2 && (a -= t), a < -t / 2 && (a += t)), a === -1 ? "prev" : a === 1 ? "next" : "far";
  }
  _isPrevDisabled() {
    var e;
    return ((e = this.config) == null ? void 0 : e.loop) !== !1 ? !1 : this._activeIndex === 0 || this._slides().length <= 1;
  }
  _isNextDisabled() {
    var e;
    return ((e = this.config) == null ? void 0 : e.loop) !== !1 ? !1 : this._activeIndex === this._slides().length - 1 || this._slides().length <= 1;
  }
  _bindDragListeners() {
    this._dragListenersBound || (this._dragListenersBound = !0, window.addEventListener("mousemove", this._onMove), window.addEventListener("mouseup", this._onUp), window.addEventListener("touchmove", this._onMove, { passive: !1 }), window.addEventListener("touchend", this._onUp), window.addEventListener("touchcancel", this._onUp));
  }
  _unbindDragListeners() {
    this._dragListenersBound && (this._dragListenersBound = !1, window.removeEventListener("mousemove", this._onMove), window.removeEventListener("mouseup", this._onUp), window.removeEventListener("touchmove", this._onMove), window.removeEventListener("touchend", this._onUp), window.removeEventListener("touchcancel", this._onUp));
  }
  _updatePosition(e) {
    var o;
    const t = this._activeCardEl();
    if (!t) return;
    const a = t.getBoundingClientRect(), r = "touches" in e ? (o = e.touches[0]) == null ? void 0 : o.clientX : e.clientX;
    if (r === void 0) return;
    let i = (r - a.left) / a.width * 100;
    i = Math.max(0, Math.min(100, i)), t.style.setProperty("--pos", `${i}%`), this._positions[this._activeIndex] = i;
  }
  _activeCardEl() {
    return this.renderRoot.querySelector(
      '.ba-slide[data-pos="active"] .ba-card'
    );
  }
  // ------------------------------------------------------------
  // Crossover mode (وضع العبور)
  //
  // Two identical, perfectly-synced marquee tracks overlap: the lower
  // lane renders "before" images, the upper lane "after" images. Each
  // lane is clipped at the centre line, so a card crossing the glowing
  // divider transforms live from before to after.
  // ------------------------------------------------------------
  /** Physical side ("left"/"right") that shows the BEFORE images. */
  _crossoverBeforeSide() {
    var a;
    let e = !0;
    try {
      e = this.matches(":dir(rtl)");
    } catch {
      e = (document.documentElement.dir || document.dir || "rtl").toLowerCase() !== "ltr";
    }
    const t = e ? "right" : "left";
    return (a = this.config) != null && a.crossover_reverse ? t === "left" ? "right" : "left" : t;
  }
  _renderCrossover(e, t, a, r, i, o) {
    const d = this._pickValue(e.crossover_speed, "normal"), l = d === "slow" ? 7 : d === "fast" ? 3 : 5, c = this._pickValue(
      e.crossover_item_size,
      "md"
    ), u = c === "sm" ? 200 : c === "lg" ? 320 : 260, f = c === "sm" ? 280 : c === "lg" ? 440 : 360, _ = Math.max(0, this._num(e.crossover_gap, 20)), C = e.crossover_pause_on_hover !== !1, S = this._crossoverBeforeSide(), m = [];
    for (; m.length < 8; ) m.push(...t);
    const k = m.length * l, g = (p, b) => s`
      <div class="ba-x-group" aria-hidden=${b ? "true" : "false"}>
        ${m.map((x) => {
      const w = p === "before" ? x.before_image || x.after_image : x.after_image || x.before_image, y = b ? "" : this.localizedString(x.caption) || (p === "before" ? a : r);
      return s`<div class="ba-x-card">
            ${w ? s`<img
                  src=${w}
                  alt=${y}
                  loading="lazy"
                  draggable="false"
                />` : h}
          </div>`;
    })}
      </div>
    `, $ = [
      `--ba-x-item-w: ${u}px`,
      `--ba-x-item-w-desktop: ${f}px`,
      `--ba-x-gap: ${_}px`,
      `--ba-x-duration: ${k}s`,
      e.crossover_divider_color ? `--ba-x-divider-color: ${e.crossover_divider_color}` : ""
    ].filter(Boolean).join("; ");
    return s`
      <div
        class="ba-x"
        style=${$}
        data-before-side=${S}
        data-anim=${o ? this._animState : "in"}
        ?data-pause-hover=${C}
      >
        ${i ? s`
              <div class="ba-x-pills">
                <span class="ba-x-pill">${a}</span>
                <span class="ba-x-pill">${r}</span>
              </div>
            ` : h}
        <div class="ba-x-stage">
          <div class="ba-x-lane ba-x-lane--before">
            <div class="ba-x-track">
              ${g("before", !1)}${g("before", !0)}
            </div>
          </div>
          <div class="ba-x-lane ba-x-lane--after" aria-hidden="true">
            <div class="ba-x-track">
              ${g("after", !0)}${g("after", !0)}
            </div>
          </div>
          <div class="ba-x-divider" aria-hidden="true"></div>
        </div>
      </div>
    `;
  }
  // ------------------------------------------------------------
  // Render
  // ------------------------------------------------------------
  render() {
    const e = this.config || {}, t = this._slides(), a = this.localizedString(e.title), r = this.localizedString(e.subtitle), i = this.localizedString(e.label_before) || "قبل", o = this.localizedString(e.label_after) || "بعد", d = e.show_labels !== !1, l = this._pickValue(e.aspect_ratio, "1/1"), c = this._pickValue(
      e.desktop_layout,
      "coverflow"
    ), u = e.show_nav_buttons !== !1, f = !!e.show_pagination, _ = !!e.reverse_direction, C = e.enable_entrance_anim !== !1, S = this._num(e.card_radius, 20), m = [
      e.bg_color ? `--ba-bg: ${e.bg_color}` : "",
      e.title_color ? `--ba-title-color: ${e.title_color}` : "",
      e.text_color ? `--ba-text-color: ${e.text_color}` : "",
      `--ba-card-radius: ${S}px`,
      e.handle_bg ? `--ba-handle-bg: ${e.handle_bg}` : "",
      e.handle_icon_color ? `--ba-handle-icon: ${e.handle_icon_color}` : "",
      e.line_color ? `--ba-line-color: ${e.line_color}` : "",
      e.label_bg ? `--ba-label-bg: ${e.label_bg}` : "",
      e.label_text_color ? `--ba-label-text: ${e.label_text_color}` : "",
      e.nav_bg ? `--ba-nav-bg: ${e.nav_bg}` : "",
      e.nav_icon_color ? `--ba-nav-icon: ${e.nav_icon_color}` : "",
      e.product_chip_bg ? `--ba-chip-bg: ${e.product_chip_bg}` : "",
      e.product_chip_color ? `--ba-chip-color: ${e.product_chip_color}` : "",
      `--ba-aspect: ${l}`
    ].filter(Boolean).join("; ");
    if (t.length === 0)
      return s`
        <section class="ba-empty" style=${m}>
          <p>أضف صورة «قبل» وصورة «بعد» للبدء.</p>
        </section>
      `;
    const k = t.length === 1, g = "m9 6 6 6-6 6", $ = a || r ? s`
            <div
              class="ba-header"
              data-anim=${C ? this._animState : "in"}
            >
              ${a ? s`<h2 class="ba-title">${a}</h2>` : h}
              ${r ? s`<p class="ba-subtitle">${r}</p>` : h}
            </div>
          ` : h;
    return e.crossover_enabled ? s`
        <section class="ba-section" style=${m} data-mode="crossover">
          ${$}
          ${this._renderCrossover(
      e,
      t,
      i,
      o,
      d,
      C
    )}
        </section>
      ` : s`
      <section
        class="ba-section"
        style=${m}
        data-layout=${c}
        data-entrance=${this._entranceState}
        ?data-entered=${this._entranceDone}
        @mouseenter=${this._onHoverIn}
        @mouseleave=${this._onHoverOut}
      >
        ${$}

        <div class="ba-stage">
          <div class="ba-track">
            ${t.map((p, b) => {
      const x = this._slidePos(b), w = this.localizedString(p.caption), y = this._resolveProduct(p), P = `--pos: ${this._positions[b] ?? 50}%`;
      return s`
                <div class="ba-slide" data-pos=${x}>
                  <div
                    class="ba-card"
                    style=${P}
                    ?data-reverse=${_}
                    @mousedown=${this._onDown}
                    @touchstart=${this._onDown}
                    @click=${this._onCardClick}
                  >
                    ${p.after_image ? s`<img
                          class="ba-after"
                          src=${p.after_image}
                          alt=${o}
                          loading="lazy"
                          draggable="false"
                        />` : h}
                    ${p.before_image ? s`<img
                          class="ba-before"
                          src=${p.before_image}
                          alt=${i}
                          loading="lazy"
                          draggable="false"
                        />` : h}
                    <div class="ba-slider-line"></div>
                    <div class="ba-handle" aria-hidden="true"></div>
                    ${d ? s`
                          <span class="ba-label ba-label-before"
                            >${i}</span
                          >
                          <span class="ba-label ba-label-after"
                            >${o}</span
                          >
                        ` : h}
                    ${w && !y ? s`<span class="ba-caption">${w}</span>` : h}
                    ${y ? this._renderProductChip(y) : h}
                  </div>
                </div>
              `;
    })}
          </div>

          ${!k && u ? s`
                <button
                  class="ba-nav ba-nav-prev"
                  type="button"
                  @click=${this._goPrev}
                  ?disabled=${this._isPrevDisabled()}
                  aria-label="Previous"
                >
                  <svg viewBox="0 0 24 24">
                    <path d=${g} />
                  </svg>
                </button>
                <button
                  class="ba-nav ba-nav-next"
                  type="button"
                  @click=${this._goNext}
                  ?disabled=${this._isNextDisabled()}
                  aria-label="Next"
                >
                  <svg viewBox="0 0 24 24">
                    <path d=${g} />
                  </svg>
                </button>
              ` : h}
        </div>

        ${!k && f ? s`
              <div class="ba-dots" role="tablist">
                ${t.map(
      (p, b) => s`
                    <button
                      class="ba-dot"
                      type="button"
                      aria-current=${this._activeIndex === b ? "true" : "false"}
                      aria-label=${`Slide ${b + 1}`}
                      @click=${() => this._goTo(b)}
                    ></button>
                  `
    )}
              </div>
            ` : h}
      </section>
    `;
  }
};
D.styles = F;
let v = D;
z([
  j({ type: Object })
], v.prototype, "config");
z([
  N()
], v.prototype, "_activeIndex");
z([
  N()
], v.prototype, "_positions");
z([
  N()
], v.prototype, "_animState");
z([
  N()
], v.prototype, "_entranceState");
z([
  N()
], v.prototype, "_entranceDone");
typeof v < "u" && v.registerSallaComponent("salla-before-after");
export {
  v as default
};
