import { html, nothing, type PropertyValues } from "lit";
import { property, state } from "lit/decorators.js";
import { GrowthElement } from "../../shared/growth-element";
import {
  fetchProductDetails,
  pickerSelection,
  sallaGlobal,
} from "../../shared/product";
import type {
  GalleryConfig,
  GallerySlideItem,
} from "./types";
import { galleryStyles } from "./style";

/** Product shape after we fetch full details from the Salla SDK. */
interface ResolvedProduct {
  name: string;
  image?: string;
  imageAlt?: string;
  url: string;
}

interface StageMetrics {
  /** Stage inner width in px. */
  width: number;
  /** Visible slides (fractional on small screens, e.g. 1.2). */
  spv: number;
  gap: number;
  slideSize: number;
  /** slideSize + gap — one layout slot. */
  slotSize: number;
}

/** Fraction of a slot the "large" (second-to-edge) slide keeps. */
const SPLIT_RATIO = 0.65;
/** Images zoom up to this as their window narrows (parallax crop). */
const IMAGE_SCALE = 1.25;
/** Snap animation duration — matches the reference's speed: 600. */
const SNAP_MS = 600;

/**
 * <growth-lifestyle-gallery> — Lifestyle Gallery (معرض لايف ستايل)
 * Part of the Growth Kit bundle for Salla Twilight.
 *
 * A "Material You" style product gallery: slides sit in fixed layout slots
 * while an inner window per slide animates its width between a small ratio
 * (0.35), a large ratio (0.65) and full size as you drag. The fixed-width
 * image stays centered inside the window, so it gets cropped symmetrically —
 * the signature material split/reveal effect. Vanilla port of the effect
 * (no Swiper), drag + snap done with pointer events and an rAF tween.
 */
export default class GrowthLifestyleGallery extends GrowthElement {
  static styles = galleryStyles;


  @property({ type: Object })
  config?: GalleryConfig;

  /** Drives the entrance fade-in. */
  @state() private _animState: "ready" | "in" = "in";
  /** Snapped position — re-renders nav button disabled states. */
  @state() private _restPos = 0;

  /** Continuous scroll position in slot units (0 = first slide at start). */
  private _pos = 0;
  private _metrics: StageMetrics | null = null;
  private _isRtl = false;

  /** In-flight CSS snap transition (for interrupting + nav state). */
  private _animating = false;
  private _animFrom = 0;
  private _animTarget = 0;
  private _animStart = 0;
  private _animDur = 0;
  private _animTimer: number | null = null;

  private _resizeObserver: ResizeObserver | null = null;
  private _autoplayTimer: number | null = null;
  private _hoverPaused = false;

  /** Drag tracking. */
  private _pointerId: number | null = null;
  private _dragging = false;
  private _dragStartX = 0;
  private _dragStartY = 0;
  private _dragStartPos = 0;
  private _dragStartTime = 0;

  /** Cached element refs, refreshed after each render. */
  private _stageEl: HTMLElement | null = null;
  private _wrapEls: HTMLElement[] = [];
  private _imgEls: (HTMLElement | null)[] = [];
  private _overlayEls: (HTMLElement | null)[] = [];

  // ------------------------------------------------------------
  // Helpers
  // ------------------------------------------------------------


  private _slides(): GallerySlideItem[] {
    const list = this.config?.slides;
    if (!Array.isArray(list)) return [];
    return list.filter((s) => {
      if (!s || typeof s !== "object") return false;
      return !!(s.image || s.product);
    });
  }

  // ------------------------------------------------------------
  // Product resolution (same pattern as the Collection component)
  // ------------------------------------------------------------

  private _productCache = new Map<
    number,
    | { status: "loading"; label: string }
    | { status: "loaded"; data: ResolvedProduct }
    | { status: "failed" }
  >();


  private async _fetchProduct(id: number, label: string) {
    if (this._productCache.has(id)) return;

    this._productCache.set(id, { status: "loading", label });
    this.requestUpdate();

    if (!sallaGlobal()) {
      // No SDK (e.g. local Vite demo) — keep the loading state so the
      // picker label still renders instead of the card vanishing.
      return;
    }

    try {
      const data = await fetchProductDetails(id, label);
      this._productCache.set(id, { status: "loaded", data });
    } catch (err) {
      console.warn("[growth-lifestyle-gallery] product fetch failed", id, err);
      this._productCache.set(id, { status: "failed" });
    }
    this.requestUpdate();
  }

  private _resolveProduct(slide: GallerySlideItem): ResolvedProduct | null {
    const sel = pickerSelection(slide.product);
    if (!sel) return null;
    const cached = this._productCache.get(sel.id);
    if (!cached) {
      void this._fetchProduct(sel.id, sel.label);
      return sel.label ? { name: sel.label, url: "", image: undefined } : null;
    }
    if (cached.status === "loaded") return cached.data;
    if (cached.status === "loading")
      return cached.label
        ? { name: cached.label, url: "", image: undefined }
        : null;
    return null;
  }

  // ------------------------------------------------------------
  // Lifecycle
  // ------------------------------------------------------------

  connectedCallback() {
    super.connectedCallback();

    const reduceMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;
    const animDisabled = this.config?.enable_entrance_anim === false;

    if (reduceMotion || animDisabled) {
      this._animState = "in";
    } else {
      this._animState = "ready";
      // Double rAF so the browser paints the "ready" frame first, then animates.
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          this._animState = "in";
        });
      });
    }
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    this._teardownAutoplay();
    this._stopTransition();
    this._resizeObserver?.disconnect();
    this._resizeObserver = null;
  }

  willUpdate(changed: PropertyValues) {
    if (!changed.has("config")) return;
    this._teardownAutoplay();
    this._setupAutoplay();
  }

  firstUpdated() {
    const stage = this.renderRoot.querySelector<HTMLElement>(".lsg-stage");
    if (stage) {
      this._resizeObserver = new ResizeObserver(() => this._onResize());
      this._resizeObserver.observe(stage);
      // After a real drag, swallow the click so CTA links don't fire.
      stage.addEventListener(
        "click",
        (e) => {
          if (this._dragging) {
            e.preventDefault();
            e.stopPropagation();
          }
        },
        true
      );
    }
  }

  updated() {
    this._cacheEls();
    this._measure();
    // While a CSS snap transition is in flight the target styles are already
    // set — re-applying with duration 0 would kill the animation mid-frame.
    if (!this._animating) this._applyEffect(0);
  }

  // ------------------------------------------------------------
  // Measurement
  // ------------------------------------------------------------

  private _cacheEls() {
    this._stageEl = this.renderRoot.querySelector<HTMLElement>(".lsg-stage");
    const slides = Array.from(
      this.renderRoot.querySelectorAll<HTMLElement>(".lsg-slide")
    );
    this._wrapEls = [];
    this._imgEls = [];
    this._overlayEls = [];
    for (const slide of slides) {
      this._wrapEls.push(slide.querySelector<HTMLElement>(".lsg-wrap")!);
      this._imgEls.push(slide.querySelector<HTMLElement>(".lsg-img"));
      this._overlayEls.push(slide.querySelector<HTMLElement>(".lsg-overlay"));
    }
  }

  private _desktopSpv(): number {
    const v = this._pickValue<"2" | "3">(this.config?.desktop_slides, "3");
    return v === "2" ? 2 : 3;
  }

  private _measure() {
    const stage = this._stageEl;
    if (!stage) {
      this._metrics = null;
      return;
    }
    const width = stage.clientWidth;
    if (!width) {
      this._metrics = null;
      return;
    }
    this._isRtl = getComputedStyle(this).direction === "rtl";

    // Same density ladder as the reference page's breakpoints.
    let spv: number;
    let gap: number;
    if (width < 480) {
      spv = 1.2;
      gap = 10;
    } else if (width < 768) {
      spv = 1.5;
      gap = 12;
    } else if (width < 1024) {
      spv = 2;
      gap = 16;
    } else {
      spv = this._desktopSpv();
      gap = 16;
    }

    const slideSize = (width - gap * (spv - 1)) / spv;
    this._metrics = { width, spv, gap, slideSize, slotSize: slideSize + gap };

    stage.style.setProperty("--lsg-slide-w", `${slideSize}px`);
    stage.style.setProperty("--lsg-gap", `${gap}px`);
    stage.style.setProperty("--lsg-slide-size", `${slideSize}px`);
  }

  private _onResize() {
    this._stopTransition();
    this._measure();
    // Keep the gallery resting on a valid snap for the new geometry.
    this._pos = this._nearestSnap(this._normalize(this._pos));
    this._restPos = this._pos;
    this._applyEffect(0);
  }

  private _loop(): boolean {
    return this.config?.loop === true && this._slides().length > 1;
  }

  /** Wraps a loop position back into [0, count). No-op when not looping. */
  private _normalize(pos: number): number {
    if (!this._loop()) return pos;
    const count = this._slides().length;
    return ((pos % count) + count) % count;
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
  private _snaps(): number[] {
    const count = this._slides().length;
    const m = this._metrics;
    if (!m || count === 0) return [0];
    const maxPos = Math.max(0, count - m.spv);
    const snaps: number[] = [];
    for (let i = 0; i < count; i++) {
      const p = Math.min(i, maxPos);
      if (snaps.length === 0 || p > snaps[snaps.length - 1] + 1e-4)
        snaps.push(p);
    }
    if (m.spv > 1 && count > 1 && SPLIT_RATIO < 1)
      snaps.push(snaps[snaps.length - 1] + 1);
    return snaps;
  }

  private _nearestSnap(pos: number): number {
    if (this._loop()) return Math.round(pos);
    const snaps = this._snaps();
    let best = snaps[0];
    for (const s of snaps)
      if (Math.abs(s - pos) < Math.abs(best - pos)) best = s;
    return best;
  }

  private _snapIndex(pos: number): number {
    const snaps = this._snaps();
    let best = 0;
    for (let i = 0; i < snaps.length; i++)
      if (Math.abs(snaps[i] - pos) < Math.abs(snaps[best] - pos)) best = i;
    return best;
  }

  /** One snap forward/backward from `base` — unbounded when looping. */
  private _stepTarget(base: number, dir: 1 | -1): number {
    if (this._loop()) return Math.round(base) + dir;
    const snaps = this._snaps();
    const idx = Math.max(
      0,
      Math.min(snaps.length - 1, this._snapIndex(base) + dir)
    );
    return snaps[idx];
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
  private _computeSlide(
    q: number,
    i: number
  ): { scale: number; translate: number } {
    const m = this._metrics!;
    const { spv, gap, slideSize, slotSize, width } = m;
    const r = SPLIT_RATIO;
    const s = 1 - r;
    const d = s === 0 ? 0 : gap / slideSize;

    let scale = 0;
    let x = 0; // window's desired inline-start position, logical px

    if (q <= 0) {
      // Exiting slide: pinned at the start edge, window collapsing.
      scale = 1 + q;
      x = 0;
    }
    if (spv === 1) {
      if (q > 0) {
        scale = 1 - q;
        x = width * Math.min(q, 1);
      }
    } else {
      // Fully open slides.
      if (q > 0 && q <= spv - 2) {
        scale = 1;
        x = q * slotSize;
      }
      // large → current (0.65 → 1)
      if (q > spv - 2 && q <= spv - 1) {
        scale = r - d + (s + 2 * d) * (spv - 1 - Math.abs(q));
        x = q * slotSize;
      }
      // small → large (0.35 → 0.65)
      if (q > spv - 1 && q <= spv) {
        const cp = spv - Math.abs(q);
        scale = s - d + (r - s) * cp;
        x = q * slotSize - slideSize * (s + d) * (1 - cp);
      }
      // zero → small (0 → 0.35), pinned at the end edge
      if (q > spv) {
        let cp = spv + 1 - Math.abs(q);
        let translateAdd = 0;
        scale = 0;
        if (cp >= 0) {
          cp = Math.max(Math.min(-d * 2 + cp * (1 + 2 * d), 1), 0);
          scale = (s - d) * cp;
          translateAdd = -cp * (s + d) * slideSize + cp * gap;
        }
        x = width * Math.min(q, 1) + translateAdd;
      }
    }

    scale = Math.min(Math.max(scale, 0.00001), 1);
    // Static layout puts the slide at i*slotSize — translate covers the rest.
    return { scale, translate: x - i * slotSize };
  }

  /** Loop wrap for resting/dragging — window (-1, count-1]: a slide mid-exit
      keeps its negative q, while the seam slide stays parked at the far end
      (and stays visible as the trailing sliver when count = spv+1). */
  private _wrapQ(v: number): number {
    const count = this._wrapEls.length;
    let q = ((v % count) + count) % count;
    if (q > count - 1) q -= count;
    return q;
  }

  /** Loop wrap for snap transitions — window [-1, count-1): here the slide
      one slot before the anchor must take the exiting role (q = -1, collapse
      at the start edge), not sit at the far end. */
  private _wrapT(v: number): number {
    const count = this._wrapEls.length;
    return ((((v + 1) % count) + count) % count) - 1;
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
  private _applyEffect(duration = 0, anchor?: number) {
    const m = this._metrics;
    if (!m || this._wrapEls.length === 0) return;
    const count = this._wrapEls.length;
    const loop = this._loop();
    const activeIdx = Math.max(
      0,
      Math.min(count - 1, this._normalize(Math.round(this._pos)))
    );
    // Below 2 slides per view there's no room for every caption — show the
    // overlay on the active slide only (the reference does the same ≤768px).
    const overlayActiveOnly = m.spv < 2;
    const durationMs = `${duration}ms`;

    for (let i = 0; i < count; i++) {
      let q: number;
      if (!loop) q = i - this._pos;
      else if (anchor === undefined) q = this._wrapQ(i - this._pos);
      else q = this._wrapT(i - anchor) + (anchor - this._pos);
      const { scale, translate } = this._computeSlide(q, i);
      const wrap = this._wrapEls[i];
      wrap.style.transitionDuration = durationMs;
      wrap.style.width = `${scale * 100}%`;
      wrap.style.transform = `translate3d(${
        this._isRtl ? -translate : translate
      }px, 0, 0)`;

      const img = this._imgEls[i];
      if (img) {
        // Image zooms as its window narrows — the parallax crop.
        img.style.transitionDuration = durationMs;
        img.style.transform = `scale(${1 + (IMAGE_SCALE - 1) * (1 - scale)})`;
      }

      const overlay = this._overlayEls[i];
      if (overlay) {
        overlay.style.opacity =
          !overlayActiveOnly || i === activeIdx ? "1" : "0";
      }
    }
  }

  // ------------------------------------------------------------
  // Snap transitions
  // ------------------------------------------------------------

  private _stopTransition() {
    this._animating = false;
    if (this._animTimer !== null) {
      clearTimeout(this._animTimer);
      this._animTimer = null;
    }
  }

  /**
   * The position the user currently *sees*. While a snap transition is in
   * flight this is estimated from elapsed time with the same easeOutCubic
   * curve as the CSS `--lsg-snap-ease`, so a grab mid-animation can freeze
   * the slides where they visually are.
   */
  private _currentPos(): number {
    if (!this._animating) return this._pos;
    const t = Math.min(
      (performance.now() - this._animStart) / this._animDur,
      1
    );
    const k = 1 - (1 - t) ** 3;
    return this._animFrom + (this._animTarget - this._animFrom) * k;
  }

  private _transitionTo(target: number, duration = SNAP_MS) {
    const from = this._currentPos();
    this._stopTransition();
    this._restPos = this._normalize(target);
    if (Math.abs(target - from) < 1e-4) {
      this._pos = this._normalize(target);
      this._applyEffect(0);
      return;
    }
    this._animFrom = from;
    this._animTarget = target;
    this._animStart = performance.now();
    this._animDur = duration;
    this._animating = true;

    if (this._loop()) {
      // Swiper's loopFix, virtually: invisibly restyle the *current* state in
      // the target's frame of reference (duration 0 + forced reflow), so the
      // upcoming transition moves every slide through adjacent positions
      // instead of flying wrapped slides across the stage.
      this._pos = from;
      this._applyEffect(0, target);
      void this._stageEl?.offsetWidth;
    }

    this._pos = target;
    this._applyEffect(duration, target);
    this._animTimer = window.setTimeout(() => {
      this._animating = false;
      this._animTimer = null;
      // Wrap loop overshoot back into range and re-anchor the wrapping —
      // only edge-parked invisible slides move.
      this._pos = this._normalize(target);
      this._applyEffect(0);
    }, duration);
  }

  // ------------------------------------------------------------
  // Drag / swipe
  // ------------------------------------------------------------

  private _onPointerDown = (e: PointerEvent) => {
    if (this._slides().length <= 1) return;
    if (e.pointerType === "mouse" && e.button !== 0) return;
    this._pointerId = e.pointerId;
    this._dragging = false;
    this._dragStartX = e.clientX;
    this._dragStartY = e.clientY;
    // Grabbing mid-snap: freeze the slides where they visually are.
    if (this._animating) {
      this._pos = this._currentPos();
      this._stopTransition();
      this._applyEffect(0);
    }
    this._dragStartPos = this._pos;
    this._dragStartTime = performance.now();
  };

  private _onPointerMove = (e: PointerEvent) => {
    if (this._pointerId !== e.pointerId) return;
    const m = this._metrics;
    if (!m) return;
    const dx = e.clientX - this._dragStartX;
    const dy = e.clientY - this._dragStartY;

    if (!this._dragging) {
      if (Math.abs(dx) < 6 || Math.abs(dx) < Math.abs(dy)) return;
      this._dragging = true;
      this._stageEl?.classList.add("is-dragging");
      this._stageEl?.setPointerCapture(e.pointerId);
    }

    // Forward = finger toward inline-start (left in LTR, right in RTL).
    const delta = (this._isRtl ? dx : -dx) / m.slotSize;
    let pos = this._dragStartPos + delta;

    // Rubber-band past the edges (loop mode has no edges).
    if (!this._loop()) {
      const snaps = this._snaps();
      const maxPos = snaps[snaps.length - 1];
      if (pos < 0) pos *= 0.3;
      else if (pos > maxPos) pos = maxPos + (pos - maxPos) * 0.3;
    }

    this._pos = pos;
    this._applyEffect(0);
  };

  private _onPointerUp = (e: PointerEvent) => {
    if (this._pointerId !== e.pointerId) return;
    this._pointerId = null;
    this._stageEl?.classList.remove("is-dragging");

    if (!this._dragging) return;

    const moved = this._pos - this._dragStartPos;
    const elapsed = performance.now() - this._dragStartTime;
    // Flick → advance one snap in the flick's direction; slow drag → nearest.
    const target =
      elapsed < 300 && Math.abs(moved) > 0.05
        ? this._stepTarget(this._dragStartPos, moved > 0 ? 1 : -1)
        : this._nearestSnap(this._pos);
    this._transitionTo(target);

    // Keep `_dragging` truthy through the imminent click event so the
    // capture handler can swallow it, then clear.
    window.setTimeout(() => {
      this._dragging = false;
    }, 50);
  };

  // ------------------------------------------------------------
  // Nav buttons + autoplay
  // ------------------------------------------------------------

  private _goBy(dir: 1 | -1) {
    this._transitionTo(this._stepTarget(this._restPos, dir));
  }

  private _goPrev = () => this._goBy(-1);
  private _goNext = () => this._goBy(1);

  private _setupAutoplay() {
    const c = this.config || {};
    if (!c.autoplay) return;
    if (this._slides().length < 2) return;
    const delaySec = Math.max(2, this._num(c.autoplay_delay, 4));
    this._autoplayTimer = window.setInterval(() => {
      if (this._hoverPaused || this._dragging || this._pointerId !== null)
        return;
      if (this._loop()) {
        this._transitionTo(Math.round(this._restPos) + 1);
        return;
      }
      const snaps = this._snaps();
      const idx = this._snapIndex(this._restPos);
      // Without loop, rewind to the start after the last snap.
      const next = idx >= snaps.length - 1 ? 0 : idx + 1;
      this._transitionTo(snaps[next]);
    }, delaySec * 1000);
  }

  private _teardownAutoplay() {
    if (this._autoplayTimer) {
      clearInterval(this._autoplayTimer);
      this._autoplayTimer = null;
    }
  }

  private _onHoverIn = () => {
    this._hoverPaused = true;
  };
  private _onHoverOut = () => {
    this._hoverPaused = false;
  };

  // ------------------------------------------------------------
  // Render
  // ------------------------------------------------------------

  render() {
    const c: GalleryConfig = this.config || {};
    const slides = this._slides();

    const title = this._t(c.section_title);
    const pretitle = this._t(c.section_pretitle);
    const showOverlay = c.show_overlay !== false;
    const defaultCtaLabel = this._t(c.default_cta_label) || "اكتشف المنتج";
    // Arrows are opt-in (bundle default is off — the reference is drag-only).
    const showNav = c.show_nav_buttons === true && slides.length > 1;
    const loop = this._loop();
    const enableAnim = c.enable_entrance_anim !== false;
    const radius = this._num(this._pickValue(c.card_radius, "32"), 32);
    const heightMobile = this._num(
      this._pickValue(c.height_mobile, "420"),
      420
    );
    const heightDesktopRaw = this._pickValue(c.height_desktop, "inherit");

    const hostStyle = [
      c.bg_color ? `--lsg-bg: ${c.bg_color}` : "",
      c.title_color ? `--lsg-title-color: ${c.title_color}` : "",
      c.overlay_text_color
        ? `--lsg-overlay-color: ${c.overlay_text_color}`
        : "",
      `--lsg-radius: ${radius}px`,
      `--lsg-h-mobile: ${heightMobile}px`,
      heightDesktopRaw !== "inherit"
        ? `--lsg-h-desktop: ${this._num(heightDesktopRaw, heightMobile)}px`
        : "",
    ]
      .filter(Boolean)
      .join("; ");

    if (slides.length === 0) {
      return html`
        <section class="lsg-empty" style=${hostStyle}>
          <p>أضف شريحة واحدة على الأقل (صورة أو منتج مرتبط) للبدء.</p>
        </section>
      `;
    }

    const chevronPath = "m9 6 6 6-6 6";
    const snaps = this._snaps();
    const restIdx = this._snapIndex(this._restPos);

    return html`
      <section
        class="lsg-section"
        style=${hostStyle}
        data-enter=${enableAnim ? this._animState : "in"}
        data-dir=${this._isRtl ? "rtl" : "ltr"}
        @mouseenter=${this._onHoverIn}
        @mouseleave=${this._onHoverOut}
      >
        ${title || pretitle
          ? html`
              <div class="lsg-header">
                <h2 class="lsg-title">
                  ${pretitle
                    ? html`<span class="lsg-pretitle">${pretitle}</span>`
                    : nothing}
                  ${title}
                </h2>
              </div>
            `
          : nothing}

        <div
          class="lsg-stage"
          @pointerdown=${this._onPointerDown}
          @pointermove=${this._onPointerMove}
          @pointerup=${this._onPointerUp}
          @pointercancel=${this._onPointerUp}
        >
          <div class="lsg-track">
            ${slides.map((slide) => {
              const product = this._resolveProduct(slide);
              const image = slide.image || product?.image || "";
              const name = this._t(slide.title) || product?.name || "";
              const href =
                (typeof slide.cta_url === "string" && slide.cta_url.trim()) ||
                product?.url ||
                "";
              const ctaLabel = this._t(slide.cta_label) || defaultCtaLabel;
              return html`
                <div class="lsg-slide">
                  <div class="lsg-wrap">
                    <div class="lsg-content">
                      ${image
                        ? html`<img
                            class="lsg-img"
                            src=${image}
                            alt=${name}
                            loading="lazy"
                            draggable="false"
                          />`
                        : html`<div class="lsg-img-empty"></div>`}
                      ${showOverlay && (name || href)
                        ? html`
                            <div class="lsg-overlay">
                              ${name
                                ? html`<span class="lsg-name">${name}</span>`
                                : nothing}
                              ${href
                                ? html`<a
                                    class="lsg-cta"
                                    href=${href}
                                    draggable="false"
                                    >${ctaLabel}</a
                                  >`
                                : nothing}
                            </div>
                          `
                        : nothing}
                    </div>
                  </div>
                </div>
              `;
            })}
          </div>

          ${showNav
            ? html`
                <button
                  class="lsg-nav lsg-nav-prev"
                  type="button"
                  @click=${this._goPrev}
                  ?disabled=${!loop && restIdx <= 0}
                  aria-label="Previous"
                >
                  <svg viewBox="0 0 24 24"><path d=${chevronPath} /></svg>
                </button>
                <button
                  class="lsg-nav lsg-nav-next"
                  type="button"
                  @click=${this._goNext}
                  ?disabled=${!loop && restIdx >= snaps.length - 1}
                  aria-label="Next"
                >
                  <svg viewBox="0 0 24 24"><path d=${chevronPath} /></svg>
                </button>
              `
            : nothing}
        </div>
      </section>
    `;
  }
}
