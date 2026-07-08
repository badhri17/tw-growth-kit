import { html, nothing, type PropertyValues } from "lit";
import { property, state } from "lit/decorators.js";
import { GrowthElement } from "../../shared/growth-element";
import type {
  CollectionConfig,
  CollectionAnimation,
  CollectionAspect,
  CollectionBagSize,
  CollectionDesktopLayout,
  CollectionDisplayMode,
  CollectionSlideItem,
  CollectionUseCase,
} from "./types";
import { collectionStyles } from "./style";

/**
 * <growth-collection> — Collection / Bundle slider (مكونات المجموعة)
 * Part of the Growth Kit bundle for Salla Twilight.
 *
 * Two surfaces, one component:
 *   • use_case: "home"   → curated collection slider; per-slide CTA links anywhere (product / category / page …).
 *   • use_case: "bundle" → "what's inside this kit" on a product page; info-only.
 *
 * Two animation modes:
 *   • simple → active slide scales up & saturates (360.html style).
 *   • reveal → swap a closed image for an opened image on the active slide
 *              (daily.html style). Slides without an `image_opened` fall back
 *              to the simple behaviour automatically.
 *
 * Two display modes:
 *   • carousel → the horizontal coverflow above (default).
 *   • bag      → "وضع الشنطة": a vertical stage where the active product
 *                rises out of a merchant-uploaded bag image while the
 *                previous one sinks back into it.
 */
export default class GrowthCollection extends GrowthElement {
  static styles = collectionStyles;


  @property({ type: Object })
  config?: CollectionConfig;

  @state() private _activeIndex = 0;
  /** Drives the header fade-in. */
  @state() private _animState: "ready" | "in" = "ready";
  /** Drives the caption fade — flips out → in when the active slide changes. */
  @state() private _captionState: "in" | "out" = "in";
  /** Bag mode: the slide currently sinking back into the bag. */
  @state() private _bagLeavingIndex: number | null = null;
  /** Bag mode: false until the first navigation, so the initial slide shows
      without playing the rise animation on page load. */
  @state() private _bagNavigated = false;
  /** Bag mode: measured h/w ratio of the tallest product image. */
  @state() private _bagProdRatio: number | null = null;
  /** Bag mode: measured h/w ratio of the bag image. */
  @state() private _bagImgRatio: number | null = null;

  private _autoplayTimer: number | null = null;
  private _captionTimer: number | null = null;
  private _hoverPaused = false;
  private _hasInitializedActive = false;
  /** Whether the section is visible — autoplay pauses while off-screen. */
  private _inView = true;
  private _io: IntersectionObserver | null = null;

  /** Swipe tracking on the track. */
  private _swipeStartX: number | null = null;
  private _swipeStartY: number | null = null;
  private _swipeActive = false;

  /** Last-rendered wrapped offset per slide index — lets us detect a slide
      that wrapped around the loop so we can snap it instead of flying it. */
  private _prevDiff = new Map<number, number>();

  // ------------------------------------------------------------
  // Helpers
  // ------------------------------------------------------------




  private _displayMode(): CollectionDisplayMode {
    return this._pickValue<CollectionDisplayMode>(
      this.config?.display_mode,
      "carousel"
    );
  }

  private _slides() {
    const list = this.config?.slides;
    if (!Array.isArray(list)) return [];
    return list.filter((s) => {
      if (!s || typeof s !== "object") return false;
      return !!(s.image || s.image_opened || s.link);
    });
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

  private _resolveLink(slide: CollectionSlideItem): string {
    const raw = slide.link;
    if (!raw) return "";
    const pick = Array.isArray(raw) ? raw[0] : raw;
    if (!pick) return "";
    const url =
      typeof pick === "string"
        ? pick
        : typeof pick === "object"
          ? String(
              (pick as Record<string, unknown>).url ??
                (pick as Record<string, unknown>).value ??
                ""
            )
          : "";
    const trimmed = url.trim();
    return trimmed && trimmed !== "#" ? trimmed : "";
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
      // Double rAF so the browser paints the "ready" frame first, then animates.
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          this._animState = "in";
        });
      });
    }

    // Pause autoplay when scrolled out of view (saves CPU and prevents the
    // slider from racing on a long page).
    if ("IntersectionObserver" in window) {
      this._io = new IntersectionObserver(
        (entries) => {
          const ent = entries[0];
          if (!ent) return;
          this._inView = ent.isIntersecting;
          this._teardownAutoplay();
          if (this._inView) this._setupAutoplay();
        },
        { threshold: 0.15 }
      );
      this._io.observe(this);
    }
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    this._teardownAutoplay();
    this._io?.disconnect();
    this._io = null;
    if (this._captionTimer) {
      clearTimeout(this._captionTimer);
      this._captionTimer = null;
    }
  }

  willUpdate(changed: PropertyValues) {
    if (!changed.has("config")) return;

    const slides = this._slides();
    if (!this._hasInitializedActive && slides.length > 0) {
      const wanted = this._num(this.config?.initial_slide, NaN);
      // Bag mode reads top-to-bottom like a story — start at the first slide;
      // the coverflow starts centered so both neighbours peek in.
      const autoStart =
        this._displayMode() === "bag" ? 0 : Math.floor(slides.length / 2);
      const start = Number.isNaN(wanted)
        ? autoStart
        : Math.max(0, Math.min(slides.length - 1, Math.round(wanted) - 1));
      this._activeIndex = start;
      this._hasInitializedActive = true;
    } else if (this._activeIndex >= slides.length) {
      this._activeIndex = Math.max(0, slides.length - 1);
    }

    this._teardownAutoplay();
    this._setupAutoplay();
  }

  updated() {
    // Snapshot where each slide ended up so the next render can tell which
    // slide wrapped around the loop (see the `instant` check in render).
    const n = this._slides().length;
    this._prevDiff.clear();
    for (let i = 0; i < n; i++) this._prevDiff.set(i, this._wrappedDiff(i));

    if (this._displayMode() === "bag") this._measureBagImages();
  }

  /**
   * Bag mode: read the h/w ratio of the loaded images and expose them as
   * CSS vars, so the stage shrinks to the real artwork instead of holding
   * worst-case headroom (which showed as a big gap under the caption).
   * Uses the tallest product so the stage doesn't bounce while navigating.
   */
  private _measureBagImages() {
    const root = this.shadowRoot;
    if (!root) return;
    const ratioOf = (img: HTMLImageElement): number => {
      if (img.naturalWidth > 0) return img.naturalHeight / img.naturalWidth;
      if (!img.dataset.measureHooked) {
        img.dataset.measureHooked = "1";
        img.addEventListener("load", () => this.requestUpdate(), {
          once: true,
        });
      }
      return 0;
    };

    let prodRatio = 0;
    for (const img of root.querySelectorAll<HTMLImageElement>(
      ".col-bag-slide img"
    ))
      prodRatio = Math.max(prodRatio, ratioOf(img));

    const bagImg = root.querySelector<HTMLImageElement>(".col-bag-img");
    const bagRatio = bagImg ? ratioOf(bagImg) : 0;

    const round = (x: number) => Math.round(x * 100) / 100;
    const prod = prodRatio > 0 ? round(prodRatio) : null;
    const bag = bagRatio > 0 ? round(bagRatio) : null;
    // Guarded assignment — @state setters re-render, so only touch them
    // when a measurement actually changed.
    if (prod !== this._bagProdRatio) this._bagProdRatio = prod;
    if (bag !== this._bagImgRatio) this._bagImgRatio = bag;
  }

  // ------------------------------------------------------------
  // Autoplay
  // ------------------------------------------------------------

  private _setupAutoplay() {
    const c = this.config || {};
    if (!c.autoplay) return;
    if (!this._inView) return;
    if (this._slides().length < 2) return;
    const delaySec = Math.max(1, this._num(c.autoplay_delay, 5));
    this._autoplayTimer = window.setInterval(() => {
      if (this._hoverPaused || this._swipeActive) return;
      this._goNext();
    }, delaySec * 1000);
  }

  private _teardownAutoplay() {
    if (this._autoplayTimer) {
      clearInterval(this._autoplayTimer);
      this._autoplayTimer = null;
    }
  }

  // ------------------------------------------------------------
  // Carousel navigation
  // ------------------------------------------------------------

  private _changeActive(next: number) {
    if (next === this._activeIndex) return;
    this._bagLeavingIndex = this._activeIndex;
    this._bagNavigated = true;
    this._activeIndex = next;
    this._flashCaption();
  }

  /** Brief fade-out → text swap → fade-in on the caption block. */
  private _flashCaption() {
    if (this._captionTimer) {
      clearTimeout(this._captionTimer);
      this._captionTimer = null;
    }
    this._captionState = "out";
    this._captionTimer = window.setTimeout(() => {
      this._captionState = "in";
      this._captionTimer = null;
    }, 220);
  }

  private _goPrev = () => {
    const n = this._slides().length;
    if (n <= 1) return;
    const loop = this.config?.loop !== false;
    let next = this._activeIndex - 1;
    if (next < 0) next = loop ? n - 1 : 0;
    this._changeActive(next);
  };

  private _goNext = () => {
    const n = this._slides().length;
    if (n <= 1) return;
    const loop = this.config?.loop !== false;
    let next = this._activeIndex + 1;
    if (next >= n) next = loop ? 0 : n - 1;
    this._changeActive(next);
  };

  private _goTo = (idx: number) => {
    const n = this._slides().length;
    if (idx < 0 || idx >= n) return;
    this._changeActive(idx);
  };

  /** Signed slot offset from the active slide, wrapped to the shorter way
      around the ring when looping (so slide 0 can sit just left of the last). */
  private _wrappedDiff(i: number): number {
    const n = this._slides().length;
    if (n === 0) return 0;
    let diff = i - this._activeIndex;
    if (this.config?.loop !== false) {
      if (diff > n / 2) diff -= n;
      if (diff < -n / 2) diff += n;
    }
    return diff;
  }

  private _slidePos(
    i: number
  ): "active" | "left" | "right" | "far-left" | "far-right" | "hidden" {
    if (this._slides().length === 0) return "hidden";
    const diff = this._wrappedDiff(i);
    if (diff === 0) return "active";
    if (diff === -1) return "left";
    if (diff === 1) return "right";
    if (diff === -2) return "far-left";
    if (diff === 2) return "far-right";
    return "hidden";
  }

  private _isPrevDisabled(): boolean {
    if (this.config?.loop !== false) return false;
    return this._activeIndex === 0 || this._slides().length <= 1;
  }
  private _isNextDisabled(): boolean {
    if (this.config?.loop !== false) return false;
    return (
      this._activeIndex === this._slides().length - 1 ||
      this._slides().length <= 1
    );
  }

  // ------------------------------------------------------------
  // Click / swipe to navigate
  // ------------------------------------------------------------

  private _onSlideClick = (e: MouseEvent) => {
    if (this._swipeActive) return;
    const slide = e.currentTarget as HTMLElement | null;
    if (!slide) return;
    // Active slide stays put (its CTA/link handles clicks); any side or far
    // slide is brought to center — matches the reference's click-to-focus.
    if (slide.dataset.pos === "active") return;
    const idx = Number(slide.dataset.index);
    if (Number.isInteger(idx)) this._goTo(idx);
  };

  private _onPointerDown = (e: PointerEvent) => {
    if (this._slides().length <= 1) return;
    this._swipeStartX = e.clientX;
    this._swipeStartY = e.clientY;
    this._swipeActive = false;
  };

  private _onPointerMove = (e: PointerEvent) => {
    if (this._swipeStartX === null) return;
    const dx = e.clientX - this._swipeStartX;
    const dy = e.clientY - (this._swipeStartY ?? e.clientY);
    if (!this._swipeActive && Math.abs(dx) > 10 && Math.abs(dx) > Math.abs(dy))
      this._swipeActive = true;
  };

  private _onPointerUp = (e: PointerEvent) => {
    if (this._swipeStartX === null) return;
    const dx = e.clientX - this._swipeStartX;
    const isRtl = getComputedStyle(this).direction === "rtl";
    if (this._swipeActive && Math.abs(dx) > 40) {
      const advance = isRtl ? dx > 0 : dx < 0;
      if (advance) this._goNext();
      else this._goPrev();
    }
    this._swipeStartX = null;
    this._swipeStartY = null;
    window.setTimeout(() => {
      this._swipeActive = false;
    }, 50);
  };

  private _onHoverIn = () => {
    this._hoverPaused = true;
  };
  private _onHoverOut = () => {
    this._hoverPaused = false;
  };

  // ------------------------------------------------------------
  // Render helpers
  // ------------------------------------------------------------

  private _slideImage(
    slide: CollectionSlideItem
  ): { closed?: string; opened?: string; alt: string } {
    const closed = slide.image || undefined;
    const opened = slide.image_opened || undefined;
    const alt = this._t(slide.title) || "";
    return { closed, opened, alt };
  }

  // ------------------------------------------------------------
  // Render
  // ------------------------------------------------------------

  render() {
    const c: CollectionConfig = this.config || {};
    const slides = this._slides();
    const displayMode = this._displayMode();
    const useCase = this._pickValue<CollectionUseCase>(c.use_case, "home");
    const animation = this._pickValue<CollectionAnimation>(
      c.slide_animation,
      "simple"
    );
    const aspect = this._pickValue<CollectionAspect>(c.aspect_ratio, "1/1");
    const layout = this._pickValue<CollectionDesktopLayout>(
      c.desktop_layout,
      "coverflow"
    );

    const title = this._t(c.section_title ?? c.title);
    const showCaption = c.show_caption !== false;
    const showCta = useCase === "home" && c.show_cta !== false;
    const defaultCtaLabel = this._t(c.default_cta_label) || "تسوّق الآن";
    const showNav = c.show_nav_buttons !== false;
    const showDots = !!c.show_pagination;
    const enableAnim = c.enable_entrance_anim !== false;
    const cardRadius = this._num(c.card_radius, 20);

    const hostStyle = [
      c.bg_color ? `--col-bg: ${c.bg_color}` : "",
      c.title_color ? `--col-title-color: ${c.title_color}` : "",
      c.caption_title_color
        ? `--col-caption-title-color: ${c.caption_title_color}`
        : "",
      c.caption_text_color
        ? `--col-caption-text-color: ${c.caption_text_color}`
        : "",
      `--col-card-radius: ${cardRadius}px`,
      c.cta_bg ? `--col-cta-bg: ${c.cta_bg}` : "",
      c.cta_color ? `--col-cta-color: ${c.cta_color}` : "",
      c.nav_bg ? `--col-nav-bg: ${c.nav_bg}` : "",
      c.nav_icon_color ? `--col-nav-icon: ${c.nav_icon_color}` : "",
      c.dot_color ? `--col-dot-color: ${c.dot_color}` : "",
      c.bag_circle_color ? `--bag-circle-color: ${c.bag_circle_color}` : "",
      `--col-aspect: ${aspect}`,
    ]
      .filter(Boolean)
      .join("; ");

    if (slides.length === 0) {
      return html`
        <section class="col-empty" style=${hostStyle}>
          <p>أضف صورة واحدة على الأقل لكل شريحة للبدء.</p>
        </section>
      `;
    }

    const isSingle = slides.length === 1;
    const chevronPath = "m9 6 6 6-6 6";
    const arrowPath = "M5 12h14M13 6l6 6-6 6";

    // Resolved once per render so the caption + CTA read from the same source
    // as the visible active slide.
    const activeSlide = slides[this._activeIndex];
    const activeTitle = activeSlide ? this._t(activeSlide.title) : "";
    const activeDesc = activeSlide ? this._t(activeSlide.description) : "";
    const activeCtaHref = activeSlide ? this._resolveLink(activeSlide) : "";
    const activeCtaLabel = activeSlide
      ? this._t(activeSlide.cta_label) || defaultCtaLabel
      : defaultCtaLabel;
    const hasCaption = !!(showCaption && (activeTitle || activeDesc));

    if (displayMode === "bag") {
      return this._renderBag(c, slides, {
        hostStyle,
        title,
        enableAnim,
        showNav,
        showDots,
        hasCaption,
        activeTitle,
        activeDesc,
        showCta,
        activeCtaHref,
        activeCtaLabel,
      });
    }

    return html`
      <section
        class="col-section"
        style=${hostStyle}
        data-layout=${layout}
        data-anim=${animation}
        data-enter=${enableAnim ? this._animState : "in"}
        data-use-case=${useCase}
        @mouseenter=${this._onHoverIn}
        @mouseleave=${this._onHoverOut}
      >
        ${title
          ? html`
              <div
                class="col-header"
                data-anim=${enableAnim ? this._animState : "in"}
              >
                <h2 class="col-title">${title}</h2>
              </div>
            `
          : nothing}

        <div
          class="col-stage"
          @pointerdown=${this._onPointerDown}
          @pointermove=${this._onPointerMove}
          @pointerup=${this._onPointerUp}
          @pointercancel=${this._onPointerUp}
        >
          <div class="col-track">
            ${slides.map((slide, i) => {
              const diff = this._wrappedDiff(i);
              const pos = this._slidePos(i);
              // A slide that jumped more than half the ring since last render
              // wrapped around the loop — snap it (no transition) so it doesn't
              // glide all the way across the stage.
              const prev = this._prevDiff.get(i);
              const instant =
                prev !== undefined &&
                Math.abs(diff - prev) > slides.length / 2;
              const { closed, opened, alt } = this._slideImage(slide);
              const noOpened = !opened || animation !== "reveal";
              return html`
                <div
                  class="col-slide"
                  data-pos=${pos}
                  data-index=${i}
                  data-instant=${instant ? "" : nothing}
                  @click=${this._onSlideClick}
                >
                  <div
                    class="col-card ${noOpened ? "col-card--no-opened" : ""}"
                  >
                    ${closed
                      ? html`<img
                          class="col-img-closed"
                          src=${closed}
                          alt=${alt}
                          loading="lazy"
                          draggable="false"
                        />`
                      : nothing}
                    ${animation === "reveal" && opened
                      ? html`<img
                          class="col-img-opened"
                          src=${opened}
                          alt=${alt}
                          loading="lazy"
                          draggable="false"
                        />`
                      : nothing}
                  </div>
                </div>
              `;
            })}
          </div>

          ${!isSingle && showNav
            ? html`
                <button
                  class="col-nav col-nav-prev"
                  type="button"
                  @click=${this._goPrev}
                  ?disabled=${this._isPrevDisabled()}
                  aria-label="Previous"
                >
                  <svg viewBox="0 0 24 24">
                    <path d=${chevronPath} />
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
                    <path d=${chevronPath} />
                  </svg>
                </button>
              `
            : nothing}
        </div>

        ${hasCaption
          ? html`
              <div class="col-caption" data-state=${this._captionState}>
                ${activeTitle
                  ? html`<h3 class="col-caption__title">${activeTitle}</h3>`
                  : nothing}
                ${activeDesc
                  ? html`<p class="col-caption__desc">${activeDesc}</p>`
                  : nothing}
              </div>
            `
          : nothing}
        ${showCta && activeCtaHref
          ? html`
              <div class="col-cta-wrap">
                <a
                  class="col-cta"
                  href=${activeCtaHref}
                  aria-label=${activeCtaLabel}
                >
                  <span>${activeCtaLabel}</span>
                  <svg viewBox="0 0 24 24">
                    <path d=${arrowPath} />
                  </svg>
                </a>
              </div>
            `
          : nothing}

        ${!isSingle && showDots
          ? html`
              <div class="col-dots" role="tablist">
                ${slides.map(
                  (_, i) => html`
                    <button
                      class="col-dot"
                      type="button"
                      aria-current=${this._activeIndex === i
                        ? "true"
                        : "false"}
                      aria-label=${`Slide ${i + 1}`}
                      @click=${() => this._goTo(i)}
                    ></button>
                  `
                )}
              </div>
            `
          : nothing}
      </section>
    `;
  }

  /**
   * Bag mode (وضع الشنطة) — vertical stage: half-dome + fog backdrop, the
   * merchant's bag image in front, and one product visible at a time. On
   * navigation the new product rises out of the bag while the previous one
   * sinks back in. Products need transparent (PNG/WebP) images to sell it.
   */
  private _renderBag(
    c: CollectionConfig,
    slides: CollectionSlideItem[],
    v: {
      hostStyle: string;
      title: string;
      enableAnim: boolean;
      showNav: boolean;
      showDots: boolean;
      hasCaption: boolean;
      activeTitle: string;
      activeDesc: string;
      showCta: boolean;
      activeCtaHref: string;
      activeCtaLabel: string;
    }
  ) {
    const bagImage = typeof c.bag_image === "string" ? c.bag_image.trim() : "";
    const bagSize = this._pickValue<CollectionBagSize>(c.bag_size, "medium");
    const productSize = this._pickValue<CollectionBagSize>(
      c.bag_product_size,
      "medium"
    );
    const bottomTitle = this._t(c.bag_bottom_title);
    const isSingle = slides.length === 1;
    const upPath = "M18 15l-6-6-6 6";
    const downPath = "M6 9l6 6 6-6";
    const arrowPath = "M5 12h14M13 6l6 6-6 6";

    const sectionStyle = [
      v.hostStyle,
      this._bagProdRatio !== null
        ? `--bag-prod-ratio: ${this._bagProdRatio}`
        : "",
      this._bagImgRatio !== null ? `--bag-ratio: ${this._bagImgRatio}` : "",
    ]
      .filter(Boolean)
      .join("; ");

    return html`
      <section
        class="col-section col-section--bag"
        style=${sectionStyle}
        data-bag-size=${bagSize}
        data-product-size=${productSize}
        @mouseenter=${this._onHoverIn}
        @mouseleave=${this._onHoverOut}
      >
        ${v.title
          ? html`
              <div
                class="col-header"
                data-anim=${v.enableAnim ? this._animState : "in"}
              >
                <h2 class="col-title">${v.title}</h2>
              </div>
            `
          : nothing}
        ${v.hasCaption
          ? html`
              <div class="col-caption" data-state=${this._captionState}>
                ${v.activeTitle
                  ? html`<h3 class="col-caption__title">${v.activeTitle}</h3>`
                  : nothing}
                ${v.activeDesc
                  ? html`<p class="col-caption__desc">${v.activeDesc}</p>`
                  : nothing}
              </div>
            `
          : nothing}

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
            ${slides.map((slide, i) => {
              const { closed, alt } = this._slideImage(slide);
              let state: "active" | "rising" | "sinking" | "hidden" = "hidden";
              if (i === this._activeIndex)
                state = this._bagNavigated ? "rising" : "active";
              else if (i === this._bagLeavingIndex) state = "sinking";
              return html`
                <div class="col-bag-slide" data-state=${state}>
                  ${closed
                    ? html`<img
                        src=${closed}
                        alt=${alt}
                        loading="lazy"
                        draggable="false"
                      />`
                    : nothing}
                </div>
              `;
            })}
          </div>

          ${bagImage
            ? html`<img
                class="col-bag-img"
                src=${bagImage}
                alt=""
                aria-hidden="true"
                draggable="false"
              />`
            : nothing}
          ${!isSingle && v.showNav
            ? html`
                <button
                  class="col-bag-nav col-bag-nav--up"
                  type="button"
                  @click=${this._goNext}
                  ?disabled=${this._isNextDisabled()}
                  aria-label="Next"
                >
                  <svg viewBox="0 0 24 24"><path d=${upPath} /></svg>
                </button>
                <button
                  class="col-bag-nav col-bag-nav--down"
                  type="button"
                  @click=${this._goPrev}
                  ?disabled=${this._isPrevDisabled()}
                  aria-label="Previous"
                >
                  <svg viewBox="0 0 24 24"><path d=${downPath} /></svg>
                </button>
              `
            : nothing}
        </div>

        ${bottomTitle
          ? html`<div class="col-bag-bottom">${bottomTitle}</div>`
          : nothing}
        ${v.showCta && v.activeCtaHref
          ? html`
              <div class="col-cta-wrap">
                <a
                  class="col-cta"
                  href=${v.activeCtaHref}
                  aria-label=${v.activeCtaLabel}
                >
                  <span>${v.activeCtaLabel}</span>
                  <svg viewBox="0 0 24 24">
                    <path d=${arrowPath} />
                  </svg>
                </a>
              </div>
            `
          : nothing}
        ${!isSingle && v.showDots
          ? html`
              <div class="col-dots" role="tablist">
                ${slides.map(
                  (_, i) => html`
                    <button
                      class="col-dot"
                      type="button"
                      aria-current=${this._activeIndex === i
                        ? "true"
                        : "false"}
                      aria-label=${`Slide ${i + 1}`}
                      @click=${() => this._goTo(i)}
                    ></button>
                  `
                )}
              </div>
            `
          : nothing}
      </section>
    `;
  }
}
