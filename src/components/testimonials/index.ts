import { html, nothing } from "lit";
import { property, state } from "lit/decorators.js";
import { GrowthElement } from "../../shared/growth-element";
import {
  fetchProductDetails,
  formatMoney,
  parseMoney,
  pickerSelection,
  sallaGlobal,
} from "../../shared/product";
import type {
  TestimonialsConfig,
  TestimonialItem,
  TestimonialsLayout,
  TestimonialCardStyle,
  TestimonialsColumns,
  TestimonialsColumnsDesktop,
  TestimonialRatingStyle,
  TestimonialChipStyle,
  TestimonialMarqueeRows,
  TestimonialMarqueeSpeed,
  TestimonialMarqueeDirection,
  TestimonialPhotoAspect,
  TestimonialOverlayTone,
  ResolvedProduct,
} from "./types";
import { testimonialsStyles } from "./style";

/** Fallback avatar when a testimonial has no avatar image of its own. */
const DEFAULT_AVATAR =
  "https://cdn.salla.network/images/themes/landing-page/default-avatar.png";

/** Resolved per-card visibility + style flags, threaded into _renderCard. */
interface CardOpts {
  showRating: boolean;
  ratingStyle: TestimonialRatingStyle;
  showAvatar: boolean;
  showPhoto: boolean;
  showQuoteMark: boolean;
  showProduct: boolean;
  chipStyle: TestimonialChipStyle;
}

/**
 * <growth-testimonials> — Testimonials (آراء العملاء)
 * Part of the Growth Kit bundle for Salla Twilight.
 *
 * A premium, social-proof wall with four arrangements and five card shapes:
 *   • Layouts: marquee (1–2 auto-scrolling rows), carousel (scroll-snap with
 *     arrows/dots/autoplay), grid, and masonry.
 *   • Card styles: modern (photo-led with overlaid name chip), overlay (full-bleed
 *     photo with a frosted-glass panel at the bottom), quote, bubble, minimal, glass.
 *   • Each review can link a real store product → renders a shoppable chip with
 *     image, name, price + sale price; clicking it opens the product page.
 *   • Fractional star ratings (e.g. 4.9).
 *   • Premium motion: marquee scroll, staggered entrance, hover-lift.
 *
 * RTL-first and mobile-first throughout; respects prefers-reduced-motion.
 */
export default class GrowthTestimonials extends GrowthElement {
  static styles = testimonialsStyles;


  @property({ type: Object })
  config?: TestimonialsConfig;

  /** Entrance gate. */
  @state() private _animState: "ready" | "in" = "ready";
  /** Active carousel page (drives dot highlighting). */
  @state() private _carouselPage = 0;
  /** Reactive desktop flag so cards-per-view re-evaluates on resize. */
  @state() private _isDesktop = false;

  private _mql?: MediaQueryList;
  private _onMqlChange?: () => void;
  private _autoplayTimer: number | null = null;
  private _scrollRaf: number | null = null;
  private _interactionPaused = false;
  /** Whether the section is visible — carousel autoplay and the marquee
      pause while off-screen (the CSS side keys off the host attribute). */
  private _inView = true;
  private _io: IntersectionObserver | null = null;
  /** Pointer-drag (desktop) state for the carousel track. */
  private _dragActive = false;
  private _dragStartX = 0;
  private _dragStartScroll = 0;
  private _dragMoved = false;

  /** Salla SDK global — see shared/product.ts. */
  private get _salla(): any {
    return sallaGlobal();
  }

  // ------------------------------------------------------------
  // Value helpers
  // ------------------------------------------------------------


  private _isRtl(): boolean {
    return getComputedStyle(this).direction === "rtl";
  }


  /** Round a rating to one decimal and trim trailing zeros ("5.0" → "5"). */
  private _formatRating(n: number): string {
    if (Number.isNaN(n)) return "";
    return String(Math.round(n * 10) / 10);
  }

  /** Keep only testimonials that carry some renderable content. */
  private _items(): TestimonialItem[] {
    const list = this.config?.items;
    if (!Array.isArray(list)) return [];
    return list.filter((it) => {
      if (!it || typeof it !== "object") return false;
      return !!(
        this._t(it.quote) ||
        this._t(it.name) ||
        it.photo ||
        it.avatar ||
        it.product
      );
    });
  }

  /** Resolve grid/carousel column counts (mobile-first; desktop "inherit" → mobile). */
  private _resolveColumns(): { mobile: number; desktop: number } {
    const c = this.config || {};
    const m = this._num(
      this._pickValue<TestimonialsColumns>(c.columns_mobile, "1"),
      1
    );
    const dRaw = this._pickValue<TestimonialsColumnsDesktop>(
      c.columns_desktop,
      "inherit"
    );
    const d = dRaw === "inherit" ? m : this._num(dRaw, 3);
    return {
      mobile: Math.max(1, Math.min(4, m)),
      desktop: Math.max(1, Math.min(4, d)),
    };
  }

  private _cardsPerView(): number {
    const cols = this._resolveColumns();
    return this._isDesktop ? cols.desktop : cols.mobile;
  }

  // ------------------------------------------------------------
  // Product resolution (shoppable chip)
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

    try {
      const data = await fetchProductDetails(id, label);
      this._productCache.set(id, { status: "loaded", data });
    } catch (err) {
      console.warn("[growth-testimonials] product fetch failed", id, err);
      this._productCache.set(id, { status: "failed" });
    }
    this.requestUpdate();
  }

  private _resolveProduct(item: TestimonialItem): ResolvedProduct | null {
    const sel = pickerSelection(item.product);
    if (!sel) return null;
    const cached = this._productCache.get(sel.id);
    if (!cached) {
      void this._fetchProduct(sel.id, sel.label);
      return sel.label ? { name: sel.label, url: "", onSale: false } : null;
    }
    if (cached.status === "loaded") return cached.data;
    if (cached.status === "loading")
      return cached.label
        ? { name: cached.label, url: "", onSale: false }
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
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          this._animState = "in";
        });
      });
    }

    this._mql = window.matchMedia("(min-width: 768px)");
    this._isDesktop = this._mql.matches;
    this._onMqlChange = () => {
      this._isDesktop = this._mql!.matches;
      // Cards-per-view changed → re-clamp the active page.
      this._carouselPage = 0;
    };
    this._mql.addEventListener("change", this._onMqlChange);

    // Pause autoplay when scrolled out of view (saves CPU and prevents the
    // carousel from racing on a long page).
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
    if (this._mql && this._onMqlChange)
      this._mql.removeEventListener("change", this._onMqlChange);
    this._teardownAutoplay();
    this._io?.disconnect();
    this._io = null;
    if (this._scrollRaf) cancelAnimationFrame(this._scrollRaf);
  }

  updated() {
    // (Re)wire autoplay whenever the render settles — config or state may change.
    this._teardownAutoplay();
    this._setupAutoplay();
  }

  // ------------------------------------------------------------
  // Carousel: scroll-snap navigation (RTL-safe via abs(scrollLeft))
  // ------------------------------------------------------------

  private get _track(): HTMLElement | null {
    return this.renderRoot.querySelector(".t-carousel-track");
  }

  private _pageCount(total: number): number {
    return Math.max(1, Math.ceil(total / this._cardsPerView()));
  }

  private _scrollToPage(page: number) {
    const track = this._track;
    if (!track) return;
    const pages = this._pageCount(this._items().length);
    const clamped = Math.max(0, Math.min(pages - 1, page));
    const left = (this._isRtl() ? -1 : 1) * clamped * track.clientWidth;
    track.scrollTo({ left, behavior: "smooth" });
    this._carouselPage = clamped;
  }

  private _carouselPrev = () => {
    const pages = this._pageCount(this._items().length);
    let p = this._carouselPage - 1;
    if (p < 0) p = this.config?.carousel_loop !== false ? pages - 1 : 0;
    this._scrollToPage(p);
  };

  private _carouselNext = () => {
    const pages = this._pageCount(this._items().length);
    let p = this._carouselPage + 1;
    if (p >= pages) p = this.config?.carousel_loop !== false ? 0 : pages - 1;
    this._scrollToPage(p);
  };

  private _onTrackScroll = () => {
    if (this._scrollRaf) return;
    this._scrollRaf = requestAnimationFrame(() => {
      this._scrollRaf = null;
      const track = this._track;
      if (!track || track.clientWidth === 0) return;
      const page = Math.round(Math.abs(track.scrollLeft) / track.clientWidth);
      const pages = this._pageCount(this._items().length);
      const clamped = Math.max(0, Math.min(pages - 1, page));
      if (clamped !== this._carouselPage) this._carouselPage = clamped;
    });
  };

  // --- Desktop pointer-drag (mouse only; touch keeps native momentum) ---
  private _onDragDown = (e: PointerEvent) => {
    if (e.pointerType !== "mouse") return;
    const track = this._track;
    if (!track) return;
    this._dragActive = true;
    this._dragMoved = false;
    this._dragStartX = e.clientX;
    this._dragStartScroll = track.scrollLeft;
    track.style.scrollSnapType = "none";
    track.style.scrollBehavior = "auto";
    track.classList.add("is-grabbing");
  };

  private _onDragMove = (e: PointerEvent) => {
    if (!this._dragActive) return;
    const track = this._track;
    if (!track) return;
    const dx = e.clientX - this._dragStartX;
    if (Math.abs(dx) > 4) this._dragMoved = true;
    track.scrollLeft = this._dragStartScroll - dx;
  };

  private _endDrag = () => {
    const track = this._track;
    if (!track || !this._dragActive) return;
    this._dragActive = false;
    track.style.scrollSnapType = "";
    track.style.scrollBehavior = "";
    track.classList.remove("is-grabbing");
  };

  /** Swallow the click that follows a pointer-drag so a chip link isn't opened. */
  private _onChipClick = (e: Event) => {
    if (this._dragMoved) {
      e.preventDefault();
      this._dragMoved = false;
    }
  };

  // ------------------------------------------------------------
  // Autoplay (carousel only)
  // ------------------------------------------------------------

  private _setupAutoplay() {
    const c = this.config || {};
    const layout = this._pickValue<TestimonialsLayout>(c.layout, "marquee");
    if (layout !== "carousel" || !c.carousel_autoplay) return;
    if (this._interactionPaused) return;
    if (!this._inView) return;
    if (this._pageCount(this._items().length) < 2) return;

    const delay = Math.max(2, this._num(c.carousel_autoplay_delay, 5)) * 1000;
    this._autoplayTimer = window.setTimeout(() => {
      this._autoplayTimer = null;
      this._carouselNext();
    }, delay);
  }

  private _teardownAutoplay() {
    if (this._autoplayTimer) {
      clearTimeout(this._autoplayTimer);
      this._autoplayTimer = null;
    }
  }

  private _pauseInteraction = () => {
    if (this._interactionPaused) return;
    this._interactionPaused = true;
    this._teardownAutoplay();
  };

  private _resumeInteraction = () => {
    if (!this._interactionPaused) return;
    this._interactionPaused = false;
    this._setupAutoplay();
  };

  // ------------------------------------------------------------
  // Icons
  // ------------------------------------------------------------

  private _starPath =
    "M12 17.27l-6.18 3.73 1.64-7.03L2 9.24l7.19-.61L12 2l2.81 6.63 7.19.61-5.46 4.73 1.64 7.03z";

  private _icon(name: "chevron" | "quote") {
    switch (name) {
      case "chevron":
        return html`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor"
          stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"
          aria-hidden="true"><path d="m9 6 6 6-6 6" /></svg>`;
      case "quote":
        return html`<svg viewBox="0 0 24 24" fill="currentColor"
          aria-hidden="true"><path d="M9.5 7C6.5 7 4 9.5 4 12.5V19h6.5v-6.5H7.2c0-1.8 1.5-3 3.3-3V7zm10 0C16.5 7 14 9.5 14 12.5V19h6.5v-6.5h-3.3c0-1.8 1.5-3 3.3-3V7z" /></svg>`;
    }
  }

  // ------------------------------------------------------------
  // Render: stars
  // ------------------------------------------------------------

  private _renderStars(rating: number) {
    const pct = Math.max(0, Math.min(100, (rating / 5) * 100));
    const row = (cls: string) => html`
      <div class=${cls} aria-hidden="true">
        ${[0, 1, 2, 3, 4].map(
          () => html`<svg viewBox="0 0 24 24"><path d=${this._starPath} /></svg>`
        )}
      </div>
    `;
    return html`
      <div class="t-stars" style=${`--t-star-pct:${pct}%`}>
        ${row("t-stars-bg")}
        <div class="t-stars-fg-clip">${row("t-stars-fg")}</div>
      </div>
    `;
  }

  private _renderRating(item: TestimonialItem, style: TestimonialRatingStyle) {
    const rating = Math.max(0, Math.min(5, this._num(item.rating, 5)));
    if (rating <= 0) return nothing;
    const label = this._formatRating(rating);
    if (style === "number") {
      return html`<div class="t-rating t-rating--num" aria-label=${`${label}/5`}>
        <svg class="t-rating-star" viewBox="0 0 24 24" aria-hidden="true">
          <path d=${this._starPath} />
        </svg>
        <span>${label}</span>
      </div>`;
    }
    return html`<div class="t-rating" aria-label=${`${label}/5`} role="img">
      ${this._renderStars(rating)}
      ${style === "stars-number"
        ? html`<span class="t-rating-text">(${label}/5)</span>`
        : nothing}
    </div>`;
  }

  // ------------------------------------------------------------
  // Render: product chip
  // ------------------------------------------------------------

  private _renderChip(item: TestimonialItem, chipStyle: TestimonialChipStyle) {
    const product = this._resolveProduct(item);
    const name = this._t(item.product_name) || product?.name || "";
    const image = item.product_image || product?.image || "";
    const url = (item.product_url || "").trim() || product?.url || "";

    let price = "";
    let compare = "";
    const priceOverride = (item.product_price || "").toString().trim();
    const compareOverride = (item.product_compare || "").toString().trim();
    if (priceOverride) {
      price = priceOverride;
      if (compareOverride) {
        const a = parseMoney(priceOverride);
        const b = parseMoney(compareOverride);
        if (a !== undefined && b !== undefined && b > a)
          compare = compareOverride;
      }
    } else if (product) {
      if (product.onSale && product.sale !== undefined) {
        price = formatMoney(product.sale, product.currency);
        if (product.regular !== undefined)
          compare = formatMoney(product.regular, product.currency);
      } else if (product.regular !== undefined) {
        price = formatMoney(product.regular, product.currency);
      }
    }

    if (!name && !image && !price) return nothing;

    const inner = html`
      ${image
        ? html`<span class="t-chip-media"
            ><img src=${image} alt=${name || ""} loading="lazy"
          /></span>`
        : nothing}
      <span class="t-chip-body">
        ${name ? html`<span class="t-chip-name">${name}</span>` : nothing}
        ${price
          ? html`<span class="t-chip-prices">
              <span class="t-chip-price">${price}</span>
              ${compare
                ? html`<span class="t-chip-compare">${compare}</span>`
                : nothing}
            </span>`
          : nothing}
      </span>
      ${url
        ? html`<span class="t-chip-go">${this._icon("chevron")}</span>`
        : nothing}
    `;

    return url
      ? html`<a
          class="t-chip"
          data-style=${chipStyle}
          href=${url}
          @click=${this._onChipClick}
          >${inner}</a
        >`
      : html`<div class="t-chip" data-style=${chipStyle}>${inner}</div>`;
  }

  // ------------------------------------------------------------
  // Render: a single testimonial card (shared across all layouts)
  // ------------------------------------------------------------

  private _renderCard(
    item: TestimonialItem,
    index: number,
    cardStyle: TestimonialCardStyle,
    opts: CardOpts
  ) {
    const name = this._t(item.name);
    const meta = this._t(item.meta);
    const quote = this._t(item.quote);

    // Photo-led styles show the customer's own product photo (UGC); others use the
    // round avatar. In "modern" the photo can be toggled off (text-only card); in
    // "overlay" the photo IS the card, so it's always used when present.
    const photo =
      cardStyle === "overlay"
        ? item.photo || ""
        : cardStyle === "modern" && opts.showPhoto
        ? item.photo || ""
        : "";
    const avatar = opts.showAvatar ? item.avatar || DEFAULT_AVATAR : "";

    const ratingBlock = opts.showRating
      ? this._renderRating(item, opts.ratingStyle)
      : nothing;
    const chipBlock = opts.showProduct
      ? this._renderChip(item, opts.chipStyle)
      : nothing;

    const author = (withAvatar: boolean) =>
      name || meta || (withAvatar && avatar)
        ? html`<div class="t-author">
            ${withAvatar && avatar
              ? html`<span class="t-avatar"
                  ><img src=${avatar} alt=${name || ""} loading="lazy"
                /></span>`
              : nothing}
            <div class="t-author-meta">
              ${name ? html`<span class="t-name">${name}</span>` : nothing}
              ${meta ? html`<span class="t-meta">${meta}</span>` : nothing}
            </div>
          </div>`
        : nothing;

    // --- modern: photo on top with an overlaid name chip (reference design) ---
    if (cardStyle === "modern") {
      return html`
        <article class="t-card" data-style="modern" data-index=${index}>
          ${photo
            ? html`<div class="t-photo">
                <img
                  src=${photo}
                  alt=${name ? `تصوير العميل: ${name}` : "تصوير العميل"}
                  loading="lazy"
                />
                ${name || meta
                  ? html`<span class="t-photo-chip">
                      ${avatar
                        ? html`<img
                            class="t-photo-chip-avatar"
                            src=${avatar}
                            alt=${name || ""}
                            loading="lazy"
                          />`
                        : nothing}
                      <span class="t-photo-chip-text"
                        >${name}${meta ? html`, ${meta}` : nothing}</span
                      >
                    </span>`
                  : nothing}
              </div>`
            : nothing}
          <div class="t-body">
            ${!photo ? author(true) : nothing} ${ratingBlock}
            ${quote ? html`<p class="t-quote">${quote}</p>` : nothing}
            ${chipBlock}
          </div>
        </article>
      `;
    }

    // --- overlay: full-bleed photo with a frosted-glass panel pinned to the bottom ---
    if (cardStyle === "overlay") {
      const tone = this._pickValue<TestimonialOverlayTone>(
        this.config?.overlay_tone,
        "dark"
      );
      return html`
        <article
          class="t-card"
          data-style="overlay"
          data-tone=${tone}
          data-index=${index}
        >
          ${photo
            ? html`<img
                class="t-overlay-photo"
                src=${photo}
                alt=${name ? `تصوير العميل: ${name}` : "تصوير العميل"}
                loading="lazy"
              />`
            : nothing}
          <div class="t-overlay-panel">
            ${opts.showQuoteMark
              ? html`<span class="t-quote-mark">${this._icon("quote")}</span>`
              : nothing}
            ${ratingBlock}
            ${quote ? html`<p class="t-quote">${quote}</p>` : nothing}
            ${author(true)} ${chipBlock}
          </div>
        </article>
      `;
    }

    // --- bubble: speech bubble holds the quote; author sits below the tail ---
    if (cardStyle === "bubble") {
      return html`
        <article class="t-card" data-style="bubble" data-index=${index}>
          <div class="t-bubble">
            ${opts.showQuoteMark
              ? html`<span class="t-quote-mark">${this._icon("quote")}</span>`
              : nothing}
            ${ratingBlock}
            ${quote ? html`<p class="t-quote">${quote}</p>` : nothing}
            ${chipBlock}
          </div>
          ${author(true)}
        </article>
      `;
    }

    // --- quote / minimal / glass share a vertical anatomy ---
    return html`
      <article class="t-card" data-style=${cardStyle} data-index=${index}>
        ${opts.showQuoteMark && cardStyle === "quote"
          ? html`<span class="t-quote-mark">${this._icon("quote")}</span>`
          : nothing}
        ${ratingBlock}
        ${quote ? html`<p class="t-quote">${quote}</p>` : nothing}
        ${author(true)} ${chipBlock}
      </article>
    `;
  }

  // ------------------------------------------------------------
  // Render: layouts
  // ------------------------------------------------------------

  private _renderMarquee(
    items: TestimonialItem[],
    cardStyle: TestimonialCardStyle,
    opts: CardOpts
  ) {
    const c = this.config || {};
    const rows = this._num(
      this._pickValue<TestimonialMarqueeRows>(c.marquee_rows, "1"),
      1
    );
    const speed = this._pickValue<TestimonialMarqueeSpeed>(
      c.marquee_speed,
      "normal"
    );
    const baseDir = this._pickValue<TestimonialMarqueeDirection>(
      c.marquee_direction,
      "forward"
    );
    const pauseHover = c.marquee_pause_hover !== false;
    // Seconds-per-card so every row scrolls at the same px/sec regardless of how
    // many cards it holds (the repeat factor cancels out in the duration below).
    const perCardMap: Record<TestimonialMarqueeSpeed, number> = {
      slow: 5,
      normal: 3,
      fast: 1.8,
    };
    const perCard = perCardMap[speed];

    // Repeat the set so the row is wide enough for a seamless −50% loop, then
    // render that set twice (the two halves must be identical for a clean loop).
    const buildOneSet = (source: TestimonialItem[]) => {
      const minCards = 8;
      const reps = Math.max(2, Math.ceil(minCards / Math.max(1, source.length)));
      const oneSet: TestimonialItem[] = [];
      for (let r = 0; r < reps; r++) oneSet.push(...source);
      return oneSet;
    };

    const renderRow = (
      source: TestimonialItem[],
      dir: TestimonialMarqueeDirection
    ) => {
      const oneSet = buildOneSet(source);
      const cards = (copy: number) =>
        oneSet.map(
          (item, i) =>
            html`<div class="t-marquee-cell" aria-hidden=${copy === 1 ? "true" : "false"}>
              ${this._renderCard(item, i, cardStyle, opts)}
            </div>`
        );
      const dur = Math.max(12, oneSet.length * perCard);
      return html`<div
        class="t-marquee-row"
        data-dir=${dir}
        data-pause=${pauseHover ? "hover" : "off"}
        style=${`--t-marquee-dur:${dur}s`}
      >
        <div class="t-marquee-track">${cards(0)}${cards(1)}</div>
      </div>`;
    };

    if (rows >= 2 && items.length > 1) {
      const half = Math.ceil(items.length / 2);
      const rowA = items.slice(0, half);
      const rowB = items.slice(half);
      const altDir: TestimonialMarqueeDirection =
        baseDir === "forward" ? "backward" : "forward";
      return html`<div class="t-marquee" data-rows="2">
        ${renderRow(rowA, baseDir)}
        ${renderRow(rowB.length ? rowB : rowA, altDir)}
      </div>`;
    }

    return html`<div class="t-marquee" data-rows="1">
      ${renderRow(items, baseDir)}
    </div>`;
  }

  private _renderCarousel(
    items: TestimonialItem[],
    cardStyle: TestimonialCardStyle,
    opts: CardOpts
  ) {
    const c = this.config || {};
    const showArrows = c.carousel_arrows !== false;
    const showDots = c.carousel_dots !== false;
    const pages = this._pageCount(items.length);
    const multiPage = pages > 1;

    return html`
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
          ${items.map(
            (item, i) =>
              html`<div class="t-carousel-cell">
                ${this._renderCard(item, i, cardStyle, opts)}
              </div>`
          )}
        </div>

        ${showArrows && multiPage
          ? html`
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
            `
          : nothing}
      </div>
      ${showDots && multiPage
        ? html`<div class="t-dots" role="tablist">
            ${Array.from({ length: pages }).map(
              (_, p) => html`<button
                type="button"
                class="t-dot"
                aria-current=${this._carouselPage === p ? "true" : "false"}
                aria-label=${`${this._lang() === "ar" ? "صفحة" : "Page"} ${p + 1}`}
                @click=${() => this._scrollToPage(p)}
              ></button>`
            )}
          </div>`
        : nothing}
    `;
  }

  private _renderGridish(
    items: TestimonialItem[],
    layout: "grid" | "masonry",
    cardStyle: TestimonialCardStyle,
    opts: CardOpts
  ) {
    return html`<div class="t-grid" data-layout=${layout}>
      ${items.map(
        (item, i) =>
          html`<div class="t-grid-cell">
            ${this._renderCard(item, i, cardStyle, opts)}
          </div>`
      )}
    </div>`;
  }

  // ------------------------------------------------------------
  // Render: host style (CSS custom properties)
  // ------------------------------------------------------------

  private _buildHostStyle(c: TestimonialsConfig): string {
    const cols = this._resolveColumns();
    const cardRadius = this._num(c.card_radius, 20);
    // Each photo style carries its own ratio field (Salla conditions match a single
    // card_style), so resolve from the field that matches the active style.
    const cardStyle = this._pickValue<TestimonialCardStyle>(
      c.card_style,
      "modern"
    );
    const aspect = this._pickValue<TestimonialPhotoAspect>(
      cardStyle === "overlay" ? c.card_aspect : c.photo_aspect,
      "4/5"
    );
    const parts = [
      c.bg_color ? `--t-bg:${c.bg_color}` : "",
      c.title_color ? `--t-title:${c.title_color}` : "",
      c.subtitle_color ? `--t-subtitle:${c.subtitle_color}` : "",
      c.card_bg ? `--t-card-bg:${c.card_bg}` : "",
      c.border_color ? `--t-border:${c.border_color}` : "",
      c.name_color ? `--t-name:${c.name_color}` : "",
      c.meta_color ? `--t-meta:${c.meta_color}` : "",
      c.text_color ? `--t-text:${c.text_color}` : "",
      c.star_color ? `--t-star:${c.star_color}` : "",
      c.star_empty_color ? `--t-star-empty:${c.star_empty_color}` : "",
      c.accent_color ? `--t-accent:${c.accent_color}` : "",
      c.chip_bg ? `--t-chip-bg:${c.chip_bg}` : "",
      c.chip_name_color ? `--t-chip-name:${c.chip_name_color}` : "",
      c.chip_price_color ? `--t-chip-price:${c.chip_price_color}` : "",
      c.chip_compare_color ? `--t-chip-compare:${c.chip_compare_color}` : "",
      `--t-radius:${cardRadius}px`,
      `--t-aspect:${aspect}`,
      `--t-cols-mobile:${cols.mobile}`,
      `--t-cols-desktop:${cols.desktop}`,
    ];
    return parts.filter(Boolean).join("; ");
  }

  // ------------------------------------------------------------
  // Render
  // ------------------------------------------------------------

  render() {
    const c: TestimonialsConfig = this.config || {};
    const items = this._items();

    const layout = this._pickValue<TestimonialsLayout>(c.layout, "marquee");
    const cardStyle = this._pickValue<TestimonialCardStyle>(
      c.card_style,
      "modern"
    );
    const ratingStyle = this._pickValue<TestimonialRatingStyle>(
      c.rating_style,
      "stars-number"
    );
    const chipStyle = this._pickValue<TestimonialChipStyle>(c.chip_style, "card");
    const enableAnim = c.enable_entrance_anim !== false;
    const hoverLift = c.enable_hover_lift !== false;

    const opts: CardOpts = {
      showRating: c.show_rating !== false,
      ratingStyle,
      showAvatar: c.show_avatar !== false,
      showPhoto: c.show_photo !== false,
      showQuoteMark: c.show_quote_mark !== false,
      showProduct: c.show_product !== false,
      chipStyle,
    };

    const hostStyle = this._buildHostStyle(c);

    const eyebrow = this._t(c.eyebrow);
    const title = this._t(c.section_title);
    const subtitle = this._t(c.section_subtitle);

    const showSummary = c.show_summary === true;
    const summaryRating = Math.max(0, Math.min(5, this._num(c.summary_rating, 0)));
    const summaryCount = this._t(c.summary_count_text);
    const hasSummary = showSummary && (summaryRating > 0 || !!summaryCount);

    if (items.length === 0) {
      return html`<section class="t-section" style=${hostStyle}>
        <p class="t-empty">
          ${this._lang() === "ar"
            ? "أضف رأي عميل واحدًا على الأقل لعرض هذا القسم."
            : "Add at least one testimonial to display this section."}
        </p>
      </section>`;
    }

    const header =
      eyebrow || title || subtitle || hasSummary
        ? html`<header
            class="t-header"
            data-anim=${enableAnim ? this._animState : "in"}
          >
            ${eyebrow ? html`<p class="t-eyebrow">${eyebrow}</p>` : nothing}
            ${title ? html`<h2 class="t-title">${title}</h2>` : nothing}
            ${subtitle ? html`<p class="t-subtitle">${subtitle}</p>` : nothing}
            ${hasSummary
              ? html`<div class="t-summary">
                  ${summaryRating > 0
                    ? html`<span class="t-summary-num"
                          >${this._formatRating(summaryRating)}</span
                        >${this._renderStars(summaryRating)}`
                    : nothing}
                  ${summaryCount
                    ? html`<span class="t-summary-count">${summaryCount}</span>`
                    : nothing}
                </div>`
              : nothing}
          </header>`
        : nothing;

    const body =
      layout === "marquee"
        ? this._renderMarquee(items, cardStyle, opts)
        : layout === "carousel"
        ? this._renderCarousel(items, cardStyle, opts)
        : this._renderGridish(
            items,
            layout as "grid" | "masonry",
            cardStyle,
            opts
          );

    return html`
      <section
        class="t-section"
        style=${hostStyle}
        data-layout=${layout}
        data-card=${cardStyle}
        data-anim=${enableAnim ? this._animState : "in"}
        data-hover-lift=${hoverLift ? "on" : "off"}
      >
        ${header}
        <div class="t-body-wrap">${body}</div>
      </section>
    `;
  }
}
