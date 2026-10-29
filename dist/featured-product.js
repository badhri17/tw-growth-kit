import { LitElement as vt, css as yt, html as o, nothing as p } from "lit";
import { property as xt, state as W } from "lit/decorators.js";
function kt(a, t) {
  if (typeof a == "string") return a;
  if (!a || typeof a != "object") return "";
  const e = a[t] || a.ar || a.en || "";
  return typeof e == "string" ? e.trim() : "";
}
function ot() {
  return (document.documentElement.lang || "ar").toLowerCase().startsWith("en") ? "en" : "ar";
}
function F(a) {
  return a.replace(/[٠-٩]/g, (t) => String(t.charCodeAt(0) - 1632)).replace(/[۰-۹]/g, (t) => String(t.charCodeAt(0) - 1776));
}
class $t extends vt {
  /**
   * Twilight transform injects `Component.registerSallaComponent(...)`.
   * Statics inherit, so `this` is the concrete component. The polling
   * fallback handles preview contexts where `Salla` loads after the
   * component file executes.
   */
  static registerSallaComponent(t) {
    const e = String(t || "").trim(), i = e.toLowerCase().replace(/[^a-z0-9._-]/g, "-"), n = i.includes("-") ? i : `salla-${i || "component"}`, r = () => `${n}-${Math.random().toString(36).substring(2, 8)}`, s = () => {
      var u;
      const d = (u = window.Salla) == null ? void 0 : u.bundles;
      return d && typeof d.registerComponent == "function" ? (d.registerComponent(e, {
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
    return ot();
  }
  /** Pull the store-language string out of a Salla multilanguage value. */
  localizedString(t) {
    return kt(t, this._lang());
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
    return F(t);
  }
  /** Coerce a config number that may arrive as a string (Arabic-Indic
      digits included) or as a [{ value }] dropdown selection. */
  _num(t, e) {
    if (typeof t == "number" && !Number.isNaN(t)) return t;
    if (typeof t == "string" && t.trim() !== "") {
      const i = Number(F(t.trim()));
      if (!Number.isNaN(i)) return i;
    }
    if (Array.isArray(t) && t.length > 0) {
      const i = t[0];
      if ((i == null ? void 0 : i.value) !== void 0) return this._num(i.value, e);
    }
    return e;
  }
}
const B = {
  none: 0,
  xs: 12,
  sm: 24,
  md: 40,
  lg: 56,
  xl: 72
}, D = {
  none: 0,
  xs: 20,
  sm: 32,
  md: 64,
  lg: 96,
  xl: 128
};
function St(a, t, e = "md", i = "md") {
  const n = t(a == null ? void 0 : a.space_top, e), r = t(a == null ? void 0 : a.space_bottom, i), s = B[n] ?? B.md, c = B[r] ?? B.md, d = D[n] ?? D.md, u = D[r] ?? D.md;
  return [
    `--sp-top-m:${s}px`,
    `--sp-bot-m:${c}px`,
    `--sp-top-d:${d}px`,
    `--sp-bot-d:${u}px`
  ];
}
function K() {
  const a = window;
  return a.salla ?? a.Salla ?? null;
}
function H(a) {
  if (!a) return null;
  if (typeof a == "string" || typeof a == "number") {
    const s = Number(a);
    return !s || Number.isNaN(s) ? null : { id: s, label: "" };
  }
  const t = Array.isArray(a) ? a[0] : a;
  if (!t) return null;
  if (typeof t == "string" || typeof t == "number") {
    const s = Number(t);
    return !s || Number.isNaN(s) ? null : { id: s, label: "" };
  }
  if (typeof t != "object") return null;
  const e = t, i = e.value ?? e.id ?? e.product_id;
  if (i == null) return null;
  const n = typeof i == "number" ? i : Number(i);
  if (!n || Number.isNaN(n)) return null;
  const r = String(e.label ?? e.name ?? e.title ?? "").trim();
  return { id: n, label: r };
}
function S(a) {
  if (typeof a == "number") return Number.isNaN(a) ? void 0 : a;
  if (a && typeof a == "object") {
    const i = a;
    return S(i.amount ?? i.value ?? i.price);
  }
  if (typeof a != "string") return;
  const t = F(a).replace(/[^0-9.,]/g, "").replace(/,/g, "");
  if (!t) return;
  const e = parseFloat(t);
  return Number.isNaN(e) ? void 0 : e;
}
function Tt(a) {
  return Number.isInteger(a) ? String(a) : a.toFixed(2).replace(/\.?0+$/, "");
}
const At = {
  SAR: "ر.س",
  AED: "د.إ",
  KWD: "د.ك",
  BHD: "د.ب",
  QAR: "ر.ق",
  OMR: "ر.ع",
  EGP: "ج.م",
  JOD: "د.أ",
  YER: "ر.ي"
};
function st(a) {
  const t = a.trim().toUpperCase();
  return t ? ot() === "ar" ? At[t] ?? t : t : "";
}
function Ct(a, t) {
  var s;
  if (typeof a != "string") return "";
  if (!a.includes("<")) return a.trim();
  const e = (s = /\bsicon-([a-z]{3})\b/i.exec(a)) == null ? void 0 : s[1], i = a.replace(/<[^>]*>/g, " ").replace(/&nbsp;|&#160;/gi, " ").replace(/&amp;/gi, "&").replace(/\s+/g, " ").trim();
  if (!i) return "";
  if (!!/[^\d.,\s\u0660-\u0669\u06f0-\u06f9]/.test(i)) return i;
  const r = t || e;
  return r ? `${i} ${st(r)}` : i;
}
function U(a, t) {
  if (a == null || Number.isNaN(a)) return "";
  const e = K();
  try {
    if (e && typeof e.money == "function") {
      const n = Ct(
        t ? e.money({ amount: a, currency: t }) : e.money(a),
        t
      );
      if (n) return n;
    }
  } catch {
  }
  const i = Tt(a);
  return t ? `${i} ${st(t)}` : i;
}
async function zt(a, t = "") {
  var A, x, R, C, _, l, z, N, y, k, w;
  const e = K();
  if (!e) throw new Error("Salla SDK unavailable");
  typeof e.onReady == "function" && await e.onReady();
  const i = ((A = e.product) == null ? void 0 : A.getDetails) ?? ((R = (x = e.product) == null ? void 0 : x.api) == null ? void 0 : R.getDetails);
  if (typeof i != "function")
    throw new Error("getDetails unavailable");
  const n = await i.call(e.product, a), r = (n == null ? void 0 : n.data) ?? n;
  if (!r) throw new Error("empty product payload");
  const s = ((C = r.image) == null ? void 0 : C.url) || ((_ = r.image) == null ? void 0 : _.thumbnail) || Array.isArray(r.images) && (((l = r.images[0]) == null ? void 0 : l.url) || r.images[0]) || r.thumbnail || r.main_image || "", c = r.url || ((z = r.urls) == null ? void 0 : z.customer) || ((N = r.urls) == null ? void 0 : N.product) || r.permalink || `/p${a}`, d = S(r.price), u = S(r.regular_price), f = S(r.sale_price);
  let g = u ?? d, b = d ?? u;
  f !== void 0 && f > 0 && (b = f, (g === void 0 || g <= f) && (g = u ?? d ?? f));
  const T = (!!(r.is_on_sale ?? r.on_sale ?? r.has_offer) || f !== void 0) && g !== void 0 && b !== void 0 && b < g, V = r.currency || ((y = r.price) == null ? void 0 : y.currency) || ((k = r.regular_price) == null ? void 0 : k.currency) || void 0;
  return {
    name: String(r.name || r.title || t || `#${a}`),
    image: s || void 0,
    imageAlt: String(((w = r.image) == null ? void 0 : w.alt) || r.name || ""),
    url: c,
    regular: g,
    sale: T ? b : void 0,
    onSale: T,
    currency: V
  };
}
const Nt = yt`
  :host {
    display: block;
    font-family: inherit;
    direction: inherit;

    --fp-bg: #f4f1ea;
    --fp-card-bg: #ffffff;
    --fp-card-radius: 24px;
    --fp-media-radius: 18px;
    --fp-eyebrow: #b08948;
    --fp-section-title: #14181f;
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
    /* Vertical space is the merchant's, via shared tiers; the horizontal
       padding stays the section's own. See src/shared/section-spacing.ts. */
    padding-inline: clamp(1rem, 4vw, 2rem);
    padding-block: var(--sp-top-m) var(--sp-bot-m);
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
    gap: clamp(1rem, 2.5vw, 1.75rem);
    position: relative; /* anchors .fp-sbg background media */
  }

  /* Optional section heading that sits above the card. Coloured separately
     from .fp-title: it sits on the section background, not on the card. */
  .fp-section-title {
    width: 100%;
    margin: 0;
    color: var(--fp-section-title);
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
    /* Held in variables so full-bleed media can pull exactly this much back. */
    --fp-card-pad: clamp(1.25rem, 4vw, 2.25rem);
    --fp-card-pad-inline: var(--fp-card-pad);
    padding: var(--fp-card-pad) var(--fp-card-pad-inline);
  }

  /* Card style: minimal — no chrome, content floats on the section. */
  .fp-card[data-card="minimal"] {
    background: transparent;
    --fp-card-pad-inline: 0px;
  }

  /* Full-bleed media ("inside" layout only): the image spans the card edge to
     edge while the text keeps its padding. The media is the card's first
     child, so it also pulls back the top padding and takes the card's corner
     radius on top.

     The <img> is rounded itself rather than leaning on .fp-media-inner's
     overflow:hidden — a full-bleed image in a rounded box leaks a sliver of
     whatever sits behind it at the corners, in Chrome as well as WebKit. */
  .fp-card[data-fullbleed="on"] .fp-media {
    margin-inline: calc(-1 * var(--fp-card-pad-inline));
    margin-block-start: calc(-1 * var(--fp-card-pad));
    width: auto;
  }
  .fp-card[data-fullbleed="on"] .fp-media-inner,
  .fp-card[data-fullbleed="on"] .fp-img {
    border-radius: var(--fp-card-radius) var(--fp-card-radius) 0 0;
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
  /* Natural: the image's own ratio decides the card's height. The "auto"
     keyword means: use the intrinsic ratio once it is known, and this 1/1
     only until then. Without a pre-load box the image lays out 0px tall,
     and a zero-height lazy image never intersects the viewport, so it is
     never fetched and never gets a height. It simply never appears. The
     placeholder also keeps the card from collapsing while it loads. */
  .fp-hero[data-aspect="natural"] .fp-hero-img {
    aspect-ratio: auto 1 / 1;
  }
  /* A merchant who picks a fixed ratio wants that shape regardless of the
     upload — a 4:5 photo forced into a cinematic hero. Always "cover" here:
     "contain" would letterbox a hero with bars, which is never what this
     layout is for. The radius stays on the <img> so the corners keep working
     under the overlay's backdrop-filter. */
  .fp-hero[data-aspect="fixed"] .fp-hero-img {
    aspect-ratio: var(--fp-aspect);
    object-fit: cover;
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
  /* Stop compositing the infinite float once the section scrolls away. Must
     out-specify (and follow) the shorthand above — the animation shorthand
     resets animation-play-state to running. */
  :host([out-of-view]) .fp[data-float="on"] .fp-card .fp-img {
    animation-play-state: paused;
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

  @media (min-width: 768px) {
    .fp {
      padding-block: var(--sp-top-d) var(--sp-bot-d);
    }
  }
`;
var Mt = Object.defineProperty, O = (a, t, e, i) => {
  for (var n = void 0, r = a.length - 1, s; r >= 0; r--)
    (s = a[r]) && (n = s(t, e, n) || n);
  return n && Mt(t, e, n), n;
};
const X = class X extends $t {
  constructor() {
    super(...arguments), this._animState = "ready", this._cartState = "idle", this._naturalAspect = null, this._measuredSrc = null, this._cartResetTimer = null, this._onImageLoad = (t) => {
      const e = t.currentTarget;
      if (!e.naturalWidth || !e.naturalHeight) return;
      const i = Math.min(
        16 / 9,
        Math.max(9 / 16, e.naturalWidth / e.naturalHeight)
      );
      this._measuredSrc = e.currentSrc || e.src, this._naturalAspect = `${i}`;
    }, this._productCache = /* @__PURE__ */ new Map(), this._io = null, this._tiltRect = null, this._tiltRaf = null, this._onTiltMove = (t) => {
      if (!this._tiltAllowed(t)) return;
      const e = t.currentTarget, i = e.querySelector(".fp-media-inner");
      if (!i) return;
      this._tiltRect || (this._tiltRect = e.getBoundingClientRect());
      const n = this._tiltRect;
      if (!n.width || !n.height) return;
      const r = Math.max(-1, Math.min(1, (t.clientX - n.left) / n.width * 2 - 1)), s = Math.max(-1, Math.min(1, (t.clientY - n.top) / n.height * 2 - 1)), c = 10;
      this._tiltRaf !== null && cancelAnimationFrame(this._tiltRaf), this._tiltRaf = requestAnimationFrame(() => {
        this._tiltRaf = null, i.style.transform = `rotateY(${r * c}deg) rotateX(${-s * c}deg) scale3d(1.025, 1.025, 1.025)`;
      });
    }, this._onTiltLeave = (t) => {
      this._tiltRect = null, this._tiltRaf !== null && (cancelAnimationFrame(this._tiltRaf), this._tiltRaf = null);
      const i = t.currentTarget.querySelector(".fp-media-inner");
      i && (i.style.transform = "");
    }, this._onPrimaryClick = async (t) => {
      var u, f, g;
      if (t.preventDefault(), this._cartState === "loading") return;
      const e = this.config || {}, i = this._pickValue(
        e.button_action,
        "add_to_cart"
      ), n = H(e.product), r = this._resolveProduct(), s = n == null ? void 0 : n.id, c = this._salla, d = ((u = c == null ? void 0 : c.cart) == null ? void 0 : u.addItem) ?? ((g = (f = c == null ? void 0 : c.cart) == null ? void 0 : f.api) == null ? void 0 : g.addItem);
      if (!s || typeof d != "function") {
        r != null && r.url && (window.location.href = r.url);
        return;
      }
      this._cartState = "loading";
      try {
        if (await d.call(c.cart, { id: s, quantity: 1 }), this._cartState = "added", i === "buy_now") {
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
    return K();
  }
  async _fetchProduct(t) {
    if (!this._productCache.has(t)) {
      this._productCache.set(t, { status: "loading" }), this.requestUpdate();
      try {
        const e = await zt(t);
        this._productCache.set(t, { status: "loaded", data: e });
      } catch (e) {
        console.warn("[growth-featured-product] product fetch failed", t, e), this._productCache.set(t, { status: "failed" });
      }
      this.requestUpdate();
    }
  }
  _resolveProduct() {
    var i;
    const t = H((i = this.config) == null ? void 0 : i.product);
    if (!t) return null;
    const e = this._productCache.get(t.id);
    return e ? e.status === "loaded" ? e.data : e.status === "loading" && t.label ? { name: t.label, url: "", onSale: !1 } : null : (this._fetchProduct(t.id), t.label ? { name: t.label, url: "", onSale: !1 } : null);
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
    }), "IntersectionObserver" in window && (this._io = new IntersectionObserver(
      (n) => {
        const r = n[0];
        r && this.toggleAttribute("out-of-view", !r.isIntersecting);
      },
      { threshold: 0 }
    ), this._io.observe(this));
  }
  disconnectedCallback() {
    var t;
    super.disconnectedCallback(), this._cartResetTimer && (clearTimeout(this._cartResetTimer), this._cartResetTimer = null), this._tiltRaf !== null && (cancelAnimationFrame(this._tiltRaf), this._tiltRaf = null), (t = this._io) == null || t.disconnect(), this._io = null;
  }
  willUpdate(t) {
    t.has("config") && (this._cartState = "idle");
  }
  /**
   * Drop a stale "natural" measurement so a new image is never framed to the
   * shape of the one before it. Compared against the rendered <img> rather
   * than re-deriving the URL here, since it can come from the linked product.
   * Clearing sets _measuredSrc to null, so this cannot loop.
   */
  updated() {
    var e;
    if (!this._measuredSrc) return;
    const t = (e = this.renderRoot) == null ? void 0 : e.querySelector(".fp-img");
    t && (t.currentSrc || t.src) !== this._measuredSrc && (this._naturalAspect = null, this._measuredSrc = null);
  }
  _tiltAllowed(t) {
    return t.pointerType === "touch" ? !1 : (this._reducedMotionMql || (this._reducedMotionMql = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    )), !this._reducedMotionMql.matches);
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
    ), i = this._pickValue(t.image_side, "start"), n = this._pickValue(
      e === "floating" ? t.aspect_ratio_floating : e === "split" ? t.aspect_ratio_split : e === "background" ? t.aspect_ratio_background : t.aspect_ratio,
      // Mirrors the schema default per layout: "inside" and "background" ship
      // "natural", the other two only offer fixed ratios. Keeps
      // audit:runtime-defaults honest and survives a `selected` that never
      // got persisted.
      e === "inside" || e === "background" ? "natural" : "1/1"
    ), r = n !== "natural" ? n : e === "background" ? "auto" : this._naturalAspect ?? "1/1", s = this._pickValue(
      e === "split" ? t.image_fit_split : t.image_fit,
      "contain"
    ), c = e === "inside" && t.image_full_bleed === !0, d = this._pickValue(
      e === "floating" ? t.bg_effect_floating : e === "split" ? t.bg_effect_split : t.bg_effect,
      "none"
    ), u = d === "none" ? "" : (e === "floating" ? d === "glow" ? t.bg_effect_color_floating_glow : t.bg_effect_color_floating : e === "split" ? d === "glow" ? t.bg_effect_color_split_glow : t.bg_effect_color_split : d === "glow" ? t.bg_effect_color_glow : t.bg_effect_color) || "", f = this._pickValue(t.card_style, "soft"), g = this._num(t.card_radius, 24), b = Math.max(8, g - 6), I = this._pickValue(
      t.card_size_mobile,
      "compact"
    ), T = this._pickValue(
      t.card_size_desktop,
      "inherit"
    ), V = T === "inherit" ? I : T, A = this._pickValue(t.bg_type, "color"), x = this._pickValue(
      t.bg_overlay_tone,
      "dark"
    ), R = this._pickValue(t.content_align, "right"), C = t.highlights_bg || "", _ = this.localizedString(t.section_title), l = this._resolveProduct(), z = !!H(t.product), N = this.localizedString(t.eyebrow), y = this.localizedString(t.title) || (l == null ? void 0 : l.name) || "", k = this.localizedString(t.description), w = t.image || (l == null ? void 0 : l.image) || "", G = t.enable_hover_image && t.image_hover || "", P = y || (l == null ? void 0 : l.imageAlt) || "", j = (Array.isArray(t.highlights) ? t.highlights : []).map((h) => this.localizedString(h == null ? void 0 : h.text)).filter(Boolean).slice(0, 3), lt = t.show_price !== !1, J = t.show_sale_price !== !1;
    let $ = "", L = "";
    if (lt) {
      const h = this.localizedString(t.price), M = this.localizedString(
        t.compare_price
      );
      if (h) {
        $ = h;
        const rt = S(h), nt = S(M);
        J && M && nt !== void 0 && rt !== void 0 && nt > rt && (L = M);
      } else l && (l.onSale && l.sale !== void 0 ? ($ = U(l.sale, l.currency), J && l.regular !== void 0 && (L = U(l.regular, l.currency))) : l.regular !== void 0 && ($ = U(l.regular, l.currency)));
    }
    const Q = this.localizedString(t.free_shipping_text), ct = t.show_button !== !1, dt = {
      square: "0px",
      soft: "12px",
      rounded: "22px",
      pill: "999px"
    }[this._pickValue(t.button_radius, "pill")], E = this._pickValue(
      t.button_action,
      "add_to_cart"
    ), pt = !z || E === "view_product", ft = E === "view_product" ? (l == null ? void 0 : l.url) || t.button_url || "" : t.button_url || "", ht = this.localizedString(t.button_label) || this._defaultButtonLabel(E), ut = t.enable_float_anim !== !1, Z = this._pickValue(
      t.float_anim_speed,
      "normal"
    ), gt = {
      slow: "6.8s",
      normal: "5s",
      fast: "3.6s"
    }, mt = {
      slow: "14px",
      normal: "18px",
      fast: "22px"
    }, Y = !!t.enable_tilt && e !== "background", m = e === "background" && x === "dark" || f === "bold", bt = f === "minimal" ? "transparent" : f === "glass" ? "rgba(255,255,255,0.55)" : f === "bold" ? "linear-gradient(135deg,#283548,#11161f)" : "#ffffff", tt = (h) => h === "compact" ? "min(420px, 82%)" : h === "large" ? "min(860px, 96%)" : h === "full" ? "100%" : "var(--fp-maxw)", q = [
      t.bg_color ? `--fp-bg: ${t.bg_color}` : "",
      `--fp-maxw-mob: ${tt(I)}`,
      `--fp-maxw-desk: ${tt(V)}`,
      `--fp-card-bg: ${t.card_bg || bt}`,
      `--fp-card-radius: ${g}px`,
      `--fp-media-radius: ${b}px`,
      `--fp-aspect: ${r}`,
      `--fp-img-fit: ${s}`,
      `--fp-eyebrow: ${t.eyebrow_color || (m ? "#d8b478" : "#b08948")}`,
      `--fp-section-title: ${t.section_title_color || t.title_color || (m ? "#ffffff" : "#14181f")}`,
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
      `--fp-btn-radius: ${dt}`,
      `--fp-shipping: ${m ? "#7ee0aa" : "#2e7d52"}`,
      `--fp-effect: ${u || (m ? "#d8b478" : "#b08948")}`,
      `--fp-float-duration: ${gt[Z]}`,
      `--fp-float-distance: ${mt[Z]}`,
      // Highlights wrapper background. The framing (tinted box) always renders
      // with a context-aware default tint resolved in CSS; a merchant colour,
      // when set, overrides that default.
      C ? `--fp-hl-bg: ${C}` : "",
      ...St(t, (h, M) => this._pickValue(h, M))
    ].filter(Boolean).join("; "), et = !!(w || y || k || j.length || $ || z);
    if (!et && !_)
      return o`
        <section class="fp-empty" style=${q}>
          <p>
            ${this._lang() === "ar" ? "اربط منتجًا أو أضف صورة وعنوانًا لعرض المنتج المميز." : "Link a product or add an image and title to show the featured product."}
          </p>
        </section>
      `;
    const _t = d !== "none" && e !== "background", wt = w ? o`
          <div
            class="fp-media"
            data-tilt=${Y ? "on" : "off"}
            @pointermove=${Y ? this._onTiltMove : null}
            @pointerleave=${Y ? this._onTiltLeave : null}
          >
            ${_t ? o`<div class="fp-effect" data-effect=${d}></div>` : p}
            <div class="fp-media-inner">
              <img
                class="fp-img"
                src=${w}
                alt=${P}
                loading="lazy"
                draggable="false"
                @load=${this._onImageLoad}
              />
              ${G && e !== "background" ? o`<img
                    class="fp-img fp-img--hover"
                    src=${G}
                    alt=${P}
                    loading="lazy"
                    draggable="false"
                  />` : p}
            </div>
          </div>
        ` : p, at = o`
      <div class="fp-content" data-align=${R}>
        ${N ? o`<p class="fp-eyebrow">${N}</p>` : p}
        ${y ? o`<h2 class="fp-title">${y}</h2>` : p}
        ${j.length ? o`
              <ul class="fp-highlights">
                ${j.map(
      (h) => o`
                    <li class="fp-highlight">${this._icon("check")}<span>${h}</span></li>
                  `
    )}
              </ul>
            ` : p}
        ${k ? o`<p class="fp-desc">${k}</p>` : p}
        ${$ ? o`
              <div class="fp-price-row">
                <span class="fp-price">${$}</span>
                ${L ? o`<span class="fp-compare">${L}</span>` : p}
              </div>
            ` : p}
        ${Q ? o`<p class="fp-shipping">${this._icon("truck")}<span>${Q}</span></p>` : p}
        ${ct ? o`<div class="fp-actions">${this._renderButton(pt, ft, ht, E)}</div>` : p}
      </div>
    `, it = A === "image" && t.bg_image ? o`<img class="fp-sbg" src=${t.bg_image} alt="" aria-hidden="true" />` : A === "video" && t.bg_video ? o`<video
            class="fp-sbg"
            src=${t.bg_video}
            autoplay
            muted
            loop
            playsinline
          ></video>` : p;
    return e === "background" ? o`
        <section
          class="fp"
          style=${q}
          data-enter=${this._animState}
          data-layout="background"
        >
          ${it}
          ${_ ? o`<h2 class="fp-section-title">${_}</h2>` : p}
          <div
            class="fp-hero"
            data-tone=${x}
            data-aspect=${n === "natural" ? "natural" : "fixed"}
          >
            ${w ? o`<img
                  class="fp-hero-img"
                  src=${w}
                  alt=${P}
                  loading="lazy"
                  draggable="false"
                />` : p}
            ${at}
          </div>
        </section>
      ` : o`
      <section
        class="fp"
        style=${q}
        data-enter=${this._animState}
        data-float=${ut ? "on" : "off"}
        data-layout=${e}
      >
        ${it}
        ${_ ? o`<h2 class="fp-section-title">${_}</h2>` : p}
        ${et ? o`<div
          class="fp-card"
          data-layout=${e}
          data-side=${i}
          data-card=${f}
          data-tone=${x}
          data-fullbleed=${c ? "on" : "off"}
        >
          ${wt} ${at}
        </div>` : p}
      </section>
    `;
  }
  _renderButton(t, e, i, n) {
    if (t)
      return o`
        <a class="fp-btn" href=${e || "#"}>
          <span>${i}</span>${this._icon("arrow")}
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
        ${this._icon("bag")}<span>${i}</span>
      </button>
    `;
  }
};
X.styles = Nt;
let v = X;
O([
  xt({ type: Object })
], v.prototype, "config");
O([
  W()
], v.prototype, "_animState");
O([
  W()
], v.prototype, "_cartState");
O([
  W()
], v.prototype, "_naturalAspect");
typeof v < "u" && v.registerSallaComponent("salla-featured-product");
export {
  v as default
};
