import { LitElement as j, css as B, nothing as m, html as c } from "lit";
import { property as D, state as w } from "lit/decorators.js";
import { ifDefined as E } from "lit/directives/if-defined.js";
function N(o, t) {
  if (typeof o == "string") return o;
  if (!o || typeof o != "object") return "";
  const e = o[t] || o.ar || o.en || "";
  return typeof e == "string" ? e.trim() : "";
}
function L(o) {
  return o.replace(/[٠-٩]/g, (t) => String(t.charCodeAt(0) - 1632)).replace(/[۰-۹]/g, (t) => String(t.charCodeAt(0) - 1776));
}
class U extends j {
  /**
   * Twilight transform injects `Component.registerSallaComponent(...)`.
   * Statics inherit, so `this` is the concrete component. The polling
   * fallback handles preview contexts where `Salla` loads after the
   * component file executes.
   */
  static registerSallaComponent(t) {
    const e = String(t || "").trim(), i = e.toLowerCase().replace(/[^a-z0-9._-]/g, "-"), a = i.includes("-") ? i : `salla-${i || "component"}`, r = () => `${a}-${Math.random().toString(36).substring(2, 8)}`, n = () => {
      var g;
      const s = (g = window.Salla) == null ? void 0 : g.bundles;
      return s && typeof s.registerComponent == "function" ? (s.registerComponent(e, {
        component: this,
        dynamicTagName: r()
      }), !0) : !1;
    };
    if (n()) return;
    const l = window.setInterval(() => {
      n() && window.clearInterval(l);
    }, 100);
    window.setTimeout(() => window.clearInterval(l), 5e3);
  }
  /** Resolved document language. */
  _lang() {
    return (document.documentElement.lang || "ar").toLowerCase().startsWith("en") ? "en" : "ar";
  }
  /** Pull the store-language string out of a Salla multilanguage value. */
  localizedString(t) {
    return N(t, this._lang());
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
    return L(t);
  }
  /** Coerce a config number that may arrive as a string (Arabic-Indic
      digits included) or as a [{ value }] dropdown selection. */
  _num(t, e) {
    if (typeof t == "number" && !Number.isNaN(t)) return t;
    if (typeof t == "string" && t.trim() !== "") {
      const i = Number(L(t.trim()));
      if (!Number.isNaN(i)) return i;
    }
    if (Array.isArray(t) && t.length > 0) {
      const i = t[0];
      if ((i == null ? void 0 : i.value) !== void 0) return this._num(i.value, e);
    }
    return e;
  }
}
const G = B`
  :host {
    /* Inherits from the theme so Arabic font, brand colours, and dir flow through. */
    display: block;
    font-family: inherit;
    direction: inherit;

    /* Tunable CSS custom properties — merchants/themes can override at :root. */
    --gh-height-full: 100svh;
    --gh-height-large: 80svh;
    --gh-height-medium: 60svh;
    --gh-height-compact: 45svh;

    --gh-content-max: 720px;
    --gh-inline-pad: clamp(1.25rem, 4vw, 3.5rem);
    --gh-block-pad: clamp(2rem, 6vw, 5rem);

    --gh-headline-size: clamp(2rem, 5.5vw, 4.5rem);
    --gh-subtitle-size: clamp(1rem, 1.6vw, 1.25rem);
    --gh-eyebrow-size: clamp(0.75rem, 1vw, 0.875rem);

    --gh-radius: 14px;
    --gh-btn-radius: 999px;
    --gh-easing: cubic-bezier(0.22, 1, 0.36, 1);
  }

  *,
  *::before,
  *::after {
    box-sizing: border-box;
  }

  .hero {
    position: relative;
    width: 100%;
    overflow: hidden;
    isolation: isolate;
    color: #fff;
    background: #0b0b0f;
  }

  .hero[data-height="full"]    { min-height: var(--gh-height-full); }
  .hero[data-height="large"]   { min-height: var(--gh-height-large); }
  .hero[data-height="medium"]  { min-height: var(--gh-height-medium); }
  .hero[data-height="compact"] { min-height: var(--gh-height-compact); }

  .hero[data-text-theme="dark"] {
    color: #0b0b0f;
  }

  /* --- Background layer --- */
  .bg {
    position: absolute;
    inset: 0;
    z-index: 0;
    overflow: hidden;
  }
  /* Media fills .bg via absolute positioning so it works both as a full-bleed
     background (.bg is absolute) and as a split column (.bg is a grid cell),
     and never contributes its intrinsic size to grid row sizing. */
  .bg > img,
  .bg > picture,
  .bg > video {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    display: block;
  }
  .bg > img,
  .bg > picture > img,
  .bg > video {
    width: 100%;
    height: 100%;
    object-fit: cover;
    object-position: center;
    will-change: transform;
  }
  .bg.is-ken-burns > img,
  .bg.is-ken-burns > picture > img {
    animation: kenBurns 24s ease-in-out infinite;
  }
  /* Stop compositing the 24s loop once the hero has scrolled away. */
  :host([out-of-view]) .bg.is-ken-burns > img,
  :host([out-of-view]) .bg.is-ken-burns > picture > img {
    animation-play-state: paused;
  }
  .bg.is-parallax > video,
  .bg.is-parallax > img,
  .bg.is-parallax > picture > img {
    transform: translate3d(0, var(--gh-parallax, 0), 0) scale(1.12);
    transition: transform 0.12s linear;
  }
  .bg.is-gradient {
    background: var(--gh-bg, linear-gradient(135deg, #1e1b4b, #7c3aed));
  }

  /* --- Overlay layer --- */
  .overlay {
    position: absolute;
    inset: 0;
    z-index: 1;
    pointer-events: none;
  }
  .overlay[data-style="dark-bottom"] {
    background: linear-gradient(
      to top,
      rgba(0, 0, 0, var(--gh-overlay-a, 0.7)) 0%,
      rgba(0, 0, 0, calc(var(--gh-overlay-a, 0.7) * 0.5)) 40%,
      rgba(0, 0, 0, 0) 75%
    );
  }
  .overlay[data-style="dark-full"] {
    background: rgba(0, 0, 0, var(--gh-overlay-a, 0.45));
  }
  .overlay[data-style="light-full"] {
    background: rgba(255, 255, 255, var(--gh-overlay-a, 0.55));
  }
  .overlay[data-style="vignette"] {
    background: radial-gradient(
      ellipse at center,
      rgba(0, 0, 0, 0) 40%,
      rgba(0, 0, 0, var(--gh-overlay-a, 0.65)) 100%
    );
  }

  /* --- Content layer --- */
  .content-wrap {
    position: relative;
    z-index: 2;
    display: flex;
    width: 100%;
    min-height: inherit;
    padding-inline: var(--gh-inline-pad);
    padding-block: var(--gh-block-pad);
  }
  .hero[data-align-v="top"]    .content-wrap { align-items: flex-start; }
  .hero[data-align-v="middle"] .content-wrap { align-items: center; }
  .hero[data-align-v="bottom"] .content-wrap { align-items: flex-end; }

  .hero[data-align-h="start"]  .content-wrap { justify-content: flex-start; text-align: start; }
  .hero[data-align-h="center"] .content-wrap { justify-content: center;    text-align: center; }
  .hero[data-align-h="end"]    .content-wrap { justify-content: flex-end;  text-align: end; }

  .content {
    max-width: var(--gh-content-max);
    display: flex;
    flex-direction: column;
    gap: clamp(0.75rem, 1.8vw, 1.5rem);
  }
  .hero[data-align-h="center"] .content { align-items: center; }
  .hero[data-align-h="end"]    .content { align-items: flex-end; }

  /* --- Typography --- */
  .eyebrow {
    font-size: var(--gh-eyebrow-size);
    font-weight: 600;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    opacity: 0.9;
    margin: 0;
    color: var(--gh-eyebrow-color, inherit);
    /* Arabic has no uppercase — respect script */
    &:dir(rtl) { letter-spacing: 0; text-transform: none; }
  }
  .headline {
    font-size: var(--gh-headline-size);
    font-weight: 800;
    line-height: 1.1;
    letter-spacing: -0.02em;
    margin: 0;
    text-wrap: balance;
    color: var(--gh-title-color, inherit);
  }
  .headline:dir(rtl) {
    letter-spacing: 0;
    line-height: 1.3;
  }
  .subtitle {
    font-size: var(--gh-subtitle-size);
    line-height: 1.6;
    opacity: 0.92;
    margin: 0;
    max-width: 54ch;
    text-wrap: pretty;
    color: var(--gh-subtitle-color, inherit);
  }

  /* --- CTAs --- */
  .ctas {
    display: flex;
    flex-wrap: wrap;
    gap: 0.75rem;
    margin-top: 0.5rem;
  }
  .btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
    padding: 0.65rem 1.5rem;
    font-family: inherit;
    font-weight: 600;
    font-size: 0.875rem;
    text-decoration: none;
    border-radius: var(--gh-btn-radius);
    border: 1.5px solid transparent;
    cursor: pointer;
    transition:
      transform 0.25s var(--gh-easing),
      background-color 0.25s var(--gh-easing),
      border-color 0.25s var(--gh-easing),
      color 0.25s var(--gh-easing),
      box-shadow 0.25s var(--gh-easing);
    white-space: nowrap;
  }
  .btn-primary {
    background: var(--gh-btn-bg, #ffffff);
    color: var(--gh-btn-fg, #0b0b0f);
    box-shadow: 0 8px 24px -10px rgba(0, 0, 0, 0.45);
  }
  .btn-primary:hover {
    transform: translateY(-1px);
    box-shadow: 0 12px 28px -10px rgba(0, 0, 0, 0.55);
  }
  .btn-outline {
    background: transparent;
    color: var(--gh-btn-fg, currentColor);
    border-color: var(--gh-btn-fg, currentColor);
    backdrop-filter: blur(6px);
  }
  .btn-outline:hover {
    background: rgba(255, 255, 255, 0.12);
    transform: translateY(-1px);
  }
  .hero[data-text-theme="dark"] .btn-outline:hover {
    background: rgba(0, 0, 0, 0.08);
  }

  /* --- Trust points --- */
  .trust {
    list-style: none;
    margin: 0.875rem 0 0;
    padding: 0;
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem 1.25rem;
  }
  .hero[data-align-h="center"] .trust { justify-content: center; }
  .hero[data-align-h="end"]    .trust { justify-content: flex-end; }
  .trust-item {
    display: inline-flex;
    align-items: center;
    gap: 0.4rem;
    font-size: 0.8125rem;
    font-weight: 500;
    line-height: 1.2;
    opacity: 0.92;
    white-space: nowrap;
    color: var(--gh-subtitle-color, inherit);
  }

  /* Custom-colours mode: show the chosen colours at full strength (drop the
     subtle auto-dimming used in the default theme-driven flow). */
  .hero[data-custom-colors="on"] .eyebrow,
  .hero[data-custom-colors="on"] .subtitle,
  .hero[data-custom-colors="on"] .trust-item {
    opacity: 1;
  }
  .trust-icon {
    flex-shrink: 0;
    width: 1rem;
    height: 1rem;
    opacity: 0.85;
  }

  /* --- Entrance motion --- */
  .content[data-anim="ready"] > * {
    opacity: 0;
    transform: translateY(14px);
  }
  .content[data-anim="in"] > * {
    opacity: 1;
    transform: translateY(0);
    transition:
      opacity 0.7s var(--gh-easing),
      transform 0.7s var(--gh-easing);
  }
  .content[data-anim="in"] > *:nth-child(1) { transition-delay: 0.05s; }
  .content[data-anim="in"] > *:nth-child(2) { transition-delay: 0.15s; }
  .content[data-anim="in"] > *:nth-child(3) { transition-delay: 0.28s; }
  .content[data-anim="in"] > *:nth-child(4) { transition-delay: 0.40s; }
  .content[data-anim="in"] > *:nth-child(5) { transition-delay: 0.52s; }

  @media (prefers-reduced-motion: reduce) {
    .bg.is-ken-burns > img,
    .bg.is-ken-burns > picture > img { animation: none; }
    .bg.is-parallax > video,
    .bg.is-parallax > img,
    .bg.is-parallax > picture > img { transform: none; }
    .content[data-anim] > * { opacity: 1 !important; transform: none !important; transition: none !important; }
  }

  @keyframes kenBurns {
    0% {
      transform: scale(1.04) translate3d(0, 0, 0);
    }
    50% {
      transform: scale(1.14) translate3d(-2%, -1.5%, 0);
    }
    100% {
      transform: scale(1.04) translate3d(0, 0, 0);
    }
  }

  /* --- Split layout (desktop ≥768 px): media on one side, content on the other.
         On mobile this never applies — the media stays a full background. --- */
  @media (min-width: 768px) {
    .hero[data-layout="split"] {
      display: grid;
      grid-template-columns: var(--gh-split-start, 1fr) var(--gh-split-end, 1fr);
      align-items: stretch;
      align-content: stretch;
    }
    /* .bg leaves the absolute full-bleed flow and becomes a real grid column.
       Columns are line-based (line 1 = inline-start), so the component resolves
       the merchant's physical left/right choice into data-media-col for the
       current writing direction. */
    .hero[data-layout="split"] .bg {
      position: relative;
      inset: auto;
    }
    .hero[data-layout="split"][data-media-col="start"] .bg           { grid-column: 1; grid-row: 1; }
    .hero[data-layout="split"][data-media-col="start"] .content-wrap { grid-column: 2; grid-row: 1; }
    .hero[data-layout="split"][data-media-col="end"]   .bg           { grid-column: 2; grid-row: 1; }
    .hero[data-layout="split"][data-media-col="end"]   .content-wrap { grid-column: 1; grid-row: 1; }

    /* The content side gets its own backdrop — media no longer sits behind it. */
    .hero[data-layout="split"] .content-wrap {
      background: var(--gh-split-content-bg, #0b0b0f);
      color: #fff;
    }
    .hero[data-layout="split"][data-split-text-theme="dark"] .content-wrap {
      color: #0b0b0f;
    }
  }

  /* --- Mobile tuning --- */
  @media (max-width: 640px) {
    :host {
      --gh-headline-size: clamp(1.75rem, 8vw, 2.5rem);
    }
    .ctas { flex-direction: column; align-items: flex-start; }
    .hero[data-align-h="center"] .ctas { align-items: center; }
    .hero[data-align-h="end"]    .ctas { align-items: flex-end; }
  }
`;
var O = Object.defineProperty, y = (o, t, e, i) => {
  for (var a = void 0, r = o.length - 1, n; r >= 0; r--)
    (n = o[r]) && (a = n(t, e, a) || a);
  return a && O(t, e, a), a;
};
const k = class k extends U {
  constructor() {
    super(...arguments), this._videoFailed = !1, this._animState = "ready", this._isDesktop = !1, this._videoEl = null, this._videoGeneration = 0, this._lastVideoSrc = "", this._fallbackTimer = null, this._autoplayCheckTimer = null, this._io = null, this._inView = !0, this._rafId = null;
  }
  // ------------------------------------------------------------
  // Helpers
  // ------------------------------------------------------------
  /** Active video URL for the current device tier, falling back to mobile when desktop is unset. */
  _currentVideoUrl() {
    const t = this.config || {};
    return this._isDesktop && t.video_url_desktop ? t.video_url_desktop : t.video_url || "";
  }
  /** Active image URL for the current device tier, falling back to mobile when desktop is unset. */
  _currentImageUrl() {
    const t = this.config || {};
    return this._isDesktop && t.background_image_desktop ? t.background_image_desktop : t.background_image || "";
  }
  /** Returns true when smart_data_saver is ON and the connection is slow/data-restricted. */
  _shouldSkipVideo() {
    var e;
    if (((e = this.config) == null ? void 0 : e.smart_data_saver) === !1) return !1;
    const t = navigator.connection;
    return !!(t && (t.saveData === !0 || ["slow-2g", "2g"].includes(t.effectiveType)));
  }
  /**
   * Returns the video fallback timeout in ms.
   * On mobile without the Network Information API (e.g. Safari), we use a shorter
   * 3 s window since we have no signal to rely on and want to fail fast.
   */
  _pickVideoTimeout() {
    var i;
    if (((i = this.config) == null ? void 0 : i.smart_data_saver) === !1) return 12e3;
    const t = !window.matchMedia("(min-width: 768px)").matches, e = !!navigator.connection;
    return t && !e ? 1e4 : 12e3;
  }
  /** Which background mode should we render? */
  get _mode() {
    return this._currentVideoUrl() && !this._shouldSkipVideo() && !this._videoFailed ? "video" : this._currentImageUrl() ? "image" : "gradient";
  }
  /**
   * Build the CSS `background` value for the gradient mode.
   * Driven by the `bg_fill_type` dropdown (solid | gradient). For configs saved
   * before that field existed, we infer the mode from whether a "to" colour is
   * present, so existing gradients keep rendering.
   * - solid (or gradient with no "to") → the single colour.
   * - gradient with both stops         → gradient of the chosen type/angle.
   * - neither colour                   → null; CSS fallback in style.ts takes over.
   */
  _buildBackground() {
    const t = this.config || {}, e = (t.gradient_from || "").trim(), i = (t.gradient_to || "").trim();
    if (!e && !i) return null;
    if (this._pickValue(
      t.bg_fill_type,
      i ? "gradient" : "solid"
    ) !== "gradient" || !i) return e || i;
    const r = this._pickValue(t.gradient_type, "linear"), n = typeof t.gradient_angle == "number" ? t.gradient_angle : 135;
    switch (r) {
      case "radial":
        return `radial-gradient(circle at center, ${e} 0%, ${i} 100%)`;
      case "radial-corner":
        return `radial-gradient(circle at top left, ${e} 0%, ${i} 75%)`;
      case "conic":
        return `conic-gradient(from ${n}deg at 50% 50%, ${e}, ${i}, ${e})`;
      case "linear":
      default:
        return `linear-gradient(${n}deg, ${e}, ${i})`;
    }
  }
  _overlayAlpha(t = "medium") {
    switch (t) {
      case "subtle":
        return 0.35;
      case "strong":
        return 0.85;
      case "medium":
      default:
        return 0.6;
    }
  }
  /** Resolved document direction; split placement maps physical sides to inline edges. */
  _dir() {
    const t = (document.documentElement.getAttribute("dir") || "").toLowerCase();
    return t === "rtl" || t === "ltr" ? t : getComputedStyle(this).direction === "ltr" ? "ltr" : "rtl";
  }
  /**
   * Resolve split-mode grid placement. Grid columns are line-based (line 1 =
   * inline-start), which flips with RTL — so we translate the merchant's PHYSICAL
   * left/right choice into an inline edge for the current direction, then assign
   * each column its width share (the bigger share goes to whatever the ratio names).
   */
  _resolveSplit(t, e) {
    const a = this._dir() === "ltr" ? t === "left" : t === "right", r = "1.25fr", n = "1fr", l = e === "media" ? r : n, s = e === "content" ? r : n;
    return {
      mediaCol: a ? "start" : "end",
      startFr: a ? l : s,
      endFr: a ? s : l
    };
  }
  // ------------------------------------------------------------
  // Lifecycle
  // ------------------------------------------------------------
  connectedCallback() {
    super.connectedCallback(), requestAnimationFrame(() => {
      requestAnimationFrame(() => this._animState = "in");
    }), this._mql = window.matchMedia("(min-width: 768px)"), this._isDesktop = this._mql.matches, this._onMqlChange = () => {
      this._isDesktop = this._mql.matches, this._videoFailed = !1;
    }, this._mql.addEventListener("change", this._onMqlChange), "IntersectionObserver" in window && (this._io = new IntersectionObserver(
      (t) => {
        const e = t[0];
        e && (this._inView = e.isIntersecting, this.toggleAttribute("out-of-view", !this._inView));
      },
      { threshold: 0 }
    ), this._io.observe(this));
  }
  firstUpdated() {
  }
  updated() {
    this._syncParallax();
    const t = this.renderRoot.querySelector("video");
    if (!t) {
      this._videoEl = null;
      return;
    }
    const e = this._currentVideoUrl();
    (t !== this._videoEl || e !== this._lastVideoSrc) && (this._fallbackTimer && (clearTimeout(this._fallbackTimer), this._fallbackTimer = null), this._lastVideoSrc = e, this._videoEl = t, this._setupVideo());
  }
  disconnectedCallback() {
    super.disconnectedCallback(), this._mql && this._onMqlChange && this._mql.removeEventListener("change", this._onMqlChange), this._teardown();
  }
  // ------------------------------------------------------------
  // Video: autoplay + robust fallback
  // Generation counter ensures that stale abort/error callbacks from a previous src
  // (e.g. the browser firing abort when we swap to a desktop variant) are ignored.
  // ------------------------------------------------------------
  _setupVideo() {
    const t = this.renderRoot.querySelector("video");
    if (!t) return;
    this._videoEl = t;
    const e = ++this._videoGeneration;
    let i = !1;
    const a = () => {
      e === this._videoGeneration && (i || (i = !0, this._fallbackTimer && (clearTimeout(this._fallbackTimer), this._fallbackTimer = null)));
    }, r = () => {
      e === this._videoGeneration && (a(), this._videoFailed = !0);
    };
    t.addEventListener("playing", a, { once: !0 }), t.addEventListener("canplaythrough", a, { once: !0 }), t.addEventListener("error", r, { once: !0 }), t.addEventListener("abort", r, { once: !0 });
    const n = () => {
      t.currentTime > 0 && (a(), t.removeEventListener("timeupdate", n));
    };
    t.addEventListener("timeupdate", n);
    const l = () => {
      var d;
      e === this._videoGeneration && (a(), ((d = this.config) == null ? void 0 : d.battery_saver_fallback) !== !1 && this._currentImageUrl() && (this._videoFailed = !0));
    };
    let s = 0;
    const g = () => {
      if (e === this._videoGeneration && !(!t.isConnected || !t.paused || t.currentTime > 0)) {
        if (t.readyState >= 2) {
          l();
          return;
        }
        ++s < 10 && (this._autoplayCheckTimer = window.setTimeout(g, 1500));
      }
    }, _ = () => {
      if (e !== this._videoGeneration) return;
      const d = t.play();
      d && typeof d.then == "function" && d.catch((f) => {
        (f == null ? void 0 : f.name) === "NotAllowedError" ? l() : r();
      }), this._autoplayCheckTimer && clearTimeout(this._autoplayCheckTimer), this._autoplayCheckTimer = window.setTimeout(g, 2e3);
    };
    t.readyState >= 1 ? _() : t.addEventListener("loadedmetadata", _, { once: !0 }), this._fallbackTimer = window.setTimeout(() => {
      e === this._videoGeneration && (i || r());
    }, this._pickVideoTimeout());
  }
  // ------------------------------------------------------------
  // Parallax: subtle Y-transform tied to scroll, throttled via rAF.
  // ------------------------------------------------------------
  /**
   * Idempotent parallax wiring. Called from updated() so it survives a config
   * that arrives after the first render, and tears down if the toggle flips off.
   */
  _syncParallax() {
    var e;
    const t = !!((e = this.config) != null && e.enable_parallax) && !window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    t !== !!this._onScroll && (t ? this._setupParallax() : this._teardownParallax());
  }
  _teardownParallax() {
    this._onScroll && window.removeEventListener("scroll", this._onScroll), this._onScroll = void 0, this._rafId && (cancelAnimationFrame(this._rafId), this._rafId = null);
  }
  _setupParallax() {
    const t = this.renderRoot.querySelector(".bg");
    if (!t) return;
    let e = !1;
    this._onScroll = () => {
      e || !this._inView || (e = !0, this._rafId = requestAnimationFrame(() => {
        const i = this.getBoundingClientRect(), a = window.innerHeight || 800, r = (i.top + i.height / 2 - a / 2) / a, n = Math.max(-1, Math.min(1, r)) * 80;
        t.style.setProperty("--gh-parallax", `${-n}px`), e = !1;
      }));
    }, window.addEventListener("scroll", this._onScroll, { passive: !0 }), this._onScroll();
  }
  _teardown() {
    var t;
    this._fallbackTimer && clearTimeout(this._fallbackTimer), this._autoplayCheckTimer && clearTimeout(this._autoplayCheckTimer), this._teardownParallax(), (t = this._io) == null || t.disconnect(), this._io = null, this._videoEl = null;
  }
  // ------------------------------------------------------------
  // Render
  // ------------------------------------------------------------
  render() {
    const t = this.config || {}, e = this._pickValue(t.height_mobile, "large"), i = this._pickValue(t.height_desktop, "inherit"), a = this._isDesktop && i !== "inherit" ? i : e, r = this._pickValue(t.align_h, "start"), n = this._pickValue(t.align_v, "middle"), l = this._pickValue(t.text_theme, "light"), s = this._pickValue(t.overlay_style, "dark-bottom"), g = this._pickValue(t.overlay_intensity, "medium"), _ = this._overlayAlpha(g), d = t.enable_entrance_anim !== !1, f = !!t.enable_ken_burns, x = !!t.enable_parallax, $ = this._pickValue(t.desktop_layout, "background"), I = this._pickValue(t.split_media_side, "left"), q = this._pickValue(t.split_ratio, "equal"), F = this._pickValue(
      t.split_text_theme,
      "light"
    ), u = $ === "split" ? this._resolveSplit(I, q) : null, p = t.enable_custom_colors === !0, S = this.localizedString(t.eyebrow), T = this.localizedString(t.headline) || "Welcome", C = this.localizedString(t.subtitle), V = this.localizedString(t.primary_label), z = (Array.isArray(t.trust_points) ? t.trust_points : []).map((b) => this.localizedString(b == null ? void 0 : b.text)).filter(Boolean).slice(0, 3), v = this._mode, A = this._buildBackground(), P = [
      `--gh-overlay-a: ${_}`,
      t.content_max_width ? `--gh-content-max: ${t.content_max_width}px` : "",
      A ? `--gh-bg: ${A}` : "",
      u ? `--gh-split-start: ${u.startFr}` : "",
      u ? `--gh-split-end: ${u.endFr}` : "",
      u && t.split_content_bg ? `--gh-split-content-bg: ${t.split_content_bg}` : "",
      p && t.title_color ? `--gh-title-color: ${t.title_color}` : "",
      p && t.eyebrow_color ? `--gh-eyebrow-color: ${t.eyebrow_color}` : "",
      p && t.subtitle_color ? `--gh-subtitle-color: ${t.subtitle_color}` : "",
      p && t.button_bg_color ? `--gh-btn-bg: ${t.button_bg_color}` : "",
      p && t.button_text_color ? `--gh-btn-fg: ${t.button_text_color}` : ""
    ].filter(Boolean).join("; "), M = [
      "bg",
      v === "gradient" ? "is-gradient" : "",
      v === "image" && f ? "is-ken-burns" : "",
      x ? "is-parallax" : ""
    ].filter(Boolean).join(" ");
    return c`
      <section
        class="hero"
        style=${P}
        data-height=${a}
        data-layout=${$}
        data-media-col=${u ? u.mediaCol : "start"}
        data-split-text-theme=${F}
        data-custom-colors=${p ? "on" : "off"}
        data-align-h=${r}
        data-align-v=${n}
        data-text-theme=${l}
        aria-label=${T}
      >
        <div class=${M}>
          ${v === "video" ? c`
                <video
                  src=${this._currentVideoUrl()}
                  poster=${E(this._currentImageUrl() || void 0)}
                  ?autoplay=${t.video_autoplay !== !1}
                  ?loop=${t.video_loop !== !1}
                  ?muted=${t.video_muted !== !1}
                  muted
                  playsinline
                  webkit-playsinline
                  preload="auto"
                ></video>
              ` : v === "image" ? c`
                <picture>
                  ${t.background_image_desktop ? c`<source media="(min-width: 768px)" srcset=${t.background_image_desktop}>` : m}
                  <img
                    src=${E(
      t.background_image || t.background_image_desktop || void 0
    )}
                    alt=""
                    loading="eager"
                    fetchpriority="high"
                    decoding="async"
                  />
                </picture>
              ` : m}
          ${s !== "none" ? c`<div class="overlay" data-style=${s}></div>` : m}
        </div>

        <div class="content-wrap">
          <div class="content" data-anim=${d ? this._animState : "in"}>
            ${S ? c`<p class="eyebrow">${S}</p>` : m}
            <h1 class="headline">${T}</h1>
            ${C ? c`<p class="subtitle">${C}</p>` : m}
            ${V ? c`
                  <div class="ctas">
                    <a
                      class="btn ${t.primary_outline ? "btn-outline" : "btn-primary"}"
                      href=${t.primary_url || "#"}
                    >
                      ${V}
                    </a>
                  </div>
                ` : m}
            ${z.length ? c`
                  <ul class="trust">
                    ${z.map(
      (b) => c`
                        <li class="trust-item">
                          <svg
                            class="trust-icon"
                            viewBox="0 0 24 24"
                            fill="none"
                            aria-hidden="true"
                          >
                            <path
                              d="M20 6 9 17l-5-5"
                              stroke="currentColor"
                              stroke-width="2.5"
                              stroke-linecap="round"
                              stroke-linejoin="round"
                            />
                          </svg>
                          <span>${b}</span>
                        </li>
                      `
    )}
                  </ul>
                ` : m}
          </div>
        </div>
      </section>
    `;
  }
};
k.styles = G;
let h = k;
y([
  D({ type: Object })
], h.prototype, "config");
y([
  w()
], h.prototype, "_videoFailed");
y([
  w()
], h.prototype, "_animState");
y([
  w()
], h.prototype, "_isDesktop");
typeof h < "u" && h.registerSallaComponent("salla-Hero");
export {
  h as default
};
