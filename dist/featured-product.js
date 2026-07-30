import { LitElement as gt, css as ut, html as o, nothing as d } from "lit";
import { property as mt, state as et } from "lit/decorators.js";
function bt(i, t) {
  if (typeof i == "string") return i;
  if (!i || typeof i != "object") return "";
  const e = i[t] || i.ar || i.en || "";
  return typeof e == "string" ? e.trim() : "";
}
function I(i) {
  return i.replace(/[٠-٩]/g, (t) => String(t.charCodeAt(0) - 1632)).replace(/[۰-۹]/g, (t) => String(t.charCodeAt(0) - 1776));
}
class wt extends gt {
  /**
   * Twilight transform injects `Component.registerSallaComponent(...)`.
   * Statics inherit, so `this` is the concrete component. The polling
   * fallback handles preview contexts where `Salla` loads after the
   * component file executes.
   */
  static registerSallaComponent(t) {
    const e = String(t || "").trim(), a = e.toLowerCase().replace(/[^a-z0-9._-]/g, "-"), n = a.includes("-") ? a : `salla-${a || "component"}`, r = () => `${n}-${Math.random().toString(36).substring(2, 8)}`, s = () => {
      var h;
      const p = (h = window.Salla) == null ? void 0 : h.bundles;
      return p && typeof p.registerComponent == "function" ? (p.registerComponent(e, {
        component: this,
        dynamicTagName: r()
      }), !0) : !1;
    };
    if (s()) return;
    const c = window.setInterval(() => {
      s() && window.clearInterval(c);
    }, 100);
    window.setTimeout(() => window.clearInterval(c), 5e3);
  }
  /** Resolved document language. */
  _lang() {
    return (document.documentElement.lang || "ar").toLowerCase().startsWith("en") ? "en" : "ar";
  }
  /** Pull the store-language string out of a Salla multilanguage value. */
  localizedString(t) {
    return bt(t, this._lang());
  }
  /** Dropdown-list values from settings may come as [{ label, value }]. */
  _pickValue(t, e) {
    if (typeof t == "string" && t) return t;
    if (Array.isArray(t) && t.length > 0) {
      const a = t[0];
      if (a && typeof a.value == "string" && a.value)
        return a.value;
    }
    return e;
  }
  /** See module-level toLatinDigits; exposed for subclasses. */
  _toLatinDigits(t) {
    return I(t);
  }
  /** Coerce a config number that may arrive as a string (Arabic-Indic
      digits included) or as a [{ value }] dropdown selection. */
  _num(t, e) {
    if (typeof t == "number" && !Number.isNaN(t)) return t;
    if (typeof t == "string" && t.trim() !== "") {
      const a = Number(I(t.trim()));
      if (!Number.isNaN(a)) return a;
    }
    if (Array.isArray(t) && t.length > 0) {
      const a = t[0];
      if ((a == null ? void 0 : a.value) !== void 0) return this._num(a.value, e);
    }
    return e;
  }
}
function Y() {
  const i = window;
  return i.salla ?? i.Salla ?? null;
}
function O(i) {
  if (!i) return null;
  if (typeof i == "string" || typeof i == "number") {
    const s = Number(i);
    return !s || Number.isNaN(s) ? null : { id: s, label: "" };
  }
  const t = Array.isArray(i) ? i[0] : i;
  if (!t) return null;
  if (typeof t == "string" || typeof t == "number") {
    const s = Number(t);
    return !s || Number.isNaN(s) ? null : { id: s, label: "" };
  }
  if (typeof t != "object") return null;
  const e = t, a = e.value ?? e.id ?? e.product_id;
  if (a == null) return null;
  const n = typeof a == "number" ? a : Number(a);
  if (!n || Number.isNaN(n)) return null;
  const r = String(e.label ?? e.name ?? e.title ?? "").trim();
  return { id: n, label: r };
}
function S(i) {
  if (typeof i == "number") return Number.isNaN(i) ? void 0 : i;
  if (i && typeof i == "object") {
    const a = i;
    return S(a.amount ?? a.value ?? a.price);
  }
  if (typeof i != "string") return;
  const t = I(i).replace(/[^0-9.,]/g, "").replace(/,/g, "");
  if (!t) return;
  const e = parseFloat(t);
  return Number.isNaN(e) ? void 0 : e;
}
function yt(i) {
  return Number.isInteger(i) ? String(i) : i.toFixed(2).replace(/\.?0+$/, "");
}
function P(i, t) {
  if (i == null || Number.isNaN(i)) return "";
  const e = Y();
  try {
    if (e && typeof e.money == "function")
      return t ? e.money({ amount: i, currency: t }) : e.money(i);
  } catch {
  }
  const a = yt(i);
  return t ? `${a} ${t}` : a;
}
async function vt(i, t = "") {
  var L, N, w, l, C, A, v, x, y, M, k;
  const e = Y();
  if (!e) throw new Error("Salla SDK unavailable");
  typeof e.onReady == "function" && await e.onReady();
  const a = ((L = e.product) == null ? void 0 : L.getDetails) ?? ((w = (N = e.product) == null ? void 0 : N.api) == null ? void 0 : w.getDetails);
  if (typeof a != "function")
    throw new Error("getDetails unavailable");
  const n = await a.call(e.product, i), r = (n == null ? void 0 : n.data) ?? n;
  if (!r) throw new Error("empty product payload");
  const s = ((l = r.image) == null ? void 0 : l.url) || ((C = r.image) == null ? void 0 : C.thumbnail) || Array.isArray(r.images) && (((A = r.images[0]) == null ? void 0 : A.url) || r.images[0]) || r.thumbnail || r.main_image || "", c = r.url || ((v = r.urls) == null ? void 0 : v.customer) || ((x = r.urls) == null ? void 0 : x.product) || r.permalink || `/p${i}`, p = S(r.price), h = S(r.regular_price), u = S(r.sale_price);
  let g = h ?? p, b = p ?? h;
  u !== void 0 && u > 0 && (b = u, (g === void 0 || g <= u) && (g = h ?? p ?? u));
  const T = (!!(r.is_on_sale ?? r.on_sale ?? r.has_offer) || u !== void 0) && g !== void 0 && b !== void 0 && b < g, z = r.currency || ((y = r.price) == null ? void 0 : y.currency) || ((M = r.regular_price) == null ? void 0 : M.currency) || void 0;
  return {
    name: String(r.name || r.title || t || `#${i}`),
    image: s || void 0,
    imageAlt: String(((k = r.image) == null ? void 0 : k.alt) || r.name || ""),
    url: c,
    regular: g,
    sale: T ? b : void 0,
    onSale: T,
    currency: z
  };
}
const _t = ut`
  :host {
    display: block;
    font-family: inherit;
    direction: inherit;

    --fp-bg: #f4f1ea;
    --fp-card-bg: #ffffff;
    --fp-card-radius: 24px;
    --fp-media-radius: 18px;
    --fp-eyebrow: #b08948;
    --fp-title: #14181f;
    --fp-text: #4b5563;
    --fp-price: #14181f;
    --fp-compare: #9aa1ac;
    --fp-badge-bg: #e23744;
    --fp-badge-color: #ffffff;
    --fp-highlight: #b08948;
    --fp-btn-bg: #14181f;
    --fp-btn-color: #ffffff;
    --fp-shipping: #2e7d52;
    --fp-effect: #b08948;
    --fp-aspect: 1 / 1;
    --fp-maxw: 600px;
    --fp-ease: cubic-bezier(0.22, 1, 0.36, 1);
    --fp-img-fit: contain;

    /* Highlights tinted box (framing always on; --fp-hl-bg-default is the
       context-aware tint, overridden by a merchant colour via --fp-hl-bg). */
    --fp-hl-radius: 14px;
    --fp-hl-gap: 4px;
    --fp-hl-item-pad: 0.72rem 1rem;
    --fp-hl-bg-default: rgba(20, 24, 31, 0.05);
  }

  *,
  *::before,
  *::after {
    box-sizing: border-box;
  }

  /* ---------- Section ---------- */
  .fp {
    width: 100%;
    background: var(--fp-bg);
    padding: clamp(2rem, 6vw, 4.5rem) clamp(1rem, 4vw, 2rem);
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
    gap: clamp(1rem, 2.5vw, 1.75rem);
    position: relative; /* anchors .fp-sbg background media */
  }

  /* Optional section heading that sits above the card. */
  .fp-section-title {
    width: 100%;
    margin: 0;
    color: var(--fp-title);
    font-size: clamp(1.9rem, 5vw, 3rem);
    font-weight: 800;
    line-height: 1.15;
    text-align: center;
    position: relative;
    z-index: 1;
  }

  /* Section background media (image / video) fills the section behind the card. */
  .fp-sbg {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    object-fit: cover;
    z-index: 0;
    display: block;
    pointer-events: none;
  }

  /* ---------- Card ---------- */
  .fp-card {
    position: relative;
    z-index: 1; /* lifts above .fp-sbg background media */
    width: 100%;
    /* Mobile card width; desktop override applied in the ≥768px block below. */
    max-width: var(--fp-maxw-mob, var(--fp-maxw));
    border-radius: var(--fp-card-radius);
    display: flex;
    flex-direction: column;
    gap: clamp(1.1rem, 3vw, 1.6rem);
    padding: clamp(1.25rem, 4vw, 2.25rem);
  }

  /* Card style: minimal — no chrome, content floats on the section. */
  .fp-card[data-card="minimal"] {
    background: transparent;
    padding-inline: 0;
  }

  /* Card style: soft — white surface, gentle elevation. */
  .fp-card[data-card="soft"] {
    background: var(--fp-card-bg);
    box-shadow: 0 30px 60px -32px rgba(15, 23, 42, 0.35),
      0 8px 20px -16px rgba(15, 23, 42, 0.25);
  }

  /* Card style: glass — translucent, blurred, hairline border + top sheen. */
  .fp-card[data-card="glass"] {
    background: var(--fp-card-bg);
    -webkit-backdrop-filter: blur(18px) saturate(1.4);
    backdrop-filter: blur(18px) saturate(1.4);
    border: 1px solid rgba(255, 255, 255, 0.55);
    box-shadow: 0 30px 70px -34px rgba(15, 23, 42, 0.45),
      inset 0 1px 0 rgba(255, 255, 255, 0.6);
  }

  /* Card style: bold — rich gradient surface for offer-led spotlights. */
  .fp-card[data-card="bold"] {
    background: var(--fp-card-bg);
    box-shadow: 0 36px 80px -34px rgba(0, 0, 0, 0.55);
  }

  /* ---------- Media ---------- */
  .fp-media {
    position: relative;
    width: 100%;
    flex: none;
  }
  .fp-media[data-tilt="on"] {
    perspective: 900px;
  }
  .fp-media-inner {
    position: relative;
    width: 100%;
    aspect-ratio: var(--fp-aspect);
    border-radius: var(--fp-media-radius);
    overflow: hidden;
    z-index: 1;
    transition: transform 0.25s ease-out;
    transform-style: preserve-3d;
    /* Pre-composite onto its own GPU layer so the JS tilt transform is applied
       immediately without a promotion delay, even when the child .fp-img is
       already on its own layer for the float-bob animation. */
    will-change: transform;
  }
  .fp-media[data-tilt="on"] .fp-media-inner {
    transform-origin: center;
    transition: transform 100ms ease-out;
  }
  .fp-img {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    object-fit: var(--fp-img-fit, contain);
    display: block;
    user-select: none;
    -webkit-user-select: none;
  }
  /* Hover image cross-fade (desktop, pointer devices only). */
  .fp-img--hover {
    opacity: 0;
    transition: opacity 0.55s var(--fp-ease);
  }
  @media (hover: hover) {
    .fp-card:hover .fp-img--hover {
      opacity: 1;
    }
  }

  /* ---------- Background effect (behind the image) ---------- */
  .fp-effect {
    position: absolute;
    inset: 0;
    z-index: 0;
    pointer-events: none;
    display: grid;
    place-items: center;
  }
  .fp-effect::before {
    content: "";
    display: block;
  }
  .fp-effect[data-effect="circle"]::before {
    width: 96%;
    aspect-ratio: 1;
    border-radius: 50%;
    background: var(--fp-effect);
    opacity: 0.16;
  }
  .fp-effect[data-effect="glow"]::before {
    width: 120%;
    height: 120%;
    border-radius: 50%;
    background: radial-gradient(
      circle at center,
      var(--fp-effect) 0%,
      transparent 62%
    );
    opacity: 0.4;
    filter: blur(8px);
  }
  /* ---------- Content ---------- */
  .fp-content {
    display: flex;
    flex-direction: column;
    gap: clamp(0.7rem, 2vw, 1rem);
    min-width: 0;
  }
  .fp-eyebrow {
    margin: 0;
    color: var(--fp-eyebrow);
    font-size: 0.8rem;
    font-weight: 700;
    letter-spacing: 1.5px;
    text-transform: uppercase;
  }
  .fp-title {
    margin: 0;
    color: var(--fp-title);
    font-size: clamp(1.6rem, 4.5vw, 2.4rem);
    font-weight: 700;
    line-height: 1.18;
    letter-spacing: -0.01em;
  }
  .fp-desc {
    margin: 0;
    color: var(--fp-text);
    font-size: clamp(0.95rem, 1.4vw, 1.05rem);
    line-height: 1.75;
  }

  /* ---------- Highlights ---------- */
  .fp-highlights {
    list-style: none;
    margin: 0;
    padding: 0;
    display: flex;
    flex-direction: column;
    gap: var(--fp-hl-gap);
    /* Merchant colour wins; otherwise the context-aware default tint. */
    background: var(--fp-hl-bg, var(--fp-hl-bg-default));
    border-radius: var(--fp-hl-radius);
    overflow: hidden; /* clips first/last item corners to the border-radius */
  }
  .fp-highlight {
    display: flex;
    align-items: center;
    gap: 0.55rem;
    color: var(--fp-highlight-text, var(--fp-text));
    font-size: 0.97rem;
    line-height: 1.4;
    padding: var(--fp-hl-item-pad);
  }
  /* Light-text contexts (bold card, dark glossy overlay) → translucent light
     tint so the box reads on a dark surface without becoming a solid slab. */
  .fp-card[data-card="bold"] .fp-highlights,
  .fp-hero:not([data-tone="light"]) .fp-highlights {
    --fp-hl-bg-default: rgba(255, 255, 255, 0.12);
  }
  /* Light overlay → translucent dark tint that lets the image show through
     (no solid block over the photo). */
  .fp-hero[data-tone="light"] .fp-highlights {
    --fp-hl-bg-default: rgba(20, 24, 31, 0.08);
  }
  .fp-highlight svg {
    width: 20px;
    height: 20px;
    flex: none;
    color: var(--fp-highlight);
  }

  /* ---------- Pricing ---------- */
  .fp-price-row {
    display: flex;
    align-items: baseline;
    flex-wrap: wrap;
    gap: 0.6rem;
    margin-top: 0.15rem;
  }
  .fp-price {
    color: var(--fp-price);
    font-size: clamp(1.5rem, 3.6vw, 2.05rem);
    font-weight: 800;
    line-height: 1;
  }
  .fp-compare {
    color: var(--fp-compare);
    font-size: 1rem;
    font-weight: 600;
    text-decoration: line-through;
    text-decoration-thickness: 1.5px;
  }
  .fp-shipping {
    margin: 0;
    display: inline-flex;
    align-items: center;
    gap: 0.4rem;
    color: var(--fp-shipping);
    font-size: 0.9rem;
    font-weight: 600;
  }
  .fp-shipping svg {
    width: 18px;
    height: 18px;
    flex: none;
  }

  /* ---------- Button ---------- */
  .fp-actions {
    margin-top: 0.4rem;
  }
  .fp-btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
    padding: 14px 30px;
    width: 100%;
    border: none;
    border-radius: var(--fp-btn-radius, 999px);
    background: var(--fp-btn-bg);
    color: var(--fp-btn-color);
    font-family: inherit;
    font-size: 1rem;
    font-weight: 700;
    cursor: pointer;
    text-decoration: none;
    box-shadow: 0 16px 34px -14px rgba(0, 0, 0, 0.5);
    transition: transform 0.25s var(--fp-ease),
      box-shadow 0.25s var(--fp-ease), opacity 0.2s var(--fp-ease);
  }
  .fp-btn:hover {
    transform: translateY(-2px);
    box-shadow: 0 22px 42px -16px rgba(0, 0, 0, 0.6);
  }
  .fp-btn:active {
    transform: translateY(0);
  }
  .fp-btn[disabled] {
    opacity: 0.7;
    cursor: default;
    transform: none;
  }
  .fp-btn svg {
    width: 19px;
    height: 19px;
    flex: none;
  }
  /* Arrow points toward the reading direction. */
  .fp-btn .fp-btn__arrow {
    transition: transform 0.25s var(--fp-ease);
  }
  .fp-btn:dir(rtl) .fp-btn__arrow {
    transform: scaleX(-1);
  }
  .fp-btn:hover .fp-btn__arrow {
    transform: translateX(3px);
  }
  .fp-btn:dir(rtl):hover .fp-btn__arrow {
    transform: scaleX(-1) translateX(3px);
  }
  /* Loading spinner. */
  .fp-spinner {
    width: 18px;
    height: 18px;
    border-radius: 50%;
    border: 2px solid currentColor;
    border-top-color: transparent;
    animation: fp-spin 0.7s linear infinite;
  }
  @keyframes fp-spin {
    to {
      transform: rotate(360deg);
    }
  }

  /* =========================================================
     LAYOUT: inside (image inside the card, content below)
     ========================================================= */
  /* base (mobile) is already a single column — nothing extra needed */

  /* =========================================================
     LAYOUT: floating (image lifts above the card top edge)
     ========================================================= */

  /* The card is pushed down so the image can rise above it. */
  .fp-card[data-layout="floating"] {
    margin-top: clamp(120px, 32vw, 240px);
  }
  /* Negative margin lifts the media above the card's top edge by the same amount. */
  .fp-card[data-layout="floating"] .fp-media {
    margin-top: clamp(-240px, -32vw, -120px);
  }
  .fp-card[data-layout="floating"] .fp-media-inner {
    border-radius: 0;
    overflow: visible;
    background: transparent;
  }
  .fp-card[data-layout="floating"] .fp-img {
    filter: drop-shadow(0 26px 34px rgba(0, 0, 0, 0.3));
  }
  /* The effect should sit behind the floating product, not clip to a frame. */
  .fp-card[data-layout="floating"] .fp-effect {
    overflow: visible;
  }

  /* =========================================================
     LAYOUT: split (image beside details on desktop)
     ========================================================= */
  /* mobile: stacks (image then content). Desktop handled in media query. */

  /* =========================================================
     LAYOUT: background — a PRODUCT CARD whose surface is the image.
     The image keeps its NATURAL aspect ratio (never cropped), but the
     card is constrained to the same width tiers as every other layout
     via --fp-maxw-* (the shared "card size" dropdown — no new control)
     and centred. A glossy frosted overlay carries the content over the
     lower part of the image. Corners stay clean because the image rounds
     ITSELF and nothing solid sits behind it.
     ========================================================= */
  .fp-hero {
    position: relative;
    width: 100%;
    /* Same width tiers as the other layouts; desktop override below. */
    max-width: var(--fp-maxw-mob, var(--fp-maxw));
    margin-inline: auto;
    overflow: hidden;
    border-radius: var(--fp-card-radius);
    /* Even ambient shadow so every corner is grounded the same. */
    /* Transparent: the image is the surface. A dark fill appears only when
       there is no image (below) — never behind it, so no corner can bleed. */
    background: transparent;
  }
  /* No image provided → give the card a height + surface so the overlay reads. */
  .fp-hero:not(:has(.fp-hero-img)) {
    min-height: 360px;
    background: #14181f;
  }
  /* Full-width image at its OWN aspect ratio (uncropped). It rounds ITSELF to
     the card radius — a replaced element's border-radius travels with its
     composited layer, so the corners stay clean even though the overlay's
     backdrop-filter composites this image. */
  .fp-hero-img {
    display: block;
    width: 100%;
    height: auto;
    border-radius: var(--fp-card-radius);
  }
  /* Glossy frosted overlay (backdrop-filter blurs the image behind it) carrying
     the content over the lower part of the card. */
  .fp-hero .fp-content {
    position: absolute;
    inset-inline: 0;
    bottom: 0;
    z-index: 2;
    width: 100%;
    padding: clamp(1.5rem, 5vw, 2.75rem);
    padding-top: clamp(0.7rem, 2.5vw, 1rem);
    border-radius: 0 0 var(--fp-card-radius) var(--fp-card-radius);
    -webkit-backdrop-filter: blur(16px) saturate(1.35);
    backdrop-filter: blur(16px) saturate(1.35);
  }
  .fp-hero:not([data-tone="light"]) .fp-content {
    background: linear-gradient(
      to top,
      rgba(12, 15, 20, 0.86) 0%,
      rgba(12, 15, 20, 0.6) 62%,
      rgba(12, 15, 20, 0.32) 100%
    );
    
    
  }
  .fp-hero[data-tone="light"] .fp-content {
    background: linear-gradient(
      to top,
      rgba(255, 255, 255, 0.9) 0%,
      rgba(255, 255, 255, 0.7) 62%,
      rgba(255, 255, 255, 0.45) 100%
    );
  }
  /* =========================================================
     CONTENT ALIGNMENT  (set via data-align on .fp-content)
     Highlights are excluded — they stay start/RTL-aligned always.
     ========================================================= */

  /* ---- Center ---- */
  .fp-content[data-align="center"] {
    text-align: center;
  }
  .fp-content[data-align="center"] .fp-price-row {
    justify-content: center;
  }
  /* Keep highlights start-aligned even when parent is centered */
  .fp-content[data-align="center"] .fp-highlights {
    text-align: start;
  }

  /* ---- Left ---- */
  .fp-content[data-align="left"] {
    text-align: left;
  }
  .fp-content[data-align="left"] .fp-price-row {
    justify-content: flex-end;
  }
  .fp-content[data-align="left"] .fp-highlights {
    text-align: start;
  }

  /* =========================================================
     ENTRANCE ANIMATION
     ========================================================= */
  .fp[data-enter="ready"] .fp-media {
    opacity: 0;
    transform: translateY(14px) scale(0.97);
  }
  .fp[data-enter="in"] .fp-media {
    opacity: 1;
    transform: none;
    transition: opacity 0.8s var(--fp-ease), transform 0.9s var(--fp-ease);
  }
  /* Background hero: the image (.fp-hero-img) gets no entrance transform — it
     just appears, while only the overlaid content animates in. */
  .fp[data-enter="ready"] .fp-content > * {
    opacity: 0;
    transform: translateY(12px);
    filter: blur(8px);
  }
  .fp[data-enter="in"] .fp-content > * {
    opacity: 1;
    transform: none;
    filter: blur(0);
    transition: opacity 0.7s var(--fp-ease), transform 0.7s var(--fp-ease),
      filter 0.7s var(--fp-ease);
  }
  .fp[data-enter="in"] .fp-content > *:nth-child(1) {
    transition-delay: 0.1s;
  }
  .fp[data-enter="in"] .fp-content > *:nth-child(2) {
    transition-delay: 0.18s;
  }
  .fp[data-enter="in"] .fp-content > *:nth-child(3) {
    transition-delay: 0.26s;
  }
  .fp[data-enter="in"] .fp-content > *:nth-child(4) {
    transition-delay: 0.34s;
  }
  .fp[data-enter="in"] .fp-content > *:nth-child(5) {
    transition-delay: 0.42s;
  }
  .fp[data-enter="in"] .fp-content > *:nth-child(6) {
    transition-delay: 0.5s;
  }
  .fp[data-enter="in"] .fp-content > *:nth-child(n + 7) {
    transition-delay: 0.56s;
  }

  /* =========================================================
     FLOAT (gentle idle bob of the product image)
     ========================================================= */
  @keyframes fp-bob {
    0%,
    100% {
      transform: translateY(0) scale(1);
    }
    50% {
      transform: translateY(calc(var(--fp-float-distance, 18px) * -1))
        scale(1.025);
    }
  }
  .fp[data-float="on"] .fp-card:not([data-layout="background"]) .fp-img {
    animation: fp-bob var(--fp-float-duration, 5.5s) ease-in-out infinite;
  }
  /* Hold the bob until the entrance settles. */
  .fp[data-enter="ready"] .fp-img {
    animation: none !important;
  }

  /* =========================================================
     DESKTOP ENHANCEMENTS (≥ 768px)
     ========================================================= */
  @media (min-width: 768px) {
    /* Desktop card width; falls back to the mobile size when not overridden. */
    .fp-card {
      max-width: var(--fp-maxw-desk, var(--fp-maxw-mob, var(--fp-maxw)));
    }
    .fp-card[data-layout="inside"],
    .fp-card[data-layout="floating"] {
      --fp-maxw: 560px;
    }
    .fp-card[data-layout="split"] {
      --fp-maxw: 1080px;
      flex-direction: row;
      align-items: center;
      gap: clamp(1.75rem, 4vw, 3.25rem);
      padding: clamp(1.75rem, 3vw, 2.75rem);
    }
    .fp-card[data-layout="split"][data-side="end"] {
      flex-direction: row-reverse;
    }
    .fp-card[data-layout="split"] .fp-media {
      flex: 1 1 50%;
    }
    .fp-card[data-layout="split"] .fp-content {
      flex: 1 1 50%;
    }
    /* Background card width follows the desktop card-size tier, same as the
       other layouts (falls back to the mobile size, then the default). */
    .fp-hero {
      max-width: var(--fp-maxw-desk, var(--fp-maxw-mob, var(--fp-maxw)));
    }
  }

  /* =========================================================
     EMPTY STATE
     ========================================================= */
  .fp-empty {
    width: 100%;
    padding: 56px 20px;
    text-align: center;
    color: #8a8a8a;
    background: var(--fp-bg);
  }

  /* =========================================================
     REDUCED MOTION
     ========================================================= */
  @media (prefers-reduced-motion: reduce) {
    .fp-media,
    .fp-media-inner,
    .fp-content > *,
    .fp-img,
    .fp-img--hover,
    .fp-btn {
      transition: none !important;
      animation: none !important;
    }
    .fp[data-enter] .fp-media,
    .fp[data-enter] .fp-content > * {
      opacity: 1 !important;
      transform: none !important;
      filter: none !important;
    }
  }
`;
var xt = Object.defineProperty, U = (i, t, e, a) => {
  for (var n = void 0, r = i.length - 1, s; r >= 0; r--)
    (s = i[r]) && (n = s(t, e, n) || n);
  return n && xt(t, e, n), n;
};
const H = class H extends wt {
  constructor() {
    super(...arguments), this._animState = "ready", this._cartState = "idle", this._cartResetTimer = null, this._productCache = /* @__PURE__ */ new Map(), this._onTiltMove = (t) => {
      if (!this._tiltAllowed(t)) return;
      const e = t.currentTarget, a = e.querySelector(".fp-media-inner");
      if (!a) return;
      const n = e.getBoundingClientRect();
      if (!n.width || !n.height) return;
      const r = Math.max(-1, Math.min(1, (t.clientX - n.left) / n.width * 2 - 1)), s = Math.max(-1, Math.min(1, (t.clientY - n.top) / n.height * 2 - 1)), c = 10;
      a.style.transform = `rotateY(${r * c}deg) rotateX(${-s * c}deg) scale3d(1.025, 1.025, 1.025)`;
    }, this._onTiltLeave = (t) => {
      const a = t.currentTarget.querySelector(".fp-media-inner");
      a && (a.style.transform = "");
    }, this._onPrimaryClick = async (t) => {
      var h, u, g;
      if (t.preventDefault(), this._cartState === "loading") return;
      const e = this.config || {}, a = this._pickValue(
        e.button_action,
        "add_to_cart"
      ), n = O(e.product), r = this._resolveProduct(), s = n == null ? void 0 : n.id, c = this._salla, p = ((h = c == null ? void 0 : c.cart) == null ? void 0 : h.addItem) ?? ((g = (u = c == null ? void 0 : c.cart) == null ? void 0 : u.api) == null ? void 0 : g.addItem);
      if (!s || typeof p != "function") {
        r != null && r.url && (window.location.href = r.url);
        return;
      }
      this._cartState = "loading";
      try {
        if (await p.call(c.cart, { id: s, quantity: 1 }), this._cartState = "added", a === "buy_now") {
          window.location.href = "/cart";
          return;
        }
        this._cartResetTimer && clearTimeout(this._cartResetTimer), this._cartResetTimer = window.setTimeout(() => {
          this._cartState = "idle";
        }, 2500);
      } catch (b) {
        console.warn("[growth-featured-product] add to cart failed", b), this._cartState = "idle";
      }
    };
  }
  /** Salla SDK global — see shared/product.ts. */
  get _salla() {
    return Y();
  }
  async _fetchProduct(t) {
    if (!this._productCache.has(t)) {
      this._productCache.set(t, { status: "loading" }), this.requestUpdate();
      try {
        const e = await vt(t);
        this._productCache.set(t, { status: "loaded", data: e });
      } catch (e) {
        console.warn("[growth-featured-product] product fetch failed", t, e), this._productCache.set(t, { status: "failed" });
      }
      this.requestUpdate();
    }
  }
  _resolveProduct() {
    var a;
    const t = O((a = this.config) == null ? void 0 : a.product);
    if (!t) return null;
    const e = this._productCache.get(t.id);
    return e ? e.status === "loaded" ? e.data : e.status === "loading" && t.label ? { name: t.label, url: "", onSale: !1 } : null : (this._fetchProduct(t.id), t.label ? { name: t.label, url: "", onSale: !1 } : null);
  }
  // ------------------------------------------------------------
  // Lifecycle
  // ------------------------------------------------------------
  connectedCallback() {
    var a;
    super.connectedCallback();
    const t = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches, e = ((a = this.config) == null ? void 0 : a.enable_entrance_anim) === !1;
    t || e ? this._animState = "in" : requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        this._animState = "in";
      });
    });
  }
  disconnectedCallback() {
    super.disconnectedCallback(), this._cartResetTimer && (clearTimeout(this._cartResetTimer), this._cartResetTimer = null);
  }
  willUpdate(t) {
    t.has("config") && (this._cartState = "idle");
  }
  // ------------------------------------------------------------
  // Pointer tilt (desktop, fine pointers, motion-allowed)
  // ------------------------------------------------------------
  _tiltAllowed(t) {
    return t.pointerType !== "touch" && !window.matchMedia("(prefers-reduced-motion: reduce)").matches;
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
        return o`<svg class="fp-btn__arrow" viewBox="0 0 24 24" fill="none"
          stroke="currentColor" stroke-width="2.4" stroke-linecap="round"
          stroke-linejoin="round">
          <path d="M5 12h14M13 6l6 6-6 6" />
        </svg>`;
      case "check":
        return o`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor"
          stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <path d="M20 6 9 17l-5-5" />
        </svg>`;
      case "truck":
        return o`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor"
          stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round">
          <path d="M3 7h11v9H3z" />
          <path d="M14 10h3.5L21 13v3h-7z" />
          <circle cx="7" cy="18.5" r="1.6" />
          <circle cx="17" cy="18.5" r="1.6" />
        </svg>`;
    }
  }
  // ------------------------------------------------------------
  // Render
  // ------------------------------------------------------------
  render() {
    const t = this.config || {}, e = this._pickValue(
      t.image_layout,
      "floating"
    ), a = this._pickValue(t.image_side, "start"), n = this._pickValue(
      e === "floating" ? t.aspect_ratio_floating : e === "split" ? t.aspect_ratio_split : t.aspect_ratio,
      "1/1"
    ), r = this._pickValue(
      e === "split" ? t.image_fit_split : t.image_fit,
      "contain"
    ), s = this._pickValue(
      e === "floating" ? t.bg_effect_floating : e === "split" ? t.bg_effect_split : t.bg_effect,
      "none"
    ), c = s === "none" ? "" : (e === "floating" ? s === "glow" ? t.bg_effect_color_floating_glow : t.bg_effect_color_floating : e === "split" ? s === "glow" ? t.bg_effect_color_split_glow : t.bg_effect_color_split : s === "glow" ? t.bg_effect_color_glow : t.bg_effect_color) || "", p = this._pickValue(t.card_style, "soft"), h = this._num(t.card_radius, 24), u = Math.max(8, h - 6), g = this._pickValue(
      t.card_size_mobile,
      "compact"
    ), b = this._pickValue(
      t.card_size_desktop,
      "inherit"
    ), q = b === "inherit" ? g : b, T = this._pickValue(t.bg_type, "color"), z = this._pickValue(
      t.bg_overlay_tone,
      "dark"
    ), L = this._pickValue(t.content_align, "right"), N = t.highlights_bg || "", w = this.localizedString(t.section_title), l = this._resolveProduct(), C = !!O(t.product), A = this.localizedString(t.eyebrow), v = this.localizedString(t.title) || (l == null ? void 0 : l.name) || "", x = this.localizedString(t.description), y = t.image || (l == null ? void 0 : l.image) || "", M = t.enable_hover_image && t.image_hover || "", k = v || (l == null ? void 0 : l.imageAlt) || "", R = (Array.isArray(t.highlights) ? t.highlights : []).map((f) => this.localizedString(f == null ? void 0 : f.text)).filter(Boolean).slice(0, 3), at = t.show_price !== !1, F = t.show_sale_price !== !1;
    let $ = "", E = "";
    if (at) {
      const f = this.localizedString(t.price), j = this.localizedString(
        t.compare_price
      );
      if (f) {
        $ = f;
        const Z = S(f), tt = S(j);
        F && j && tt !== void 0 && Z !== void 0 && tt > Z && (E = j);
      } else l && (l.onSale && l.sale !== void 0 ? ($ = P(l.sale, l.currency), F && l.regular !== void 0 && (E = P(l.regular, l.currency))) : l.regular !== void 0 && ($ = P(l.regular, l.currency)));
    }
    const X = this.localizedString(t.free_shipping_text), it = t.show_button !== !1, rt = {
      square: "0px",
      soft: "12px",
      rounded: "22px",
      pill: "999px"
    }[this._pickValue(t.button_radius, "pill")], D = this._pickValue(
      t.button_action,
      "add_to_cart"
    ), nt = !C || D === "view_product", ot = D === "view_product" ? (l == null ? void 0 : l.url) || t.button_url || "" : t.button_url || "", st = this.localizedString(t.button_label) || this._defaultButtonLabel(D), lt = t.enable_float_anim !== !1, K = this._pickValue(
      t.float_anim_speed,
      "normal"
    ), ct = {
      slow: "6.8s",
      normal: "5s",
      fast: "3.6s"
    }, pt = {
      slow: "14px",
      normal: "18px",
      fast: "22px"
    }, B = !!t.enable_tilt && e !== "background", m = e === "background" && z === "dark" || p === "bold", dt = p === "minimal" ? "transparent" : p === "glass" ? "rgba(255,255,255,0.55)" : p === "bold" ? "linear-gradient(135deg,#283548,#11161f)" : "#ffffff", G = (f) => f === "compact" ? "min(420px, 82%)" : f === "large" ? "min(860px, 96%)" : f === "full" ? "100%" : "var(--fp-maxw)", V = [
      t.bg_color ? `--fp-bg: ${t.bg_color}` : "",
      `--fp-maxw-mob: ${G(g)}`,
      `--fp-maxw-desk: ${G(q)}`,
      `--fp-card-bg: ${t.card_bg || dt}`,
      `--fp-card-radius: ${h}px`,
      `--fp-media-radius: ${u}px`,
      `--fp-aspect: ${n}`,
      `--fp-img-fit: ${r}`,
      `--fp-eyebrow: ${t.eyebrow_color || (m ? "#d8b478" : "#b08948")}`,
      `--fp-title: ${t.title_color || (m ? "#ffffff" : "#14181f")}`,
      `--fp-text: ${t.text_color || (m ? "rgba(255,255,255,0.85)" : "#4b5563")}`,
      `--fp-price: ${t.price_color || (m ? "#ffffff" : "#14181f")}`,
      `--fp-compare: ${t.compare_color || (m ? "rgba(255,255,255,0.6)" : "#9aa1ac")}`,
      `--fp-badge-bg: ${t.badge_bg || "#e23744"}`,
      `--fp-badge-color: ${t.badge_color || "#ffffff"}`,
      `--fp-highlight: ${t.highlight_color || (m ? "#d8b478" : "#b08948")}`,
      `--fp-highlight-text: ${t.highlight_text_color || t.text_color || (m ? "rgba(255,255,255,0.85)" : "#4b5563")}`,
      `--fp-btn-bg: ${t.button_bg || (m ? "#ffffff" : "#14181f")}`,
      `--fp-btn-color: ${t.button_color || (m ? "#14181f" : "#ffffff")}`,
      `--fp-btn-radius: ${rt}`,
      `--fp-shipping: ${m ? "#7ee0aa" : "#2e7d52"}`,
      `--fp-effect: ${c || (m ? "#d8b478" : "#b08948")}`,
      `--fp-float-duration: ${ct[K]}`,
      `--fp-float-distance: ${pt[K]}`,
      // Highlights wrapper background. The framing (tinted box) always renders
      // with a context-aware default tint resolved in CSS; a merchant colour,
      // when set, overrides that default.
      N ? `--fp-hl-bg: ${N}` : ""
    ].filter(Boolean).join("; "), W = !!(y || v || x || R.length || $ || C);
    if (!W && !w)
      return o`
        <section class="fp-empty" style=${V}>
          <p>
            ${this._lang() === "ar" ? "اربط منتجًا أو أضف صورة وعنوانًا لعرض المنتج المميز." : "Link a product or add an image and title to show the featured product."}
          </p>
        </section>
      `;
    const ft = s !== "none" && e !== "background", ht = y ? o`
          <div
            class="fp-media"
            data-tilt=${B ? "on" : "off"}
            @pointermove=${B ? this._onTiltMove : null}
            @pointerleave=${B ? this._onTiltLeave : null}
          >
            ${ft ? o`<div class="fp-effect" data-effect=${s}></div>` : d}
            <div class="fp-media-inner">
              <img
                class="fp-img"
                src=${y}
                alt=${k}
                loading="lazy"
                draggable="false"
              />
              ${M && e !== "background" ? o`<img
                    class="fp-img fp-img--hover"
                    src=${M}
                    alt=${k}
                    loading="lazy"
                    draggable="false"
                  />` : d}
            </div>
          </div>
        ` : d, J = o`
      <div class="fp-content" data-align=${L}>
        ${A ? o`<p class="fp-eyebrow">${A}</p>` : d}
        ${v ? o`<h2 class="fp-title">${v}</h2>` : d}
        ${R.length ? o`
              <ul class="fp-highlights">
                ${R.map(
      (f) => o`
                    <li class="fp-highlight">${this._icon("check")}<span>${f}</span></li>
                  `
    )}
              </ul>
            ` : d}
        ${x ? o`<p class="fp-desc">${x}</p>` : d}
        ${$ ? o`
              <div class="fp-price-row">
                <span class="fp-price">${$}</span>
                ${E ? o`<span class="fp-compare">${E}</span>` : d}
              </div>
            ` : d}
        ${X ? o`<p class="fp-shipping">${this._icon("truck")}<span>${X}</span></p>` : d}
        ${it ? o`<div class="fp-actions">${this._renderButton(nt, ot, st, D)}</div>` : d}
      </div>
    `, Q = T === "image" && t.bg_image ? o`<img class="fp-sbg" src=${t.bg_image} alt="" aria-hidden="true" />` : T === "video" && t.bg_video ? o`<video
            class="fp-sbg"
            src=${t.bg_video}
            autoplay
            muted
            loop
            playsinline
          ></video>` : d;
    return e === "background" ? o`
        <section
          class="fp"
          style=${V}
          data-enter=${this._animState}
          data-layout="background"
        >
          ${Q}
          ${w ? o`<h2 class="fp-section-title">${w}</h2>` : d}
          <div class="fp-hero" data-tone=${z}>
            ${y ? o`<img
                  class="fp-hero-img"
                  src=${y}
                  alt=${k}
                  loading="lazy"
                  draggable="false"
                />` : d}
            ${J}
          </div>
        </section>
      ` : o`
      <section
        class="fp"
        style=${V}
        data-enter=${this._animState}
        data-float=${lt ? "on" : "off"}
        data-layout=${e}
      >
        ${Q}
        ${w ? o`<h2 class="fp-section-title">${w}</h2>` : d}
        ${W ? o`<div
          class="fp-card"
          data-layout=${e}
          data-side=${a}
          data-card=${p}
          data-tone=${z}
        >
          ${ht} ${J}
        </div>` : d}
      </section>
    `;
  }
  _renderButton(t, e, a, n) {
    if (t)
      return o`
        <a class="fp-btn" href=${e || "#"}>
          <span>${a}</span>${this._icon("arrow")}
        </a>
      `;
    const r = this._lang() === "ar";
    return this._cartState === "loading" ? o`
        <button class="fp-btn" type="button" disabled aria-busy="true">
          <span class="fp-spinner" aria-hidden="true"></span>
          <span>${r ? "جارٍ الإضافة…" : "Adding…"}</span>
        </button>
      ` : this._cartState === "added" ? o`
        <button class="fp-btn" type="button" disabled>
          ${this._icon("check")}
          <span>${r ? "تمت الإضافة" : "Added"}</span>
        </button>
      ` : o`
      <button class="fp-btn" type="button" @click=${this._onPrimaryClick}>
        ${this._icon("bag")}<span>${a}</span>
      </button>
    `;
  }
};
H.styles = _t;
let _ = H;
U([
  mt({ type: Object })
], _.prototype, "config");
U([
  et()
], _.prototype, "_animState");
U([
  et()
], _.prototype, "_cartState");
typeof _ < "u" && _.registerSallaComponent("salla-featured-product");
export {
  _ as default
};
