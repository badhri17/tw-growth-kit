import { LitElement as Z, css as F, html as o, nothing as h } from "lit";
import { property as O, state as L } from "lit/decorators.js";
function U(n, t) {
  if (typeof n == "string") return n;
  if (!n || typeof n != "object") return "";
  const e = n[t] || n.ar || n.en || "";
  return typeof e == "string" ? e.trim() : "";
}
function R(n) {
  return n.replace(/[٠-٩]/g, (t) => String(t.charCodeAt(0) - 1632)).replace(/[۰-۹]/g, (t) => String(t.charCodeAt(0) - 1776));
}
class W extends Z {
  /**
   * Twilight transform injects `Component.registerSallaComponent(...)`.
   * Statics inherit, so `this` is the concrete component. The polling
   * fallback handles preview contexts where `Salla` loads after the
   * component file executes.
   */
  static registerSallaComponent(t) {
    const e = String(t || "").trim(), i = e.toLowerCase().replace(/[^a-z0-9._-]/g, "-"), r = i.includes("-") ? i : `salla-${i || "component"}`, a = () => `${r}-${Math.random().toString(36).substring(2, 8)}`, s = () => {
      var p;
      const c = (p = window.Salla) == null ? void 0 : p.bundles;
      return c && typeof c.registerComponent == "function" ? (c.registerComponent(e, {
        component: this,
        dynamicTagName: a()
      }), !0) : !1;
    };
    if (s()) return;
    const d = window.setInterval(() => {
      s() && window.clearInterval(d);
    }, 100);
    window.setTimeout(() => window.clearInterval(d), 5e3);
  }
  /** Resolved document language. */
  _lang() {
    return (document.documentElement.lang || "ar").toLowerCase().startsWith("en") ? "en" : "ar";
  }
  /** Pull the store-language string out of a Salla multilanguage value. */
  localizedString(t) {
    return U(t, this._lang());
  }
  /** Dropdown-list values from settings may come as [{ label, value }]. */
  _pickValue(t, e) {
    if (typeof t == "string" && t) return t;
    if (Array.isArray(t) && t.length > 0) {
      const i = t[0];
      if (i && typeof i.value == "string" && i.value)
        return i.value;
    }
    return e;
  }
  /** See module-level toLatinDigits; exposed for subclasses. */
  _toLatinDigits(t) {
    return R(t);
  }
  /** Coerce a config number that may arrive as a string (Arabic-Indic
      digits included) or as a [{ value }] dropdown selection. */
  _num(t, e) {
    if (typeof t == "number" && !Number.isNaN(t)) return t;
    if (typeof t == "string" && t.trim() !== "") {
      const i = Number(R(t.trim()));
      if (!Number.isNaN(i)) return i;
    }
    if (Array.isArray(t) && t.length > 0) {
      const i = t[0];
      if ((i == null ? void 0 : i.value) !== void 0) return this._num(i.value, e);
    }
    return e;
  }
}
function B() {
  const n = window;
  return n.salla ?? n.Salla ?? null;
}
function X(n) {
  if (!n) return null;
  if (typeof n == "string" || typeof n == "number") {
    const s = Number(n);
    return !s || Number.isNaN(s) ? null : { id: s, label: "" };
  }
  const t = Array.isArray(n) ? n[0] : n;
  if (!t) return null;
  if (typeof t == "string" || typeof t == "number") {
    const s = Number(t);
    return !s || Number.isNaN(s) ? null : { id: s, label: "" };
  }
  if (typeof t != "object") return null;
  const e = t, i = e.value ?? e.id ?? e.product_id;
  if (i == null) return null;
  const r = typeof i == "number" ? i : Number(i);
  if (!r || Number.isNaN(r)) return null;
  const a = String(e.label ?? e.name ?? e.title ?? "").trim();
  return { id: r, label: a };
}
function P(n) {
  if (typeof n == "number") return Number.isNaN(n) ? void 0 : n;
  if (n && typeof n == "object") {
    const i = n;
    return P(i.amount ?? i.value ?? i.price);
  }
  if (typeof n != "string") return;
  const t = R(n).replace(/[^0-9.,]/g, "").replace(/,/g, "");
  if (!t) return;
  const e = parseFloat(t);
  return Number.isNaN(e) ? void 0 : e;
}
function K(n) {
  return Number.isInteger(n) ? String(n) : n.toFixed(2).replace(/\.?0+$/, "");
}
function j(n, t) {
  if (n == null || Number.isNaN(n)) return "";
  const e = B();
  try {
    if (e && typeof e.money == "function")
      return t ? e.money({ amount: n, currency: t }) : e.money(n);
  } catch {
  }
  const i = K(n);
  return t ? `${i} ${t}` : i;
}
async function G(n, t = "") {
  var S, z, b, v, _, A, N, C, w, x, y;
  const e = B();
  if (!e) throw new Error("Salla SDK unavailable");
  typeof e.onReady == "function" && await e.onReady();
  const i = ((S = e.product) == null ? void 0 : S.getDetails) ?? ((b = (z = e.product) == null ? void 0 : z.api) == null ? void 0 : b.getDetails);
  if (typeof i != "function")
    throw new Error("getDetails unavailable");
  const r = await i.call(e.product, n), a = (r == null ? void 0 : r.data) ?? r;
  if (!a) throw new Error("empty product payload");
  const s = ((v = a.image) == null ? void 0 : v.url) || ((_ = a.image) == null ? void 0 : _.thumbnail) || Array.isArray(a.images) && (((A = a.images[0]) == null ? void 0 : A.url) || a.images[0]) || a.thumbnail || a.main_image || "", d = a.url || ((N = a.urls) == null ? void 0 : N.customer) || ((C = a.urls) == null ? void 0 : C.product) || a.permalink || `/p${n}`, c = P(a.price), p = P(a.regular_price), u = P(a.sale_price);
  let l = p ?? c, f = c ?? p;
  u !== void 0 && u > 0 && (f = u, (l === void 0 || l <= u) && (l = p ?? c ?? u));
  const g = (!!(a.is_on_sale ?? a.on_sale ?? a.has_offer) || u !== void 0) && l !== void 0 && f !== void 0 && f < l, $ = a.currency || ((w = a.price) == null ? void 0 : w.currency) || ((x = a.regular_price) == null ? void 0 : x.currency) || void 0;
  return {
    name: String(a.name || a.title || t || `#${n}`),
    image: s || void 0,
    imageAlt: String(((y = a.image) == null ? void 0 : y.alt) || a.name || ""),
    url: d,
    regular: l,
    sale: g ? f : void 0,
    onSale: g,
    currency: $
  };
}
const J = F`
  :host {
    display: block;
    font-family: inherit;
    direction: inherit;

    /* Size containment: the host takes width from its container, never from its
       (overflowing) carousel contents — stops the Salla grid blow-out. */
    container-type: inline-size;
    min-width: 0;
    max-width: 100%;

    --pc-bg: #fbeee0;
    --pc-accent: #f0712c;
    --pc-card-bg: #ffffff;
    --pc-card-radius: 22px;
    --pc-media-radius: 16px;
    --pc-title: #14181f;
    --pc-text: #5b6470;
    --pc-price: var(--pc-accent);
    --pc-compare: #9aa1ac;
    --pc-badge-bg: var(--pc-accent);
    --pc-badge-color: #ffffff;
    --pc-btn-bg: var(--pc-accent);
    --pc-btn-color: #ffffff;
    --pc-btn-radius: 999px;
    --pc-shipping: #8a93a0;
    --pc-nav-bg: #ffffff;
    --pc-nav-icon: #14181f;
    --pc-dot-color: var(--pc-accent);

    --pc-aspect: 1 / 1;
    --pc-img-fit: contain;
    --pc-card-w: 320px;
    --pc-stage-h: 460px;
    --pc-ease: cubic-bezier(0.22, 1, 0.36, 1);
  }

  *,
  *::before,
  *::after {
    box-sizing: border-box;
  }

  /* ---------- Section ---------- */
  .pc {
    width: 100%;
    background: var(--pc-bg);
    padding: clamp(2rem, 6vw, 4rem) clamp(1rem, 3vw, 1.75rem);
    display: flex;
    flex-direction: column;
    align-items: center;
    position: relative;
    overflow: hidden; /* clips the peeking side cards to the section */
  }

  /* ---------- Header (title + subtitle + optional top nav) ---------- */
  .pc-head {
    width: 100%;
    max-width: 1100px;
    display: flex;
    align-items: flex-end;
    justify-content: space-between;
    gap: 1rem;
    margin-bottom: clamp(1.5rem, 4vw, 2.75rem);
  }
  .pc-head__text {
    min-width: 0;
  }
  .pc-head-title {
    position: relative;
    display: inline-block;
    margin: 0;
    color: var(--pc-title);
    font-size: clamp(1.5rem, 4vw, 2.4rem);
    font-weight: 800;
    line-height: 1.2;
    letter-spacing: -0.01em;
  }
  /* Accent underline under the section title (the reference "Most loved" look). */
  .pc-head-title::after {
    content: "";
    position: absolute;
    inset-inline-start: 0;
    bottom: -0.32em;
    width: 100%;
    height: 3px;
    border-radius: 3px;
    background: var(--pc-accent);
    opacity: 0.95;
  }
  .pc-head-sub {
    margin: 0.9rem 0 0;
    color: var(--pc-text);
    font-size: clamp(0.95rem, 1.4vw, 1.05rem);
    line-height: 1.65;
    max-width: 52ch;
  }

  /* Top nav group (renders in the header row when nav_position = "top"). */
  .pc-nav-group {
    display: inline-flex;
    gap: 10px;
    flex: none;
  }

  /* ---------- Stage ---------- */
  .pc-stage {
    position: relative;
    width: 100%;
    max-width: 1200px;
    display: flex;
    justify-content: center;
  }

  /* The 3D track: card-width, measured height, perspective owner. Side cards
     poke out past it (overflow visible). */
  .pc-track {
    position: relative;
    width: var(--pc-card-w);
    height: var(--pc-stage-h);
    margin-inline: auto;
    overflow: visible;
    perspective: 1700px;
    transform-style: preserve-3d;
    touch-action: pan-y; /* horizontal = swipe, vertical = page scroll */
  }

  /* ---------- Slide positioning (coverflow) ----------
     Each slide is the size of the track (= one card) and centres its card.
     One combined transform per resting slot glides + recedes + scales it. */
  .pc-slide {
    position: absolute;
    inset: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: transform 0.62s var(--pc-ease), opacity 0.62s var(--pc-ease);
    opacity: 0;
    pointer-events: none;
    will-change: transform, opacity;
  }
  /* A slide that wrapped across the loop snaps to its new side (no glide). */
  .pc-slide[data-instant] {
    transition: none;
  }

  .pc-slide[data-pos="active"] {
    opacity: 1;
    pointer-events: auto;
    z-index: 5;
    transform: translateX(0) translateZ(0) scale(1);
  }
  .pc-slide[data-pos="left"] {
    opacity: 0.5;
    z-index: 4;
    transform: translateX(-58%) translateZ(-130px) scale(0.84);
  }
  .pc-slide[data-pos="right"] {
    opacity: 0.5;
    z-index: 4;
    transform: translateX(58%) translateZ(-130px) scale(0.84);
  }
  /* Side cards are clickable to bring them to center; their internals stay
     inert so a side card's button never fires — only the active card's does. */
  .pc-slide[data-pos="left"],
  .pc-slide[data-pos="right"] {
    pointer-events: auto;
    cursor: pointer;
  }
  .pc-slide:not([data-pos="active"]) .pc-card * {
    pointer-events: none;
  }
  .pc-slide[data-pos="far-left"] {
    opacity: 0;
    z-index: 2;
    transform: translateX(-92%) translateZ(-260px) scale(0.7);
  }
  .pc-slide[data-pos="far-right"] {
    opacity: 0;
    z-index: 2;
    transform: translateX(92%) translateZ(-260px) scale(0.7);
  }
  .pc-slide[data-pos="hidden"] {
    opacity: 0;
    z-index: 1;
    transform: translateZ(-380px) scale(0.6);
  }

  /* RTL mirrors the arc: sides swap hands. */
  .pc-slide:dir(rtl)[data-pos="left"] {
    transform: translateX(58%) translateZ(-130px) scale(0.84);
  }
  .pc-slide:dir(rtl)[data-pos="right"] {
    transform: translateX(-58%) translateZ(-130px) scale(0.84);
  }
  .pc-slide:dir(rtl)[data-pos="far-left"] {
    transform: translateX(92%) translateZ(-260px) scale(0.7);
  }
  .pc-slide:dir(rtl)[data-pos="far-right"] {
    transform: translateX(-92%) translateZ(-260px) scale(0.7);
  }

  /* ---------- Card (soft white surface is the single base look) ---------- */
  .pc-card {
    position: relative;
    width: 100%;
    display: flex;
    flex-direction: column;
    border-radius: var(--pc-card-radius);
    background: var(--pc-card-bg);
    overflow: hidden;
    cursor: pointer;
    box-shadow: 0 30px 60px -32px rgba(15, 23, 42, 0.4),
      0 8px 20px -16px rgba(15, 23, 42, 0.28);
  }
  .pc-slide[data-pos="active"] .pc-card {
    cursor: default;
  }

  /* ===== شكل المنتج: background — image fills the card, content over a scrim ===== */
  .pc-card[data-layout="background"] {
    aspect-ratio: var(--pc-aspect);
    background: transparent; /* the image is the surface (no corner bleed) */
  }
  .pc-card[data-layout="background"] .pc-media {
    position: absolute;
    inset: 0;
    aspect-ratio: auto;
    height: 100%;
    border-radius: var(--pc-card-radius);
  }
  .pc-card[data-layout="background"] .pc-img {
    border-radius: var(--pc-card-radius); /* rounds itself; nothing solid behind */
  }
  /* Glossy frosted overlay (matches Featured Product): the backdrop-filter
     blurs + saturates the image showing through, and the inset top sheen gives
     the glassy highlight along its leading edge. */
  .pc-card[data-layout="background"] .pc-body {
    position: absolute;
    inset-inline: 0;
    bottom: 0;
    z-index: 2;
    flex: none;
    border-radius: 0 0 var(--pc-card-radius) var(--pc-card-radius);
    background: linear-gradient(
      to top,
      rgba(12, 15, 20, 0.86) 0%,
      rgba(12, 15, 20, 0.6) 62%,
      rgba(12, 15, 20, 0.32) 100%
    );
    -webkit-backdrop-filter: blur(16px) saturate(1.35);
    backdrop-filter: blur(16px) saturate(1.35);
    box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.16);
  }
  /* The card body's clamped min-heights are for equal in-flow cards; in the
     overlay they only add dead space, so let it hug the content. */
  .pc-card[data-layout="background"] .pc-title,
  .pc-card[data-layout="background"] .pc-desc {
    min-height: 0;
  }

  /* ---------- Media (product image) ---------- */
  .pc-media {
    position: relative;
    width: 100%;
    aspect-ratio: var(--pc-aspect);
    overflow: hidden;
    /* Round the top to the card radius (img is rounded too, below, so a
       composited layer in glass mode can't bleed a corner sliver). */
    border-top-left-radius: var(--pc-card-radius);
    border-top-right-radius: var(--pc-card-radius);
  }
  .pc-img {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    object-fit: var(--pc-img-fit);
    display: block;
    z-index: 1;
    user-select: none;
    -webkit-user-select: none;
    border-top-left-radius: var(--pc-card-radius);
    border-top-right-radius: var(--pc-card-radius);
  }

  /* ---------- Badge (corner pill) ---------- */
  .pc-badge {
    position: absolute;
    top: 12px;
    inset-inline-end: 12px;
    z-index: 3;
    padding: 6px 13px;
    border-radius: 999px;
    background: var(--pc-badge-bg);
    color: var(--pc-badge-color);
    font-size: 0.7rem;
    font-weight: 800;
    letter-spacing: 0.5px;
    text-transform: uppercase;
    line-height: 1;
    box-shadow: 0 6px 16px -8px rgba(0, 0, 0, 0.5);
    max-width: calc(100% - 24px);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  /* ---------- Body ---------- */
  .pc-body {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    padding: clamp(1rem, 4.5%, 1.45rem);
    flex: 1 1 auto;
  }
  .pc-body[data-align="center"] {
    text-align: center;
  }
  .pc-body[data-align="center"] .pc-price-row {
    justify-content: center;
  }
  .pc-body[data-align="left"] {
    text-align: left;
  }
  .pc-body[data-align="left"] .pc-price-row {
    justify-content: flex-end;
  }

  .pc-title {
    margin: 0;
    color: var(--pc-title);
    font-size: clamp(1.05rem, 1.6vw, 1.2rem);
    font-weight: 700;
    line-height: 1.3;
    /* Reserve two lines so every card is the same height. */
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
    min-height: 2.6em;
  }

  .pc-price-row {
    display: flex;
    align-items: baseline;
    flex-wrap: wrap;
    gap: 0.55rem;
  }
  .pc-price {
    color: var(--pc-price);
    font-size: clamp(1.15rem, 2vw, 1.35rem);
    font-weight: 800;
    line-height: 1;
  }
  .pc-compare {
    color: var(--pc-compare);
    font-size: 0.9rem;
    font-weight: 600;
    text-decoration: line-through;
    text-decoration-thickness: 1.5px;
  }

  .pc-desc {
    margin: 0;
    color: var(--pc-text);
    font-size: 0.92rem;
    line-height: 1.6;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
    min-height: 2.95em;
  }

  /* ---------- Button ---------- */
  .pc-actions {
    margin-top: 0.55rem;
  }
  .pc-btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
    width: 100%;
    padding: 13px 24px;
    border: none;
    border-radius: var(--pc-btn-radius);
    background: var(--pc-btn-bg);
    color: var(--pc-btn-color);
    font-family: inherit;
    font-size: 0.98rem;
    font-weight: 700;
    cursor: pointer;
    text-decoration: none;
    box-shadow: 0 16px 30px -16px rgba(0, 0, 0, 0.5);
    transition: transform 0.25s var(--pc-ease), box-shadow 0.25s var(--pc-ease),
      opacity 0.2s var(--pc-ease);
  }
  .pc-btn:hover {
    transform: translateY(-2px);
    box-shadow: 0 22px 38px -18px rgba(0, 0, 0, 0.6);
  }
  .pc-btn:active {
    transform: translateY(0);
  }
  .pc-btn[disabled] {
    opacity: 0.75;
    cursor: default;
    transform: none;
  }
  .pc-btn svg {
    width: 18px;
    height: 18px;
    flex: none;
  }
  .pc-btn__arrow {
    transition: transform 0.25s var(--pc-ease);
  }
  .pc-btn:dir(rtl) .pc-btn__arrow {
    transform: scaleX(-1);
  }
  .pc-btn:hover .pc-btn__arrow {
    transform: translateX(3px);
  }
  .pc-btn:dir(rtl):hover .pc-btn__arrow {
    transform: scaleX(-1) translateX(3px);
  }
  .pc-spinner {
    width: 17px;
    height: 17px;
    border-radius: 50%;
    border: 2px solid currentColor;
    border-top-color: transparent;
    animation: pc-spin 0.7s linear infinite;
  }
  @keyframes pc-spin {
    to {
      transform: rotate(360deg);
    }
  }

  /* ---------- Free-shipping / returns fine print ---------- */
  .pc-shipping {
    margin: 0.7rem 0 0;
    text-align: center;
    color: var(--pc-shipping);
    font-size: 0.66rem;
    font-weight: 700;
    letter-spacing: 0.6px;
    text-transform: uppercase;
    line-height: 1.5;
  }

  /* ---------- Side navigation ---------- */
  .pc-nav {
    width: 46px;
    height: 46px;
    border: none;
    background: var(--pc-nav-bg);
    border-radius: 50%;
    cursor: pointer;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    padding: 0;
    box-shadow: 0 8px 20px -8px rgba(0, 0, 0, 0.35);
    transition: transform 0.25s var(--pc-ease), box-shadow 0.25s var(--pc-ease),
      filter 0.25s var(--pc-ease), opacity 0.2s var(--pc-ease);
  }
  .pc-nav:hover {
    transform: scale(1.08);
    filter: brightness(1.03);
  }
  .pc-nav:active {
    transform: scale(1);
  }
  .pc-nav:disabled {
    opacity: 0.4;
    cursor: not-allowed;
    transform: none;
    box-shadow: none;
  }
  .pc-nav svg {
    width: 20px;
    height: 20px;
    stroke: var(--pc-nav-icon);
    fill: none;
    stroke-width: 2.4;
    stroke-linecap: round;
    stroke-linejoin: round;
  }
  /* Side variant: overlaid on the stage edges. */
  .pc-nav--side {
    position: absolute;
    top: 50%;
    transform: translateY(-50%);
    z-index: 10;
  }
  .pc-nav--side:hover {
    transform: translateY(-50%) scale(1.08);
  }
  .pc-nav--side:disabled {
    transform: translateY(-50%);
  }
  .pc-nav--prev {
    inset-inline-start: clamp(0px, 2vw, 18px);
  }
  .pc-nav--next {
    inset-inline-end: clamp(0px, 2vw, 18px);
  }
  /* Chevron points the natural way per side + direction. */
  .pc-nav--prev svg {
    transform: rotate(180deg);
  }
  .pc-nav--prev:dir(rtl) svg {
    transform: rotate(0deg);
  }
  .pc-nav--next:dir(rtl) svg {
    transform: rotate(180deg);
  }

  /* ---------- Pagination dots ---------- */
  .pc-dots {
    display: flex;
    gap: 9px;
    justify-content: center;
    margin-top: clamp(1.25rem, 3vw, 1.75rem);
  }
  .pc-dot {
    width: 9px;
    height: 9px;
    border-radius: 999px;
    border: none;
    padding: 0;
    background: var(--pc-dot-color);
    opacity: 0.32;
    cursor: pointer;
    transition: opacity 0.25s var(--pc-ease), width 0.25s var(--pc-ease);
  }
  .pc-dot[aria-current="true"] {
    opacity: 1;
    width: 26px;
  }
  .pc-dot:hover {
    opacity: 0.6;
  }

  /* ---------- Entrance: stacked → spread ----------
     With entrance anim on, every slide starts collapsed at center (receded +
     faded), then releases to its resting coverflow slot. The selector below
     outranks the resting data-pos rules while "ready"; once "in" it stops
     matching and each slide's own transition animates the spread. */
  .pc[data-enter="ready"] .pc-track .pc-slide {
    transform: translateX(0) translateZ(-240px) scale(0.62);
    opacity: 0;
  }
  /* Header fade + de-blur. */
  .pc-head[data-enter] > * {
    will-change: opacity, filter, transform;
  }
  .pc-head[data-enter="ready"] > * {
    opacity: 0;
    filter: blur(12px);
    transform: translateY(8px);
  }
  .pc-head[data-enter="in"] > * {
    opacity: 1;
    filter: blur(0);
    transform: translateY(0);
    transition: opacity 0.85s var(--pc-ease), filter 0.8s var(--pc-ease),
      transform 0.85s var(--pc-ease);
  }

  /* ---------- Empty state ---------- */
  .pc-empty {
    width: 100%;
    padding: 60px 20px;
    text-align: center;
    color: #8a8a8a;
    background: var(--pc-bg);
  }

  /* ---------- Desktop enhancements (≥ 768px) ---------- */
  @media (min-width: 768px) {
    .pc-track {
      width: var(--pc-card-w-desk, var(--pc-card-w));
    }
    .pc-nav {
      width: 50px;
      height: 50px;
    }
  }

  /* ---------- Reduced motion ---------- */
  @media (prefers-reduced-motion: reduce) {
    /* The component forces data-enter="in" under reduced motion, so the slides
       already render at their resting positions — just drop the transitions. */
    .pc-slide,
    .pc-btn,
    .pc-nav,
    .pc-dot {
      transition: none !important;
    }
    .pc-head[data-enter] > * {
      opacity: 1 !important;
      filter: none !important;
      transform: none !important;
      transition: none !important;
    }
  }
`;
var Q = Object.defineProperty, D = (n, t, e, i) => {
  for (var r = void 0, a = n.length - 1, s; a >= 0; a--)
    (s = n[a]) && (r = s(t, e, r) || r);
  return r && Q(t, e, r), r;
};
const V = class V extends W {
  constructor() {
    super(...arguments), this._activeIndex = 0, this._animState = "ready", this._stageH = null, this._autoplayTimer = null, this._hoverPaused = !1, this._hasInitializedActive = !1, this._inView = !0, this._io = null, this._cartStates = /* @__PURE__ */ new Map(), this._cartTimers = /* @__PURE__ */ new Map(), this._swipeStartX = null, this._swipeStartY = null, this._swipeActive = !1, this._prevDiff = /* @__PURE__ */ new Map(), this._resizeRaf = null, this._needsMeasure = !0, this._productCache = /* @__PURE__ */ new Map(), this._onResize = () => {
      this._resizeRaf && cancelAnimationFrame(this._resizeRaf), this._resizeRaf = requestAnimationFrame(() => this._measureStage());
    }, this._goPrev = () => {
      var r;
      const t = this._cards().length;
      if (t <= 1) return;
      const e = ((r = this.config) == null ? void 0 : r.loop) !== !1;
      let i = this._activeIndex - 1;
      i < 0 && (i = e ? t - 1 : 0), this._changeActive(i);
    }, this._goNext = () => {
      var r;
      const t = this._cards().length;
      if (t <= 1) return;
      const e = ((r = this.config) == null ? void 0 : r.loop) !== !1;
      let i = this._activeIndex + 1;
      i >= t && (i = e ? 0 : t - 1), this._changeActive(i);
    }, this._goTo = (t) => {
      const e = this._cards().length;
      t < 0 || t >= e || this._changeActive(t);
    }, this._onSlideClick = (t) => {
      if (this._swipeActive) return;
      const e = t.currentTarget;
      if (!e || e.dataset.pos === "active") return;
      const i = Number(e.dataset.index);
      Number.isInteger(i) && this._goTo(i);
    }, this._onPointerDown = (t) => {
      var e;
      if (!(this._cards().length <= 1)) {
        try {
          (e = t.currentTarget) == null || e.setPointerCapture(t.pointerId);
        } catch {
        }
        this._swipeStartX = t.clientX, this._swipeStartY = t.clientY, this._swipeActive = !1;
      }
    }, this._onPointerMove = (t) => {
      if (this._swipeStartX === null) return;
      const e = t.clientX - this._swipeStartX, i = t.clientY - (this._swipeStartY ?? t.clientY);
      !this._swipeActive && Math.abs(e) > 10 && Math.abs(e) > Math.abs(i) && (this._swipeActive = !0);
    }, this._onPointerUp = (t) => {
      try {
        const r = t.currentTarget;
        r != null && r.hasPointerCapture(t.pointerId) && r.releasePointerCapture(t.pointerId);
      } catch {
      }
      if (this._swipeStartX === null) return;
      const e = t.clientX - this._swipeStartX, i = getComputedStyle(this).direction === "rtl";
      this._swipeActive && Math.abs(e) > 40 && ((i ? e > 0 : e < 0) ? this._goNext() : this._goPrev()), this._swipeStartX = null, this._swipeStartY = null, window.setTimeout(() => {
        this._swipeActive = !1;
      }, 50);
    }, this._onHoverIn = () => {
      this._hoverPaused = !0;
    }, this._onHoverOut = () => {
      this._hoverPaused = !1;
    }, this._onPrimaryClick = async (t, e, i, r, a) => {
      var c, p, u;
      if (t.preventDefault(), t.stopPropagation(), this._cartStates.get(e) === "loading") return;
      const s = this._salla, d = ((c = s == null ? void 0 : s.cart) == null ? void 0 : c.addItem) ?? ((u = (p = s == null ? void 0 : s.cart) == null ? void 0 : p.api) == null ? void 0 : u.addItem);
      if (!i || typeof d != "function") {
        a && (window.location.href = a);
        return;
      }
      this._setCart(e, "loading");
      try {
        if (await d.call(s.cart, { id: i, quantity: 1 }), this._setCart(e, "added"), r === "buy_now") {
          window.location.href = "/cart";
          return;
        }
        const l = this._cartTimers.get(e);
        l && clearTimeout(l), this._cartTimers.set(
          e,
          window.setTimeout(() => this._setCart(e, "idle"), 2500)
        );
      } catch (l) {
        console.warn("[growth-product-cards] add to cart failed", l), this._setCart(e, "idle");
      }
    };
  }
  /** Salla SDK global — see shared/product.ts. */
  get _salla() {
    return B();
  }
  // ------------------------------------------------------------
  // Value helpers
  // ------------------------------------------------------------
  // ------------------------------------------------------------
  // Cards
  // ------------------------------------------------------------
  _cards() {
    var e;
    const t = (e = this.config) == null ? void 0 : e.cards;
    return Array.isArray(t) ? t.filter((i) => !i || typeof i != "object" ? !1 : !!(i.product || i.image || this.localizedString(i.title) || i.price || this.localizedString(i.badge))) : [];
  }
  async _fetchProduct(t) {
    if (!this._productCache.has(t)) {
      this._productCache.set(t, { status: "loading" }), this.requestUpdate();
      try {
        const e = await G(t);
        this._productCache.set(t, { status: "loaded", data: e });
      } catch (e) {
        console.warn("[growth-product-cards] product fetch failed", t, e), this._productCache.set(t, { status: "failed" });
      }
      this.requestUpdate();
    }
  }
  _resolveCardProduct(t) {
    const e = X(t.product);
    if (!e) return null;
    const i = this._productCache.get(e.id);
    return i ? i.status === "loaded" ? i.data : i.status === "loading" && e.label ? { name: e.label, url: "", onSale: !1 } : null : (this._fetchProduct(e.id), e.label ? { name: e.label, url: "", onSale: !1 } : null);
  }
  /**
   * `card.link` is a Salla `variable-list` field resolved to a final URL string
   * server-side. Parse defensively (bare string / `{ url|value }` / single-item
   * array) and treat "" / "#" as "no link".
   */
  _resolveLink(t) {
    if (!t) return "";
    const e = Array.isArray(t) ? t[0] : t;
    if (!e) return "";
    const r = (typeof e == "string" ? e : typeof e == "object" ? String(
      e.url ?? e.value ?? ""
    ) : "").trim();
    return r && r !== "#" ? r : "";
  }
  // ------------------------------------------------------------
  // Lifecycle
  // ------------------------------------------------------------
  connectedCallback() {
    var i;
    super.connectedCallback();
    const t = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches, e = ((i = this.config) == null ? void 0 : i.enable_entrance_anim) === !1;
    t || e ? this._animState = "in" : requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        this._animState = "in";
      });
    }), window.addEventListener("resize", this._onResize, { passive: !0 }), "IntersectionObserver" in window && (this._io = new IntersectionObserver(
      (r) => {
        const a = r[0];
        a && (this._inView = a.isIntersecting, this._teardownAutoplay(), this._inView && this._setupAutoplay());
      },
      { threshold: 0.15 }
    ), this._io.observe(this));
  }
  disconnectedCallback() {
    var t;
    super.disconnectedCallback(), this._teardownAutoplay(), (t = this._io) == null || t.disconnect(), this._io = null, window.removeEventListener("resize", this._onResize), this._resizeRaf && cancelAnimationFrame(this._resizeRaf);
    for (const e of this._cartTimers.values()) clearTimeout(e);
    this._cartTimers.clear();
  }
  willUpdate(t) {
    var i;
    if (!t.has("config")) return;
    this._cartStates.clear(), this._needsMeasure = !0;
    const e = this._cards();
    if (!this._hasInitializedActive && e.length > 0) {
      const r = this._num((i = this.config) == null ? void 0 : i.initial_slide, NaN), a = Math.floor(e.length / 2), s = Number.isNaN(r) ? a : Math.max(0, Math.min(e.length - 1, Math.round(r) - 1));
      this._activeIndex = s, this._hasInitializedActive = !0;
    } else this._activeIndex >= e.length && (this._activeIndex = Math.max(0, e.length - 1));
    this._teardownAutoplay(), this._setupAutoplay();
  }
  updated() {
    const t = this._cards().length;
    this._prevDiff.clear();
    for (let e = 0; e < t; e++) this._prevDiff.set(e, this._wrappedDiff(e));
    this._needsMeasure && (this._needsMeasure = !1, this._measureStage());
  }
  /**
   * The track's height must equal the tallest card (cards are kept equal-height,
   * but we measure the max defensively). offsetHeight ignores the coverflow
   * scale transforms, so it returns the true layout height. Re-runs when images
   * load (their dimensions change a card's height).
   */
  _measureStage() {
    const t = this.shadowRoot;
    if (!t) return;
    let e = 0;
    for (const i of t.querySelectorAll(".pc-card"))
      i.offsetHeight > 0 && (e = Math.max(e, i.offsetHeight));
    for (const i of t.querySelectorAll(".pc-img"))
      if (!i.complete && !i.dataset.measureHooked) {
        i.dataset.measureHooked = "1";
        const r = () => this._measureStage();
        i.addEventListener("load", r, { once: !0 }), i.addEventListener("error", r, { once: !0 });
      }
    e > 0 && e !== this._stageH && (this._stageH = e);
  }
  // ------------------------------------------------------------
  // Autoplay
  // ------------------------------------------------------------
  _setupAutoplay() {
    const t = this.config || {};
    if (!t.autoplay || !this._inView || this._cards().length < 2) return;
    const e = Math.max(1, this._num(t.autoplay_delay, 5));
    this._autoplayTimer = window.setInterval(() => {
      this._hoverPaused || this._swipeActive || this._goNext();
    }, e * 1e3);
  }
  _teardownAutoplay() {
    this._autoplayTimer && (clearInterval(this._autoplayTimer), this._autoplayTimer = null);
  }
  // ------------------------------------------------------------
  // Navigation
  // ------------------------------------------------------------
  _changeActive(t) {
    t !== this._activeIndex && (this._activeIndex = t);
  }
  /** Signed slot offset from the active slide, wrapped the shorter way when
      looping (so card 0 can sit just before the last). */
  _wrappedDiff(t) {
    var r;
    const e = this._cards().length;
    if (e === 0) return 0;
    let i = t - this._activeIndex;
    return ((r = this.config) == null ? void 0 : r.loop) !== !1 && (i > e / 2 && (i -= e), i < -e / 2 && (i += e)), i;
  }
  _slidePos(t) {
    if (this._cards().length === 0) return "hidden";
    const e = this._wrappedDiff(t);
    return e === 0 ? "active" : e === -1 ? "left" : e === 1 ? "right" : e === -2 ? "far-left" : e === 2 ? "far-right" : "hidden";
  }
  _isPrevDisabled() {
    var t;
    return ((t = this.config) == null ? void 0 : t.loop) !== !1 ? !1 : this._activeIndex === 0 || this._cards().length <= 1;
  }
  _isNextDisabled() {
    var t;
    return ((t = this.config) == null ? void 0 : t.loop) !== !1 ? !1 : this._activeIndex === this._cards().length - 1 || this._cards().length <= 1;
  }
  // ------------------------------------------------------------
  // Add to cart (per card)
  // ------------------------------------------------------------
  _setCart(t, e) {
    this._cartStates.set(t, e), this.requestUpdate();
  }
  _defaultButtonLabel(t) {
    const e = this._lang() === "ar";
    switch (t) {
      case "buy_now":
        return e ? "اشترِ الآن" : "Buy now";
      case "view_product":
        return e ? "عرض المنتج" : "View product";
      case "add_to_cart":
      default:
        return e ? "أضف إلى السلة" : "Add to cart";
    }
  }
  // ------------------------------------------------------------
  // Icons
  // ------------------------------------------------------------
  _icon(t) {
    switch (t) {
      case "bag":
        return o`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor"
          stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M6 8h12l-1 11.5a1.5 1.5 0 0 1-1.5 1.4H8.5A1.5 1.5 0 0 1 7 19.5z" />
          <path d="M9 8a3 3 0 0 1 6 0" />
        </svg>`;
      case "arrow":
        return o`<svg class="pc-btn__arrow" viewBox="0 0 24 24" fill="none"
          stroke="currentColor" stroke-width="2.4" stroke-linecap="round"
          stroke-linejoin="round">
          <path d="M5 12h14M13 6l6 6-6 6" />
        </svg>`;
      case "check":
        return o`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor"
          stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <path d="M20 6 9 17l-5-5" />
        </svg>`;
      case "chevron":
        return o`<svg viewBox="0 0 24 24"><path d="m9 6 6 6-6 6" /></svg>`;
    }
  }
  // ------------------------------------------------------------
  // Render
  // ------------------------------------------------------------
  render() {
    const t = this.config || {}, e = this._cards(), i = this._pickValue(t.image_layout, "inside"), r = i === "background" ? "3/4" : this._pickValue(t.aspect_ratio, "1/1"), a = i === "background" ? "cover" : this._pickValue(t.image_fit, "contain"), s = this._pickValue(t.content_align, "right"), d = this._num(t.card_radius, 22), c = this._pickValue(t.card_size_mobile, "medium"), p = this._pickValue(
      t.card_size_desktop,
      "inherit"
    ), u = p === "inherit" ? c : p, l = i === "background", f = t.accent_color || "#f0712c", I = i === "background" ? "transparent" : "#ffffff", g = (M, m) => m ? M === "compact" ? "300px" : M === "large" ? "382px" : "340px" : M === "compact" ? "min(280px, 76vw)" : M === "large" ? "min(360px, 88vw)" : "min(322px, 82vw)", S = {
      square: "0px",
      soft: "12px",
      rounded: "22px",
      pill: "999px"
    }[this._pickValue(t.button_radius, "pill")], z = [
      `--pc-bg: ${t.bg_color || "#fbeee0"}`,
      `--pc-accent: ${f}`,
      `--pc-card-bg: ${t.card_bg || I}`,
      `--pc-card-radius: ${d}px`,
      `--pc-aspect: ${r}`,
      `--pc-img-fit: ${a}`,
      `--pc-card-w: ${g(c, !1)}`,
      `--pc-card-w-desk: ${g(u, !0)}`,
      this._stageH ? `--pc-stage-h: ${this._stageH}px` : "",
      `--pc-title: ${t.title_color || (l ? "#ffffff" : "#14181f")}`,
      `--pc-text: ${t.text_color || (l ? "rgba(255,255,255,0.82)" : "#5b6470")}`,
      `--pc-price: ${t.price_color || f}`,
      `--pc-compare: ${t.compare_color || (l ? "rgba(255,255,255,0.55)" : "#9aa1ac")}`,
      `--pc-badge-bg: ${t.badge_bg || f}`,
      `--pc-badge-color: ${t.badge_color || "#ffffff"}`,
      `--pc-btn-bg: ${t.button_bg || f}`,
      `--pc-btn-color: ${t.button_color || "#ffffff"}`,
      `--pc-btn-radius: ${S}`,
      `--pc-shipping: ${t.shipping_color || (l ? "rgba(255,255,255,0.6)" : "#8a93a0")}`,
      `--pc-dot-color: ${f}`
    ].filter(Boolean).join("; ");
    if (e.length === 0)
      return o`
        <section class="pc-empty" style=${z}>
          <p>
            ${this._lang() === "ar" ? "أضف بطاقة منتج واحدة على الأقل لعرض الكاروسيل." : "Add at least one product card to show the carousel."}
          </p>
        </section>
      `;
    const b = e.length === 1, v = this.localizedString(t.section_title), _ = this.localizedString(t.section_subtitle), A = t.show_nav_buttons !== !1 && !b, N = this._pickValue(t.nav_position, "sides"), C = A && N === "top", w = A && N === "sides", x = !!t.show_pagination && !b, y = t.enable_entrance_anim === !1 ? "in" : this._animState, T = v || _ || C ? o`
            <div class="pc-head" data-enter=${y}>
              <div class="pc-head__text">
                ${v ? o`<h2 class="pc-head-title">${v}</h2>` : h}
                ${_ ? o`<p class="pc-head-sub">${_}</p>` : h}
              </div>
              ${C ? o`<div class="pc-nav-group">
                    ${this._renderNav("prev", !1)}
                    ${this._renderNav("next", !1)}
                  </div>` : h}
            </div>
          ` : h;
    return o`
      <section
        class="pc"
        style=${z}
        data-enter=${y}
        data-layout=${i}
        @mouseenter=${this._onHoverIn}
        @mouseleave=${this._onHoverOut}
      >
        ${T}

        <div class="pc-stage">
          <div
            class="pc-track"
            @pointerdown=${this._onPointerDown}
            @pointermove=${this._onPointerMove}
            @pointerup=${this._onPointerUp}
            @pointercancel=${this._onPointerUp}
          >
            ${e.map((M, m) => {
      const Y = this._wrappedDiff(m), E = this._slidePos(m), H = this._prevDiff.get(m), q = H !== void 0 && Math.abs(Y - H) > e.length / 2;
      return o`
                <div
                  class="pc-slide"
                  data-pos=${E}
                  data-index=${m}
                  data-instant=${q ? "" : h}
                  @click=${this._onSlideClick}
                >
                  ${this._renderCard(M, m, {
        imageLayout: i,
        contentAlign: s
      })}
                </div>
              `;
    })}
          </div>

          ${w ? o`
                ${this._renderNav("prev", !0)}${this._renderNav("next", !0)}
              ` : h}
        </div>

        ${x ? o`
              <div class="pc-dots" role="tablist">
                ${e.map(
      (M, m) => o`
                    <button
                      class="pc-dot"
                      type="button"
                      aria-current=${this._activeIndex === m ? "true" : "false"}
                      aria-label=${`${m + 1}`}
                      @click=${() => this._goTo(m)}
                    ></button>
                  `
    )}
              </div>
            ` : h}
      </section>
    `;
  }
  _renderNav(t, e) {
    const i = t === "prev" ? this._goPrev : this._goNext, r = t === "prev" ? this._isPrevDisabled() : this._isNextDisabled(), a = e ? `pc-nav pc-nav--side pc-nav--${t}` : `pc-nav pc-nav--${t}`;
    return o`
      <button
        class=${a}
        type="button"
        @click=${i}
        ?disabled=${r}
        aria-label=${t === "prev" ? "Previous" : "Next"}
      >
        ${this._icon("chevron")}
      </button>
    `;
  }
  _renderCard(t, e, i) {
    const r = this.config || {}, a = this._resolveCardProduct(t), s = !!X(t.product), d = this.localizedString(t.badge), c = this.localizedString(t.title) || (a == null ? void 0 : a.name) || "", p = this.localizedString(t.description), u = t.image || (a == null ? void 0 : a.image) || "", l = c || (a == null ? void 0 : a.imageAlt) || "", f = r.show_price !== !1, I = r.show_sale_price !== !1;
    let g = "", $ = "";
    if (f) {
      const w = this.localizedString(t.price), x = this.localizedString(
        t.compare_price
      );
      if (w) {
        g = w;
        const y = P(w), T = P(x);
        I && x && T !== void 0 && y !== void 0 && T > y && ($ = x);
      } else a && (a.onSale && a.sale !== void 0 ? (g = j(a.sale, a.currency), I && a.regular !== void 0 && ($ = j(a.regular, a.currency))) : a.regular !== void 0 && (g = j(a.regular, a.currency)));
    }
    const S = this.localizedString(r.free_shipping_text), z = r.show_button !== !1, b = this._pickValue(
      r.button_action,
      "add_to_cart"
    ), v = X(t.product), _ = this._resolveLink(t.link), A = !s || b === "view_product", N = b === "view_product" ? (a == null ? void 0 : a.url) || _ || "" : _ || (a == null ? void 0 : a.url) || "", C = this.localizedString(t.button_label) || this.localizedString(r.default_button_label) || this._defaultButtonLabel(b);
    return o`
      <article class="pc-card" data-layout=${i.imageLayout}>
        <div class="pc-media">
          ${u ? o`<img
                class="pc-img"
                src=${u}
                alt=${l}
                loading="lazy"
                draggable="false"
              />` : h}
          ${d ? o`<span class="pc-badge">${d}</span>` : h}
        </div>

        <div class="pc-body" data-align=${i.contentAlign}>
          ${c ? o`<h3 class="pc-title">${c}</h3>` : h}
          ${g ? o`
                <div class="pc-price-row">
                  <span class="pc-price">${g}</span>
                  ${$ ? o`<span class="pc-compare">${$}</span>` : h}
                </div>
              ` : h}
          ${p ? o`<p class="pc-desc">${p}</p>` : h}
          ${z ? o`<div class="pc-actions">
                ${this._renderButton(
      e,
      A,
      N,
      C,
      b,
      v == null ? void 0 : v.id
    )}
              </div>` : h}
          ${S ? o`<p class="pc-shipping">${S}</p>` : h}
        </div>
      </article>
    `;
  }
  _renderButton(t, e, i, r, a, s) {
    if (e)
      return o`
        <a class="pc-btn" href=${i || "#"}>
          <span>${r}</span>${this._icon("arrow")}
        </a>
      `;
    const d = this._lang() === "ar", c = this._cartStates.get(t) ?? "idle";
    return c === "loading" ? o`
        <button class="pc-btn" type="button" disabled aria-busy="true">
          <span class="pc-spinner" aria-hidden="true"></span>
          <span>${d ? "جارٍ الإضافة…" : "Adding…"}</span>
        </button>
      ` : c === "added" ? o`
        <button class="pc-btn" type="button" disabled>
          ${this._icon("check")}<span>${d ? "تمت الإضافة" : "Added"}</span>
        </button>
      ` : o`
      <button
        class="pc-btn"
        type="button"
        @click=${(p) => this._onPrimaryClick(p, t, s, a, i)}
      >
        ${this._icon("bag")}<span>${r}</span>
      </button>
    `;
  }
};
V.styles = J;
let k = V;
D([
  O({ type: Object })
], k.prototype, "config");
D([
  L()
], k.prototype, "_activeIndex");
D([
  L()
], k.prototype, "_animState");
D([
  L()
], k.prototype, "_stageH");
typeof k < "u" && k.registerSallaComponent("salla-product-cards");
export {
  k as default
};
