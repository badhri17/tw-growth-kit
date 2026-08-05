import { LitElement as M, css as N, html as s, nothing as l } from "lit";
import { property as I, state as S } from "lit/decorators.js";
function E(o, e) {
  if (typeof o == "string") return o;
  if (!o || typeof o != "object") return "";
  const i = o[e] || o.ar || o.en || "";
  return typeof i == "string" ? i.trim() : "";
}
function z(o) {
  return o.replace(/[٠-٩]/g, (e) => String(e.charCodeAt(0) - 1632)).replace(/[۰-۹]/g, (e) => String(e.charCodeAt(0) - 1776));
}
class D extends M {
  /**
   * Twilight transform injects `Component.registerSallaComponent(...)`.
   * Statics inherit, so `this` is the concrete component. The polling
   * fallback handles preview contexts where `Salla` loads after the
   * component file executes.
   */
  static registerSallaComponent(e) {
    const i = String(e || "").trim(), t = i.toLowerCase().replace(/[^a-z0-9._-]/g, "-"), a = t.includes("-") ? t : `salla-${t || "component"}`, n = () => `${a}-${Math.random().toString(36).substring(2, 8)}`, r = () => {
      var c;
      const p = (c = window.Salla) == null ? void 0 : c.bundles;
      return p && typeof p.registerComponent == "function" ? (p.registerComponent(i, {
        component: this,
        dynamicTagName: n()
      }), !0) : !1;
    };
    if (r()) return;
    const d = window.setInterval(() => {
      r() && window.clearInterval(d);
    }, 100);
    window.setTimeout(() => window.clearInterval(d), 5e3);
  }
  /** Resolved document language. */
  _lang() {
    return (document.documentElement.lang || "ar").toLowerCase().startsWith("en") ? "en" : "ar";
  }
  /** Pull the store-language string out of a Salla multilanguage value. */
  localizedString(e) {
    return E(e, this._lang());
  }
  /** Dropdown-list values from settings may come as [{ label, value }]. */
  _pickValue(e, i) {
    if (typeof e == "string" && e) return e;
    if (Array.isArray(e) && e.length > 0) {
      const t = e[0];
      if (t && typeof t.value == "string" && t.value)
        return t.value;
    }
    return i;
  }
  /** See module-level toLatinDigits; exposed for subclasses. */
  _toLatinDigits(e) {
    return z(e);
  }
  /** Coerce a config number that may arrive as a string (Arabic-Indic
      digits included) or as a [{ value }] dropdown selection. */
  _num(e, i) {
    if (typeof e == "number" && !Number.isNaN(e)) return e;
    if (typeof e == "string" && e.trim() !== "") {
      const t = Number(z(e.trim()));
      if (!Number.isNaN(t)) return t;
    }
    if (Array.isArray(e) && e.length > 0) {
      const t = e[0];
      if ((t == null ? void 0 : t.value) !== void 0) return this._num(t.value, i);
    }
    return i;
  }
}
const P = N`
  :host {
    display: block;
    font-family: inherit;
    direction: inherit;
    /* Size containment: the host takes its width from its container, never from
       its contents — so the image/card row can't force an ancestor grid item
       (e.g. Salla's component card) wider than the viewport. Height still grows
       with content. See the grid-blowout note in the bundle. */
    container-type: inline-size;
    min-width: 0;
    max-width: 100%;

    /* --- Light palette (default) --- */
    --ip-bg: #f5f5f5;
    --ip-title: #14181f;
    --ip-subtitle: #5b6573;
    --ip-accent: #d95e16;
    --ip-card-bg: #ffffff;
    --ip-card-border: rgba(20, 24, 31, 0.08);
    --ip-card-shadow: 0 18px 50px rgba(20, 24, 31, 0.08);
    --ip-card-title: #14181f;
    --ip-card-text: #5b6573;
    --ip-marker-bg: rgba(255, 255, 255, 0.92);
    --ip-marker-text: var(--ip-accent);
    --ip-stage-shadow: none;

    --ip-pad-x: clamp(1rem, 4vw, 2.5rem);
    --ip-radius: 20px;
    --ip-detail-aspect: 4 / 3;
    --ip-ease: cubic-bezier(0.22, 1, 0.36, 1);
  }

  :host([hidden]) {
    display: none;
  }

  *,
  *::before,
  *::after {
    box-sizing: border-box;
  }

  /* ============================================================
     THEME: dark
     ============================================================ */
  .ip[data-theme="dark"] {
    --ip-bg: #0b0b0c;
    --ip-title: #f5f5f5;
    --ip-subtitle: #a0a6ad;
    --ip-card-bg: #161618;
    --ip-card-border: rgba(255, 255, 255, 0.08);
    --ip-card-shadow: 0 20px 60px rgba(0, 0, 0, 0.45);
    --ip-card-title: #f5f5f5;
    --ip-card-text: #a0a6ad;
    --ip-marker-bg: rgba(10, 10, 12, 0.72);
    --ip-marker-text: #ffffff;
    --ip-stage-shadow: 0 24px 70px rgba(0, 0, 0, 0.5);
  }

  /* ============================================================
     SECTION + HEADER
     ============================================================ */
  .ip {
    width: 100%;
    max-width: 100%;
    min-width: 0;
    background: var(--ip-bg);
    color: var(--ip-title);
    padding: clamp(2.25rem, 6vw, 3.75rem) var(--ip-pad-x);
    overflow: hidden;
  }

  .ip-header {
    max-width: 720px;
    margin: 0 auto clamp(1.75rem, 4vw, 2.75rem);
    text-align: center;
  }

  .ip-eyebrow {
    margin: 0 0 0.5rem;
    color: var(--ip-accent);
    font-size: 0.78rem;
    font-weight: 700;
    letter-spacing: 1.5px;
    text-transform: uppercase;
  }

  .ip-title {
    position: relative;
    display: inline-block;
    margin: 0;
    color: var(--ip-title);
    font-size: clamp(1.5rem, 4.5vw, 2.4rem);
    font-weight: 800;
    line-height: 1.2;
    letter-spacing: -0.01em;
  }
  .ip-title::after {
    content: "";
    position: absolute;
    bottom: -10px;
    left: 50%;
    transform: translateX(-50%);
    width: 76px;
    height: 3px;
    border-radius: 2px;
    background: linear-gradient(
      90deg,
      transparent,
      var(--ip-accent),
      transparent
    );
  }

  .ip-subtitle {
    margin: 1.35rem auto 0;
    max-width: 540px;
    color: var(--ip-subtitle);
    font-size: clamp(0.95rem, 2vw, 1.08rem);
    line-height: 1.7;
  }

  .ip-empty {
    margin: 0;
    text-align: center;
    color: var(--ip-subtitle);
    padding: 3rem 1rem;
    font-size: 0.98rem;
  }

  /* ============================================================
     CONTENT LAYOUT (mobile: stacked → desktop: row)
     ============================================================ */
  .ip-content {
    display: flex;
    flex-direction: column;
    /* Mobile: zero base gap — the card is then pulled up under the product (see
       .ip-details margin-top) to create the overlap. A real gap is restored on
       desktop where the two sit side by side. */
    gap: 0;
    max-width: 1280px;
    margin-inline: auto;
    align-items: stretch;
  }

  @media (min-width: 768px) {
    .ip-content {
      flex-direction: row;
      align-items: flex-start;
      gap: clamp(2rem, 4vw, 3.5rem);
    }
    .ip-content[data-reverse="on"] {
      flex-direction: row-reverse;
    }
  }

  /* ============================================================
     STAGE (image + hotspots)
     ============================================================ */
  .ip-stage-wrap {
    width: 100%;
    display: flex;
    justify-content: center;
    /* Mobile: the product overlaps the top of the card below it, so it must
       paint ON TOP of the card (which comes later in the DOM). */
    position: relative;
    z-index: 2;
  }

  @media (min-width: 768px) {
    .ip-stage-wrap {
      flex: 1.25;
      min-width: 0;
    }
  }

  .ip-stage {
    position: relative;
    width: 100%;
    max-width: 820px;
    border-radius: var(--ip-radius);
    /* The marker diameter; bumped on desktop + by the size tier below. */
    --ip-hs: 34px;
    box-shadow: var(--ip-stage-shadow);
    line-height: 0; /* kill descender gap under the inline image */
  }

  .ip[data-hs="small"] .ip-stage {
    --ip-hs: 28px;
  }
  .ip[data-hs="large"] .ip-stage {
    --ip-hs: 40px;
  }
  @media (min-width: 768px) {
    .ip-stage {
      --ip-hs: 40px;
    }
    .ip[data-hs="small"] .ip-stage {
      --ip-hs: 34px;
    }
    .ip[data-hs="large"] .ip-stage {
      --ip-hs: 48px;
    }
  }

  .ip-img {
    display: block;
    width: 100%;
    height: auto;
    border-radius: var(--ip-radius);
    user-select: none;
    -webkit-user-drag: none;
  }

  .ip-stage-empty {
    aspect-ratio: 4 / 3;
    border: 2px dashed var(--ip-card-border);
    border-radius: var(--ip-radius);
    display: flex;
    align-items: center;
    justify-content: center;
    color: var(--ip-subtitle);
    font-size: 0.9rem;
    line-height: 1.5;
    text-align: center;
    padding: 1rem;
  }

  /* --- Hotspot marker --- */
  .ip-hotspot {
    position: absolute;
    /* left/top set inline; physical props -> independent of RTL/LTR. */
    transform: translate(-50%, -50%);
    width: var(--ip-hs);
    height: var(--ip-hs);
    margin: 0;
    padding: 0;
    border-radius: 50%;
    border: 2px solid var(--ip-accent);
    background: var(--ip-marker-bg);
    color: var(--ip-marker-text);
    font: inherit;
    font-size: calc(var(--ip-hs) * 0.42);
    font-weight: 700;
    font-variant-numeric: tabular-nums;
    line-height: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    z-index: 2;
    -webkit-backdrop-filter: blur(2px);
    backdrop-filter: blur(2px);
    transition: transform 0.25s var(--ip-ease), background 0.25s var(--ip-ease),
      color 0.25s var(--ip-ease), box-shadow 0.25s var(--ip-ease);
  }
  .ip-hotspot:hover {
    background: var(--ip-accent);
    color: #fff;
    transform: translate(-50%, -50%) scale(1.12);
    z-index: 3;
  }
  .ip-hotspot:focus-visible {
    outline: none;
    box-shadow: 0 0 0 4px color-mix(in srgb, var(--ip-accent) 35%, transparent);
  }
  .ip-hotspot[data-active="true"] {
    background: var(--ip-accent);
    color: #fff;
    box-shadow: 0 0 0 4px color-mix(in srgb, var(--ip-accent) 22%, transparent),
      0 8px 22px color-mix(in srgb, var(--ip-accent) 45%, transparent);
    z-index: 4;
  }

  /* Pulsing ring around idle markers (opt-in). */
  .ip-hotspot::before {
    content: "";
    position: absolute;
    inset: -2px;
    border-radius: 50%;
    border: 2px solid var(--ip-accent);
    opacity: 0;
    pointer-events: none;
  }
  .ip[data-pulse="on"] .ip-hotspot:not([data-active="true"])::before {
    animation: ip-pulse 2.4s var(--ip-ease) infinite;
  }
  /* Stop compositing the infinite pulse once the section scrolls away. Must
     out-specify (and follow) the shorthand above — the animation shorthand
     resets animation-play-state to running. */
  :host([out-of-view]) .ip[data-pulse="on"] .ip-hotspot::before {
    animation-play-state: paused;
  }

  @keyframes ip-pulse {
    0% {
      transform: scale(1);
      opacity: 0.7;
    }
    70% {
      opacity: 0;
    }
    100% {
      transform: scale(1.9);
      opacity: 0;
    }
  }

  /* ============================================================
     DETAIL CARD
     ============================================================ */
  .ip-details {
    /* Size-tier-driven: padding + desktop max-width. "medium" = base. */
    --ip-card-pad: clamp(1.25rem, 4vw, 1.75rem);
    /* Mobile only: the product image overlaps the top of the card. The card is
       pulled up under the product (margin-top), then its content is padded down
       so it clears the overlapping image. Both neutralised on desktop, where the
       card sits beside the image. */
    --ip-overlap: clamp(2rem, 9vw, 3.25rem);
    --ip-card-pad-top: calc(var(--ip-card-pad) + var(--ip-overlap));
    --ip-card-max: 430px;
    /* Feature-image width inside the card; "large" (default) is inset, not 100%. */
    --ip-media-width: 88%;
    width: 100%;
    /* Below the product, which overlaps it from above. */
    position: relative;
    z-index: 1;
    background: var(--ip-card-bg);
    border: 1px solid var(--ip-card-border);
    border-radius: var(--ip-radius);
    box-shadow: var(--ip-card-shadow);
    margin-top: calc(-1 * var(--ip-overlap));
    padding: var(--ip-card-pad);
    padding-top: var(--ip-card-pad-top);
  }

  /* Card size tiers (mobile values; desktop refined below). */
  .ip[data-card-size="small"] .ip-details {
    --ip-card-pad: clamp(0.85rem, 3vw, 1.1rem);
    --ip-card-max: 340px;
    /* Clip the full-bleed image header to the card's rounded corners. */
    overflow: hidden;
  }
  .ip[data-card-size="large"] .ip-details {
    --ip-card-pad: clamp(1.5rem, 5vw, 2.25rem);
    --ip-card-max: 540px;
  }

  /* Feature-image width tiers (apply on every screen). */
  .ip[data-media-width="medium"] .ip-details {
    --ip-media-width: 70%;
  }
  .ip[data-media-width="small"] .ip-details {
    --ip-media-width: 50%;
  }

  @media (min-width: 768px) {
    .ip-details {
      --ip-card-pad: clamp(1.5rem, 2.4vw, 2.25rem);
      flex: 0.85;
      max-width: var(--ip-card-max);
      position: sticky;
      top: 32px;
      align-self: flex-start;
      /* No overlap on desktop: card sits beside the image with uniform padding. */
      margin-top: 0;
      padding: var(--ip-card-pad);
    }
    .ip[data-card-size="small"] .ip-details {
      --ip-card-pad: clamp(1rem, 1.6vw, 1.35rem);
    }
    .ip[data-card-size="large"] .ip-details {
      --ip-card-pad: clamp(1.75rem, 2.8vw, 2.6rem);
    }
  }

  .ip-detail-media {
    width: 100%;
    /* Capped by the chosen feature-image width; a narrowed image is always
       horizontally centered inside the card, regardless of content alignment. */
    max-width: var(--ip-media-width);
    margin-inline: auto;
    aspect-ratio: var(--ip-detail-aspect);
    margin-bottom: 1.25rem;
    border-radius: calc(var(--ip-radius) - 6px);
    overflow: hidden;
    background: color-mix(in srgb, var(--ip-card-text) 8%, transparent);
  }
  .ip-detail-media[data-aspect="natural"] {
    aspect-ratio: auto;
  }
  .ip-detail-media[data-aspect="natural"] .ip-detail-img {
    height: auto;
  }
  .ip-detail-media[data-empty="true"] {
    display: none;
  }

  .ip-detail-img {
    display: block;
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  /* Small card: the feature image becomes a full-bleed header that sits flush on
     top of the card (negative margins cancel the card padding) — no gap. Only
     when the image is at full width; a narrowed image stays contained + aligned. */
  .ip[data-card-size="small"][data-media-width="large"] .ip-detail-media {
    width: auto;
    max-width: none;
    /* Cancel only the normal padding (not the overlap) so the full-bleed header
       begins just below the overlapping product, edge-to-edge. */
    margin-top: calc(-1 * var(--ip-card-pad));
    margin-inline: calc(-1 * var(--ip-card-pad));
    margin-bottom: var(--ip-card-pad);
    border-radius: 0;
  }

  /* ------------------------------------------------------------
     Content alignment (title, description, narrowed image, pills)
     ------------------------------------------------------------ */
  .ip[data-content-align="center"] .ip-details {
    text-align: center;
  }
  .ip[data-content-align="end"] .ip-details {
    text-align: end;
  }
  /* The feature image stays centered for every alignment; only the text and
     nav pills follow [data-content-align]. */
  .ip[data-content-align="center"] .ip-pills {
    justify-content: center;
  }
  .ip[data-content-align="end"] .ip-pills {
    justify-content: flex-end;
  }

  .ip-detail-title {
    margin: 0 0 0.7rem;
    color: var(--ip-card-title);
    font-size: clamp(1.15rem, 2.6vw, 1.45rem);
    font-weight: 700;
    line-height: 1.4;
  }

  .ip-detail-desc {
    margin: 0;
    color: var(--ip-card-text);
    font-size: clamp(0.95rem, 1.8vw, 1.02rem);
    line-height: 1.85;
  }

  /* Type scale per card size. */
  .ip[data-card-size="small"] .ip-detail-title {
    font-size: clamp(1.05rem, 2.2vw, 1.22rem);
    margin-bottom: 0.5rem;
  }
  .ip[data-card-size="small"] .ip-detail-desc {
    font-size: clamp(0.9rem, 1.6vw, 0.96rem);
    line-height: 1.7;
  }
  .ip[data-card-size="large"] .ip-detail-title {
    font-size: clamp(1.3rem, 3vw, 1.7rem);
  }
  .ip[data-card-size="large"] .ip-detail-desc {
    font-size: clamp(1rem, 2vw, 1.12rem);
  }

  /* Cross-fade replayed imperatively on selection change. */
  .ip-detail-img.is-enter,
  .ip-detail-title.is-enter,
  .ip-detail-desc.is-enter {
    animation: ip-detail-in 0.4s var(--ip-ease) both;
  }
  @keyframes ip-detail-in {
    from {
      opacity: 0;
      transform: translateY(8px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  /* --- Nav pills --- */
  .ip-pills {
    display: flex;
    flex-wrap: wrap;
    gap: 0.55rem;
    margin-top: 1.5rem;
  }
  .ip-pill {
    width: 38px;
    height: 38px;
    margin: 0;
    padding: 0;
    border-radius: 50%;
    border: 2px solid color-mix(in srgb, var(--ip-accent) 32%, transparent);
    background: transparent;
    color: var(--ip-card-text);
    font: inherit;
    font-size: 0.85rem;
    font-weight: 700;
    font-variant-numeric: tabular-nums;
    line-height: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    transition: background 0.2s var(--ip-ease), color 0.2s var(--ip-ease),
      border-color 0.2s var(--ip-ease);
  }
  .ip-pill:hover {
    border-color: var(--ip-accent);
    color: var(--ip-accent);
  }
  .ip-pill:focus-visible {
    outline: none;
    box-shadow: 0 0 0 4px color-mix(in srgb, var(--ip-accent) 32%, transparent);
  }
  .ip-pill[data-active="true"] {
    background: var(--ip-accent);
    border-color: var(--ip-accent);
    color: #fff;
  }

  .ip[data-card-size="small"] .ip-pills {
    gap: 0.45rem;
    margin-top: 1.1rem;
  }
  .ip[data-card-size="small"] .ip-pill {
    width: 32px;
    height: 32px;
    font-size: 0.8rem;
  }

  /* ============================================================
     ENTRANCE ANIMATION
     ============================================================ */
  .ip[data-enter] .ip-header,
  .ip[data-enter] .ip-stage-wrap,
  .ip[data-enter] .ip-details {
    transition: opacity 0.7s var(--ip-ease), transform 0.7s var(--ip-ease);
  }
  .ip[data-enter="ready"] .ip-header,
  .ip[data-enter="ready"] .ip-stage-wrap,
  .ip[data-enter="ready"] .ip-details {
    opacity: 0;
    transform: translateY(26px);
  }
  .ip[data-enter="in"] .ip-header,
  .ip[data-enter="in"] .ip-stage-wrap,
  .ip[data-enter="in"] .ip-details {
    opacity: 1;
    transform: translateY(0);
  }
  .ip[data-enter="in"] .ip-stage-wrap {
    transition-delay: 0.08s;
  }
  .ip[data-enter="in"] .ip-details {
    transition-delay: 0.16s;
  }

  /* Markers fade/pop in after the stage settles. */
  .ip[data-enter] .ip-hotspot {
    opacity: 0;
    transform: translate(-50%, -50%) scale(0.4);
  }
  .ip[data-enter="in"] .ip-hotspot {
    animation: ip-hotspot-in 0.45s var(--ip-ease) forwards;
    animation-delay: var(--ip-hs-delay, 0.4s);
  }
  @keyframes ip-hotspot-in {
    to {
      opacity: 1;
      transform: translate(-50%, -50%) scale(1);
    }
  }

  /* ============================================================
     REDUCED MOTION
     ============================================================ */
  @media (prefers-reduced-motion: reduce) {
    .ip[data-enter] .ip-header,
    .ip[data-enter] .ip-stage-wrap,
    .ip[data-enter] .ip-details,
    .ip[data-enter] .ip-hotspot {
      transition: none !important;
      animation: none !important;
      opacity: 1 !important;
      transform: none !important;
    }
    .ip[data-enter] .ip-hotspot {
      transform: translate(-50%, -50%) !important;
    }
    .ip-hotspot::before {
      animation: none !important;
    }
    .ip-detail-img.is-enter,
    .ip-detail-title.is-enter,
    .ip-detail-desc.is-enter {
      animation: none !important;
    }
  }
`;
var O = Object.defineProperty, x = (o, e, i, t) => {
  for (var a = void 0, n = o.length - 1, r; n >= 0; n--)
    (r = o[n]) && (a = r(e, i, a) || a);
  return a && O(e, i, a), a;
};
const _ = class _ extends D {
  constructor() {
    super(...arguments), this._active = 0, this._animState = "ready", this._autoplayTimer = null, this._interactionPaused = !1, this._lastRenderedActive = 0, this._io = null, this._pauseInteraction = () => {
      this._interactionPaused || (this._interactionPaused = !0, this._teardownAutoplay());
    }, this._resumeInteraction = () => {
      this._interactionPaused && (this._interactionPaused = !1, this._setupAutoplay());
    };
  }
  // ------------------------------------------------------------
  // Value helpers
  // ------------------------------------------------------------
  _clampPct(e, i) {
    const t = this._num(e, i);
    return Math.max(0, Math.min(100, t));
  }
  // ------------------------------------------------------------
  // Hotspots
  // ------------------------------------------------------------
  /** Hotspots that carry renderable feature content (image/title/description). */
  _hotspots() {
    var i;
    const e = (i = this.config) == null ? void 0 : i.hotspots;
    return Array.isArray(e) ? e.filter(
      (t) => !!t && typeof t == "object" && (!!t.image || !!this.localizedString(t.title) || !!this.localizedString(t.description))
    ) : [];
  }
  /** Clamp the active index against the current hotspot count. */
  _activeIndex(e) {
    return e <= 0 ? 0 : Math.max(0, Math.min(e - 1, this._active));
  }
  /** Resolve a marker position, falling back to a tidy staggered layout. */
  _pos(e, i) {
    const t = e.x !== void 0 && e.x !== null && e.x !== "", a = e.y !== void 0 && e.y !== null && e.y !== "", n = 20 + i % 4 * 20, r = 25 + Math.floor(i / 4) * 25;
    return {
      x: this._clampPct(e.x, t ? 50 : n),
      y: this._clampPct(e.y, a ? 50 : r)
    };
  }
  _setActive(e) {
    const i = this._hotspots().length;
    if (i === 0) return;
    const t = Math.max(0, Math.min(i - 1, e));
    t !== this._active && (this._active = t);
  }
  // ------------------------------------------------------------
  // Lifecycle
  // ------------------------------------------------------------
  connectedCallback() {
    var t;
    super.connectedCallback();
    const e = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches, i = ((t = this.config) == null ? void 0 : t.enable_entrance_anim) === !1;
    e || i ? this._animState = "in" : requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        this._animState = "in";
      });
    }), "IntersectionObserver" in window && (this._io = new IntersectionObserver(
      (a) => {
        const n = a[0];
        n && this.toggleAttribute("out-of-view", !n.isIntersecting);
      },
      { threshold: 0 }
    ), this._io.observe(this));
  }
  disconnectedCallback() {
    var e;
    super.disconnectedCallback(), this._teardownAutoplay(), (e = this._io) == null || e.disconnect(), this._io = null;
  }
  updated(e) {
    const i = this._activeIndex(this._hotspots().length);
    i !== this._lastRenderedActive && (this._lastRenderedActive = i, this._replayDetailFade()), this._teardownAutoplay(), this._setupAutoplay();
  }
  _replayDetailFade() {
    const e = [".ip-detail-img", ".ip-detail-title", ".ip-detail-desc"];
    for (const i of e) {
      const t = this.renderRoot.querySelector(i);
      t && (t.classList.remove("is-enter"), t.offsetWidth, t.classList.add("is-enter"));
    }
  }
  // ------------------------------------------------------------
  // Autoplay (auto-advance through hotspots)
  // ------------------------------------------------------------
  _setupAutoplay() {
    const e = this.config || {};
    if (!e.autoplay || this._interactionPaused || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const i = this._hotspots().length;
    if (i < 2) return;
    const t = Math.max(2, this._num(this._pickValue(e.autoplay_delay, "5"), 5)) * 1e3;
    this._autoplayTimer = window.setTimeout(() => {
      this._autoplayTimer = null;
      const a = (this._activeIndex(i) + 1) % i;
      this._active = a;
    }, t);
  }
  _teardownAutoplay() {
    this._autoplayTimer && (clearTimeout(this._autoplayTimer), this._autoplayTimer = null);
  }
  // ------------------------------------------------------------
  // Host style (CSS custom properties)
  // ------------------------------------------------------------
  _buildHostStyle(e, i) {
    const t = i === "natural" ? "4 / 3" : i.replace("/", " / ");
    return [
      e.bg_color ? `--ip-bg:${e.bg_color}` : "",
      e.title_color ? `--ip-title:${e.title_color}` : "",
      e.subtitle_color ? `--ip-subtitle:${e.subtitle_color}` : "",
      e.accent_color ? `--ip-accent:${e.accent_color}` : "",
      e.card_bg ? `--ip-card-bg:${e.card_bg}` : "",
      e.card_title_color ? `--ip-card-title:${e.card_title_color}` : "",
      e.card_text_color ? `--ip-card-text:${e.card_text_color}` : "",
      e.marker_bg ? `--ip-marker-bg:${e.marker_bg}` : "",
      `--ip-detail-aspect:${t}`
    ].filter(Boolean).join("; ");
  }
  // ------------------------------------------------------------
  // Render
  // ------------------------------------------------------------
  render() {
    const e = this.config || {}, i = this._lang() === "ar", t = this._pickValue(e.theme, "light"), a = this._pickValue(e.hotspot_size, "medium"), n = this._pickValue(
      e.detail_image_aspect,
      "4/3"
    ), r = this._pickValue(e.card_size, "medium"), d = this._pickValue(
      e.detail_media_width,
      "medium"
    ), p = this._pickValue(e.content_align, "start"), c = !!e.reverse_layout, g = e.enable_pulse !== !1, b = e.show_pills !== !1, A = e.enable_entrance_anim !== !1 ? this._animState : "in", $ = this._buildHostStyle(e, n), v = this.localizedString(e.eyebrow), f = this.localizedString(e.section_title), w = this.localizedString(e.section_subtitle), k = (e.product_image || "").trim(), u = this._hotspots(), y = this._activeIndex(u.length);
    if (!k && u.length === 0)
      return s`<section class="ip" data-theme=${t} style=${$}>
        <p class="ip-empty">
          ${i ? "أضف صورة المنتج ومؤشرًا واحدًا على الأقل لعرض هذا القسم." : "Add a product image and at least one hotspot to display this section."}
        </p>
      </section>`;
    const T = v || f || w ? s`<header class="ip-header">
            ${v ? s`<p class="ip-eyebrow">${v}</p>` : l}
            ${f ? s`<h2 class="ip-title">${f}</h2>` : l}
            ${w ? s`<p class="ip-subtitle">${w}</p>` : l}
          </header>` : l, C = u[y];
    return s`
      <section
        class="ip"
        data-theme=${t}
        data-hs=${a}
        data-card-size=${r}
        data-media-width=${d}
        data-content-align=${p}
        data-pulse=${g ? "on" : "off"}
        data-enter=${A}
        style=${$}
        aria-label=${f || (i ? "مميزات المنتج" : "Product features")}
        @pointerenter=${this._pauseInteraction}
        @pointerleave=${this._resumeInteraction}
        @focusin=${this._pauseInteraction}
        @focusout=${this._resumeInteraction}
      >
        ${T}
        <div class="ip-content" data-reverse=${c ? "on" : "off"}>
          ${this._renderStage(k, u, y, i)}
          ${u.length ? this._renderDetails(C, u, y, b, i) : l}
        </div>
      </section>
    `;
  }
  _renderStage(e, i, t, a) {
    return s`
      <div class="ip-stage-wrap">
        <div class="ip-stage">
          ${e ? s`<img
                class="ip-img"
                src=${e}
                alt=${a ? "صورة المنتج" : "Product image"}
                draggable="false"
              />` : s`<div class="ip-stage-empty">
                ${a ? "أضف صورة المنتج" : "Add a product image"}
              </div>`}
          ${e ? i.map((n, r) => {
      const { x: d, y: p } = this._pos(n, r), c = this.localizedString(n.title) || `${a ? "ميزة" : "Feature"} ${r + 1}`;
      return s`<button
                  type="button"
                  class="ip-hotspot"
                  data-active=${r === t ? "true" : "false"}
                  style=${`left:${d}%; top:${p}%; --ip-hs-delay:${(0.4 + r * 0.08).toFixed(2)}s`}
                  aria-pressed=${r === t ? "true" : "false"}
                  aria-label=${c}
                  @click=${() => this._setActive(r)}
                >
                  ${r + 1}
                </button>`;
    }) : l}
        </div>
      </div>
    `;
  }
  _renderDetails(e, i, t, a, n) {
    var g;
    const r = this._pickValue(
      (g = this.config) == null ? void 0 : g.detail_image_aspect,
      "4/3"
    ), d = (e == null ? void 0 : e.image) || "", p = this.localizedString(e == null ? void 0 : e.title), c = this.localizedString(
      e == null ? void 0 : e.description
    );
    return s`
      <aside class="ip-details" aria-live="polite">
        <div
          class="ip-detail-media"
          data-aspect=${r}
          data-empty=${d ? "false" : "true"}
        >
          ${d ? s`<img
                class="ip-detail-img is-enter"
                src=${d}
                alt=${p || (n ? "صورة الميزة" : "Feature image")}
                loading="lazy"
              />` : l}
        </div>
        ${p ? s`<h3 class="ip-detail-title is-enter">${p}</h3>` : l}
        ${c ? s`<p class="ip-detail-desc is-enter">${c}</p>` : l}
        ${a && i.length > 1 ? s`<div class="ip-pills">
              ${i.map(
      (b, h) => s`<button
                  type="button"
                  class="ip-pill"
                  data-active=${h === t ? "true" : "false"}
                  aria-pressed=${h === t ? "true" : "false"}
                  aria-label=${this.localizedString(b.title) || `${n ? "ميزة رقم" : "Feature"} ${h + 1}`}
                  @click=${() => this._setActive(h)}
                >
                  ${h + 1}
                </button>`
    )}
            </div>` : l}
      </aside>
    `;
  }
};
_.styles = P;
let m = _;
x([
  I({ type: Object })
], m.prototype, "config");
x([
  S()
], m.prototype, "_active");
x([
  S()
], m.prototype, "_animState");
typeof m < "u" && m.registerSallaComponent("salla-interactive-product");
export {
  m as default
};
