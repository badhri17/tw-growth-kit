import { LitElement as E, css as L, html as o, nothing as n } from "lit";
import { property as O, state as M } from "lit/decorators.js";
function I(s, t) {
  if (typeof s == "string") return s;
  if (!s || typeof s != "object") return "";
  const a = s[t] || s.ar || s.en || "";
  return typeof a == "string" ? a.trim() : "";
}
function C(s) {
  return s.replace(/[٠-٩]/g, (t) => String(t.charCodeAt(0) - 1632)).replace(/[۰-۹]/g, (t) => String(t.charCodeAt(0) - 1776));
}
class j extends E {
  /**
   * Twilight transform injects `Component.registerSallaComponent(...)`.
   * Statics inherit, so `this` is the concrete component. The polling
   * fallback handles preview contexts where `Salla` loads after the
   * component file executes.
   */
  static registerSallaComponent(t) {
    const a = String(t || "").trim(), e = a.toLowerCase().replace(/[^a-z0-9._-]/g, "-"), r = e.includes("-") ? e : `salla-${e || "component"}`, i = () => `${r}-${Math.random().toString(36).substring(2, 8)}`, l = () => {
      var p;
      const h = (p = window.Salla) == null ? void 0 : p.bundles;
      return h && typeof h.registerComponent == "function" ? (h.registerComponent(a, {
        component: this,
        dynamicTagName: i()
      }), !0) : !1;
    };
    if (l()) return;
    const c = window.setInterval(() => {
      l() && window.clearInterval(c);
    }, 100);
    window.setTimeout(() => window.clearInterval(c), 5e3);
  }
  /** Resolved document language. */
  _lang() {
    return (document.documentElement.lang || "ar").toLowerCase().startsWith("en") ? "en" : "ar";
  }
  /** Pull the store-language string out of a Salla multilanguage value. */
  localizedString(t) {
    return I(t, this._lang());
  }
  /** Dropdown-list values from settings may come as [{ label, value }]. */
  _pickValue(t, a) {
    if (typeof t == "string" && t) return t;
    if (Array.isArray(t) && t.length > 0) {
      const e = t[0];
      if (e && typeof e.value == "string" && e.value)
        return e.value;
    }
    return a;
  }
  /** See module-level toLatinDigits; exposed for subclasses. */
  _toLatinDigits(t) {
    return C(t);
  }
  /** Coerce a config number that may arrive as a string (Arabic-Indic
      digits included) or as a [{ value }] dropdown selection. */
  _num(t, a) {
    if (typeof t == "number" && !Number.isNaN(t)) return t;
    if (typeof t == "string" && t.trim() !== "") {
      const e = Number(C(t.trim()));
      if (!Number.isNaN(e)) return e;
    }
    if (Array.isArray(t) && t.length > 0) {
      const e = t[0];
      if ((e == null ? void 0 : e.value) !== void 0) return this._num(e.value, a);
    }
    return a;
  }
}
function A() {
  const s = window;
  return s.salla ?? s.Salla ?? null;
}
function B(s) {
  if (!s) return null;
  if (typeof s == "string" || typeof s == "number") {
    const l = Number(s);
    return !l || Number.isNaN(l) ? null : { id: l, label: "" };
  }
  const t = Array.isArray(s) ? s[0] : s;
  if (!t) return null;
  if (typeof t == "string" || typeof t == "number") {
    const l = Number(t);
    return !l || Number.isNaN(l) ? null : { id: l, label: "" };
  }
  if (typeof t != "object") return null;
  const a = t, e = a.value ?? a.id ?? a.product_id;
  if (e == null) return null;
  const r = typeof e == "number" ? e : Number(e);
  if (!r || Number.isNaN(r)) return null;
  const i = String(a.label ?? a.name ?? a.title ?? "").trim();
  return { id: r, label: i };
}
function $(s) {
  if (typeof s == "number") return Number.isNaN(s) ? void 0 : s;
  if (s && typeof s == "object") {
    const e = s;
    return $(e.amount ?? e.value ?? e.price);
  }
  if (typeof s != "string") return;
  const t = C(s).replace(/[^0-9.,]/g, "").replace(/,/g, "");
  if (!t) return;
  const a = parseFloat(t);
  return Number.isNaN(a) ? void 0 : a;
}
function X(s) {
  return Number.isInteger(s) ? String(s) : s.toFixed(2).replace(/\.?0+$/, "");
}
function S(s, t) {
  if (s == null || Number.isNaN(s)) return "";
  const a = A();
  try {
    if (a && typeof a.money == "function")
      return t ? a.money({ amount: s, currency: t }) : a.money(s);
  } catch {
  }
  const e = X(s);
  return t ? `${e} ${t}` : e;
}
async function H(s, t = "") {
  var v, y, w, x, k, z, P, T, D, R, V;
  const a = A();
  if (!a) throw new Error("Salla SDK unavailable");
  typeof a.onReady == "function" && await a.onReady();
  const e = ((v = a.product) == null ? void 0 : v.getDetails) ?? ((w = (y = a.product) == null ? void 0 : y.api) == null ? void 0 : w.getDetails);
  if (typeof e != "function")
    throw new Error("getDetails unavailable");
  const r = await e.call(a.product, s), i = (r == null ? void 0 : r.data) ?? r;
  if (!i) throw new Error("empty product payload");
  const l = ((x = i.image) == null ? void 0 : x.url) || ((k = i.image) == null ? void 0 : k.thumbnail) || Array.isArray(i.images) && (((z = i.images[0]) == null ? void 0 : z.url) || i.images[0]) || i.thumbnail || i.main_image || "", c = i.url || ((P = i.urls) == null ? void 0 : P.customer) || ((T = i.urls) == null ? void 0 : T.product) || i.permalink || `/p${s}`, h = $(i.price), p = $(i.regular_price), d = $(i.sale_price);
  let u = p ?? h, m = h ?? p;
  d !== void 0 && d > 0 && (m = d, (u === void 0 || u <= d) && (u = p ?? h ?? d));
  const f = (!!(i.is_on_sale ?? i.on_sale ?? i.has_offer) || d !== void 0) && u !== void 0 && m !== void 0 && m < u, b = i.currency || ((D = i.price) == null ? void 0 : D.currency) || ((R = i.regular_price) == null ? void 0 : R.currency) || void 0;
  return {
    name: String(i.name || i.title || t || `#${s}`),
    image: l || void 0,
    imageAlt: String(((V = i.image) == null ? void 0 : V.alt) || i.name || ""),
    url: c,
    regular: u,
    sale: f ? m : void 0,
    onSale: f,
    currency: b
  };
}
const F = L`
  :host {
    display: block;
    font-family: inherit;
    direction: inherit;
    /* Size containment: the host's width is taken from its container, never from
       its contents. This is what stops the marquee's max-content track (or any
       wide layout) from forcing an ancestor grid/flex item — e.g. Salla's
       component card — wider than the viewport and pushing other sections away.
       Width-only containment; height still grows with content. */
    container-type: inline-size;
    min-width: 0;
    max-width: 100%;

    --t-bg: #f6f4f0;
    --t-title: #14181f;
    --t-subtitle: #5b6573;
    --t-card-bg: #ffffff;
    --t-border: rgba(20, 24, 31, 0.09);
    --t-name: #14181f;
    --t-meta: #8a93a0;
    --t-text: #3f4754;
    --t-star: #ff9f1c;
    --t-star-empty: rgba(20, 24, 31, 0.14);
    --t-accent: #e07a3e;
    --t-chip-bg: #f1f0ec;
    --t-chip-name: #14181f;
    --t-chip-price: #14181f;
    --t-chip-compare: #9aa1ac;

    --t-gap: clamp(12px, 2.6vw, 20px);
    --t-pad-x: clamp(1rem, 4vw, 2rem);
    --t-radius: 20px;
    --t-aspect: 4 / 5;
    --t-cols-mobile: 1;
    --t-cols-desktop: 3;
    --t-ease: cubic-bezier(0.22, 1, 0.36, 1);
  }

  *,
  *::before,
  *::after {
    box-sizing: border-box;
  }

  /* ============================================================
     SECTION + HEADER
     ============================================================ */
  .t-section {
    width: 100%;
    max-width: 100%;
    min-width: 0;
    background: var(--t-bg);
    padding: clamp(2.5rem, 6vw, 4.5rem) var(--t-pad-x);
    overflow: hidden;
  }

  .t-header {
    max-width: 720px;
    margin: 0 auto clamp(1.75rem, 4vw, 2.75rem);
    text-align: center;
  }
  .t-eyebrow {
    margin: 0 0 0.5rem;
    color: var(--t-accent);
    font-size: 0.78rem;
    font-weight: 700;
    letter-spacing: 1.6px;
    text-transform: uppercase;
  }
  .t-title {
    margin: 0;
    color: var(--t-title);
    font-size: clamp(1.5rem, 4vw, 2.3rem);
    font-weight: 800;
    line-height: 1.18;
    letter-spacing: -0.01em;
  }
  .t-subtitle {
    margin: 0.7rem 0 0;
    color: var(--t-subtitle);
    font-size: clamp(0.95rem, 1.6vw, 1.08rem);
    line-height: 1.7;
  }
  .t-summary {
    margin-top: 1.1rem;
    display: inline-flex;
    align-items: center;
    gap: 0.6rem;
    flex-wrap: wrap;
    justify-content: center;
  }
  .t-summary-num {
    color: var(--t-title);
    font-size: 1.5rem;
    font-weight: 800;
    line-height: 1;
  }
  .t-summary .t-stars svg {
    width: 20px;
    height: 20px;
  }
  .t-summary-count {
    color: var(--t-meta);
    font-size: 0.9rem;
    font-weight: 600;
  }

  .t-body-wrap {
    max-width: 1240px;
    margin-inline: auto;
    width: 100%;
  }

  .t-empty {
    text-align: center;
    color: var(--t-meta);
    padding: 3rem 1rem;
    margin: 0;
  }

  /* ============================================================
     STARS (two-layer clip → supports fractional ratings)
     ============================================================ */
  .t-stars {
    position: relative;
    display: inline-flex;
    direction: ltr; /* ratings always fill left→right */
    line-height: 0;
    order:-1;
  }
  .t-stars-bg,
  .t-stars-fg {
    display: inline-flex;
    gap: 2px;
  }
  .t-stars svg {
    width: 16px;
    height: 16px;
    display: block;
  }
  .t-stars-bg svg {
    fill: var(--t-star-empty);
  }
  .t-stars-fg-clip {
    position: absolute;
    inset-block: 0;
    inset-inline-start: 0;
    width: var(--t-star-pct, 100%);
    overflow: hidden;
    transition: width 0.9s var(--t-ease) 0.2s;
  }
  .t-stars-fg {
    width: max-content;
  }
  .t-stars-fg svg {
    fill: var(--t-star);
  }

  /* Compact numeric rating pill. */
  .t-rating {
    display: inline-flex;
    align-items: center;
    gap: 0.45rem;
  }
  .t-rating-text {
    color: var(--t-meta);
    font-size: 0.82rem;
    font-weight: 700;
  }
  .t-rating--num {
    gap: 0.3rem;
    padding: 0.25rem 0.6rem;
    background: rgba(255, 159, 28, 0.16);
    background: color-mix(in srgb, var(--t-star) 16%, transparent);
    border-radius: 999px;
    align-self: flex-start;
    font-weight: 800;
    color: var(--t-title);
    font-size: 0.92rem;
  }
  .t-rating--num .t-rating-star {
    width: 15px;
    height: 15px;
    fill: var(--t-star);
  }

  /* ============================================================
     CARD — base + shared pieces
     ============================================================ */
  .t-card {
    position: relative;
    height: 100%;
    background: var(--t-card-bg);
    border: 1px solid transparent;
    border-radius: var(--t-radius);
    box-shadow: 0 20px 44px -30px rgba(15, 23, 42, 0.45);
    display: flex;
    flex-direction: column;
    overflow: hidden;
    text-align: start;
  }
  .t-card[data-style="quote"],
  .t-card[data-style="minimal"],
  .t-card[data-style="glass"] {
    padding: clamp(18px, 4vw, 26px);
    gap: 12px;
  }
  .t-card[data-style="minimal"] {
    box-shadow: none;
    border-color: var(--t-border);
  }
  .t-card[data-style="glass"] {
    background: rgba(255, 255, 255, 0.55);
    -webkit-backdrop-filter: blur(16px) saturate(1.3);
    backdrop-filter: blur(16px) saturate(1.3);
    border-color: rgba(255, 255, 255, 0.6);
    box-shadow: 0 26px 60px -34px rgba(15, 23, 42, 0.5),
      inset 0 1px 0 rgba(255, 255, 255, 0.6);
  }

  /* Quote text */
  .t-quote {
    margin: 0;
    color: var(--t-text);
    font-size: 0.98rem;
    line-height: 1.72;
  }
  .t-card[data-style="quote"] .t-quote,
  .t-card[data-style="bubble"] .t-quote {
    font-size: 1.06rem;
    line-height: 1.65;
  }

  /* Decorative quotation mark */
  .t-quote-mark {
    line-height: 0;
    color: var(--t-accent);
    opacity: 0.9;
  }
  .t-quote-mark svg {
    width: 34px;
    height: 34px;
  }

  /* Author block */
  .t-author {
    display: flex;
    align-items: center;
    gap: 10px;
  }
  .t-avatar {
    width: 44px;
    height: 44px;
    border-radius: 50%;
    overflow: hidden;
    flex: none;
    background: var(--t-star-empty);
  }
  .t-avatar img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    display: block;
  }
  .t-author-meta {
    min-width: 0;
    display: flex;
    flex-direction: column;
    gap: 1px;
  }
  .t-name {
    display: inline-flex;
    align-items: center;
    gap: 5px;
    color: var(--t-name);
    font-weight: 700;
    font-size: 0.95rem;
    line-height: 1.2;
  }
  .t-meta {
    color: var(--t-meta);
    font-size: 0.82rem;
  }

  /* Author / chip drop to the bottom for tidy equal-height cards */
  .t-card[data-style="quote"] .t-author,
  .t-card[data-style="minimal"] .t-author,
  .t-card[data-style="glass"] .t-author {
    margin-top: auto;
  }

  /* ============================================================
     CARD — modern (photo-led with overlaid name chip)
     ============================================================ */
  .t-card[data-style="modern"] {
    padding: 0;
    gap: 0;
  }
  .t-photo {
    position: relative;
    width: 100%;
    aspect-ratio: var(--t-aspect);
    overflow: hidden;
  }
  .t-photo > img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    display: block;
  }
  .t-photo-chip {
    position: absolute;
    top: 12px;
    inset-inline-start: 12px;
    display: inline-flex;
    align-items: center;
    gap: 7px;
    background: rgba(18, 22, 28, 0.62);
    -webkit-backdrop-filter: blur(7px);
    backdrop-filter: blur(7px);
    color: #fff;
    font-weight: 600;
    font-size: 0.82rem;
    padding: 5px;
    padding-inline-end: 12px;
    border-radius: 999px;
  }
  .t-photo-chip-avatar {
    width: 24px;
    height: 24px;
    border-radius: 50%;
    object-fit: cover;
    flex-shrink: 0;
    background: rgba(255, 255, 255, 0.15);
  }
  .t-photo-chip-text {
    white-space: nowrap;
  }
  .t-body {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 11px;
    padding: 15px 16px 17px;
  }
  .t-body .t-chip {
    margin-top: auto;
  }

  /* ============================================================
     CARD — overlay (full-bleed photo + frosted-glass bottom panel)
     ============================================================ */
  .t-card[data-style="overlay"] {
    padding: 0;
    gap: 0;
    position: relative;
    aspect-ratio: var(--t-aspect);
    justify-content: flex-end;
    /* Solid fallback shows through when an item has no photo. */
    background: #14181f;
    border:none;
  }
  .t-card[data-style="overlay"][data-tone="light"] {
    background: #e9e7e2;
  }
  .t-overlay-photo {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    object-fit: cover;
    display: block;
    z-index: 0;
  }
  /* The frosted panel: blurs the photo behind it (backdrop-filter) and lays a
     translucent veil on top, so the comment stays crisp while its backdrop softens.
     Structure is shared; the veil + text colours are tone-driven below. */
  .t-overlay-panel {
    position: relative;
    z-index: 1;
    margin-top: auto;
    display: flex;
    flex-direction: column;
    gap: 10px;
    padding: clamp(15px, 5%, 22px);
    border-radius: 0 0 var(--t-radius) var(--t-radius);
    -webkit-backdrop-filter: blur(16px) saturate(1.25);
    backdrop-filter: blur(16px) saturate(1.25);
  }
  /* Dark tone (default for any overlay that isn't explicitly light):
     dark veil + light-on-dark text. */
  .t-card[data-style="overlay"]:not([data-tone="light"]) .t-overlay-panel {
    background: linear-gradient(
      to top,
      rgba(15, 18, 22, 0.76),
      rgba(15, 18, 22, 0.46)
    );
    box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.12);
    --t-text: rgba(255, 255, 255, 0.92);
    --t-name: #ffffff;
    --t-meta: rgba(255, 255, 255, 0.72);
    --t-accent: rgba(255, 255, 255, 0.92);
  }
  .t-card[data-style="overlay"]:not([data-tone="light"]) .t-rating--num {
    color: #fff;
    background: rgba(255, 255, 255, 0.18);
  }
  /* Light tone: frosted white veil + dark text; quote mark keeps the brand accent. */
  .t-card[data-style="overlay"][data-tone="light"] .t-overlay-panel {
    background: linear-gradient(
      to top,
      rgba(255, 255, 255, 0.82),
      rgba(255, 255, 255, 0.52)
    );
    --t-text: #2c333d;
    --t-name: #14181f;
    --t-meta: #6b7480;
  }
  .t-card[data-style="overlay"][data-tone="light"] .t-rating--num {
    color: #14181f;
    background: rgba(20, 24, 31, 0.07);
  }
  .t-card[data-style="overlay"] .t-quote-mark {
    opacity: 0.85;
    text-align:end;
  }
  .t-card[data-style="overlay"] .t-quote-mark svg {
    width: 30px;
    height: 30px;
  }

  /* ============================================================
     CARD — bubble (speech bubble + tail, author below)
     ============================================================ */
  .t-card[data-style="bubble"] {
    background: transparent;
    border: none;
    box-shadow: none;
    overflow: visible;
    gap: 14px;
  }
  .t-bubble {
    position: relative;
    background: var(--t-card-bg);
    border: 1px solid var(--t-border);
    border-radius: var(--t-radius);
    padding: clamp(16px, 4vw, 22px);
    box-shadow: 0 20px 44px -32px rgba(15, 23, 42, 0.45);
    display: flex;
    flex-direction: column;
    gap: 11px;
  }
  .t-bubble::after {
    content: "";
    position: absolute;
    bottom: -8px;
    inset-inline-start: 28px;
    width: 16px;
    height: 16px;
    background: var(--t-card-bg);
    border-inline-end: 1px solid var(--t-border);
    border-bottom: 1px solid var(--t-border);
    transform: rotate(45deg);
  }
  .t-card[data-style="bubble"] .t-author {
    padding-inline-start: 6px;
  }

  /* ============================================================
     PRODUCT CHIP (shoppable)
     ============================================================ */
  .t-chip {
    display: flex;
    align-items: center;
    gap: 11px;
    text-decoration: none;
    background: var(--t-chip-bg);
    border-radius: 14px;
    padding: 9px 11px;
    color: inherit;
    transition: background 0.25s var(--t-ease), transform 0.25s var(--t-ease);
  }
  .t-chip[data-style="inline"] {
    background: transparent;
    padding: 6px 0 0;
    gap: 9px;
  }
  a.t-chip:hover {
    background: color-mix(in srgb, var(--t-chip-bg) 82%, #000);
  }
  a.t-chip[data-style="inline"]:hover {
    background: transparent;
    transform: translateX(0);
  }
  .t-chip-media {
    flex: none;
    width: 48px;
    height: 48px;
    border-radius: 10px;
    overflow: hidden;
    background: #fff;
    box-shadow: inset 0 0 0 1px rgba(0, 0, 0, 0.05);
  }
  .t-chip[data-style="inline"] .t-chip-media {
    width: 38px;
    height: 38px;
    border-radius: 8px;
  }
  .t-chip-media img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    display: block;
  }
  .t-chip-body {
    min-width: 0;
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 2px;
  }
  .t-chip-name {
    color: var(--t-chip-name);
    font-weight: 700;
    font-size: 0.9rem;
    line-height: 1.25;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .t-chip-prices {
    display: inline-flex;
    align-items: baseline;
    gap: 6px;
  }
  .t-chip-price {
    color: var(--t-chip-price);
    font-weight: 800;
    font-size: 0.92rem;
  }
  .t-chip-compare {
    color: var(--t-chip-compare);
    font-size: 0.8rem;
    text-decoration: line-through;
  }
  .t-chip-go {
    flex: none;
    color: var(--t-meta);
    line-height: 0;
    align-self: center;
  }
  .t-chip-go svg {
    width: 18px;
    height: 18px;
  }
  .t-chip-go svg {
    transform: rotate(0deg);
  }
  .t-chip:dir(rtl) .t-chip-go svg {
    transform: rotate(180deg);
  }

  /* ============================================================
     LAYOUT — marquee
     ============================================================ */
  /* NOTE: do NOT set max-width:none here. The marquee track is width:max-content,
     so an uncapped body-wrap lets that ~6000px intrinsic width drive the min-content
     of an ancestor grid/flex item (e.g. Salla's component card) and blow out the
     whole page. The marquee stays inside the standard capped, centered body-wrap. */
  .t-marquee {
    display: flex;
    flex-direction: column;
    gap: clamp(14px, 2.5vw, 22px);
    min-width: 0;
    max-width: 100%;
  }
  .t-marquee-row {
    /* min-width:0 lets overflow:hidden actually clip the max-content track in a
       column-flex (cross-axis auto-min would otherwise expand to the track width). */
    min-width: 0;
    max-width: 100%;
    overflow: hidden;
    -webkit-mask-image: linear-gradient(
      to right,
      transparent,
      #000 6%,
      #000 94%,
      transparent
    );
    mask-image: linear-gradient(
      to right,
      transparent,
      #000 6%,
      #000 94%,
      transparent
    );
  }
  .t-marquee-track {
    display: flex;
    width: max-content;
    align-items: stretch;
    will-change: transform;
    /* LTR scrolls left (-50%); RTL scrolls right (+50%) so the row never empties.
       Spacing lives on the cells (margin-inline-end), NOT as flex gap, so the two
       identical halves tile to exactly 50% and the loop is seamless. */
    animation: t-marquee-ltr var(--t-marquee-dur, 40s) linear infinite;
  }
  .t-marquee-track:dir(rtl) {
    animation-name: t-marquee-rtl;
  }
  .t-marquee-row[data-dir="backward"] .t-marquee-track {
    animation-direction: reverse;
  }
  .t-marquee-row[data-pause="hover"]:hover .t-marquee-track {
    animation-play-state: paused;
  }
  /* Off-screen (host attribute set by IntersectionObserver): freeze the
     marquee so it doesn't burn compositor time while invisible. */
  :host([out-of-view]) .t-marquee-track {
    animation-play-state: paused;
  }
  .t-marquee-cell {
    flex: 0 0 auto;
    width: clamp(258px, 80vw, 320px);
    margin-inline-end: var(--t-gap);
  }
  @keyframes t-marquee-ltr {
    from {
      transform: translateX(0);
    }
    to {
      transform: translateX(-50%);
    }
  }
  @keyframes t-marquee-rtl {
    from {
      transform: translateX(0);
    }
    to {
      transform: translateX(50%);
    }
  }

  /* ============================================================
     LAYOUT — carousel (scroll-snap)
     ============================================================ */
  .t-carousel {
    position: relative;
  }
  .t-carousel-track {
    display: flex;
    gap: var(--t-gap);
    align-items: stretch;
    overflow-x: auto;
    scroll-snap-type: x mandatory;
    scroll-behavior: smooth;
    -webkit-overflow-scrolling: touch;
    scrollbar-width: none;
    padding-block: 6px;
  }
  .t-carousel-track::-webkit-scrollbar {
    display: none;
  }
  @media (pointer: fine) {
    .t-carousel-track {
      cursor: grab;
    }
    .t-carousel-track.is-grabbing {
      cursor: grabbing;
      scroll-snap-type: none;
      scroll-behavior: auto;
    }
  }
  .t-carousel-cell {
    flex: 0 0
      calc(
        (100% - (var(--t-cols-mobile) - 1) * var(--t-gap)) /
          var(--t-cols-mobile)
      );
    scroll-snap-align: start;
  }
  /* Mobile peek: never let a single card fill the whole width — hint there's more */
  @media (max-width: 767.98px) {
    .t-carousel-cell {
      flex-basis: min(
        86%,
        calc(
          (100% - (var(--t-cols-mobile) - 1) * var(--t-gap)) /
            var(--t-cols-mobile)
        )
      );
    }
  }

  .t-arrow {
    position: absolute;
    top: 50%;
    transform: translateY(-50%);
    z-index: 4;
    width: 42px;
    height: 42px;
    border: none;
    border-radius: 50%;
    background: var(--t-title);
    color: #fff;
    display: grid;
    place-items: center;
    cursor: pointer;
    box-shadow: 0 10px 24px -10px rgba(0, 0, 0, 0.55);
    transition: transform 0.2s var(--t-ease), opacity 0.2s var(--t-ease);
  }
  .t-arrow:hover {
    transform: translateY(-50%) scale(1.07);
  }
  .t-arrow svg {
    width: 20px;
    height: 20px;
  }
  .t-arrow--prev {
    inset-inline-start: 4px;
  }
  .t-arrow--next {
    inset-inline-end: 4px;
  }
  /* Chevron points outward in the reading direction */
  .t-arrow--prev svg {
    transform: rotate(180deg);
  }
  .t-arrow--next svg {
    transform: rotate(0deg);
  }
  .t-arrow:dir(rtl).t-arrow--prev svg {
    transform: rotate(0deg);
  }
  .t-arrow:dir(rtl).t-arrow--next svg {
    transform: rotate(180deg);
  }

  .t-dots {
    display: flex;
    justify-content: center;
    align-items: center;
    gap: 8px;
    margin-top: clamp(16px, 3vw, 24px);
  }
  .t-dot {
    width: 8px;
    height: 8px;
    padding: 0;
    border: none;
    border-radius: 999px;
    background: var(--t-star-empty);
    cursor: pointer;
    transition: width 0.3s var(--t-ease), background 0.3s var(--t-ease);
  }
  .t-dot[aria-current="true"] {
    width: 22px;
    background: var(--t-accent);
  }

  /* ============================================================
     LAYOUT — grid + masonry
     ============================================================ */
  .t-grid[data-layout="grid"] {
    display: grid;
    grid-template-columns: repeat(var(--t-cols-mobile), minmax(0, 1fr));
    gap: var(--t-gap);
  }
  .t-grid[data-layout="masonry"] {
    column-count: var(--t-cols-mobile);
    column-gap: var(--t-gap);
  }
  .t-grid[data-layout="masonry"] .t-grid-cell {
    break-inside: avoid;
    margin-bottom: var(--t-gap);
  }
  .t-grid-cell {
    min-width: 0;
  }

  /* ============================================================
     ENTRANCE ANIMATIONS
     ============================================================ */
  /* Header */
  .t-header[data-anim="ready"] > * {
    opacity: 0;
    transform: translateY(10px);
    filter: blur(6px);
  }
  .t-header[data-anim="in"] > * {
    opacity: 1;
    transform: none;
    filter: blur(0);
    transition: opacity 0.7s var(--t-ease), transform 0.7s var(--t-ease),
      filter 0.7s var(--t-ease);
  }
  .t-header[data-anim="in"] > *:nth-child(2) {
    transition-delay: 0.08s;
  }
  .t-header[data-anim="in"] > *:nth-child(3) {
    transition-delay: 0.16s;
  }
  .t-header[data-anim="in"] > *:nth-child(4) {
    transition-delay: 0.24s;
  }

  /* Cards (grid / masonry / carousel) */
  .t-section[data-anim="ready"] .t-grid-cell,
  .t-section[data-anim="ready"] .t-carousel-cell {
    opacity: 0;
    transform: translateY(16px) scale(0.985);
  }
  .t-section[data-anim="in"] .t-grid-cell,
  .t-section[data-anim="in"] .t-carousel-cell {
    opacity: 1;
    transform: none;
    transition: opacity 0.6s var(--t-ease), transform 0.7s var(--t-ease);
  }
  .t-section[data-anim="in"] .t-grid-cell:nth-child(2),
  .t-section[data-anim="in"] .t-carousel-cell:nth-child(2) {
    transition-delay: 0.07s;
  }
  .t-section[data-anim="in"] .t-grid-cell:nth-child(3),
  .t-section[data-anim="in"] .t-carousel-cell:nth-child(3) {
    transition-delay: 0.14s;
  }
  .t-section[data-anim="in"] .t-grid-cell:nth-child(4),
  .t-section[data-anim="in"] .t-carousel-cell:nth-child(4) {
    transition-delay: 0.21s;
  }
  .t-section[data-anim="in"] .t-grid-cell:nth-child(5),
  .t-section[data-anim="in"] .t-carousel-cell:nth-child(5) {
    transition-delay: 0.28s;
  }
  .t-section[data-anim="in"] .t-grid-cell:nth-child(6),
  .t-section[data-anim="in"] .t-carousel-cell:nth-child(6) {
    transition-delay: 0.35s;
  }
  .t-section[data-anim="in"] .t-grid-cell:nth-child(n + 7),
  .t-section[data-anim="in"] .t-carousel-cell:nth-child(n + 7) {
    transition-delay: 0.4s;
  }

  /* Marquee fades in as a whole (cards are already in motion) */
  .t-section[data-anim="ready"] .t-marquee {
    opacity: 0;
  }
  .t-section[data-anim="in"] .t-marquee {
    opacity: 1;
    transition: opacity 0.8s var(--t-ease);
  }

  /* Star fill grows from 0 on entrance */
  .t-section[data-anim="ready"] .t-stars-fg-clip {
    width: 0;
  }

  /* ============================================================
     HOVER LIFT
     ============================================================ */
  .t-section[data-hover-lift="on"] .t-card {
    transition: transform 0.35s var(--t-ease), box-shadow 0.35s var(--t-ease);
  }
  @media (hover: hover) {
    .t-section[data-hover-lift="on"] .t-card:hover {
      transform: translateY(-6px);
      box-shadow: 0 34px 64px -30px rgba(15, 23, 42, 0.5);
    }
    .t-section[data-hover-lift="on"] .t-card[data-style="modern"] .t-photo > img,
    .t-section[data-hover-lift="on"] .t-card[data-style="overlay"] .t-overlay-photo {
      transition: transform 0.7s var(--t-ease);
    }
    .t-section[data-hover-lift="on"]
      .t-card[data-style="modern"]:hover
      .t-photo
      > img,
    .t-section[data-hover-lift="on"]
      .t-card[data-style="overlay"]:hover
      .t-overlay-photo {
      transform: scale(1.05);
    }
  }

  /* ============================================================
     DESKTOP ENHANCEMENTS (≥ 768px)
     ============================================================ */
  @media (min-width: 768px) {
    .t-grid[data-layout="grid"] {
      grid-template-columns: repeat(var(--t-cols-desktop), minmax(0, 1fr));
    }
    .t-grid[data-layout="masonry"] {
      column-count: var(--t-cols-desktop);
    }
    .t-carousel-cell {
      flex-basis: calc(
        (100% - (var(--t-cols-desktop) - 1) * var(--t-gap)) /
          var(--t-cols-desktop)
      );
    }
    .t-marquee-cell {
      width: clamp(300px, 24vw, 360px);
    }
    .t-arrow {
      width: 46px;
      height: 46px;
    }
  }

  /* ============================================================
     REDUCED MOTION
     ============================================================ */
  @media (prefers-reduced-motion: reduce) {
    .t-marquee-track {
      animation: none !important;
    }
    .t-card,
    .t-photo > img,
    .t-overlay-photo,
    .t-grid-cell,
    .t-carousel-cell,
    .t-header > *,
    .t-stars-fg-clip,
    .t-chip,
    .t-arrow,
    .t-dot {
      transition: none !important;
      animation: none !important;
    }
    .t-section[data-anim] .t-grid-cell,
    .t-section[data-anim] .t-carousel-cell,
    .t-section[data-anim] .t-header > *,
    .t-section[data-anim] .t-marquee {
      opacity: 1 !important;
      transform: none !important;
      filter: none !important;
    }
    .t-stars-fg-clip {
      width: var(--t-star-pct, 100%) !important;
    }
    .t-carousel-track {
      scroll-behavior: auto;
    }
  }
`;
var U = Object.defineProperty, q = (s, t, a, e) => {
  for (var r = void 0, i = s.length - 1, l; i >= 0; i--)
    (l = s[i]) && (r = l(t, a, r) || r);
  return r && U(t, a, r), r;
};
const Y = "https://cdn.salla.network/images/themes/landing-page/default-avatar.png", N = class N extends j {
  constructor() {
    super(...arguments), this._animState = "ready", this._carouselPage = 0, this._isDesktop = !1, this._autoplayTimer = null, this._scrollRaf = null, this._interactionPaused = !1, this._inView = !0, this._io = null, this._dragActive = !1, this._dragStartX = 0, this._dragStartScroll = 0, this._dragMoved = !1, this._productCache = /* @__PURE__ */ new Map(), this._carouselPrev = () => {
      var e;
      const t = this._pageCount(this._items().length);
      let a = this._carouselPage - 1;
      a < 0 && (a = ((e = this.config) == null ? void 0 : e.carousel_loop) !== !1 ? t - 1 : 0), this._scrollToPage(a);
    }, this._carouselNext = () => {
      var e;
      const t = this._pageCount(this._items().length);
      let a = this._carouselPage + 1;
      a >= t && (a = ((e = this.config) == null ? void 0 : e.carousel_loop) !== !1 ? 0 : t - 1), this._scrollToPage(a);
    }, this._onTrackScroll = () => {
      this._scrollRaf || (this._scrollRaf = requestAnimationFrame(() => {
        this._scrollRaf = null;
        const t = this._track;
        if (!t || t.clientWidth === 0) return;
        const a = Math.round(Math.abs(t.scrollLeft) / t.clientWidth), e = this._pageCount(this._items().length), r = Math.max(0, Math.min(e - 1, a));
        r !== this._carouselPage && (this._carouselPage = r);
      }));
    }, this._onDragDown = (t) => {
      if (t.pointerType !== "mouse") return;
      const a = this._track;
      a && (this._dragActive = !0, this._dragMoved = !1, this._dragStartX = t.clientX, this._dragStartScroll = a.scrollLeft, a.style.scrollSnapType = "none", a.style.scrollBehavior = "auto", a.classList.add("is-grabbing"));
    }, this._onDragMove = (t) => {
      if (!this._dragActive) return;
      const a = this._track;
      if (!a) return;
      const e = t.clientX - this._dragStartX;
      Math.abs(e) > 4 && (this._dragMoved = !0), a.scrollLeft = this._dragStartScroll - e;
    }, this._endDrag = () => {
      const t = this._track;
      !t || !this._dragActive || (this._dragActive = !1, t.style.scrollSnapType = "", t.style.scrollBehavior = "", t.classList.remove("is-grabbing"));
    }, this._onChipClick = (t) => {
      this._dragMoved && (t.preventDefault(), this._dragMoved = !1);
    }, this._pauseInteraction = () => {
      this._interactionPaused || (this._interactionPaused = !0, this._teardownAutoplay());
    }, this._resumeInteraction = () => {
      this._interactionPaused && (this._interactionPaused = !1, this._setupAutoplay());
    }, this._starPath = "M12 17.27l-6.18 3.73 1.64-7.03L2 9.24l7.19-.61L12 2l2.81 6.63 7.19.61-5.46 4.73 1.64 7.03z";
  }
  /** Salla SDK global — see shared/product.ts. */
  get _salla() {
    return A();
  }
  // ------------------------------------------------------------
  // Value helpers
  // ------------------------------------------------------------
  _isRtl() {
    return getComputedStyle(this).direction === "rtl";
  }
  /** Round a rating to one decimal and trim trailing zeros ("5.0" → "5"). */
  _formatRating(t) {
    return Number.isNaN(t) ? "" : String(Math.round(t * 10) / 10);
  }
  /** Keep only testimonials that carry some renderable content. */
  _items() {
    var a;
    const t = (a = this.config) == null ? void 0 : a.items;
    return Array.isArray(t) ? t.filter((e) => !e || typeof e != "object" ? !1 : !!(this.localizedString(e.quote) || this.localizedString(e.name) || e.photo || e.avatar || e.product)) : [];
  }
  /** Resolve grid/carousel column counts (mobile-first; desktop "inherit" → mobile). */
  _resolveColumns() {
    const t = this.config || {}, a = this._num(
      this._pickValue(t.columns_mobile, "1"),
      1
    ), e = this._pickValue(
      t.columns_desktop,
      "inherit"
    ), r = e === "inherit" ? a : this._num(e, 3);
    return {
      mobile: Math.max(1, Math.min(4, a)),
      desktop: Math.max(1, Math.min(4, r))
    };
  }
  _cardsPerView() {
    const t = this._resolveColumns();
    return this._isDesktop ? t.desktop : t.mobile;
  }
  async _fetchProduct(t, a) {
    if (!this._productCache.has(t)) {
      this._productCache.set(t, { status: "loading", label: a }), this.requestUpdate();
      try {
        const e = await H(t, a);
        this._productCache.set(t, { status: "loaded", data: e });
      } catch (e) {
        console.warn("[growth-testimonials] product fetch failed", t, e), this._productCache.set(t, { status: "failed" });
      }
      this.requestUpdate();
    }
  }
  _resolveProduct(t) {
    const a = B(t.product);
    if (!a) return null;
    const e = this._productCache.get(a.id);
    return e ? e.status === "loaded" ? e.data : e.status === "loading" && e.label ? { name: e.label, url: "", onSale: !1 } : null : (this._fetchProduct(a.id, a.label), a.label ? { name: a.label, url: "", onSale: !1 } : null);
  }
  // ------------------------------------------------------------
  // Lifecycle
  // ------------------------------------------------------------
  connectedCallback() {
    var e;
    super.connectedCallback();
    const t = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches, a = ((e = this.config) == null ? void 0 : e.enable_entrance_anim) === !1;
    t || a ? this._animState = "in" : requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        this._animState = "in";
      });
    }), this._mql = window.matchMedia("(min-width: 768px)"), this._isDesktop = this._mql.matches, this._onMqlChange = () => {
      this._isDesktop = this._mql.matches, this._carouselPage = 0;
    }, this._mql.addEventListener("change", this._onMqlChange), "IntersectionObserver" in window && (this._io = new IntersectionObserver(
      (r) => {
        const i = r[0];
        i && (this._inView = i.isIntersecting, this.toggleAttribute("out-of-view", !this._inView), this._teardownAutoplay(), this._inView && this._setupAutoplay());
      },
      { threshold: 0.15 }
    ), this._io.observe(this));
  }
  disconnectedCallback() {
    var t;
    super.disconnectedCallback(), this._mql && this._onMqlChange && this._mql.removeEventListener("change", this._onMqlChange), this._teardownAutoplay(), (t = this._io) == null || t.disconnect(), this._io = null, this._scrollRaf && cancelAnimationFrame(this._scrollRaf);
  }
  updated() {
    this._teardownAutoplay(), this._setupAutoplay();
  }
  // ------------------------------------------------------------
  // Carousel: scroll-snap navigation (RTL-safe via abs(scrollLeft))
  // ------------------------------------------------------------
  get _track() {
    return this.renderRoot.querySelector(".t-carousel-track");
  }
  _pageCount(t) {
    return Math.max(1, Math.ceil(t / this._cardsPerView()));
  }
  _scrollToPage(t) {
    const a = this._track;
    if (!a) return;
    const e = this._pageCount(this._items().length), r = Math.max(0, Math.min(e - 1, t)), i = (this._isRtl() ? -1 : 1) * r * a.clientWidth;
    a.scrollTo({ left: i, behavior: "smooth" }), this._carouselPage = r;
  }
  // ------------------------------------------------------------
  // Autoplay (carousel only)
  // ------------------------------------------------------------
  _setupAutoplay() {
    const t = this.config || {};
    if (this._pickValue(t.layout, "marquee") !== "carousel" || !t.carousel_autoplay || this._interactionPaused || !this._inView || this._pageCount(this._items().length) < 2) return;
    const e = Math.max(2, this._num(t.carousel_autoplay_delay, 5)) * 1e3;
    this._autoplayTimer = window.setTimeout(() => {
      this._autoplayTimer = null, this._carouselNext();
    }, e);
  }
  _teardownAutoplay() {
    this._autoplayTimer && (clearTimeout(this._autoplayTimer), this._autoplayTimer = null);
  }
  _icon(t) {
    switch (t) {
      case "chevron":
        return o`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor"
          stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"
          aria-hidden="true"><path d="m9 6 6 6-6 6" /></svg>`;
      case "quote":
        return o`<svg viewBox="0 0 24 24" fill="currentColor"
          aria-hidden="true"><path d="M9.5 7C6.5 7 4 9.5 4 12.5V19h6.5v-6.5H7.2c0-1.8 1.5-3 3.3-3V7zm10 0C16.5 7 14 9.5 14 12.5V19h6.5v-6.5h-3.3c0-1.8 1.5-3 3.3-3V7z" /></svg>`;
    }
  }
  // ------------------------------------------------------------
  // Render: stars
  // ------------------------------------------------------------
  _renderStars(t) {
    const a = Math.max(0, Math.min(100, t / 5 * 100)), e = (r) => o`
      <div class=${r} aria-hidden="true">
        ${[0, 1, 2, 3, 4].map(
      () => o`<svg viewBox="0 0 24 24"><path d=${this._starPath} /></svg>`
    )}
      </div>
    `;
    return o`
      <div class="t-stars" style=${`--t-star-pct:${a}%`}>
        ${e("t-stars-bg")}
        <div class="t-stars-fg-clip">${e("t-stars-fg")}</div>
      </div>
    `;
  }
  _renderRating(t, a) {
    const e = Math.max(0, Math.min(5, this._num(t.rating, 5)));
    if (e <= 0) return n;
    const r = this._formatRating(e);
    return a === "number" ? o`<div class="t-rating t-rating--num" aria-label=${`${r}/5`}>
        <svg class="t-rating-star" viewBox="0 0 24 24" aria-hidden="true">
          <path d=${this._starPath} />
        </svg>
        <span>${r}</span>
      </div>` : o`<div class="t-rating" aria-label=${`${r}/5`} role="img">
      ${this._renderStars(e)}
      ${a === "stars-number" ? o`<span class="t-rating-text">(${r}/5)</span>` : n}
    </div>`;
  }
  // ------------------------------------------------------------
  // Render: product chip
  // ------------------------------------------------------------
  _renderChip(t, a) {
    const e = this._resolveProduct(t), r = this.localizedString(t.product_name) || (e == null ? void 0 : e.name) || "", i = t.product_image || (e == null ? void 0 : e.image) || "", l = (t.product_url || "").trim() || (e == null ? void 0 : e.url) || "";
    let c = "", h = "";
    const p = (t.product_price || "").toString().trim(), d = (t.product_compare || "").toString().trim();
    if (p) {
      if (c = p, d) {
        const m = $(p), g = $(d);
        m !== void 0 && g !== void 0 && g > m && (h = d);
      }
    } else e && (e.onSale && e.sale !== void 0 ? (c = S(e.sale, e.currency), e.regular !== void 0 && (h = S(e.regular, e.currency))) : e.regular !== void 0 && (c = S(e.regular, e.currency)));
    if (!r && !i && !c) return n;
    const u = o`
      ${i ? o`<span class="t-chip-media"
            ><img src=${i} alt=${r} loading="lazy"
          /></span>` : n}
      <span class="t-chip-body">
        ${r ? o`<span class="t-chip-name">${r}</span>` : n}
        ${c ? o`<span class="t-chip-prices">
              <span class="t-chip-price">${c}</span>
              ${h ? o`<span class="t-chip-compare">${h}</span>` : n}
            </span>` : n}
      </span>
      ${l ? o`<span class="t-chip-go">${this._icon("chevron")}</span>` : n}
    `;
    return l ? o`<a
          class="t-chip"
          data-style=${a}
          href=${l}
          @click=${this._onChipClick}
          >${u}</a
        >` : o`<div class="t-chip" data-style=${a}>${u}</div>`;
  }
  // ------------------------------------------------------------
  // Render: a single testimonial card (shared across all layouts)
  // ------------------------------------------------------------
  _renderCard(t, a, e, r) {
    var g;
    const i = this.localizedString(t.name), l = this.localizedString(t.meta), c = this.localizedString(t.quote), h = e === "overlay" ? t.photo || "" : e === "modern" && r.showPhoto && t.photo || "", p = r.showAvatar ? t.avatar || Y : "", d = r.showRating ? this._renderRating(t, r.ratingStyle) : n, u = r.showProduct ? this._renderChip(t, r.chipStyle) : n, m = (f) => i || l || f && p ? o`<div class="t-author">
            ${p ? o`<span class="t-avatar"
                  ><img src=${p} alt=${i} loading="lazy"
                /></span>` : n}
            <div class="t-author-meta">
              ${i ? o`<span class="t-name">${i}</span>` : n}
              ${l ? o`<span class="t-meta">${l}</span>` : n}
            </div>
          </div>` : n;
    if (e === "modern")
      return o`
        <article class="t-card" data-style="modern" data-index=${a}>
          ${h ? o`<div class="t-photo">
                <img
                  src=${h}
                  alt=${i ? `تصوير العميل: ${i}` : "تصوير العميل"}
                  loading="lazy"
                />
                ${i || l ? o`<span class="t-photo-chip">
                      ${p ? o`<img
                            class="t-photo-chip-avatar"
                            src=${p}
                            alt=${i}
                            loading="lazy"
                          />` : n}
                      <span class="t-photo-chip-text"
                        >${i}${l ? o`, ${l}` : n}</span
                      >
                    </span>` : n}
              </div>` : n}
          <div class="t-body">
            ${h ? n : m(!0)} ${d}
            ${c ? o`<p class="t-quote">${c}</p>` : n}
            ${u}
          </div>
        </article>
      `;
    if (e === "overlay") {
      const f = this._pickValue(
        (g = this.config) == null ? void 0 : g.overlay_tone,
        "dark"
      );
      return o`
        <article
          class="t-card"
          data-style="overlay"
          data-tone=${f}
          data-index=${a}
        >
          ${h ? o`<img
                class="t-overlay-photo"
                src=${h}
                alt=${i ? `تصوير العميل: ${i}` : "تصوير العميل"}
                loading="lazy"
              />` : n}
          <div class="t-overlay-panel">
            ${r.showQuoteMark ? o`<span class="t-quote-mark">${this._icon("quote")}</span>` : n}
            ${d}
            ${c ? o`<p class="t-quote">${c}</p>` : n}
            ${m(!0)} ${u}
          </div>
        </article>
      `;
    }
    return e === "bubble" ? o`
        <article class="t-card" data-style="bubble" data-index=${a}>
          <div class="t-bubble">
            ${r.showQuoteMark ? o`<span class="t-quote-mark">${this._icon("quote")}</span>` : n}
            ${d}
            ${c ? o`<p class="t-quote">${c}</p>` : n}
            ${u}
          </div>
          ${m(!0)}
        </article>
      ` : o`
      <article class="t-card" data-style=${e} data-index=${a}>
        ${r.showQuoteMark && e === "quote" ? o`<span class="t-quote-mark">${this._icon("quote")}</span>` : n}
        ${d}
        ${c ? o`<p class="t-quote">${c}</p>` : n}
        ${m(!0)} ${u}
      </article>
    `;
  }
  // ------------------------------------------------------------
  // Render: layouts
  // ------------------------------------------------------------
  _renderMarquee(t, a, e) {
    const r = this.config || {}, i = this._num(
      this._pickValue(r.marquee_rows, "1"),
      1
    ), l = this._pickValue(
      r.marquee_speed,
      "normal"
    ), c = this._pickValue(
      r.marquee_direction,
      "forward"
    ), h = r.marquee_pause_hover !== !1, d = {
      slow: 5,
      normal: 3,
      fast: 1.8
    }[l], u = (g) => {
      const b = Math.max(2, Math.ceil(8 / Math.max(1, g.length))), v = [];
      for (let y = 0; y < b; y++) v.push(...g);
      return v;
    }, m = (g, f) => {
      const b = u(g), v = (w) => b.map(
        (x, k) => o`<div class="t-marquee-cell" aria-hidden=${w === 1 ? "true" : "false"}>
              ${this._renderCard(x, k, a, e)}
            </div>`
      ), y = Math.max(12, b.length * d);
      return o`<div
        class="t-marquee-row"
        data-dir=${f}
        data-pause=${h ? "hover" : "off"}
        style=${`--t-marquee-dur:${y}s`}
      >
        <div class="t-marquee-track">${v(0)}${v(1)}</div>
      </div>`;
    };
    if (i >= 2 && t.length > 1) {
      const g = Math.ceil(t.length / 2), f = t.slice(0, g), b = t.slice(g), v = c === "forward" ? "backward" : "forward";
      return o`<div class="t-marquee" data-rows="2">
        ${m(f, c)}
        ${m(b.length ? b : f, v)}
      </div>`;
    }
    return o`<div class="t-marquee" data-rows="1">
      ${m(t, c)}
    </div>`;
  }
  _renderCarousel(t, a, e) {
    const r = this.config || {}, i = r.carousel_arrows !== !1, l = r.carousel_dots !== !1, c = this._pageCount(t.length), h = c > 1;
    return o`
      <div
        class="t-carousel"
        @mouseenter=${this._pauseInteraction}
        @mouseleave=${this._resumeInteraction}
      >
        <div
          class="t-carousel-track"
          @scroll=${this._onTrackScroll}
          @pointerdown=${this._onDragDown}
          @pointermove=${this._onDragMove}
          @pointerup=${this._endDrag}
          @pointercancel=${this._endDrag}
          @pointerleave=${this._endDrag}
        >
          ${t.map(
      (p, d) => o`<div class="t-carousel-cell">
                ${this._renderCard(p, d, a, e)}
              </div>`
    )}
        </div>

        ${i && h ? o`
              <button
                type="button"
                class="t-arrow t-arrow--prev"
                aria-label=${this._lang() === "ar" ? "السابق" : "Previous"}
                @click=${this._carouselPrev}
              >
                ${this._icon("chevron")}
              </button>
              <button
                type="button"
                class="t-arrow t-arrow--next"
                aria-label=${this._lang() === "ar" ? "التالي" : "Next"}
                @click=${this._carouselNext}
              >
                ${this._icon("chevron")}
              </button>
            ` : n}
      </div>
      ${l && h ? o`<div class="t-dots" role="tablist">
            ${Array.from({ length: c }).map(
      (p, d) => o`<button
                type="button"
                class="t-dot"
                aria-current=${this._carouselPage === d ? "true" : "false"}
                aria-label=${`${this._lang() === "ar" ? "صفحة" : "Page"} ${d + 1}`}
                @click=${() => this._scrollToPage(d)}
              ></button>`
    )}
          </div>` : n}
    `;
  }
  _renderGridish(t, a, e, r) {
    return o`<div class="t-grid" data-layout=${a}>
      ${t.map(
      (i, l) => o`<div class="t-grid-cell">
            ${this._renderCard(i, l, e, r)}
          </div>`
    )}
    </div>`;
  }
  // ------------------------------------------------------------
  // Render: host style (CSS custom properties)
  // ------------------------------------------------------------
  _buildHostStyle(t) {
    const a = this._resolveColumns(), e = this._num(t.card_radius, 20), i = this._pickValue(
      t.card_style,
      "modern"
    ) === "overlay" ? "4/5" : this._pickValue(t.photo_aspect, "4/5");
    return [
      t.bg_color ? `--t-bg:${t.bg_color}` : "",
      t.title_color ? `--t-title:${t.title_color}` : "",
      t.subtitle_color ? `--t-subtitle:${t.subtitle_color}` : "",
      t.card_bg ? `--t-card-bg:${t.card_bg}` : "",
      t.border_color ? `--t-border:${t.border_color}` : "",
      t.name_color ? `--t-name:${t.name_color}` : "",
      t.meta_color ? `--t-meta:${t.meta_color}` : "",
      t.text_color ? `--t-text:${t.text_color}` : "",
      t.star_color ? `--t-star:${t.star_color}` : "",
      t.star_empty_color ? `--t-star-empty:${t.star_empty_color}` : "",
      t.accent_color ? `--t-accent:${t.accent_color}` : "",
      t.chip_bg ? `--t-chip-bg:${t.chip_bg}` : "",
      t.chip_name_color ? `--t-chip-name:${t.chip_name_color}` : "",
      t.chip_price_color ? `--t-chip-price:${t.chip_price_color}` : "",
      t.chip_compare_color ? `--t-chip-compare:${t.chip_compare_color}` : "",
      `--t-radius:${e}px`,
      `--t-aspect:${i}`,
      `--t-cols-mobile:${a.mobile}`,
      `--t-cols-desktop:${a.desktop}`
    ].filter(Boolean).join("; ");
  }
  // ------------------------------------------------------------
  // Render
  // ------------------------------------------------------------
  render() {
    const t = this.config || {}, a = this._items(), e = this._pickValue(t.layout, "marquee"), r = this._pickValue(
      t.card_style,
      "modern"
    ), i = this._pickValue(
      t.rating_style,
      "stars-number"
    ), l = this._pickValue(t.chip_style, "card"), c = t.enable_entrance_anim !== !1, h = t.enable_hover_lift !== !1, p = {
      showRating: t.show_rating !== !1,
      ratingStyle: i,
      showAvatar: t.show_avatar !== !1,
      showPhoto: t.show_photo !== !1,
      showQuoteMark: t.show_quote_mark !== !1,
      showProduct: t.show_product !== !1,
      chipStyle: l
    }, d = this._buildHostStyle(t), u = this.localizedString(t.eyebrow), m = this.localizedString(t.section_title), g = this.localizedString(t.section_subtitle), f = t.show_summary === !0, b = Math.max(0, Math.min(5, this._num(t.summary_rating, 0))), v = this.localizedString(t.summary_count_text), y = f && (b > 0 || !!v);
    if (a.length === 0)
      return o`<section class="t-section" style=${d}>
        <p class="t-empty">
          ${this._lang() === "ar" ? "أضف رأي عميل واحدًا على الأقل لعرض هذا القسم." : "Add at least one testimonial to display this section."}
        </p>
      </section>`;
    const w = u || m || g || y ? o`<header
            class="t-header"
            data-anim=${c ? this._animState : "in"}
          >
            ${u ? o`<p class="t-eyebrow">${u}</p>` : n}
            ${m ? o`<h2 class="t-title">${m}</h2>` : n}
            ${g ? o`<p class="t-subtitle">${g}</p>` : n}
            ${y ? o`<div class="t-summary">
                  ${b > 0 ? o`<span class="t-summary-num"
                          >${this._formatRating(b)}</span
                        >${this._renderStars(b)}` : n}
                  ${v ? o`<span class="t-summary-count">${v}</span>` : n}
                </div>` : n}
          </header>` : n, x = e === "marquee" ? this._renderMarquee(a, r, p) : e === "carousel" ? this._renderCarousel(a, r, p) : this._renderGridish(
      a,
      e,
      r,
      p
    );
    return o`
      <section
        class="t-section"
        style=${d}
        data-layout=${e}
        data-card=${r}
        data-anim=${c ? this._animState : "in"}
        data-hover-lift=${h ? "on" : "off"}
      >
        ${w}
        <div class="t-body-wrap">${x}</div>
      </section>
    `;
  }
};
N.styles = F;
let _ = N;
q([
  O({ type: Object })
], _.prototype, "config");
q([
  M()
], _.prototype, "_animState");
q([
  M()
], _.prototype, "_carouselPage");
q([
  M()
], _.prototype, "_isDesktop");
typeof _ < "u" && _.registerSallaComponent("salla-testimonials");
export {
  _ as default
};
