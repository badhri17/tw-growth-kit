import { LitElement as O, css as j, html as _, nothing as x } from "lit";
import { property as L, state as D } from "lit/decorators.js";
function Y(r, t) {
  if (typeof r == "string") return r;
  if (!r || typeof r != "object") return "";
  const e = r[t] || r.ar || r.en || "";
  return typeof e == "string" ? e.trim() : "";
}
function $(r) {
  return r.replace(/[٠-٩]/g, (t) => String(t.charCodeAt(0) - 1632)).replace(/[۰-۹]/g, (t) => String(t.charCodeAt(0) - 1776));
}
class B extends O {
  /**
   * Twilight transform injects `Component.registerSallaComponent(...)`.
   * Statics inherit, so `this` is the concrete component. The polling
   * fallback handles preview contexts where `Salla` loads after the
   * component file executes.
   */
  static registerSallaComponent(t) {
    const e = String(t || "").trim(), s = e.toLowerCase().replace(/[^a-z0-9._-]/g, "-"), i = s.includes("-") ? s : `salla-${s || "component"}`, n = () => `${i}-${Math.random().toString(36).substring(2, 8)}`, a = () => {
      var o;
      const g = (o = window.Salla) == null ? void 0 : o.bundles;
      return g && typeof g.registerComponent == "function" ? (g.registerComponent(e, {
        component: this,
        dynamicTagName: n()
      }), !0) : !1;
    };
    if (a()) return;
    const d = window.setInterval(() => {
      a() && window.clearInterval(d);
    }, 100);
    window.setTimeout(() => window.clearInterval(d), 5e3);
  }
  /** Resolved document language. */
  _lang() {
    return (document.documentElement.lang || "ar").toLowerCase().startsWith("en") ? "en" : "ar";
  }
  /** Pull the store-language string out of a Salla multilanguage value. */
  localizedString(t) {
    return Y(t, this._lang());
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
    return $(t);
  }
  /** Coerce a config number that may arrive as a string (Arabic-Indic
      digits included) or as a [{ value }] dropdown selection. */
  _num(t, e) {
    if (typeof t == "number" && !Number.isNaN(t)) return t;
    if (typeof t == "string" && t.trim() !== "") {
      const s = Number($(t.trim()));
      if (!Number.isNaN(s)) return s;
    }
    if (Array.isArray(t) && t.length > 0) {
      const s = t[0];
      if ((s == null ? void 0 : s.value) !== void 0) return this._num(s.value, e);
    }
    return e;
  }
}
function R() {
  const r = window;
  return r.salla ?? r.Salla ?? null;
}
function F(r) {
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
function z(r) {
  if (typeof r == "number") return Number.isNaN(r) ? void 0 : r;
  if (r && typeof r == "object") {
    const s = r;
    return z(s.amount ?? s.value ?? s.price);
  }
  if (typeof r != "string") return;
  const t = $(r).replace(/[^0-9.,]/g, "").replace(/,/g, "");
  if (!t) return;
  const e = parseFloat(t);
  return Number.isNaN(e) ? void 0 : e;
}
async function U(r, t = "") {
  var S, y, m, P, b, w, k, M, N, A, C;
  const e = R();
  if (!e) throw new Error("Salla SDK unavailable");
  typeof e.onReady == "function" && await e.onReady();
  const s = ((S = e.product) == null ? void 0 : S.getDetails) ?? ((m = (y = e.product) == null ? void 0 : y.api) == null ? void 0 : m.getDetails);
  if (typeof s != "function")
    throw new Error("getDetails unavailable");
  const i = await s.call(e.product, r), n = (i == null ? void 0 : i.data) ?? i;
  if (!n) throw new Error("empty product payload");
  const a = ((P = n.image) == null ? void 0 : P.url) || ((b = n.image) == null ? void 0 : b.thumbnail) || Array.isArray(n.images) && (((w = n.images[0]) == null ? void 0 : w.url) || n.images[0]) || n.thumbnail || n.main_image || "", d = n.url || ((k = n.urls) == null ? void 0 : k.customer) || ((M = n.urls) == null ? void 0 : M.product) || n.permalink || `/p${r}`, g = z(n.price), o = z(n.regular_price), l = z(n.sale_price);
  let c = o ?? g, h = g ?? o;
  l !== void 0 && l > 0 && (h = l, (c === void 0 || c <= l) && (c = o ?? g ?? l));
  const p = (!!(n.is_on_sale ?? n.on_sale ?? n.has_offer) || l !== void 0) && c !== void 0 && h !== void 0 && h < c, f = n.currency || ((N = n.price) == null ? void 0 : N.currency) || ((A = n.regular_price) == null ? void 0 : A.currency) || void 0;
  return {
    name: String(n.name || n.title || t || `#${r}`),
    image: a || void 0,
    imageAlt: String(((C = n.image) == null ? void 0 : C.alt) || n.name || ""),
    url: d,
    regular: c,
    sale: p ? h : void 0,
    onSale: p,
    currency: f
  };
}
const V = j`
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
    padding: clamp(2.5rem, 6vw, 4rem) clamp(1rem, 3vw, 1.5rem);
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
`;
var X = Object.defineProperty, T = (r, t, e, s) => {
  for (var i = void 0, n = r.length - 1, a; n >= 0; n--)
    (a = r[n]) && (i = a(t, e, i) || i);
  return i && X(t, e, i), i;
};
const I = 0.65, H = 1.25, W = 600, E = class E extends B {
  constructor() {
    super(...arguments), this._animState = "in", this._restPos = 0, this._pos = 0, this._metrics = null, this._isRtl = !1, this._animating = !1, this._animFrom = 0, this._animTarget = 0, this._animStart = 0, this._animDur = 0, this._animTimer = null, this._resizeObserver = null, this._autoplayTimer = null, this._hoverPaused = !1, this._pointerId = null, this._dragging = !1, this._dragStartX = 0, this._dragStartY = 0, this._dragStartPos = 0, this._dragStartTime = 0, this._stageEl = null, this._wrapEls = [], this._imgEls = [], this._overlayEls = [], this._productCache = /* @__PURE__ */ new Map(), this._onPointerDown = (t) => {
      this._slides().length <= 1 || t.pointerType === "mouse" && t.button !== 0 || (this._pointerId = t.pointerId, this._dragging = !1, this._dragStartX = t.clientX, this._dragStartY = t.clientY, this._animating && (this._pos = this._currentPos(), this._stopTransition(), this._applyEffect(0)), this._dragStartPos = this._pos, this._dragStartTime = performance.now());
    }, this._onPointerMove = (t) => {
      var d, g;
      if (this._pointerId !== t.pointerId) return;
      const e = this._metrics;
      if (!e) return;
      const s = t.clientX - this._dragStartX, i = t.clientY - this._dragStartY;
      if (!this._dragging) {
        if (Math.abs(s) < 6 || Math.abs(s) < Math.abs(i)) return;
        this._dragging = !0, (d = this._stageEl) == null || d.classList.add("is-dragging"), (g = this._stageEl) == null || g.setPointerCapture(t.pointerId);
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
    if (!this._productCache.has(t) && (this._productCache.set(t, { status: "loading", label: e }), this.requestUpdate(), !!R())) {
      try {
        const s = await U(t, e);
        this._productCache.set(t, { status: "loaded", data: s });
      } catch (s) {
        console.warn("[growth-lifestyle-gallery] product fetch failed", t, s), this._productCache.set(t, { status: "failed" });
      }
      this.requestUpdate();
    }
  }
  _resolveProduct(t) {
    const e = F(t.product);
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
    super.disconnectedCallback(), this._teardownAutoplay(), this._stopTransition(), (t = this._resizeObserver) == null || t.disconnect(), this._resizeObserver = null;
  }
  willUpdate(t) {
    t.has("config") && (this._teardownAutoplay(), this._setupAutoplay());
  }
  firstUpdated() {
    const t = this.renderRoot.querySelector(".lsg-stage");
    t && (this._resizeObserver = new ResizeObserver(() => this._onResize()), this._resizeObserver.observe(t), t.addEventListener(
      "click",
      (e) => {
        this._dragging && (e.preventDefault(), e.stopPropagation());
      },
      !0
    ));
  }
  updated() {
    this._cacheEls(), this._measure(), this._animating || this._applyEffect(0);
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
    return e.spv > 1 && t > 1 && I < 1 && i.push(i[i.length - 1] + 1), i;
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
    const s = this._metrics, { spv: i, gap: n, slideSize: a, slotSize: d, width: g } = s, o = I, l = 1 - o, c = n / a;
    let h = 0, u = 0;
    if (t <= 0 && (h = 1 + t, u = 0), i === 1)
      t > 0 && (h = 1 - t, u = g * Math.min(t, 1));
    else {
      if (t > 0 && t <= i - 2 && (h = 1, u = t * d), t > i - 2 && t <= i - 1 && (h = o - c + (l + 2 * c) * (i - 1 - Math.abs(t)), u = t * d), t > i - 1 && t <= i) {
        const p = i - Math.abs(t);
        h = l - c + (o - l) * p, u = t * d - a * (l + c) * (1 - p);
      }
      if (t > i) {
        let p = i + 1 - Math.abs(t), f = 0;
        h = 0, p >= 0 && (p = Math.max(Math.min(-c * 2 + p * (1 + 2 * c), 1), 0), h = (l - c) * p, f = -p * (l + c) * a + p * n), u = g * Math.min(t, 1) + f;
      }
    }
    return h = Math.min(Math.max(h, 1e-5), 1), { scale: h, translate: u - e * d };
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
    ), d = s.spv < 2, g = `${t}ms`;
    for (let o = 0; o < i; o++) {
      let l;
      n ? e === void 0 ? l = this._wrapQ(o - this._pos) : l = this._wrapT(o - e) + (e - this._pos) : l = o - this._pos;
      const { scale: c, translate: h } = this._computeSlide(l, o), u = this._wrapEls[o];
      u.style.transitionDuration = g, u.style.width = `${c * 100}%`, u.style.transform = `translate3d(${this._isRtl ? -h : h}px, 0, 0)`;
      const p = this._imgEls[o];
      p && (p.style.transitionDuration = g, p.style.transform = `scale(${1 + (H - 1) * (1 - c)})`);
      const f = this._overlayEls[o];
      f && (f.style.opacity = !d || o === a ? "1" : "0");
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
  _transitionTo(t, e = W) {
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
    const t = this.config || {}, e = this._slides(), s = this.localizedString(t.section_title), i = this.localizedString(t.section_pretitle), n = t.show_overlay !== !1, a = this.localizedString(t.default_cta_label) || "اكتشف المنتج", d = t.show_nav_buttons === !0 && e.length > 1, g = this._loop(), o = t.enable_entrance_anim !== !1, l = this._num(this._pickValue(t.card_radius, "32"), 32), c = this._num(
      this._pickValue(t.height_mobile, "420"),
      420
    ), h = this._pickValue(t.height_desktop, "inherit"), u = [
      t.bg_color ? `--lsg-bg: ${t.bg_color}` : "",
      t.title_color ? `--lsg-title-color: ${t.title_color}` : "",
      t.overlay_text_color ? `--lsg-overlay-color: ${t.overlay_text_color}` : "",
      `--lsg-radius: ${l}px`,
      `--lsg-h-mobile: ${c}px`,
      h !== "inherit" ? `--lsg-h-desktop: ${this._num(h, c)}px` : ""
    ].filter(Boolean).join("; ");
    if (e.length === 0)
      return _`
        <section class="lsg-empty" style=${u}>
          <p>أضف شريحة واحدة على الأقل (صورة أو منتج مرتبط) للبدء.</p>
        </section>
      `;
    const p = "m9 6 6 6-6 6", f = this._snaps(), S = this._snapIndex(this._restPos);
    return _`
      <section
        class="lsg-section"
        style=${u}
        data-enter=${o ? this._animState : "in"}
        data-dir=${this._isRtl ? "rtl" : "ltr"}
        @mouseenter=${this._onHoverIn}
        @mouseleave=${this._onHoverOut}
      >
        ${s || i ? _`
              <div class="lsg-header">
                <h2 class="lsg-title">
                  ${i ? _`<span class="lsg-pretitle">${i}</span>` : x}
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
            ${e.map((y) => {
      const m = this._resolveProduct(y), P = y.image || (m == null ? void 0 : m.image) || "", b = this.localizedString(y.title) || (m == null ? void 0 : m.name) || "", w = typeof y.cta_url == "string" && y.cta_url.trim() || (m == null ? void 0 : m.url) || "", k = this.localizedString(y.cta_label) || a;
      return _`
                <div class="lsg-slide">
                  <div class="lsg-wrap">
                    <div class="lsg-content">
                      ${P ? _`<img
                            class="lsg-img"
                            src=${P}
                            alt=${b}
                            loading="lazy"
                            draggable="false"
                          />` : _`<div class="lsg-img-empty"></div>`}
                      ${n && (b || w) ? _`
                            <div class="lsg-overlay">
                              ${b ? _`<span class="lsg-name">${b}</span>` : x}
                              ${w ? _`<a
                                    class="lsg-cta"
                                    href=${w}
                                    draggable="false"
                                    >${k}</a
                                  >` : x}
                            </div>
                          ` : x}
                    </div>
                  </div>
                </div>
              `;
    })}
          </div>

          ${d ? _`
                <button
                  class="lsg-nav lsg-nav-prev"
                  type="button"
                  @click=${this._goPrev}
                  ?disabled=${!g && S <= 0}
                  aria-label="Previous"
                >
                  <svg viewBox="0 0 24 24"><path d=${p} /></svg>
                </button>
                <button
                  class="lsg-nav lsg-nav-next"
                  type="button"
                  @click=${this._goNext}
                  ?disabled=${!g && S >= f.length - 1}
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
E.styles = V;
let v = E;
T([
  L({ type: Object })
], v.prototype, "config");
T([
  D()
], v.prototype, "_animState");
T([
  D()
], v.prototype, "_restPos");
typeof v < "u" && v.registerSallaComponent("salla-lifestyle-gallery");
export {
  v as default
};
