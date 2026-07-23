import { html, nothing, type PropertyValues } from "lit";
import { property, state } from "lit/decorators.js";
import { GrowthElement } from "../../shared/growth-element";
import {
  fetchProductDetails,
  pickerSelection,
  sallaGlobal,
} from "../../shared/product";
import type {
  BeforeAfterConfig,
  BeforeAfterAspect,
  BeforeAfterDesktopLayout,
  BeforeAfterSlideItem,
  CrossoverItemSize,
  CrossoverSpeed,
} from "./types";
import { beforeAfterStyles } from "./style";

/** The subset of the fetched product the chip renders (no pricing here). */
interface ResolvedProduct {
  name: string;
  image?: string;
  imageAlt?: string;
  url: string;
}

/**
 * <growth-before-after> — Before & After slider (سلايدر قبل وبعد)
 * Part of the Growth Kit bundle for Salla Twilight.
 *
 * Behaviour:
 *   • Single comparison slide OR carousel of slides — driven by the `slides` collection length.
 *   • Coverflow layout on desktop (active centred, neighbours peeking at 78% scale).
 *   • Per-slide CTA (link to product, category, or any URL).
 *   • RTL-aware: side slides + nav buttons flip in RTL documents.
 *   • Optional autoplay (paused on hover/drag), optional loop, optional pagination dots.
 *   • Respects prefers-reduced-motion.
 */
export default class GrowthBeforeAfter extends GrowthElement {
  static styles = beforeAfterStyles;


  @property({ type: Object })
  config?: BeforeAfterConfig;

  @state() private _activeIndex = 0;
  /** Divider position (0–100) per slide; preserved across slide changes. */
  @state() private _positions: number[] = [];
  /** Text reveal gate: "ready" = pre-state (blurred), "in" = revealed. */
  @state() private _animState: "ready" | "in" = "ready";
  /** Carousel reveal gate: "enter" = stacked deck, "ready" = spread to positions. */
  @state() private _entranceState: "enter" | "ready" = "enter";
  /** Becomes true once the entrance settles — switches to faster carousel timing. */
  @state() private _entranceDone = false;

  private _dragging = false;
  private _autoplayTimer: number | null = null;
  private _entranceFinishTimer: number | null = null;
  private _hoverPaused = false;
  private _hasInitializedActive = false;
  /** Whether the section is visible — autoplay and the crossover marquee
      pause while off-screen (the CSS side keys off the host attribute). */
  private _inView = true;
  private _io: IntersectionObserver | null = null;

  // ------------------------------------------------------------
  // Helpers
  // ------------------------------------------------------------




  /** Filter slides that have at least one valid image so we don't render blanks. */
  private _slides() {
    const list = this.config?.slides;
    if (!Array.isArray(list)) return [];
    return list.filter(
      (s) => s && typeof s === "object" && (s.before_image || s.after_image)
    );
  }

  // ------------------------------------------------------------
  // Product resolution
  //
  // Salla's `source: "products"` picker only stores [{ value: id, label }].
  // The image and product URL must be fetched from the storefront API:
  //   Salla.product.api.getDetails(id) → { data: Product }
  // We cache per-id in a private Map and trigger Lit re-renders manually
  // when a fetch resolves.
  // ------------------------------------------------------------

  private _productCache = new Map<
    number,
    | { status: "loading"; label: string }
    | { status: "loaded"; data: ResolvedProduct }
    | { status: "failed" }
  >();

  /**
   * Kick off (or no-op if already done/in-flight) a fetch for the picked
   * product. Resolves the Salla SDK ready-promise first so the API is
   * available even when this component loads before the storefront JS.
   */
  private async _fetchProduct(id: number, label: string) {
    if (this._productCache.has(id)) return;

    this._productCache.set(id, { status: "loading", label });
    this.requestUpdate();

    if (!sallaGlobal()) {
      // No SDK (e.g. local Vite demo) — keep the loading state so the chip
      // still renders with the picker label + skeleton thumb instead of vanishing.
      return;
    }

    try {
      const data = await fetchProductDetails(id, label);
      this._productCache.set(id, { status: "loaded", data });
    } catch (err) {
      console.warn("[growth-before-after] product fetch failed", id, err);
      this._productCache.set(id, { status: "failed" });
    }
    this.requestUpdate();
  }

  /**
   * Returns the chip data for a slide:
   *   - null   → no product picked, or fetch failed
   *   - object with `loading: true` and a `name` → render skeleton chip
   *   - object with `loading: false` and full data → render real chip
   * Side-effect: triggers a fetch if this id hasn't been seen yet.
   */
  private _resolveProduct(
    slide: BeforeAfterSlideItem
  ): (ResolvedProduct & { loading: boolean }) | null {
    // The Salla product picker cannot always clear a previous selection.
    // This switch lets merchants explicitly unlink the slide without losing
    // the saved selection in case they decide to enable it again later.
    if (slide.show_product === false) return null;

    const sel = pickerSelection(slide.product);
    if (!sel) {
      // Empty array == "no product picked"; only warn on truly unexpected shapes.
      const empty =
        !slide.product ||
        (Array.isArray(slide.product) && slide.product.length === 0);
      if (!empty) {
        console.warn(
          "[growth-before-after] could not parse picker selection",
          slide.product
        );
      }
      return null;
    }

    const cached = this._productCache.get(sel.id);
    if (!cached) {
      // Fire-and-forget; the fetch will requestUpdate when it resolves.
      void this._fetchProduct(sel.id, sel.label);
      // Show an immediate placeholder using the label we already have.
      return sel.label
        ? { name: sel.label, url: "", loading: true }
        : { name: "", url: "", loading: true };
    }
    if (cached.status === "loading") {
      return { name: cached.label || "", url: "", loading: true };
    }
    if (cached.status === "failed") {
      // Degrade gracefully: still show a chip with whatever the picker gave us,
      // so a failed/unavailable SDK doesn't make the chip disappear entirely.
      return sel.label
        ? { name: sel.label, url: "", loading: true }
        : null;
    }
    return { ...cached.data, loading: false };
  }

  /**
   * Render the product chip. While loading we render a non-clickable
   * skeleton with a shimmer thumbnail and the label we have from the
   * picker so the chip appears immediately instead of popping in late.
   */
  private _renderProductChip(
    product: ResolvedProduct & { loading: boolean }
  ) {
    const arrow = html`<svg
      class="ba-product-chip__arrow"
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <path d="m9 6 6 6-6 6" />
    </svg>`;

    const thumb = product.image
      ? html`<img
          class="ba-product-chip__thumb"
          src=${product.image}
          alt=${product.imageAlt || ""}
          loading="lazy"
          draggable="false"
        />`
      : html`<span class="ba-product-chip__thumb ba-product-chip__thumb--skeleton"></span>`;

    const name = html`<span class="ba-product-chip__name"
      >${product.name || ""}</span
    >`;

    if (product.loading || !product.url) {
      return html`<span class="ba-product-chip ba-product-chip--loading">
        ${thumb}${name}${arrow}
      </span>`;
    }

    return html`<a
      class="ba-product-chip"
      href=${product.url}
      aria-label=${product.name || "View product"}
    >
      ${thumb}${name}${arrow}
    </a>`;
  }

  // ------------------------------------------------------------
  // Lifecycle
  // ------------------------------------------------------------

  connectedCallback() {
    super.connectedCallback();

    // Reset gates so a reconnect re-plays the reveal.
    this._animState = "ready";
    this._entranceState = "enter";
    this._entranceDone = false;

    const reduceMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;
    // Merchants can disable the whole entrance (title + carousel) via the toggle.
    const animDisabled = this.config?.enable_entrance_anim === false;

    if (reduceMotion || animDisabled) {
      // No motion: jump straight to the final state, no transition.
      this._animState = "in";
      this._entranceState = "ready";
      this._entranceDone = true;
    } else {
      // Two rAFs so the browser paints the "stacked deck" frame first,
      // then the transition to "ready" is animated.
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          this._animState = "in";
          this._entranceState = "ready";
          // After the longest transition (1s + 0.26s delay), switch to
          // faster carousel timing for subsequent nav clicks.
          this._entranceFinishTimer = window.setTimeout(() => {
            this._entranceDone = true;
            this._entranceFinishTimer = null;
          }, 1350);
        });
      });
    }

    // Global drag listeners — arrow-function fields keep refs stable for removal.
    window.addEventListener("mousemove", this._onMove);
    window.addEventListener("mouseup", this._onUp);
    window.addEventListener("touchmove", this._onMove, { passive: false });
    window.addEventListener("touchend", this._onUp);

    // Pause autoplay when scrolled out of view (saves CPU and prevents the
    // slider from racing on a long page).
    if ("IntersectionObserver" in window) {
      this._io = new IntersectionObserver(
        (entries) => {
          const ent = entries[0];
          if (!ent) return;
          this._inView = ent.isIntersecting;
          this.toggleAttribute("out-of-view", !this._inView);
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
    if (this._entranceFinishTimer) {
      clearTimeout(this._entranceFinishTimer);
      this._entranceFinishTimer = null;
    }
    window.removeEventListener("mousemove", this._onMove);
    window.removeEventListener("mouseup", this._onUp);
    window.removeEventListener("touchmove", this._onMove);
    window.removeEventListener("touchend", this._onUp);
  }

  willUpdate(changed: PropertyValues) {
    if (!changed.has("config")) return;

    const slides = this._slides();
    const initialPos = this._num(this.config?.initial_position, 50);
    const clampedPos = Math.max(0, Math.min(100, initialPos));

    // Resize positions array to match slide count; preserve existing values.
    if (slides.length !== this._positions.length) {
      this._positions = slides.map((_, i) =>
        i < this._positions.length ? this._positions[i] : clampedPos
      );
    }

    // First-time only: honour merchant's `initial_slide` choice.
    if (!this._hasInitializedActive && slides.length > 0) {
      const wanted = this._num(this.config?.initial_slide, NaN);
      const start = Number.isNaN(wanted)
        ? Math.floor(slides.length / 2)
        : Math.max(0, Math.min(slides.length - 1, Math.round(wanted) - 1));
      this._activeIndex = start;
      this._hasInitializedActive = true;
    } else if (this._activeIndex >= slides.length) {
      this._activeIndex = Math.max(0, slides.length - 1);
    }

    this._teardownAutoplay();
    this._setupAutoplay();
  }

  // ------------------------------------------------------------
  // Autoplay
  // ------------------------------------------------------------

  private _setupAutoplay() {
    const c = this.config || {};
    // Crossover mode has its own continuous CSS motion — no slide autoplay.
    if (c.crossover_enabled) return;
    if (!c.autoplay) return;
    if (!this._inView) return;
    if (this._slides().length < 2) return;
    const delaySec = Math.max(1, this._num(c.autoplay_delay, 5));
    this._autoplayTimer = window.setInterval(() => {
      if (this._hoverPaused || this._dragging) return;
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

  private _goPrev = () => {
    const n = this._slides().length;
    if (n <= 1) return;
    const loop = this.config?.loop !== false;
    if (this._activeIndex === 0) {
      if (loop) this._activeIndex = n - 1;
    } else {
      this._activeIndex -= 1;
    }
  };

  private _goNext = () => {
    const n = this._slides().length;
    if (n <= 1) return;
    const loop = this.config?.loop !== false;
    if (this._activeIndex === n - 1) {
      if (loop) this._activeIndex = 0;
    } else {
      this._activeIndex += 1;
    }
  };

  private _goTo = (idx: number) => {
    const n = this._slides().length;
    if (idx < 0 || idx >= n) return;
    this._activeIndex = idx;
  };

  /**
   * Determine each slide's visual position relative to the active one.
   * Handles loop-aware wrap so the carousel always shows prev/active/next.
   */
  private _slidePos(i: number): "active" | "prev" | "next" | "far" {
    const n = this._slides().length;
    if (n === 0) return "far";
    if (i === this._activeIndex) return "active";
    let diff = i - this._activeIndex;
    if (this.config?.loop !== false) {
      if (diff > n / 2) diff -= n;
      if (diff < -n / 2) diff += n;
    }
    if (diff === -1) return "prev";
    if (diff === 1) return "next";
    return "far";
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
  // Comparison-slider drag interaction (active slide only)
  // ------------------------------------------------------------

  private _onDown = (e: MouseEvent | TouchEvent) => {
    // Only the active slide is interactive.
    const target = e.currentTarget as HTMLElement | null;
    const slide = target?.closest(".ba-slide") as HTMLElement | null;
    if (!slide || slide.dataset.pos !== "active") return;
    this._dragging = true;
    e.preventDefault();
    this._updatePosition(e);
  };

  private _onMove = (e: MouseEvent | TouchEvent) => {
    if (!this._dragging) return;
    // Block scroll while dragging on touch.
    if ("touches" in e) e.preventDefault();
    this._updatePosition(e);
  };

  private _onUp = () => {
    if (this._dragging) this._dragging = false;
  };

  private _onCardClick = (e: MouseEvent) => {
    // Single click on the active card should jump the divider to the click point.
    const slide = (e.currentTarget as HTMLElement | null)?.closest(
      ".ba-slide"
    ) as HTMLElement | null;
    if (!slide || slide.dataset.pos !== "active") return;
    this._updatePosition(e);
  };

  private _updatePosition(e: MouseEvent | TouchEvent) {
    const card = this._activeCardEl();
    if (!card) return;
    const rect = card.getBoundingClientRect();
    const clientX =
      "touches" in e ? e.touches[0]?.clientX : (e as MouseEvent).clientX;
    if (clientX === undefined) return;
    let pct = ((clientX - rect.left) / rect.width) * 100;
    pct = Math.max(0, Math.min(100, pct));
    // Drive the visual via a CSS variable — no re-render, no jank.
    card.style.setProperty("--pos", `${pct}%`);
    // Sync state so the value persists when switching slides and back.
    this._positions[this._activeIndex] = pct;
  }

  private _activeCardEl(): HTMLElement | null {
    return this.renderRoot.querySelector(
      `.ba-slide[data-pos="active"] .ba-card`
    ) as HTMLElement | null;
  }

  private _onHoverIn = () => {
    this._hoverPaused = true;
  };
  private _onHoverOut = () => {
    this._hoverPaused = false;
  };

  // ------------------------------------------------------------
  // Crossover mode (وضع العبور)
  //
  // Two identical, perfectly-synced marquee tracks overlap: the lower
  // lane renders "before" images, the upper lane "after" images. Each
  // lane is clipped at the centre line, so a card crossing the glowing
  // divider transforms live from before to after.
  // ------------------------------------------------------------

  /** Physical side ("left"/"right") that shows the BEFORE images. */
  private _crossoverBeforeSide(): "left" | "right" {
    let rtl = true;
    try {
      rtl = this.matches(":dir(rtl)");
    } catch {
      rtl =
        (document.documentElement.dir || document.dir || "rtl").toLowerCase() !==
        "ltr";
    }
    // Cards flow in reading order: before sits at inline-start.
    const base: "left" | "right" = rtl ? "right" : "left";
    if (!this.config?.crossover_reverse) return base;
    return base === "left" ? "right" : "left";
  }

  private _renderCrossover(
    c: BeforeAfterConfig,
    slides: BeforeAfterSlideItem[],
    labelBefore: string,
    labelAfter: string,
    showLabels: boolean,
    enableAnim: boolean
  ) {
    const speed = this._pickValue<CrossoverSpeed>(c.crossover_speed, "normal");
    const secondsPerCard = speed === "slow" ? 7 : speed === "fast" ? 3 : 5;
    const size = this._pickValue<CrossoverItemSize>(
      c.crossover_item_size,
      "md"
    );
    const itemW = size === "sm" ? 200 : size === "lg" ? 320 : 260;
    const itemWDesktop = size === "sm" ? 280 : size === "lg" ? 440 : 360;
    const gap = Math.max(0, this._num(c.crossover_gap, 20));
    const pauseHover = c.crossover_pause_on_hover !== false;
    const side = this._crossoverBeforeSide();

    // Repeat the slides until one group is wider than any stage, so the
    // 2-group loop never shows a gap.
    const cards: BeforeAfterSlideItem[] = [];
    while (cards.length < 8) cards.push(...slides);
    const duration = cards.length * secondsPerCard;

    const laneGroup = (kind: "before" | "after", hidden: boolean) => html`
      <div class="ba-x-group" aria-hidden=${hidden ? "true" : "false"}>
        ${cards.map((s) => {
          // Fall back to the other image so a half-filled slide doesn't
          // leave a blank card in one lane.
          const src =
            kind === "before"
              ? s.before_image || s.after_image
              : s.after_image || s.before_image;
          const alt = hidden
            ? ""
            : this._t(s.caption) ||
              (kind === "before" ? labelBefore : labelAfter);
          return html`<div class="ba-x-card">
            ${src
              ? html`<img
                  src=${src}
                  alt=${alt}
                  loading="lazy"
                  draggable="false"
                />`
              : nothing}
          </div>`;
        })}
      </div>
    `;

    const xStyle = [
      `--ba-x-item-w: ${itemW}px`,
      `--ba-x-item-w-desktop: ${itemWDesktop}px`,
      `--ba-x-gap: ${gap}px`,
      `--ba-x-duration: ${duration}s`,
      c.crossover_divider_color
        ? `--ba-x-divider-color: ${c.crossover_divider_color}`
        : "",
    ]
      .filter(Boolean)
      .join("; ");

    return html`
      <div
        class="ba-x"
        style=${xStyle}
        data-before-side=${side}
        data-anim=${enableAnim ? this._animState : "in"}
        ?data-pause-hover=${pauseHover}
      >
        ${showLabels
          ? html`
              <div class="ba-x-pills">
                <span class="ba-x-pill">${labelBefore}</span>
                <span class="ba-x-pill">${labelAfter}</span>
              </div>
            `
          : nothing}
        <div class="ba-x-stage">
          <div class="ba-x-lane ba-x-lane--before">
            <div class="ba-x-track">
              ${laneGroup("before", false)}${laneGroup("before", true)}
            </div>
          </div>
          <div class="ba-x-lane ba-x-lane--after" aria-hidden="true">
            <div class="ba-x-track">
              ${laneGroup("after", true)}${laneGroup("after", true)}
            </div>
          </div>
          <div class="ba-x-divider" aria-hidden="true"></div>
        </div>
      </div>
    `;
  }

  // ------------------------------------------------------------
  // Render
  // ------------------------------------------------------------

  render() {
    const c: BeforeAfterConfig = this.config || {};
    const slides = this._slides();
    const title = this._t(c.title);
    const subtitle = this._t(c.subtitle);
    const labelBefore = this._t(c.label_before) || "قبل";
    const labelAfter = this._t(c.label_after) || "بعد";
    const showLabels = c.show_labels !== false;
    const aspect = this._pickValue<BeforeAfterAspect>(c.aspect_ratio, "1/1");
    const layout = this._pickValue<BeforeAfterDesktopLayout>(
      c.desktop_layout,
      "coverflow"
    );
    const showNav = c.show_nav_buttons !== false;
    const showDots = !!c.show_pagination;
    const reverse = !!c.reverse_direction;
    const enableAnim = c.enable_entrance_anim !== false;
    const cardRadius = this._num(c.card_radius, 20);

    const hostStyle = [
      c.bg_color ? `--ba-bg: ${c.bg_color}` : "",
      c.title_color ? `--ba-title-color: ${c.title_color}` : "",
      c.text_color ? `--ba-text-color: ${c.text_color}` : "",
      `--ba-card-radius: ${cardRadius}px`,
      c.handle_bg ? `--ba-handle-bg: ${c.handle_bg}` : "",
      c.handle_icon_color ? `--ba-handle-icon: ${c.handle_icon_color}` : "",
      c.line_color ? `--ba-line-color: ${c.line_color}` : "",
      c.label_bg ? `--ba-label-bg: ${c.label_bg}` : "",
      c.label_text_color ? `--ba-label-text: ${c.label_text_color}` : "",
      c.nav_bg ? `--ba-nav-bg: ${c.nav_bg}` : "",
      c.nav_icon_color ? `--ba-nav-icon: ${c.nav_icon_color}` : "",
      c.product_chip_bg ? `--ba-chip-bg: ${c.product_chip_bg}` : "",
      c.product_chip_color ? `--ba-chip-color: ${c.product_chip_color}` : "",
      `--ba-aspect: ${aspect}`,
    ]
      .filter(Boolean)
      .join("; ");

    if (slides.length === 0) {
      return html`
        <section class="ba-empty" style=${hostStyle}>
          <p>أضف صورة «قبل» وصورة «بعد» للبدء.</p>
        </section>
      `;
    }

    const isSingle = slides.length === 1;
    const chevronPath = "m9 6 6 6-6 6";

    const header =
      title || subtitle
        ? html`
            <div
              class="ba-header"
              data-anim=${enableAnim ? this._animState : "in"}
            >
              ${title ? html`<h2 class="ba-title">${title}</h2>` : nothing}
              ${subtitle
                ? html`<p class="ba-subtitle">${subtitle}</p>`
                : nothing}
            </div>
          `
        : nothing;

    if (c.crossover_enabled) {
      return html`
        <section class="ba-section" style=${hostStyle} data-mode="crossover">
          ${header}
          ${this._renderCrossover(
            c,
            slides,
            labelBefore,
            labelAfter,
            showLabels,
            enableAnim
          )}
        </section>
      `;
    }

    return html`
      <section
        class="ba-section"
        style=${hostStyle}
        data-layout=${layout}
        data-entrance=${this._entranceState}
        ?data-entered=${this._entranceDone}
        @mouseenter=${this._onHoverIn}
        @mouseleave=${this._onHoverOut}
      >
        ${header}

        <div class="ba-stage">
          <div class="ba-track">
            ${slides.map((slide, i) => {
              const pos = this._slidePos(i);
              const caption = this._t(slide.caption);
              const product = this._resolveProduct(slide);
              const positionPct = this._positions[i] ?? 50;
              const cardStyle = `--pos: ${positionPct}%`;
              return html`
                <div class="ba-slide" data-pos=${pos}>
                  <div
                    class="ba-card"
                    style=${cardStyle}
                    ?data-reverse=${reverse}
                    @mousedown=${this._onDown}
                    @touchstart=${this._onDown}
                    @click=${this._onCardClick}
                  >
                    ${slide.after_image
                      ? html`<img
                          class="ba-after"
                          src=${slide.after_image}
                          alt=${labelAfter}
                          loading="lazy"
                          draggable="false"
                        />`
                      : nothing}
                    ${slide.before_image
                      ? html`<img
                          class="ba-before"
                          src=${slide.before_image}
                          alt=${labelBefore}
                          loading="lazy"
                          draggable="false"
                        />`
                      : nothing}
                    <div class="ba-slider-line"></div>
                    <div class="ba-handle" aria-hidden="true"></div>
                    ${showLabels
                      ? html`
                          <span class="ba-label ba-label-before"
                            >${labelBefore}</span
                          >
                          <span class="ba-label ba-label-after"
                            >${labelAfter}</span
                          >
                        `
                      : nothing}
                    ${caption && !product
                      ? html`<span class="ba-caption">${caption}</span>`
                      : nothing}
                    ${product ? this._renderProductChip(product) : nothing}
                  </div>
                </div>
              `;
            })}
          </div>

          ${!isSingle && showNav
            ? html`
                <button
                  class="ba-nav ba-nav-prev"
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
                  class="ba-nav ba-nav-next"
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

        ${!isSingle && showDots
          ? html`
              <div class="ba-dots" role="tablist">
                ${slides.map(
                  (_, i) => html`
                    <button
                      class="ba-dot"
                      type="button"
                      aria-current=${this._activeIndex === i ? "true" : "false"}
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
