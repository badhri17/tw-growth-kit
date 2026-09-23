import { LitElement as E, css as q, html as s, nothing as r } from "lit";
import { property as U, state as f } from "lit/decorators.js";
function W(n, t) {
  if (typeof n == "string") return n;
  if (!n || typeof n != "object") return "";
  const a = n[t] || n.ar || n.en || "";
  return typeof a == "string" ? a.trim() : "";
}
function F() {
  return (document.documentElement.lang || "ar").toLowerCase().startsWith("en") ? "en" : "ar";
}
function Y(n) {
  return n.replace(/[٠-٩]/g, (t) => String(t.charCodeAt(0) - 1632)).replace(/[۰-۹]/g, (t) => String(t.charCodeAt(0) - 1776));
}
class K extends E {
  /**
   * Twilight transform injects `Component.registerSallaComponent(...)`.
   * Statics inherit, so `this` is the concrete component. The polling
   * fallback handles preview contexts where `Salla` loads after the
   * component file executes.
   */
  static registerSallaComponent(t) {
    const a = String(t || "").trim(), e = a.toLowerCase().replace(/[^a-z0-9._-]/g, "-"), i = e.includes("-") ? e : `salla-${e || "component"}`, o = () => `${i}-${Math.random().toString(36).substring(2, 8)}`, c = () => {
      var l;
      const d = (l = window.Salla) == null ? void 0 : l.bundles;
      return d && typeof d.registerComponent == "function" ? (d.registerComponent(a, {
        component: this,
        dynamicTagName: o()
      }), !0) : !1;
    };
    if (c()) return;
    const p = window.setInterval(() => {
      c() && window.clearInterval(p);
    }, 100);
    window.setTimeout(() => window.clearInterval(p), 5e3);
  }
  /** Resolved document language. */
  _lang() {
    return F();
  }
  /** Pull the store-language string out of a Salla multilanguage value. */
  localizedString(t) {
    return W(t, this._lang());
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
    return Y(t);
  }
  /** Coerce a config number that may arrive as a string (Arabic-Indic
      digits included) or as a [{ value }] dropdown selection. */
  _num(t, a) {
    if (typeof t == "number" && !Number.isNaN(t)) return t;
    if (typeof t == "string" && t.trim() !== "") {
      const e = Number(Y(t.trim()));
      if (!Number.isNaN(e)) return e;
    }
    if (Array.isArray(t) && t.length > 0) {
      const e = t[0];
      if ((e == null ? void 0 : e.value) !== void 0) return this._num(e.value, a);
    }
    return a;
  }
}
const T = {
  none: 0,
  xs: 12,
  sm: 24,
  md: 40,
  lg: 56,
  xl: 72
}, P = {
  none: 0,
  xs: 20,
  sm: 32,
  md: 64,
  lg: 96,
  xl: 128
};
function J(n, t, a = "md", e = "md") {
  const i = t(n == null ? void 0 : n.space_top, a), o = t(n == null ? void 0 : n.space_bottom, e), c = T[i] ?? T.md, p = T[o] ?? T.md, d = P[i] ?? P.md, l = P[o] ?? P.md;
  return [
    `--sp-top-m:${c}px`,
    `--sp-bot-m:${p}px`,
    `--sp-top-d:${d}px`,
    `--sp-bot-d:${l}px`
  ];
}
const Q = q`
  :host {
    display: block;
    font-family: inherit;
    direction: inherit;

    --col-bg: #feecd4;
    --col-title-color: #18332f;
    --col-text-color: #4b5563;
    --col-caption-title-color: #111111;
    --col-caption-text-color: #555555;
    --col-card-radius: 20px;
    --col-cta-bg: #18332f;
    --col-cta-color: #ffffff;
    --col-nav-bg: rgba(255, 255, 255, 0.95);
    --col-nav-icon: #18332f;
    --col-dot-color: #18332f;
    --col-aspect: 1 / 1;
    --col-ease: cubic-bezier(0.25, 0.46, 0.45, 0.94);
  }

  *,
  *::before,
  *::after {
    box-sizing: border-box;
  }

  .col-section {
    width: 100%;
    /* Vertical space is the merchant's, via shared tiers; the horizontal
       padding stays the section's own. See src/shared/section-spacing.ts. */
    padding-inline: clamp(1rem, 3vw, 1.5rem);
    padding-block: var(--sp-top-m) var(--sp-bot-m);
    background-color: var(--col-bg);
    display: flex;
    flex-direction: column;
    align-items: center;
    position: relative;
    overflow: hidden;
  }

  /* ---------- Header ---------- */
  .col-header {
    width: 100%;
    max-width: 720px;
    text-align: center;
    margin-bottom: clamp(1.5rem, 4vw, 2.5rem);
  }
  .col-title {
    font-size: clamp(1.75rem, 4vw, 2.5rem);
    font-weight: 500;
    letter-spacing: 1.5px;
    color: var(--col-title-color);
    margin: 0 0 0.5rem;
    line-height: 1.2;
  }

  /* ---------- Stage ---------- */
  .col-stage {
    position: relative;
    width: 100%;
    max-width: 1200px;
    padding: 1rem 3.5rem;
  }
  @media (min-width: 1024px) {
    .col-stage {
      padding: 1rem 5rem;
    }
  }
  @media (max-width: 480px) {
    .col-stage {
      padding: 0.5rem 3.75rem;
    }
  }

  /* Track is the 3D stage: it owns the perspective so each slide's rotateY +
     translateZ render as real depth. Side slides poke out past it. */
  .col-track {
    position: relative;
    width: 100%;
    max-width: 560px;
    margin-inline: auto;
    aspect-ratio: var(--col-aspect);
    overflow: visible;
    perspective: 1400px;
    transform-style: preserve-3d;
  }

  /* ---------- Slide positioning ----------
     A depth coverflow: one combined transform per resting position —
     translateX glides it sideways, translateZ recedes it into the scene, scale
     shrinks it. No rotation — cards stay flat-on. Side slides are fully opaque
     so the section background never tints through the transparent card. */
  .col-slide {
    position: absolute;
    inset: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: transform 0.6s var(--col-ease),
      opacity 0.6s var(--col-ease);
    opacity: 0;
    pointer-events: none;
    will-change: transform, opacity;
  }

  /* When a slide wraps around the loop it would otherwise fly all the way
     across the stage. Snap it to its new side with no transition instead. */
  .col-slide[data-instant] {
    transition: none;
  }

  .col-slide[data-pos="active"] {
    opacity: 1;
    pointer-events: auto;
    z-index: 5;
    transform: translateX(0) translateZ(0) scale(1);
  }
  .col-slide[data-pos="left"] {
    opacity: 1;
    z-index: 4;
    transform: translateX(-90%) translateZ(-90px) scale(0.62);
  }
  .col-slide[data-pos="right"] {
    opacity: 1;
    z-index: 4;
    transform: translateX(90%) translateZ(-90px) scale(0.62);
  }
  /* Only 3 slides are ever visible (active + the two neighbours). The far
     positions stay laid out for the wrap animation but are fully hidden, so a
     slide fades in from the edge as it slides into the neighbour slot. */
  .col-slide[data-pos="far-left"] {
    opacity: 0;
    z-index: 2;
    transform: translateX(-130%) translateZ(-170px) scale(0.5);
  }
  .col-slide[data-pos="far-right"] {
    opacity: 0;
    z-index: 2;
    transform: translateX(130%) translateZ(-170px) scale(0.5);
  }
  .col-slide[data-pos="hidden"] {
    opacity: 0;
    z-index: 1;
    transform: translateZ(-340px) scale(0.45);
  }

  /* RTL mirrors the arc: sides swap to the opposite hand. */
  .col-slide:dir(rtl)[data-pos="left"] {
    transform: translateX(90%) translateZ(-90px) scale(0.62);
  }
  .col-slide:dir(rtl)[data-pos="right"] {
    transform: translateX(-90%) translateZ(-90px) scale(0.62);
  }
  .col-slide:dir(rtl)[data-pos="far-left"] {
    transform: translateX(130%) translateZ(-170px) scale(0.5);
  }
  .col-slide:dir(rtl)[data-pos="far-right"] {
    transform: translateX(-130%) translateZ(-170px) scale(0.5);
  }

  /* Single layout: only the active slide shows — everything else recedes out. */
  .col-section[data-layout="single"] .col-slide:not([data-pos="active"]) {
    opacity: 0;
    transform: translateZ(-340px) scale(0.45);
  }

  /* Mobile: neighbours shrink and peek in from the edges with a gap. */
  @media (max-width: 1023px) {
    .col-slide[data-pos="left"] {
      transform: translateX(-78%) translateZ(-60px) scale(0.56);
    }
    .col-slide[data-pos="right"] {
      transform: translateX(78%) translateZ(-60px) scale(0.56);
    }
    .col-slide:dir(rtl)[data-pos="left"] {
      transform: translateX(78%) translateZ(-60px) scale(0.56);
    }
    .col-slide:dir(rtl)[data-pos="right"] {
      transform: translateX(-78%) translateZ(-60px) scale(0.56);
    }
  }

  /* ---------- Slides entrance: stacked → spread ----------
     With «حركة الظهور» on, every slide starts collapsed at the center (receded
     into the scene and faded out), then releases to its coverflow position —
     the cards appear stacked, then fan out. The four-class selector outranks
     every resting data-pos rule (incl. the RTL / mobile ones) so it wins while
     "ready"; once the state flips to "in" it stops matching and the normal
     positions take over, and .col-slide's own transition animates the spread. */
  .col-section[data-enter="ready"] .col-track .col-slide {
    transform: translateX(0) translateZ(-220px) scale(0.6);
    opacity: 0;
  }

  /* ---------- Card ---------- */
  .col-card {
    position: relative;
    width: 100%;
    height: 100%;
    border-radius: var(--col-card-radius);
    overflow: hidden;
    user-select: none;
    -webkit-user-select: none;
    background: transparent;
    cursor: pointer;
  }
  .col-slide[data-pos="active"] .col-card {
    cursor: default;
  }

  .col-card img {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    object-fit: cover;
    display: block;
    pointer-events: none;
    transition: opacity 0.5s var(--col-ease),
      transform 0.5s var(--col-ease);
  }



  /* ---------- Animation: reveal ----------
     Two stacked images per slide; on active we cross-fade from closed→opened
     (with a hair of scale to feel like the product is "opening"). Slides
     without an "image_opened" are tagged "col-card--no-opened" so the swap
     is skipped — otherwise the closed image would fade out into nothing. */
  .col-card:not(.col-card--no-opened) .col-img-opened {
    opacity: 0;
    transform: scale(1.05);
    z-index: 2;
  }
  .col-card:not(.col-card--no-opened) .col-img-closed {
    opacity: 1;
    transform: scale(1);
    z-index: 1;
  }
  .col-slide[data-pos="active"]
    .col-card:not(.col-card--no-opened)
    .col-img-opened {
    opacity: 1;
    transform: scale(1);
  }
  .col-slide[data-pos="active"]
    .col-card:not(.col-card--no-opened)
    .col-img-closed {
    opacity: 0;
    transform: scale(1.1);
  }
  /* Hold the reveal until the slide has finished gliding to center: wait out
     the 0.6s slide-move transition before the closed→opened cross-fade starts.
     Reverting (leaving active) uses the base transition with no delay, so the
     closed image returns promptly. */
  .col-slide[data-pos="active"]
    .col-card:not(.col-card--no-opened)
    .col-img-opened,
  .col-slide[data-pos="active"]
    .col-card:not(.col-card--no-opened)
    .col-img-closed {
    transition-delay: 0.4s;
  }
  .col-card.col-card--no-opened .col-img-opened {
    display: none;
  }

  /* ---------- Caption block (per-slide, under carousel) ----------
     Fades out → swaps text → fades in as the active slide changes. */
  .col-caption {
    width: 100%;
    max-width: 640px;
    text-align: center;
    margin: clamp(1.25rem, 3vw, 2rem) auto 0;
    padding: 0 1rem;
    min-height: 6rem;
  }
  .col-caption[data-state="out"] .col-caption__title,
  .col-caption[data-state="out"] .col-caption__desc {
    opacity: 0;
    transform: translateY(6px);
  }
  .col-caption[data-state="in"] .col-caption__title,
  .col-caption[data-state="in"] .col-caption__desc {
    opacity: 1;
    transform: translateY(0);
  }
  .col-caption__title,
  .col-caption__desc {
    transition: opacity 0.45s var(--col-ease),
      transform 0.45s var(--col-ease);
  }
  .col-caption__title {
    font-size: clamp(1.3rem, 2.4vw, 1.85rem);
    font-weight: 400;
    letter-spacing: 0.5px;
    color: var(--col-caption-title-color);
    margin: 0 0 0.6rem;
    line-height: 1.3;
  }
  .col-caption__desc {
    font-size: clamp(0.95rem, 1.3vw, 1.05rem);
    color: var(--col-caption-text-color);
    line-height: 1.7;
    margin: 0;
    transition-delay: 0.05s;
  }

  /* ---------- CTA button (under carousel, home mode only) ---------- */
  .col-cta-wrap {
    width: 100%;
    text-align: center;
    margin-top: clamp(1.5rem, 3vw, 2.25rem);
  }
  .col-cta {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    padding: 12px 28px;
    background: var(--col-cta-bg);
    color: var(--col-cta-color);
    border-radius: 999px;
    font-weight: 600;
    font-size: 0.95rem;
    text-decoration: none;
    transition: transform 0.25s var(--col-ease),
      box-shadow 0.25s var(--col-ease), opacity 0.3s var(--col-ease);
    box-shadow: 0 12px 24px -12px rgba(0, 0, 0, 0.35);
  }
  .col-cta:hover {
    transform: translateY(-2px);
    box-shadow: 0 18px 32px -14px rgba(0, 0, 0, 0.45);
  }
  .col-cta svg {
    width: 14px;
    height: 14px;
    fill: none;
    stroke: currentColor;
    stroke-width: 2.5;
    stroke-linecap: round;
    stroke-linejoin: round;
  }
  .col-cta:dir(rtl) svg {
    transform: rotate(180deg);
  }

  /* ---------- Navigation ---------- */
  .col-nav {
    position: absolute;
    top: 50%;
    transform: translateY(-50%);
    width: 50px;
    height: 50px;
    border: 1px solid rgba(255, 255, 255, 0.5);
    background: var(--col-nav-bg);
    border-radius: 50%;
    cursor: pointer;
    z-index: 10;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: transform 0.25s var(--col-ease),
      box-shadow 0.25s var(--col-ease), filter 0.25s var(--col-ease);
    box-shadow: 0 6px 18px -6px rgba(0, 0, 0, 0.3);
  }
  .col-nav:hover {
    transform: translateY(-50%) scale(1.1);
    filter: brightness(1.05);
    box-shadow: 0 10px 28px -8px rgba(0, 0, 0, 0.45);
  }
  .col-nav:disabled {
    opacity: 0.35;
    cursor: not-allowed;
    transform: translateY(-50%);
    box-shadow: none;
  }
  .col-nav svg {
    width: 22px;
    height: 22px;
    stroke: var(--col-nav-icon);
    fill: none;
    stroke-width: 2.5;
    stroke-linecap: round;
    stroke-linejoin: round;
  }
  .col-nav-prev {
    left: 0;
  }
  .col-nav-next {
    right: 0;
  }
  .col-nav-prev svg {
    transform: rotate(180deg);
  }
  /* RTL: swap nav button sides + flip arrows. */
  .col-nav-prev:dir(rtl) {
    left: auto;
    right: 0;
  }
  .col-nav-next:dir(rtl) {
    right: auto;
    left: 0;
  }
  .col-nav-prev:dir(rtl) svg {
    transform: rotate(0deg);
  }
  .col-nav-next:dir(rtl) svg {
    transform: rotate(180deg);
  }

  /* ---------- Pagination dots ---------- */
  .col-dots {
    display: flex;
    gap: 10px;
    justify-content: center;
    margin-top: 24px;
  }
  .col-dot {
    width: 10px;
    height: 10px;
    border-radius: 50%;
    border: none;
    padding: 0;
    background: var(--col-dot-color);
    opacity: 0.35;
    cursor: pointer;
    transition: opacity 0.25s var(--col-ease),
      transform 0.25s var(--col-ease);
  }
  .col-dot[aria-current="true"] {
    opacity: 1;
    transform: scale(1.25);
  }
  .col-dot:hover {
    opacity: 0.7;
  }

  /* ---------- Header entrance (fade + de-blur) ---------- */
  .col-header > * {
    will-change: opacity, filter, transform;
  }
  .col-header[data-anim="ready"] > * {
    opacity: 0;
    filter: blur(14px);
    transform: translateY(8px);
  }
  .col-header[data-anim="in"] > * {
    opacity: 1;
    filter: blur(0);
    transform: translateY(0);
    transition: opacity 0.95s cubic-bezier(0.22, 1, 0.36, 1),
      filter 0.85s cubic-bezier(0.22, 1, 0.36, 1),
      transform 0.95s cubic-bezier(0.22, 1, 0.36, 1);
  }
  .col-header[data-anim="in"] > *:nth-child(1) {
    transition-delay: 0.08s;
  }
  .col-header[data-anim="in"] > *:nth-child(2) {
    transition-delay: 0.26s;
  }

  /* ---------- Empty state ---------- */
  .col-empty {
    width: 100%;
    padding: 60px 20px;
    text-align: center;
    color: #888;
    background: var(--col-bg);
  }

  /* ---------- Reduced motion ---------- */
  @media (prefers-reduced-motion: reduce) {
    .col-slide,
    .col-card,
    .col-card img,
    .col-nav,
    .col-dot,
    .col-cta,
    .col-caption__title,
    .col-caption__desc {
      transition: none !important;
    }
    .col-header[data-anim] > * {
      opacity: 1 !important;
      filter: blur(0) !important;
      transform: none !important;
      transition: none !important;
    }
  }

  /* ---------- Mobile tuning ---------- */
  @media (max-width: 640px) {
    .col-nav {
      width: 42px;
      height: 42px;
    }
    .col-nav svg {
      width: 18px;
      height: 18px;
    }
  }

  /* ============================================================
     Bag mode (وضع الشنطة)
     Vertical stage: half-dome + fog backdrop (z 1–2), the merchant's
     bag image in front of them (z 5), and the product layer on top
     (z 7) so the bottle reads as standing in the bag's mouth. The
     rise/sink keyframes + the opacity fade sell the in/out illusion.
     Mobile values are the base; desktop overrides at 768px.
     ============================================================ */
  .col-section--bag {
    /* Bag tier (حجم الشنطة): the bag image + the stage built around it.
       --bag-anchor = the bag's mouth line, where the product's bottom
       rests, measured up from the stage bottom. */
    --bag-w: 320px;
    --bag-anchor: 240px;
    --bag-nav-size: 46px;
    --bag-circle-color: #eba3a8;

    /* Product tier (حجم المنتجات): independent of the bag so merchants
       can tune the product-to-bag ratio. */
    --bag-bottle-w: 215px;
    --bag-circle-w: 260px;
    --bag-circle-h: 150px;

    /* Measured h/w ratios of the actual images — the component sets these
       inline once the images load, so the stage hugs the real artwork
       instead of reserving worst-case headroom (which read as a huge gap
       between the caption and the product). Declarations here are the
       pre-measure fallbacks. */
    --bag-prod-ratio: 1.2;
    --bag-ratio: 1.05;

    /* Derived: the stage is exactly tall enough for the taller of
       (mouth line + product + overshoot headroom) and the bag artwork
       itself; everything else tracks the mouth line, so the two size
       dropdowns can be mixed freely. */
    --bag-img-h: calc(
      var(--bag-bottle-w) * min(var(--bag-prod-ratio), 1.9)
    );
    --bag-stage-h: max(
      calc(var(--bag-anchor) + var(--bag-img-h) + 16px),
      calc(var(--bag-w) * var(--bag-ratio) - 12px)
    );
    --bag-layer-h: calc(var(--bag-stage-h) - var(--bag-anchor));
    --bag-circle-top: max(
      0px,
      calc(var(--bag-layer-h) - var(--bag-circle-h) - 25px)
    );
    --bag-nav-top: calc(var(--bag-layer-h) + 25px);
  }
  .col-section--bag[data-bag-size="small"] {
    --bag-w: 260px;
    --bag-anchor: 220px;
  }
  .col-section--bag[data-bag-size="large"] {
    --bag-w: 360px;
    --bag-anchor: 260px;
  }
  .col-section--bag[data-product-size="small"] {
    --bag-bottle-w: 170px;
    --bag-circle-w: 220px;
    --bag-circle-h: 130px;
  }
  .col-section--bag[data-product-size="large"] {
    --bag-bottle-w: 260px;
    --bag-circle-w: 300px;
    --bag-circle-h: 170px;
  }
  @media (min-width: 768px) {
    .col-section--bag {
      --bag-w: 400px;
      --bag-anchor: 290px;
      --bag-nav-size: 54px;
      --bag-bottle-w: 255px;
      --bag-circle-w: 310px;
      --bag-circle-h: 180px;
    }
    .col-section--bag[data-bag-size="small"] {
      --bag-w: 320px;
      --bag-anchor: 230px;
    }
    .col-section--bag[data-bag-size="large"] {
      --bag-w: 460px;
      --bag-anchor: 350px;
    }
    .col-section--bag[data-product-size="small"] {
      --bag-bottle-w: 195px;
      --bag-circle-w: 260px;
      --bag-circle-h: 150px;
    }
    .col-section--bag[data-product-size="large"] {
      --bag-bottle-w: 315px;
      --bag-circle-w: 360px;
      --bag-circle-h: 200px;
    }
  }

  /* In bag mode the caption sits ABOVE the stage (the copy introduces the
     product rising below it). Reserve height so text swaps don't bounce
     the whole stage. */
  .col-section--bag .col-caption {
    margin: 0 auto;
    min-height: 7rem;
  }
  /* Keep the caption swap in step with the quicker rise/sink below. */
  .col-section--bag .col-caption__title,
  .col-section--bag .col-caption__desc {
    transition-duration: 0.28s;
  }

  .col-bag-stage {
    position: relative;
    width: min(520px, 94vw);
    height: var(--bag-stage-h);
    margin-inline: auto;
    overflow: hidden;
    /* Horizontal swipe navigates; vertical stays native page scroll. */
    touch-action: pan-y;
  }

  .col-bag-circle {
    position: absolute;
    left: 50%;
    transform: translateX(-50%);
    top: var(--bag-circle-top);
    width: var(--bag-circle-w);
    height: var(--bag-circle-h);
    border-radius: var(--bag-circle-h) var(--bag-circle-h) 0 0;
    background: var(--bag-circle-color);
    z-index: 1;
  }
  .col-bag-fog {
    position: absolute;
    left: 50%;
    transform: translateX(-50%);
    top: calc(var(--bag-circle-top) + var(--bag-circle-h) - 10px);
    width: calc(var(--bag-circle-w) + 90px);
    height: 130px;
    background: linear-gradient(
      180deg,
      var(--bag-circle-color) 0%,
      transparent 100%
    );
    filter: blur(18px);
    opacity: 0.9;
    pointer-events: none;
    z-index: 2;
  }

  .col-bag-img {
    position: absolute;
    left: 50%;
    transform: translateX(-50%);
    bottom: -12px;
    width: var(--bag-w);
    max-width: 92vw;
    display: block;
    z-index: 5;
    pointer-events: none;
    user-select: none;
    -webkit-user-select: none;
  }

  .col-bag-layer {
    position: absolute;
    left: 50%;
    transform: translateX(-50%);
    top: 0;
    width: var(--bag-bottle-w);
    height: var(--bag-layer-h);
    z-index: 7;
    /* The layer's bottom edge IS the bag's mouth line, so clipping there makes
       a product physically disappear into / emerge from the bag — no opacity
       or blur crossfade needed. Negative insets keep the drop-shadow and the
       rise overshoot unclipped on the other three sides. */
    clip-path: inset(-60px -60px 0 -60px);
  }
  .col-bag-slide {
    position: absolute;
    inset: 0;
    display: flex;
    align-items: flex-end;
    justify-content: center;
    opacity: 0;
    pointer-events: none;
  }
  .col-bag-slide[data-state="active"],
  .col-bag-slide[data-state="rising"],
  .col-bag-slide[data-state="sinking"] {
    opacity: 1;
  }
  /* The incoming product passes over the outgoing one at the mouth. */
  .col-bag-slide[data-state="rising"] {
    z-index: 2;
  }
  .col-bag-slide img {
    display: block;
    width: 100%;
    max-height: 100%;
    object-fit: contain;
    filter: drop-shadow(0 12px 20px rgba(0, 0, 0, 0.12));
    transform-origin: 50% 100%;
    /* Transform-only animations keep this on the compositor: the static
       drop-shadow is rasterised once, never per frame. */
    will-change: transform;
    user-select: none;
    -webkit-user-select: none;
  }
  /* Sequential handoff: the outgoing product drops in with a short gravity
     ease-in, and only once it is (almost) below the mouth does the next one
     pop up — a single easing with a small overshoot, so the two never share
     the stage. Total ≈ 0.78s, all transform-only. */
  .col-bag-slide[data-state="rising"] img {
    animation: colBagRise 0.5s cubic-bezier(0.32, 1.25, 0.5, 1) 0.28s both;
  }
  .col-bag-slide[data-state="sinking"] img {
    animation: colBagSink 0.32s cubic-bezier(0.55, 0.06, 0.68, 0.19) forwards;
  }

  @keyframes colBagRise {
    from {
      transform: translateY(100%) scale(0.94);
    }
    to {
      transform: translateY(0) scale(1);
    }
  }
  @keyframes colBagSink {
    from {
      transform: translateY(0) scale(1);
    }
    to {
      transform: translateY(100%) scale(0.96);
    }
  }

  /* Bag nav: up pulls the next product out, down sends it back in.
     RTL puts "up" on the right hand (matches reading order); LTR mirrors. */
  .col-bag-nav {
    position: absolute;
    top: var(--bag-nav-top);
    width: var(--bag-nav-size);
    height: var(--bag-nav-size);
    border-radius: 50%;
    border: none;
    background: var(--col-nav-bg);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.14);
    z-index: 20;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    padding: 0;
    transition: opacity 0.2s var(--col-ease), transform 0.15s var(--col-ease);
  }
  .col-bag-nav:hover {
    transform: scale(1.06);
  }
  .col-bag-nav:active {
    transform: scale(0.94);
  }
  .col-bag-nav:disabled {
    opacity: 0.4;
    pointer-events: none;
  }
  .col-bag-nav svg {
    width: 22px;
    height: 22px;
    stroke: var(--col-nav-icon);
    stroke-width: 2;
    fill: none;
    stroke-linecap: round;
    stroke-linejoin: round;
  }
  .col-bag-nav--up {
    inset-inline-end: 10px;
  }
  .col-bag-nav--down {
    inset-inline-start: 10px;
  }

  .col-bag-bottom {
    text-align: center;
    color: var(--col-caption-title-color);
    font-size: clamp(1.15rem, 3.5vw, 1.6rem);
    font-weight: 700;
    line-height: 1.55;
    margin: 14px auto 0;
    max-width: 480px;
    padding: 0 1rem;
  }

  @media (prefers-reduced-motion: reduce) {
    .col-bag-slide img {
      animation: none !important;
    }
    .col-bag-slide[data-state="sinking"] {
      opacity: 0;
    }
  }

  @media (min-width: 768px) {
    .col-section {
      padding-block: var(--sp-top-d) var(--sp-bot-d);
    }
  }
`;
var G = Object.defineProperty, b = (n, t, a, e) => {
  for (var i = void 0, o = n.length - 1, c; o >= 0; o--)
    (c = n[o]) && (i = c(t, a, i) || i);
  return i && G(t, a, i), i;
};
const N = class N extends K {
  constructor() {
    super(...arguments), this._activeIndex = 0, this._animState = "ready", this._captionState = "in", this._bagLeavingIndex = null, this._bagNavigated = !1, this._bagProdRatio = null, this._bagImgRatio = null, this._autoplayTimer = null, this._captionTimer = null, this._hoverPaused = !1, this._hasInitializedActive = !1, this._inView = !0, this._io = null, this._swipeStartX = null, this._swipeStartY = null, this._swipeActive = !1, this._prevDiff = /* @__PURE__ */ new Map(), this._goPrev = () => {
      var i;
      const t = this._slides().length;
      if (t <= 1) return;
      const a = ((i = this.config) == null ? void 0 : i.loop) !== !1;
      let e = this._activeIndex - 1;
      e < 0 && (e = a ? t - 1 : 0), this._changeActive(e);
    }, this._goNext = () => {
      var i;
      const t = this._slides().length;
      if (t <= 1) return;
      const a = ((i = this.config) == null ? void 0 : i.loop) !== !1;
      let e = this._activeIndex + 1;
      e >= t && (e = a ? 0 : t - 1), this._changeActive(e);
    }, this._goTo = (t) => {
      const a = this._slides().length;
      t < 0 || t >= a || this._changeActive(t);
    }, this._onSlideClick = (t) => {
      if (this._swipeActive) return;
      const a = t.currentTarget;
      if (!a || a.dataset.pos === "active") return;
      const e = Number(a.dataset.index);
      Number.isInteger(e) && this._goTo(e);
    }, this._onPointerDown = (t) => {
      this._slides().length <= 1 || (this._swipeStartX = t.clientX, this._swipeStartY = t.clientY, this._swipeActive = !1);
    }, this._onPointerMove = (t) => {
      var i;
      if (this._swipeStartX === null) return;
      if (t.pointerType === "mouse" && t.buttons === 0) {
        this._swipeStartX = null, this._swipeStartY = null;
        return;
      }
      const a = t.clientX - this._swipeStartX, e = t.clientY - (this._swipeStartY ?? t.clientY);
      if (!this._swipeActive && Math.abs(a) > 10 && Math.abs(a) > Math.abs(e)) {
        this._swipeActive = !0;
        try {
          (i = t.currentTarget) == null || i.setPointerCapture(t.pointerId);
        } catch {
        }
      }
    }, this._onPointerUp = (t) => {
      try {
        const i = t.currentTarget;
        i != null && i.hasPointerCapture(t.pointerId) && i.releasePointerCapture(t.pointerId);
      } catch {
      }
      if (this._swipeStartX === null) return;
      const a = t.clientX - this._swipeStartX, e = getComputedStyle(this).direction === "rtl";
      this._swipeActive && Math.abs(a) > 40 && ((e ? a > 0 : a < 0) ? this._goNext() : this._goPrev()), this._swipeStartX = null, this._swipeStartY = null, window.setTimeout(() => {
        this._swipeActive = !1;
      }, 50);
    }, this._onHoverIn = () => {
      this._hoverPaused = !0;
    }, this._onHoverOut = () => {
      this._hoverPaused = !1;
    };
  }
  // ------------------------------------------------------------
  // Helpers
  // ------------------------------------------------------------
  _displayMode() {
    var t;
    return this._pickValue(
      (t = this.config) == null ? void 0 : t.display_mode,
      "carousel"
    );
  }
  _slides() {
    var a;
    const t = (a = this.config) == null ? void 0 : a.slides;
    return Array.isArray(t) ? t.filter((e) => !e || typeof e != "object" ? !1 : !!(e.image || e.image_opened || e.link)) : [];
  }
  // ------------------------------------------------------------
  // Link resolution
  //
  // `slide.link` is a Salla `variable-list` field: the platform resolves the
  // picked target (product / category / page / brand / blog / external URL) to
  // a final URL string server-side. We still parse defensively because the
  // value can arrive as a bare string, a `{ url | value }` object, or a
  // single-item array wrapping either — and we treat "" / "#" as "no link".
  // ------------------------------------------------------------
  _resolveLink(t) {
    const a = t.link;
    if (!a) return "";
    const e = Array.isArray(a) ? a[0] : a;
    if (!e) return "";
    const o = (typeof e == "string" ? e : typeof e == "object" ? String(
      e.url ?? e.value ?? ""
    ) : "").trim();
    return o && o !== "#" ? o : "";
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
    }), "IntersectionObserver" in window && (this._io = new IntersectionObserver(
      (i) => {
        const o = i[0];
        o && (this._inView = o.isIntersecting, this._teardownAutoplay(), this._inView && this._setupAutoplay());
      },
      { threshold: 0.15 }
    ), this._io.observe(this));
  }
  disconnectedCallback() {
    var t;
    super.disconnectedCallback(), this._teardownAutoplay(), (t = this._io) == null || t.disconnect(), this._io = null, this._captionTimer && (clearTimeout(this._captionTimer), this._captionTimer = null);
  }
  willUpdate(t) {
    var e;
    if (!t.has("config")) return;
    const a = this._slides();
    if (!this._hasInitializedActive && a.length > 0) {
      const i = this._num((e = this.config) == null ? void 0 : e.initial_slide, NaN), o = this._displayMode() === "bag" ? 0 : Math.floor(a.length / 2), c = Number.isNaN(i) ? o : Math.max(0, Math.min(a.length - 1, Math.round(i) - 1));
      this._activeIndex = c, this._hasInitializedActive = !0;
    } else this._activeIndex >= a.length && (this._activeIndex = Math.max(0, a.length - 1));
    this._teardownAutoplay(), this._setupAutoplay();
  }
  updated() {
    const t = this._slides().length;
    this._prevDiff.clear();
    for (let a = 0; a < t; a++) this._prevDiff.set(a, this._wrappedDiff(a));
    this._displayMode() === "bag" && this._measureBagImages();
  }
  /**
   * Bag mode: read the h/w ratio of the loaded images and expose them as
   * CSS vars, so the stage shrinks to the real artwork instead of holding
   * worst-case headroom (which showed as a big gap under the caption).
   * Uses the tallest product so the stage doesn't bounce while navigating.
   */
  _measureBagImages() {
    const t = this.shadowRoot;
    if (!t) return;
    const a = (l) => l.naturalWidth > 0 ? l.naturalHeight / l.naturalWidth : (l.dataset.measureHooked || (l.dataset.measureHooked = "1", l.addEventListener("load", () => this.requestUpdate(), {
      once: !0
    })), 0);
    let e = 0;
    for (const l of t.querySelectorAll(
      ".col-bag-slide img"
    ))
      e = Math.max(e, a(l));
    const i = t.querySelector(".col-bag-img"), o = i ? a(i) : 0, c = (l) => Math.round(l * 100) / 100, p = e > 0 ? c(e) : null, d = o > 0 ? c(o) : null;
    p !== this._bagProdRatio && (this._bagProdRatio = p), d !== this._bagImgRatio && (this._bagImgRatio = d);
  }
  // ------------------------------------------------------------
  // Autoplay
  // ------------------------------------------------------------
  _setupAutoplay() {
    const t = this.config || {};
    if (!t.autoplay || !this._inView || this._slides().length < 2) return;
    const a = Math.max(1, this._num(t.autoplay_delay, 5));
    this._autoplayTimer = window.setInterval(() => {
      this._hoverPaused || this._swipeActive || this._goNext();
    }, a * 1e3);
  }
  _teardownAutoplay() {
    this._autoplayTimer && (clearInterval(this._autoplayTimer), this._autoplayTimer = null);
  }
  // ------------------------------------------------------------
  // Carousel navigation
  // ------------------------------------------------------------
  _changeActive(t) {
    t !== this._activeIndex && (this._bagLeavingIndex = this._activeIndex, this._bagNavigated = !0, this._activeIndex = t, this._flashCaption());
  }
  /** Brief fade-out → text swap → fade-in on the caption block. */
  _flashCaption() {
    this._captionTimer && (clearTimeout(this._captionTimer), this._captionTimer = null), this._captionState = "out", this._captionTimer = window.setTimeout(() => {
      this._captionState = "in", this._captionTimer = null;
    }, 220);
  }
  /** Signed slot offset from the active slide, wrapped to the shorter way
      around the ring when looping (so slide 0 can sit just left of the last). */
  _wrappedDiff(t) {
    var i;
    const a = this._slides().length;
    if (a === 0) return 0;
    let e = t - this._activeIndex;
    return ((i = this.config) == null ? void 0 : i.loop) !== !1 && (e > a / 2 && (e -= a), e < -a / 2 && (e += a)), e;
  }
  _slidePos(t) {
    if (this._slides().length === 0) return "hidden";
    const a = this._wrappedDiff(t);
    return a === 0 ? "active" : a === -1 ? "left" : a === 1 ? "right" : a === -2 ? "far-left" : a === 2 ? "far-right" : "hidden";
  }
  _isPrevDisabled() {
    var t;
    return ((t = this.config) == null ? void 0 : t.loop) !== !1 ? !1 : this._activeIndex === 0 || this._slides().length <= 1;
  }
  _isNextDisabled() {
    var t;
    return ((t = this.config) == null ? void 0 : t.loop) !== !1 ? !1 : this._activeIndex === this._slides().length - 1 || this._slides().length <= 1;
  }
  // ------------------------------------------------------------
  // Render helpers
  // ------------------------------------------------------------
  _slideImage(t) {
    const a = t.image || void 0, e = t.image_opened || void 0, i = this.localizedString(t.title) || "";
    return { closed: a, opened: e, alt: i };
  }
  // ------------------------------------------------------------
  // Render
  // ------------------------------------------------------------
  render() {
    const t = this.config || {}, a = this._slides(), e = this._displayMode(), i = this._pickValue(t.use_case, "home"), o = this._pickValue(
      t.slide_animation,
      "simple"
    ), c = this._pickValue(t.aspect_ratio, "1/1"), p = this._pickValue(
      t.desktop_layout,
      "coverflow"
    ), d = this.localizedString(
      t.section_title ?? t.title
    ), l = t.show_caption !== !1, w = i === "home" && t.show_cta !== !1, y = this.localizedString(t.default_cta_label) || "تسوّق الآن", $ = t.show_nav_buttons !== !1, _ = !!t.show_pagination, g = t.enable_entrance_anim !== !1, k = this._num(t.card_radius, 20), x = [
      t.bg_color ? `--col-bg: ${t.bg_color}` : "",
      t.title_color ? `--col-title-color: ${t.title_color}` : "",
      t.caption_title_color ? `--col-caption-title-color: ${t.caption_title_color}` : "",
      t.caption_text_color ? `--col-caption-text-color: ${t.caption_text_color}` : "",
      `--col-card-radius: ${k}px`,
      t.cta_bg ? `--col-cta-bg: ${t.cta_bg}` : "",
      t.cta_color ? `--col-cta-color: ${t.cta_color}` : "",
      t.nav_bg ? `--col-nav-bg: ${t.nav_bg}` : "",
      t.nav_icon_color ? `--col-nav-icon: ${t.nav_icon_color}` : "",
      t.dot_color ? `--col-dot-color: ${t.dot_color}` : "",
      t.bag_circle_color ? `--bag-circle-color: ${t.bag_circle_color}` : "",
      `--col-aspect: ${c}`,
      ...J(t, (I, u) => this._pickValue(I, u))
    ].filter(Boolean).join("; ");
    if (a.length === 0)
      return s`
        <section class="col-empty" style=${x}>
          <p>أضف صورة واحدة على الأقل لكل شريحة للبدء.</p>
        </section>
      `;
    const v = a.length === 1, D = "m9 6 6 6-6 6", Z = "M5 12h14M13 6l6 6-6 6", m = a[this._activeIndex], S = m ? this.localizedString(m.title) : "", z = m ? this.localizedString(m.description) : "", A = m ? this._resolveLink(m) : "", C = m && this.localizedString(m.cta_label) || y, X = !!(l && (S || z));
    return e === "bag" ? this._renderBag(t, a, {
      hostStyle: x,
      sectionTitle: d,
      enableAnim: g,
      showNav: $,
      showDots: _,
      hasCaption: X,
      activeTitle: S,
      activeDesc: z,
      showCta: w,
      activeCtaHref: A,
      activeCtaLabel: C
    }) : s`
      <section
        class="col-section"
        style=${x}
        data-layout=${p}
        data-anim=${o}
        data-enter=${g ? this._animState : "in"}
        data-use-case=${i}
        @mouseenter=${this._onHoverIn}
        @mouseleave=${this._onHoverOut}
      >
        ${d ? s`
              <div
                class="col-header"
                data-anim=${g ? this._animState : "in"}
              >
                <h2 class="col-title">${d}</h2>
              </div>
            ` : r}

        <div
          class="col-stage"
          @pointerdown=${this._onPointerDown}
          @pointermove=${this._onPointerMove}
          @pointerup=${this._onPointerUp}
          @pointercancel=${this._onPointerUp}
        >
          <div class="col-track">
            ${a.map((I, u) => {
      const j = this._wrappedDiff(u), H = this._slidePos(u), R = this._prevDiff.get(u), V = R !== void 0 && Math.abs(j - R) > a.length / 2, { closed: B, opened: M, alt: L } = this._slideImage(I), O = !M || o !== "reveal";
      return s`
                <div
                  class="col-slide"
                  data-pos=${H}
                  data-index=${u}
                  data-instant=${V ? "" : r}
                  @click=${this._onSlideClick}
                >
                  <div
                    class="col-card ${O ? "col-card--no-opened" : ""}"
                  >
                    ${B ? s`<img
                          class="col-img-closed"
                          src=${B}
                          alt=${L}
                          loading="lazy"
                          draggable="false"
                        />` : r}
                    ${o === "reveal" && M ? s`<img
                          class="col-img-opened"
                          src=${M}
                          alt=${L}
                          loading="lazy"
                          draggable="false"
                        />` : r}
                  </div>
                </div>
              `;
    })}
          </div>

          ${!v && $ ? s`
                <button
                  class="col-nav col-nav-prev"
                  type="button"
                  @click=${this._goPrev}
                  ?disabled=${this._isPrevDisabled()}
                  aria-label="Previous"
                >
                  <svg viewBox="0 0 24 24">
                    <path d=${D} />
                  </svg>
                </button>
                <button
                  class="col-nav col-nav-next"
                  type="button"
                  @click=${this._goNext}
                  ?disabled=${this._isNextDisabled()}
                  aria-label="Next"
                >
                  <svg viewBox="0 0 24 24">
                    <path d=${D} />
                  </svg>
                </button>
              ` : r}
        </div>

        ${X ? s`
              <div class="col-caption" data-state=${this._captionState}>
                ${S ? s`<h3 class="col-caption__title">${S}</h3>` : r}
                ${z ? s`<p class="col-caption__desc">${z}</p>` : r}
              </div>
            ` : r}
        ${w && A ? s`
              <div class="col-cta-wrap">
                <a
                  class="col-cta"
                  href=${A}
                  aria-label=${C}
                >
                  <span>${C}</span>
                  <svg viewBox="0 0 24 24">
                    <path d=${Z} />
                  </svg>
                </a>
              </div>
            ` : r}

        ${!v && _ ? s`
              <div class="col-dots" role="tablist">
                ${a.map(
      (I, u) => s`
                    <button
                      class="col-dot"
                      type="button"
                      aria-current=${this._activeIndex === u ? "true" : "false"}
                      aria-label=${`Slide ${u + 1}`}
                      @click=${() => this._goTo(u)}
                    ></button>
                  `
    )}
              </div>
            ` : r}
      </section>
    `;
  }
  /**
   * Bag mode (وضع الشنطة) — vertical stage: half-dome + fog backdrop, the
   * merchant's bag image in front, and one product visible at a time. On
   * navigation the new product rises out of the bag while the previous one
   * sinks back in. Products need transparent (PNG/WebP) images to sell it.
   */
  _renderBag(t, a, e) {
    const i = typeof t.bag_image == "string" ? t.bag_image.trim() : "", o = this._pickValue(t.bag_size, "medium"), c = this._pickValue(
      t.bag_product_size,
      "medium"
    ), p = this.localizedString(t.bag_bottom_title), d = a.length === 1, l = "M18 15l-6-6-6 6", w = "M6 9l6 6 6-6", y = "M5 12h14M13 6l6 6-6 6", $ = [
      e.hostStyle,
      this._bagProdRatio !== null ? `--bag-prod-ratio: ${this._bagProdRatio}` : "",
      this._bagImgRatio !== null ? `--bag-ratio: ${this._bagImgRatio}` : ""
    ].filter(Boolean).join("; ");
    return s`
      <section
        class="col-section col-section--bag"
        style=${$}
        data-bag-size=${o}
        data-product-size=${c}
        @mouseenter=${this._onHoverIn}
        @mouseleave=${this._onHoverOut}
      >
        ${e.sectionTitle ? s`
              <div
                class="col-header"
                data-anim=${e.enableAnim ? this._animState : "in"}
              >
                <h2 class="col-title">${e.sectionTitle}</h2>
              </div>
            ` : r}
        ${e.hasCaption ? s`
              <div class="col-caption" data-state=${this._captionState}>
                ${e.activeTitle ? s`<h3 class="col-caption__title">${e.activeTitle}</h3>` : r}
                ${e.activeDesc ? s`<p class="col-caption__desc">${e.activeDesc}</p>` : r}
              </div>
            ` : r}

        <div
          class="col-bag-stage"
          @pointerdown=${this._onPointerDown}
          @pointermove=${this._onPointerMove}
          @pointerup=${this._onPointerUp}
          @pointercancel=${this._onPointerUp}
        >
          <div class="col-bag-circle" aria-hidden="true"></div>
          <div class="col-bag-fog" aria-hidden="true"></div>

          <div class="col-bag-layer">
            ${a.map((_, g) => {
      const { closed: k, alt: x } = this._slideImage(_);
      let v = "hidden";
      return g === this._activeIndex ? v = this._bagNavigated ? "rising" : "active" : g === this._bagLeavingIndex && (v = "sinking"), s`
                <div class="col-bag-slide" data-state=${v}>
                  ${k ? s`<img
                        src=${k}
                        alt=${x}
                        loading="lazy"
                        draggable="false"
                      />` : r}
                </div>
              `;
    })}
          </div>

          ${i ? s`<img
                class="col-bag-img"
                src=${i}
                alt=""
                aria-hidden="true"
                draggable="false"
              />` : r}
          ${!d && e.showNav ? s`
                <button
                  class="col-bag-nav col-bag-nav--up"
                  type="button"
                  @click=${this._goNext}
                  ?disabled=${this._isNextDisabled()}
                  aria-label="Next"
                >
                  <svg viewBox="0 0 24 24"><path d=${l} /></svg>
                </button>
                <button
                  class="col-bag-nav col-bag-nav--down"
                  type="button"
                  @click=${this._goPrev}
                  ?disabled=${this._isPrevDisabled()}
                  aria-label="Previous"
                >
                  <svg viewBox="0 0 24 24"><path d=${w} /></svg>
                </button>
              ` : r}
        </div>

        ${p ? s`<div class="col-bag-bottom">${p}</div>` : r}
        ${e.showCta && e.activeCtaHref ? s`
              <div class="col-cta-wrap">
                <a
                  class="col-cta"
                  href=${e.activeCtaHref}
                  aria-label=${e.activeCtaLabel}
                >
                  <span>${e.activeCtaLabel}</span>
                  <svg viewBox="0 0 24 24">
                    <path d=${y} />
                  </svg>
                </a>
              </div>
            ` : r}
        ${!d && e.showDots ? s`
              <div class="col-dots" role="tablist">
                ${a.map(
      (_, g) => s`
                    <button
                      class="col-dot"
                      type="button"
                      aria-current=${this._activeIndex === g ? "true" : "false"}
                      aria-label=${`Slide ${g + 1}`}
                      @click=${() => this._goTo(g)}
                    ></button>
                  `
    )}
              </div>
            ` : r}
      </section>
    `;
  }
};
N.styles = Q;
let h = N;
b([
  U({ type: Object })
], h.prototype, "config");
b([
  f()
], h.prototype, "_activeIndex");
b([
  f()
], h.prototype, "_animState");
b([
  f()
], h.prototype, "_captionState");
b([
  f()
], h.prototype, "_bagLeavingIndex");
b([
  f()
], h.prototype, "_bagNavigated");
b([
  f()
], h.prototype, "_bagProdRatio");
b([
  f()
], h.prototype, "_bagImgRatio");
typeof h < "u" && h.registerSallaComponent("salla-collection");
export {
  h as default
};
