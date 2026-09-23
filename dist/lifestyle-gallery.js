import { LitElement as L, css as j, html as f, nothing as x } from "lit";
import { property as Y, state as R } from "lit/decorators.js";
function V(r, t) {
  if (typeof r == "string") return r;
  if (!r || typeof r != "object") return "";
  const e = r[t] || r.ar || r.en || "";
  return typeof e == "string" ? e.trim() : "";
}
function F() {
  return (document.documentElement.lang || "ar").toLowerCase().startsWith("en") ? "en" : "ar";
}
function T(r) {
  return r.replace(/[٠-٩]/g, (t) => String(t.charCodeAt(0) - 1632)).replace(/[۰-۹]/g, (t) => String(t.charCodeAt(0) - 1776));
}
class U extends L {
  /**
   * Twilight transform injects `Component.registerSallaComponent(...)`.
   * Statics inherit, so `this` is the concrete component. The polling
   * fallback handles preview contexts where `Salla` loads after the
   * component file executes.
   */
  static registerSallaComponent(t) {
    const e = String(t || "").trim(), s = e.toLowerCase().replace(/[^a-z0-9._-]/g, "-"), i = s.includes("-") ? s : `salla-${s || "component"}`, n = () => `${i}-${Math.random().toString(36).substring(2, 8)}`, a = () => {
      var o;
      const c = (o = window.Salla) == null ? void 0 : o.bundles;
      return c && typeof c.registerComponent == "function" ? (c.registerComponent(e, {
        component: this,
        dynamicTagName: n()
      }), !0) : !1;
    };
    if (a()) return;
    const g = window.setInterval(() => {
      a() && window.clearInterval(g);
    }, 100);
    window.setTimeout(() => window.clearInterval(g), 5e3);
  }
  /** Resolved document language. */
  _lang() {
    return F();
  }
  /** Pull the store-language string out of a Salla multilanguage value. */
  localizedString(t) {
    return V(t, this._lang());
  }
  /** Dropdown-list values from settings may come as [{ label, value }]. */
  _pickValue(t, e) {
    if (typeof t == "string" && t) return t;
    if (Array.isArray(t) && t.length > 0) {
      const s = t[0];
      if (s && typeof s.value == "string" && s.value)
        return s.value;
    }
    return e;
  }
  /** See module-level toLatinDigits; exposed for subclasses. */
  _toLatinDigits(t) {
    return T(t);
  }
  /** Coerce a config number that may arrive as a string (Arabic-Indic
      digits included) or as a [{ value }] dropdown selection. */
  _num(t, e) {
    if (typeof t == "number" && !Number.isNaN(t)) return t;
    if (typeof t == "string" && t.trim() !== "") {
      const s = Number(T(t.trim()));
      if (!Number.isNaN(s)) return s;
    }
    if (Array.isArray(t) && t.length > 0) {
      const s = t[0];
      if ((s == null ? void 0 : s.value) !== void 0) return this._num(s.value, e);
    }
    return e;
  }
}
const k = {
  none: 0,
  xs: 12,
  sm: 24,
  md: 40,
  lg: 56,
  xl: 72
}, z = {
  none: 0,
  xs: 20,
  sm: 32,
  md: 64,
  lg: 96,
  xl: 128
};
function X(r, t, e = "md", s = "md") {
  const i = t(r == null ? void 0 : r.space_top, e), n = t(r == null ? void 0 : r.space_bottom, s), a = k[i] ?? k.md, g = k[n] ?? k.md, c = z[i] ?? z.md, o = z[n] ?? z.md;
  return [
    `--sp-top-m:${a}px`,
    `--sp-bot-m:${g}px`,
    `--sp-top-d:${c}px`,
    `--sp-bot-d:${o}px`
  ];
}
function B() {
  const r = window;
  return r.salla ?? r.Salla ?? null;
}
function H(r) {
  if (!r) return null;
  if (typeof r == "string" || typeof r == "number") {
    const a = Number(r);
    return !a || Number.isNaN(a) ? null : { id: a, label: "" };
  }
  const t = Array.isArray(r) ? r[0] : r;
  if (!t) return null;
  if (typeof t == "string" || typeof t == "number") {
    const a = Number(t);
    return !a || Number.isNaN(a) ? null : { id: a, label: "" };
  }
  if (typeof t != "object") return null;
  const e = t, s = e.value ?? e.id ?? e.product_id;
  if (s == null) return null;
  const i = typeof s == "number" ? s : Number(s);
  if (!i || Number.isNaN(i)) return null;
  const n = String(e.label ?? e.name ?? e.title ?? "").trim();
  return { id: i, label: n };
}
function E(r) {
  if (typeof r == "number") return Number.isNaN(r) ? void 0 : r;
  if (r && typeof r == "object") {
    const s = r;
    return E(s.amount ?? s.value ?? s.price);
  }
  if (typeof r != "string") return;
  const t = T(r).replace(/[^0-9.,]/g, "").replace(/,/g, "");
  if (!t) return;
  const e = parseFloat(t);
  return Number.isNaN(e) ? void 0 : e;
}
async function K(r, t = "") {
  var S, _, m, P, b, w, $, A, C, I, D;
  const e = B();
  if (!e) throw new Error("Salla SDK unavailable");
  typeof e.onReady == "function" && await e.onReady();
  const s = ((S = e.product) == null ? void 0 : S.getDetails) ?? ((m = (_ = e.product) == null ? void 0 : _.api) == null ? void 0 : m.getDetails);
  if (typeof s != "function")
    throw new Error("getDetails unavailable");
  const i = await s.call(e.product, r), n = (i == null ? void 0 : i.data) ?? i;
  if (!n) throw new Error("empty product payload");
  const a = ((P = n.image) == null ? void 0 : P.url) || ((b = n.image) == null ? void 0 : b.thumbnail) || Array.isArray(n.images) && (((w = n.images[0]) == null ? void 0 : w.url) || n.images[0]) || n.thumbnail || n.main_image || "", g = n.url || (($ = n.urls) == null ? void 0 : $.customer) || ((A = n.urls) == null ? void 0 : A.product) || n.permalink || `/p${r}`, c = E(n.price), o = E(n.regular_price), l = E(n.sale_price);
  let h = o ?? c, d = c ?? o;
  l !== void 0 && l > 0 && (d = l, (h === void 0 || h <= l) && (h = o ?? c ?? l));
  const p = (!!(n.is_on_sale ?? n.on_sale ?? n.has_offer) || l !== void 0) && h !== void 0 && d !== void 0 && d < h, y = n.currency || ((C = n.price) == null ? void 0 : C.currency) || ((I = n.regular_price) == null ? void 0 : I.currency) || void 0;
  return {
    name: String(n.name || n.title || t || `#${r}`),
    image: a || void 0,
    imageAlt: String(((D = n.image) == null ? void 0 : D.alt) || n.name || ""),
    url: g,
    regular: h,
    sale: p ? d : void 0,
    onSale: p,
    currency: y
  };
}
const W = j`
  :host {
    display: block;
    font-family: inherit;
    direction: inherit;
    /* Size containment: wide slides can never push sibling Salla sections
       off-screen, and container queries track the section's real width
       (more reliable than the viewport inside the admin preview iframe). */
    container-type: inline-size;

    --lsg-bg: #f5f5f5;
    --lsg-title-color: #1a1a1a;
    --lsg-overlay-color: #ffffff;
    --lsg-radius: 32px;
    --lsg-h-mobile: 420px;
    /* --lsg-h-desktop is only set when the merchant overrides it. */
    --lsg-gap: 16px;
    --lsg-slide-w: 100%;
    --lsg-slide-size: 100%;
    --lsg-ease: cubic-bezier(0.25, 0.46, 0.45, 0.94);
    /* easeOutCubic — must match the JS estimate used when a drag interrupts
       an in-flight snap transition (see _currentPos in index.ts). */
    --lsg-snap-ease: cubic-bezier(0.33, 1, 0.68, 1);
  }

  *,
  *::before,
  *::after {
    box-sizing: border-box;
  }

  .lsg-section {
    width: 100%;
    /* Vertical space is the merchant's, via shared tiers; the horizontal
       padding stays the section's own. See src/shared/section-spacing.ts. */
    padding-inline: clamp(1rem, 3vw, 1.5rem);
    padding-block: var(--sp-top-m) var(--sp-bot-m);
    background-color: var(--lsg-bg);
    display: flex;
    flex-direction: column;
    align-items: center;
    overflow: hidden;
  }

  /* ---------- Entrance ---------- */
  .lsg-section[data-enter="ready"] .lsg-header,
  .lsg-section[data-enter="ready"] .lsg-stage {
    opacity: 0;
    transform: translateY(24px);
  }
  .lsg-section[data-enter="in"] .lsg-header,
  .lsg-section[data-enter="in"] .lsg-stage {
    opacity: 1;
    transform: translateY(0);
    transition: opacity 0.7s var(--lsg-ease), transform 0.7s var(--lsg-ease);
  }
  .lsg-section[data-enter="in"] .lsg-stage {
    transition-delay: 0.12s;
  }

  /* ---------- Header ---------- */
  .lsg-header {
    width: 100%;
    max-width: 720px;
    text-align: center;
    margin-bottom: 24px;
  }
  .lsg-pretitle {
    display: block;
    font-family: -apple-system, system-ui, "Segoe UI", Roboto, sans-serif;
    font-weight: 800;
    font-size: clamp(1.75rem, 5cqw, 3rem);
    color: var(--lsg-title-color);
    line-height: 1.3;
  }
  .lsg-title {
    margin: 0;
    font-size: clamp(1.75rem, 5cqw, 3rem);
    font-weight: 700;
    color: var(--lsg-title-color);
    line-height: 1.4;
  }
  @container (min-width: 768px) {
    .lsg-header {
      margin-bottom: 40px;
    }
  }

  /* ---------- Stage ---------- */
  .lsg-stage {
    position: relative;
    width: 100%;
    max-width: 1100px;
    height: var(--lsg-h-mobile);
    cursor: grab;
    touch-action: pan-y;
    user-select: none;
    -webkit-user-select: none;
  }
  .lsg-stage.is-dragging {
    cursor: grabbing;
  }
  @container (min-width: 768px) {
    .lsg-stage {
      height: var(--lsg-h-desktop, var(--lsg-h-mobile));
    }
  }

  .lsg-track {
    display: flex;
    height: 100%;
  }

  /* The slide is a static layout slot — it never moves. The wrapper inside it
     is what the material effect animates: its width shrinks/grows while the
     fixed-width content stays centered, so the image gets cropped from both
     sides like a narrowing window. */
  .lsg-slide {
    position: relative;
    flex: 0 0 auto;
    width: var(--lsg-slide-w);
    height: 100%;
    margin-inline-end: var(--lsg-gap);
  }

  /* Snap animations work exactly like the Swiper material plugin: JS writes
     the target snap styles plus an inline transition-duration, and CSS
     interpolates. duration is 0 while dragging (per-frame updates). */
  .lsg-wrap {
    position: absolute;
    inset-block-start: 0;
    inset-inline-start: 0;
    width: 100%;
    height: 100%;
    overflow: hidden;
    border-radius: var(--lsg-radius);
    will-change: width, transform;
    pointer-events: auto;
    transition: width 0ms var(--lsg-snap-ease),
      transform 0ms var(--lsg-snap-ease);
  }

  .lsg-content {
    position: absolute;
    top: 0;
    height: 100%;
    width: var(--lsg-slide-size);
    inset-inline-start: calc(50% - var(--lsg-slide-size) / 2);
  }

  .lsg-img {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    object-fit: cover;
    display: block;
    will-change: transform;
    transition: transform 0ms var(--lsg-snap-ease);
  }

  /* Placeholder card while a linked product's image is still loading. */
  .lsg-img-empty {
    position: absolute;
    inset: 0;
    background: linear-gradient(135deg, #e8e8e8, #d4d4d4);
  }

  /* ---------- Overlay (name + CTA over the image) ---------- */
  .lsg-overlay {
    position: absolute;
    inset-inline: 0;
    bottom: 0;
    height: 60%;
    padding: 24px;
    display: flex;
    flex-direction: column;
    justify-content: flex-end;
    align-items: center;
    gap: 12px;
    background-image: linear-gradient(
      to bottom,
      rgba(0, 0, 0, 0),
      rgba(0, 0, 0, 0.65) 60%
    );
    transition: opacity 0.4s ease;
  }

  .lsg-name {
    font-size: 17px;
    font-weight: 700;
    color: var(--lsg-overlay-color);
    text-shadow: 0 2px 8px rgba(0, 0, 0, 0.4);
    white-space: nowrap;
    text-align: center;
  }

  .lsg-cta {
    display: inline-block;
    padding: 8px 22px;
    background: transparent;
    color: var(--lsg-overlay-color);
    font-size: 14px;
    font-weight: 700;
    font-family: inherit;
    border: 2px solid var(--lsg-overlay-color);
    border-radius: 50px;
    cursor: pointer;
    text-decoration: none;
    transition: transform 0.3s ease, background 0.3s ease, box-shadow 0.3s ease;
  }
  .lsg-cta:hover {
    transform: translateY(-2px);
    background: rgba(255, 255, 255, 0.15);
    box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
  }
  .lsg-cta:active {
    transform: translateY(0);
  }

  @container (min-width: 768px) {
    .lsg-name {
      font-size: 22px;
    }
    .lsg-cta {
      padding: 9px 28px;
      font-size: 15px;
    }
    .lsg-overlay {
      gap: 16px;
    }
  }

  /* ---------- Nav buttons ---------- */
  .lsg-nav {
    position: absolute;
    top: 50%;
    transform: translateY(-50%);
    z-index: 20;
    width: 42px;
    height: 42px;
    border-radius: 50%;
    border: none;
    background: rgba(255, 255, 255, 0.92);
    color: #1a1a1a;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    box-shadow: 0 4px 14px rgba(0, 0, 0, 0.15);
    transition: opacity 0.3s ease, transform 0.2s ease;
  }
  .lsg-nav:hover {
    transform: translateY(-50%) scale(1.06);
  }
  .lsg-nav[disabled] {
    opacity: 0.35;
    cursor: default;
    pointer-events: none;
  }
  .lsg-nav svg {
    width: 20px;
    height: 20px;
    fill: none;
    stroke: currentColor;
    stroke-width: 2.5;
    stroke-linecap: round;
    stroke-linejoin: round;
  }
  .lsg-nav-prev {
    inset-inline-start: 10px;
  }
  .lsg-nav-next {
    inset-inline-end: 10px;
  }
  /* Chevron path points "forward" (LTR right). Flip per logical direction. */
  .lsg-section[data-dir="ltr"] .lsg-nav-prev svg,
  .lsg-section[data-dir="rtl"] .lsg-nav-next svg {
    transform: scaleX(-1);
  }

  /* ---------- Empty state (admin, before slides are added) ---------- */
  .lsg-empty {
    width: 100%;
    padding: 3rem 1rem;
    background: var(--lsg-bg);
    color: #6b7280;
    text-align: center;
    font-size: 0.95rem;
  }

  @media (min-width: 768px) {
    .lsg-section {
      padding-block: var(--sp-top-d) var(--sp-bot-d);
    }
  }
`;
var J = Object.defineProperty, M = (r, t, e, s) => {
  for (var i = void 0, n = r.length - 1, a; n >= 0; n--)
    (a = r[n]) && (i = a(t, e, i) || i);
  return i && J(t, e, i), i;
};
const O = 0.65, Q = 1.25, Z = 600, N = class N extends U {
  constructor() {
    super(...arguments), this._animState = "in", this._restPos = 0, this._pos = 0, this._metrics = null, this._isRtl = !1, this._animating = !1, this._animFrom = 0, this._animTarget = 0, this._animStart = 0, this._animDur = 0, this._animTimer = null, this._resizeObserver = null, this._autoplayTimer = null, this._hoverPaused = !1, this._pointerId = null, this._dragging = !1, this._dragStartX = 0, this._dragStartY = 0, this._dragStartPos = 0, this._dragStartTime = 0, this._stageEl = null, this._wrapEls = [], this._imgEls = [], this._overlayEls = [], this._productCache = /* @__PURE__ */ new Map(), this._stageBound = null, this._onPointerDown = (t) => {
      this._slides().length <= 1 || t.pointerType === "mouse" && t.button !== 0 || (this._pointerId = t.pointerId, this._dragging = !1, this._dragStartX = t.clientX, this._dragStartY = t.clientY, this._animating && (this._pos = this._currentPos(), this._stopTransition(), this._applyEffect(0)), this._dragStartPos = this._pos, this._dragStartTime = performance.now());
    }, this._onPointerMove = (t) => {
      var g, c;
      if (this._pointerId !== t.pointerId) return;
      const e = this._metrics;
      if (!e) return;
      const s = t.clientX - this._dragStartX, i = t.clientY - this._dragStartY;
      if (!this._dragging) {
        if (Math.abs(s) < 6 || Math.abs(s) < Math.abs(i)) return;
        this._dragging = !0, (g = this._stageEl) == null || g.classList.add("is-dragging"), (c = this._stageEl) == null || c.setPointerCapture(t.pointerId);
      }
      const n = (this._isRtl ? s : -s) / e.slotSize;
      let a = this._dragStartPos + n;
      if (!this._loop()) {
        const o = this._snaps(), l = o[o.length - 1];
        a < 0 ? a *= 0.3 : a > l && (a = l + (a - l) * 0.3);
      }
      this._pos = a, this._applyEffect(0);
    }, this._onPointerUp = (t) => {
      var n;
      if (this._pointerId !== t.pointerId || (this._pointerId = null, (n = this._stageEl) == null || n.classList.remove("is-dragging"), !this._dragging)) return;
      const e = this._pos - this._dragStartPos, i = performance.now() - this._dragStartTime < 300 && Math.abs(e) > 0.05 ? this._stepTarget(this._dragStartPos, e > 0 ? 1 : -1) : this._nearestSnap(this._pos);
      this._transitionTo(i), window.setTimeout(() => {
        this._dragging = !1;
      }, 50);
    }, this._goPrev = () => this._goBy(-1), this._goNext = () => this._goBy(1), this._onHoverIn = () => {
      this._hoverPaused = !0;
    }, this._onHoverOut = () => {
      this._hoverPaused = !1;
    };
  }
  // ------------------------------------------------------------
  // Helpers
  // ------------------------------------------------------------
  _slides() {
    var e;
    const t = (e = this.config) == null ? void 0 : e.slides;
    return Array.isArray(t) ? t.filter((s) => !s || typeof s != "object" ? !1 : !!(s.image || s.product)) : [];
  }
  async _fetchProduct(t, e) {
    if (!this._productCache.has(t) && (this._productCache.set(t, { status: "loading", label: e }), this.requestUpdate(), !!B())) {
      try {
        const s = await K(t, e);
        this._productCache.set(t, { status: "loaded", data: s });
      } catch (s) {
        console.warn("[growth-lifestyle-gallery] product fetch failed", t, s), this._productCache.set(t, { status: "failed" });
      }
      this.requestUpdate();
    }
  }
  _resolveProduct(t) {
    const e = H(t.product);
    if (!e) return null;
    const s = this._productCache.get(e.id);
    return s ? s.status === "loaded" ? s.data : s.status === "loading" && s.label ? { name: s.label, url: "", image: void 0 } : null : (this._fetchProduct(e.id, e.label), e.label ? { name: e.label, url: "", image: void 0 } : null);
  }
  // ------------------------------------------------------------
  // Lifecycle
  // ------------------------------------------------------------
  connectedCallback() {
    var s;
    super.connectedCallback();
    const t = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches, e = ((s = this.config) == null ? void 0 : s.enable_entrance_anim) === !1;
    t || e ? this._animState = "in" : (this._animState = "ready", requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        this._animState = "in";
      });
    }));
  }
  disconnectedCallback() {
    var t;
    super.disconnectedCallback(), this._teardownAutoplay(), this._stopTransition(), (t = this._resizeObserver) == null || t.disconnect(), this._resizeObserver = null, this._stageBound = null;
  }
  willUpdate(t) {
    t.has("config") && (this._teardownAutoplay(), this._setupAutoplay());
  }
  firstUpdated() {
    this._bindStage();
  }
  _bindStage() {
    var e;
    const t = this.renderRoot.querySelector(".lsg-stage");
    !t || t === this._stageBound || ((e = this._resizeObserver) == null || e.disconnect(), this._stageBound = t, this._resizeObserver = new ResizeObserver(() => this._onResize()), this._resizeObserver.observe(t), t.addEventListener(
      "click",
      (s) => {
        this._dragging && (s.preventDefault(), s.stopPropagation());
      },
      !0
    ));
  }
  updated() {
    this._bindStage(), this._cacheEls(), this._measure(), this._animating || this._applyEffect(0);
  }
  // ------------------------------------------------------------
  // Measurement
  // ------------------------------------------------------------
  _cacheEls() {
    this._stageEl = this.renderRoot.querySelector(".lsg-stage");
    const t = Array.from(
      this.renderRoot.querySelectorAll(".lsg-slide")
    );
    this._wrapEls = [], this._imgEls = [], this._overlayEls = [];
    for (const e of t)
      this._wrapEls.push(e.querySelector(".lsg-wrap")), this._imgEls.push(e.querySelector(".lsg-img")), this._overlayEls.push(e.querySelector(".lsg-overlay"));
  }
  _desktopSpv() {
    var e;
    return this._pickValue((e = this.config) == null ? void 0 : e.desktop_slides, "3") === "2" ? 2 : 3;
  }
  _measure() {
    const t = this._stageEl;
    if (!t) {
      this._metrics = null;
      return;
    }
    const e = t.clientWidth;
    if (!e) {
      this._metrics = null;
      return;
    }
    this._isRtl = getComputedStyle(this).direction === "rtl";
    let s, i;
    e < 480 ? (s = 1.2, i = 10) : e < 768 ? (s = 1.5, i = 12) : e < 1024 ? (s = 2, i = 16) : (s = this._desktopSpv(), i = 16);
    const n = (e - i * (s - 1)) / s;
    this._metrics = { width: e, spv: s, gap: i, slideSize: n, slotSize: n + i }, t.style.setProperty("--lsg-slide-w", `${n}px`), t.style.setProperty("--lsg-gap", `${i}px`), t.style.setProperty("--lsg-slide-size", `${n}px`);
  }
  _onResize() {
    this._stopTransition(), this._measure(), this._pos = this._nearestSnap(this._normalize(this._pos)), this._restPos = this._pos, this._applyEffect(0);
  }
  _loop() {
    var t;
    return ((t = this.config) == null ? void 0 : t.loop) === !0 && this._slides().length > 1;
  }
  /** Wraps a loop position back into [0, count). No-op when not looping. */
  _normalize(t) {
    if (!this._loop()) return t;
    const e = this._slides().length;
    return (t % e + e) % e;
  }
  // ------------------------------------------------------------
  // Snap grid
  // ------------------------------------------------------------
  /**
   * Resting positions, in slot units. Mirrors Swiper + the material effect:
   * one snap per slide clamped to (count − spv), plus one extra snap past the
   * end so the last slide can unfold to full width (the effect keeps the
   * trailing column compressed at every regular snap).
   */
  _snaps() {
    const t = this._slides().length, e = this._metrics;
    if (!e || t === 0) return [0];
    const s = Math.max(0, t - e.spv), i = [];
    for (let n = 0; n < t; n++) {
      const a = Math.min(n, s);
      (i.length === 0 || a > i[i.length - 1] + 1e-4) && i.push(a);
    }
    return e.spv > 1 && t > 1 && O < 1 && i.push(i[i.length - 1] + 1), i;
  }
  _nearestSnap(t) {
    if (this._loop()) return Math.round(t);
    const e = this._snaps();
    let s = e[0];
    for (const i of e)
      Math.abs(i - t) < Math.abs(s - t) && (s = i);
    return s;
  }
  _snapIndex(t) {
    const e = this._snaps();
    let s = 0;
    for (let i = 0; i < e.length; i++)
      Math.abs(e[i] - t) < Math.abs(e[s] - t) && (s = i);
    return s;
  }
  /** One snap forward/backward from `base` — unbounded when looping. */
  _stepTarget(t, e) {
    if (this._loop()) return Math.round(t) + e;
    const s = this._snaps(), i = Math.max(
      0,
      Math.min(s.length - 1, this._snapIndex(t) + e)
    );
    return s[i];
  }
  // ------------------------------------------------------------
  // The material effect — vanilla port of the non-centered branch
  // ------------------------------------------------------------
  /**
   * For slide `i` at the current position, returns the window's scale
   * (fraction of a slot it keeps) and its translate along the axis in
   * **logical** px (positive = toward inline-end). The caller mirrors the
   * sign for RTL — anchoring uses logical properties, so unlike the original
   * plugin no further RTL correction is needed.
   *
   * Works in `q` space — the slide's distance in slots from the viewport's
   * start edge (the caller computes `q`, wrapped for loop mode).
   */
  _computeSlide(t, e) {
    const s = this._metrics, { spv: i, gap: n, slideSize: a, slotSize: g, width: c } = s, o = O, l = 1 - o, h = n / a;
    let d = 0, u = 0;
    if (t <= 0 && (d = 1 + t, u = 0), i === 1)
      t > 0 && (d = 1 - t, u = c * Math.min(t, 1));
    else {
      if (t > 0 && t <= i - 2 && (d = 1, u = t * g), t > i - 2 && t <= i - 1 && (d = o - h + (l + 2 * h) * (i - 1 - Math.abs(t)), u = t * g), t > i - 1 && t <= i) {
        const p = i - Math.abs(t);
        d = l - h + (o - l) * p, u = t * g - a * (l + h) * (1 - p);
      }
      if (t > i) {
        let p = i + 1 - Math.abs(t), y = 0;
        d = 0, p >= 0 && (p = Math.max(Math.min(-h * 2 + p * (1 + 2 * h), 1), 0), d = (l - h) * p, y = -p * (l + h) * a + p * n), u = c * Math.min(t, 1) + y;
      }
    }
    return d = Math.min(Math.max(d, 1e-5), 1), { scale: d, translate: u - e * g };
  }
  /** Loop wrap for resting/dragging — window (-1, count-1]: a slide mid-exit
      keeps its negative q, while the seam slide stays parked at the far end
      (and stays visible as the trailing sliver when count = spv+1). */
  _wrapQ(t) {
    const e = this._wrapEls.length;
    let s = (t % e + e) % e;
    return s > e - 1 && (s -= e), s;
  }
  /** Loop wrap for snap transitions — window [-1, count-1): here the slide
      one slot before the anchor must take the exiting role (q = -1, collapse
      at the start edge), not sit at the far end. */
  _wrapT(t) {
    const e = this._wrapEls.length;
    return ((t + 1) % e + e) % e - 1;
  }
  /**
   * Writes the effect styles for every slide at the current `_pos`, with the
   * given transition duration — exactly the original plugin's mechanism:
   * snaps write the target styles once with duration 600ms and CSS
   * interpolates; drags write per-frame with duration 0.
   *
   * `anchor` (loop snap transitions only) picks the wrapping's frame of
   * reference: each slide's role is wrapped at `anchor` and shifted by
   * (anchor − pos). Transitions anchor both their start and end styles at the
   * *target* position, so every slide travels through adjacent positions —
   * never across the stage, even when the transition crosses the loop seam.
   */
  _applyEffect(t = 0, e) {
    const s = this._metrics;
    if (!s || this._wrapEls.length === 0) return;
    const i = this._wrapEls.length, n = this._loop(), a = Math.max(
      0,
      Math.min(i - 1, this._normalize(Math.round(this._pos)))
    ), g = s.spv < 2, c = `${t}ms`;
    for (let o = 0; o < i; o++) {
      let l;
      n ? e === void 0 ? l = this._wrapQ(o - this._pos) : l = this._wrapT(o - e) + (e - this._pos) : l = o - this._pos;
      const { scale: h, translate: d } = this._computeSlide(l, o), u = this._wrapEls[o];
      u.style.transitionDuration = c, u.style.width = `${h * 100}%`, u.style.transform = `translate3d(${this._isRtl ? -d : d}px, 0, 0)`;
      const p = this._imgEls[o];
      p && (p.style.transitionDuration = c, p.style.transform = `scale(${1 + (Q - 1) * (1 - h)})`);
      const y = this._overlayEls[o];
      y && (y.style.opacity = !g || o === a ? "1" : "0");
    }
  }
  // ------------------------------------------------------------
  // Snap transitions
  // ------------------------------------------------------------
  _stopTransition() {
    this._animating = !1, this._animTimer !== null && (clearTimeout(this._animTimer), this._animTimer = null);
  }
  /**
   * The position the user currently *sees*. While a snap transition is in
   * flight this is estimated from elapsed time with the same easeOutCubic
   * curve as the CSS `--lsg-snap-ease`, so a grab mid-animation can freeze
   * the slides where they visually are.
   */
  _currentPos() {
    if (!this._animating) return this._pos;
    const e = 1 - (1 - Math.min(
      (performance.now() - this._animStart) / this._animDur,
      1
    )) ** 3;
    return this._animFrom + (this._animTarget - this._animFrom) * e;
  }
  _transitionTo(t, e = Z) {
    var i;
    const s = this._currentPos();
    if (this._stopTransition(), this._restPos = this._normalize(t), Math.abs(t - s) < 1e-4) {
      this._pos = this._normalize(t), this._applyEffect(0);
      return;
    }
    this._animFrom = s, this._animTarget = t, this._animStart = performance.now(), this._animDur = e, this._animating = !0, this._loop() && (this._pos = s, this._applyEffect(0, t), (i = this._stageEl) == null || i.offsetWidth), this._pos = t, this._applyEffect(e, t), this._animTimer = window.setTimeout(() => {
      this._animating = !1, this._animTimer = null, this._pos = this._normalize(t), this._applyEffect(0);
    }, e);
  }
  // ------------------------------------------------------------
  // Nav buttons + autoplay
  // ------------------------------------------------------------
  _goBy(t) {
    this._transitionTo(this._stepTarget(this._restPos, t));
  }
  _setupAutoplay() {
    const t = this.config || {};
    if (!t.autoplay || this._slides().length < 2) return;
    const e = Math.max(2, this._num(t.autoplay_delay, 4));
    this._autoplayTimer = window.setInterval(() => {
      if (this._hoverPaused || this._dragging || this._pointerId !== null)
        return;
      if (this._loop()) {
        this._transitionTo(Math.round(this._restPos) + 1);
        return;
      }
      const s = this._snaps(), i = this._snapIndex(this._restPos), n = i >= s.length - 1 ? 0 : i + 1;
      this._transitionTo(s[n]);
    }, e * 1e3);
  }
  _teardownAutoplay() {
    this._autoplayTimer && (clearInterval(this._autoplayTimer), this._autoplayTimer = null);
  }
  // ------------------------------------------------------------
  // Render
  // ------------------------------------------------------------
  render() {
    const t = this.config || {}, e = this._slides(), s = this.localizedString(t.section_title), i = this.localizedString(t.section_pretitle), n = t.show_overlay !== !1, a = this.localizedString(t.default_cta_label) || "اكتشف المنتج", g = t.show_nav_buttons === !0 && e.length > 1, c = this._loop(), o = t.enable_entrance_anim !== !1, l = this._num(this._pickValue(t.card_radius, "32"), 32), h = this._num(
      this._pickValue(t.height_mobile, "420"),
      420
    ), d = this._pickValue(t.height_desktop, "inherit"), u = [
      t.bg_color ? `--lsg-bg: ${t.bg_color}` : "",
      t.title_color ? `--lsg-title-color: ${t.title_color}` : "",
      t.overlay_text_color ? `--lsg-overlay-color: ${t.overlay_text_color}` : "",
      `--lsg-radius: ${l}px`,
      `--lsg-h-mobile: ${h}px`,
      d !== "inherit" ? `--lsg-h-desktop: ${this._num(d, h)}px` : "",
      ...X(t, (_, m) => this._pickValue(_, m))
    ].filter(Boolean).join("; ");
    if (e.length === 0)
      return f`
        <section class="lsg-empty" style=${u}>
          <p>أضف شريحة واحدة على الأقل (صورة أو منتج مرتبط) للبدء.</p>
        </section>
      `;
    const p = "m9 6 6 6-6 6", y = this._snaps(), S = this._snapIndex(this._restPos);
    return f`
      <section
        class="lsg-section"
        style=${u}
        data-enter=${o ? this._animState : "in"}
        data-dir=${this._isRtl ? "rtl" : "ltr"}
        @mouseenter=${this._onHoverIn}
        @mouseleave=${this._onHoverOut}
      >
        ${s || i ? f`
              <div class="lsg-header">
                <h2 class="lsg-title">
                  ${i ? f`<span class="lsg-pretitle">${i}</span>` : x}
                  ${s}
                </h2>
              </div>
            ` : x}

        <div
          class="lsg-stage"
          @pointerdown=${this._onPointerDown}
          @pointermove=${this._onPointerMove}
          @pointerup=${this._onPointerUp}
          @pointercancel=${this._onPointerUp}
        >
          <div class="lsg-track">
            ${e.map((_) => {
      const m = this._resolveProduct(_), P = _.image || (m == null ? void 0 : m.image) || "", b = this.localizedString(_.title) || (m == null ? void 0 : m.name) || "", w = typeof _.cta_url == "string" && _.cta_url.trim() || (m == null ? void 0 : m.url) || "", $ = this.localizedString(_.cta_label) || a;
      return f`
                <div class="lsg-slide">
                  <div class="lsg-wrap">
                    <div class="lsg-content">
                      ${P ? f`<img
                            class="lsg-img"
                            src=${P}
                            alt=${b}
                            loading="lazy"
                            draggable="false"
                          />` : f`<div class="lsg-img-empty"></div>`}
                      ${n && (b || w) ? f`
                            <div class="lsg-overlay">
                              ${b ? f`<span class="lsg-name">${b}</span>` : x}
                              ${w ? f`<a
                                    class="lsg-cta"
                                    href=${w}
                                    draggable="false"
                                    >${$}</a
                                  >` : x}
                            </div>
                          ` : x}
                    </div>
                  </div>
                </div>
              `;
    })}
          </div>

          ${g ? f`
                <button
                  class="lsg-nav lsg-nav-prev"
                  type="button"
                  @click=${this._goPrev}
                  ?disabled=${!c && S <= 0}
                  aria-label="Previous"
                >
                  <svg viewBox="0 0 24 24"><path d=${p} /></svg>
                </button>
                <button
                  class="lsg-nav lsg-nav-next"
                  type="button"
                  @click=${this._goNext}
                  ?disabled=${!c && S >= y.length - 1}
                  aria-label="Next"
                >
                  <svg viewBox="0 0 24 24"><path d=${p} /></svg>
                </button>
              ` : x}
        </div>
      </section>
    `;
  }
};
N.styles = W;
let v = N;
M([
  Y({ type: Object })
], v.prototype, "config");
M([
  R()
], v.prototype, "_animState");
M([
  R()
], v.prototype, "_restPos");
typeof v < "u" && v.registerSallaComponent("salla-lifestyle-gallery");
export {
  v as default
};
