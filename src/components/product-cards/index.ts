import { html, nothing, type PropertyValues } from "lit";
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
  ProductCardsConfig,
  PcCardItem,
  PcImageLayout,
  PcAspect,
  PcImageFit,
  PcContentAlign,
  PcCardSize,
  PcCardSizeDesktop,
  PcButtonRadius,
  PcButtonAction,
  PcNavPosition,
  MaybeMultiLang,
  RawLinkValue,
  ResolvedProduct,
} from "./types";
import { productCardsStyles } from "./style";

type CartState = "idle" | "loading" | "added";

/**
 * <growth-product-cards> — 3D Product Cards (بطاقات المنتجات ٣D)
 * Part of the Growth Kit bundle for Salla Twilight.
 *
 * A premium depth coverflow where every slide is a full product card. The
 * active card sits centered at full size; its neighbours shrink, recede and
 * fade behind it. Each card resolves its own content — link a real store
 * product (auto-fills name/image/price/url and enables add-to-cart) or override
 * any field by hand. Visual styling is shared across all cards for consistency.
 *
 * RTL-first and mobile-first; respects prefers-reduced-motion.
 */
export default class GrowthProductCards extends GrowthElement {
  static styles = productCardsStyles;


  @property({ type: Object })
  config?: ProductCardsConfig;

  @state() private _activeIndex = 0;
  /** Drives the header + slides entrance gate. */
  @state() private _animState: "ready" | "in" = "ready";
  /** Measured tallest card height — the track's height (px). */
  @state() private _stageH: number | null = null;

  private _autoplayTimer: number | null = null;
  private _hoverPaused = false;
  private _hasInitializedActive = false;

  /** Per-card add-to-cart lifecycle, keyed by card index. */
  private _cartStates = new Map<number, CartState>();
  private _cartTimers = new Map<number, number>();

  /** Swipe tracking. */
  private _swipeStartX: number | null = null;
  private _swipeStartY: number | null = null;
  private _swipeActive = false;

  /** Last-rendered wrapped offset per slide — detects a loop wrap to snap it. */
  private _prevDiff = new Map<number, number>();

  private _resizeRaf: number | null = null;

  /** Salla SDK global — see shared/product.ts. */
  private get _salla(): any {
    return sallaGlobal();
  }

  // ------------------------------------------------------------
  // Value helpers
  // ------------------------------------------------------------


  // ------------------------------------------------------------
  // Cards
  // ------------------------------------------------------------

  private _cards(): PcCardItem[] {
    const list = this.config?.cards;
    if (!Array.isArray(list)) return [];
    return list.filter((card) => {
      if (!card || typeof card !== "object") return false;
      return !!(
        card.product ||
        card.image ||
        this._t(card.title) ||
        card.price ||
        this._t(card.badge)
      );
    });
  }

  // ------------------------------------------------------------
  // Product resolution (store source) — cache shared, keyed by product id.
  // ------------------------------------------------------------

  private _productCache = new Map<
    number,
    | { status: "loading" }
    | { status: "loaded"; data: ResolvedProduct }
    | { status: "failed" }
  >();


  private async _fetchProduct(id: number) {
    if (this._productCache.has(id)) return;

    this._productCache.set(id, { status: "loading" });
    this.requestUpdate();

    try {
      const data = await fetchProductDetails(id);
      this._productCache.set(id, { status: "loaded", data });
    } catch (err) {
      console.warn("[growth-product-cards] product fetch failed", id, err);
      this._productCache.set(id, { status: "failed" });
    }
    this.requestUpdate();
  }

  private _resolveCardProduct(card: PcCardItem): ResolvedProduct | null {
    const sel = pickerSelection(card.product);
    if (!sel) return null;
    const cached = this._productCache.get(sel.id);
    if (!cached) {
      void this._fetchProduct(sel.id);
      return sel.label ? { name: sel.label, url: "", onSale: false } : null;
    }
    if (cached.status === "loaded") return cached.data;
    if (cached.status === "loading")
      return sel.label ? { name: sel.label, url: "", onSale: false } : null;
    return null;
  }

  /**
   * `card.link` is a Salla `variable-list` field resolved to a final URL string
   * server-side. Parse defensively (bare string / `{ url|value }` / single-item
   * array) and treat "" / "#" as "no link".
   */
  private _resolveLink(raw: RawLinkValue): string {
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
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          this._animState = "in";
        });
      });
    }

    window.addEventListener("resize", this._onResize, { passive: true });
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    this._teardownAutoplay();
    window.removeEventListener("resize", this._onResize);
    if (this._resizeRaf) cancelAnimationFrame(this._resizeRaf);
    for (const t of this._cartTimers.values()) clearTimeout(t);
    this._cartTimers.clear();
  }

  willUpdate(changed: PropertyValues) {
    if (!changed.has("config")) return;

    // A fresh config invalidates per-card cart state.
    this._cartStates.clear();

    const cards = this._cards();
    if (!this._hasInitializedActive && cards.length > 0) {
      const wanted = this._num(this.config?.initial_slide, NaN);
      // Coverflow starts centered so both neighbours peek in.
      const autoStart = Math.floor(cards.length / 2);
      const start = Number.isNaN(wanted)
        ? autoStart
        : Math.max(0, Math.min(cards.length - 1, Math.round(wanted) - 1));
      this._activeIndex = start;
      this._hasInitializedActive = true;
    } else if (this._activeIndex >= cards.length) {
      this._activeIndex = Math.max(0, cards.length - 1);
    }

    this._teardownAutoplay();
    this._setupAutoplay();
  }

  updated() {
    // Snapshot where each slide ended up so the next render can detect a wrap.
    const n = this._cards().length;
    this._prevDiff.clear();
    for (let i = 0; i < n; i++) this._prevDiff.set(i, this._wrappedDiff(i));

    this._measureStage();
  }

  private _onResize = () => {
    if (this._resizeRaf) cancelAnimationFrame(this._resizeRaf);
    this._resizeRaf = requestAnimationFrame(() => this._measureStage());
  };

  /**
   * The track's height must equal the tallest card (cards are kept equal-height,
   * but we measure the max defensively). offsetHeight ignores the coverflow
   * scale transforms, so it returns the true layout height. Re-runs when images
   * load (their dimensions change a card's height).
   */
  private _measureStage() {
    const root = this.shadowRoot;
    if (!root) return;

    let max = 0;
    for (const card of root.querySelectorAll<HTMLElement>(".pc-card")) {
      if (card.offsetHeight > 0) max = Math.max(max, card.offsetHeight);
    }

    for (const img of root.querySelectorAll<HTMLImageElement>(".pc-img")) {
      if (!img.complete && !img.dataset.measureHooked) {
        img.dataset.measureHooked = "1";
        const remeasure = () => this._measureStage();
        img.addEventListener("load", remeasure, { once: true });
        img.addEventListener("error", remeasure, { once: true });
      }
    }

    if (max > 0 && max !== this._stageH) this._stageH = max;
  }

  // ------------------------------------------------------------
  // Autoplay
  // ------------------------------------------------------------

  private _setupAutoplay() {
    const c = this.config || {};
    if (!c.autoplay) return;
    if (this._cards().length < 2) return;
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
  // Navigation
  // ------------------------------------------------------------

  private _changeActive(next: number) {
    if (next === this._activeIndex) return;
    this._activeIndex = next;
  }

  private _goPrev = () => {
    const n = this._cards().length;
    if (n <= 1) return;
    const loop = this.config?.loop !== false;
    let next = this._activeIndex - 1;
    if (next < 0) next = loop ? n - 1 : 0;
    this._changeActive(next);
  };

  private _goNext = () => {
    const n = this._cards().length;
    if (n <= 1) return;
    const loop = this.config?.loop !== false;
    let next = this._activeIndex + 1;
    if (next >= n) next = loop ? 0 : n - 1;
    this._changeActive(next);
  };

  private _goTo = (idx: number) => {
    const n = this._cards().length;
    if (idx < 0 || idx >= n) return;
    this._changeActive(idx);
  };

  /** Signed slot offset from the active slide, wrapped the shorter way when
      looping (so card 0 can sit just before the last). */
  private _wrappedDiff(i: number): number {
    const n = this._cards().length;
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
    if (this._cards().length === 0) return "hidden";
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
    return this._activeIndex === 0 || this._cards().length <= 1;
  }
  private _isNextDisabled(): boolean {
    if (this.config?.loop !== false) return false;
    return (
      this._activeIndex === this._cards().length - 1 ||
      this._cards().length <= 1
    );
  }

  // ------------------------------------------------------------
  // Click / swipe
  // ------------------------------------------------------------

  private _onSlideClick = (e: MouseEvent) => {
    if (this._swipeActive) return;
    const slide = e.currentTarget as HTMLElement | null;
    if (!slide) return;
    if (slide.dataset.pos === "active") return; // active handles its own clicks
    const idx = Number(slide.dataset.index);
    if (Number.isInteger(idx)) this._goTo(idx);
  };

  private _onPointerDown = (e: PointerEvent) => {
    if (this._cards().length <= 1) return;
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
  // Add to cart (per card)
  // ------------------------------------------------------------

  private _setCart(i: number, state: CartState) {
    this._cartStates.set(i, state);
    this.requestUpdate();
  }

  private _onPrimaryClick = async (
    e: Event,
    i: number,
    id: number | undefined,
    action: PcButtonAction,
    fallbackHref: string
  ) => {
    e.preventDefault();
    e.stopPropagation();
    if (this._cartStates.get(i) === "loading") return;

    const salla = this._salla;
    const addItem = salla?.cart?.addItem ?? salla?.cart?.api?.addItem;

    // No usable product id or no cart API → degrade to navigation.
    if (!id || typeof addItem !== "function") {
      if (fallbackHref) window.location.href = fallbackHref;
      return;
    }

    this._setCart(i, "loading");
    try {
      await addItem.call(salla.cart, { id, quantity: 1 });
      this._setCart(i, "added");
      if (action === "buy_now") {
        window.location.href = "/cart";
        return;
      }
      const prev = this._cartTimers.get(i);
      if (prev) clearTimeout(prev);
      this._cartTimers.set(
        i,
        window.setTimeout(() => this._setCart(i, "idle"), 2500)
      );
    } catch (err) {
      console.warn("[growth-product-cards] add to cart failed", err);
      this._setCart(i, "idle");
    }
  };

  private _defaultButtonLabel(action: PcButtonAction): string {
    const ar = this._lang() === "ar";
    switch (action) {
      case "buy_now":
        return ar ? "اشترِ الآن" : "Buy now";
      case "view_product":
        return ar ? "عرض المنتج" : "View product";
      case "add_to_cart":
      default:
        return ar ? "أضف إلى السلة" : "Add to cart";
    }
  }

  // ------------------------------------------------------------
  // Icons
  // ------------------------------------------------------------

  private _icon(name: "bag" | "arrow" | "check" | "chevron") {
    switch (name) {
      case "bag":
        return html`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor"
          stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M6 8h12l-1 11.5a1.5 1.5 0 0 1-1.5 1.4H8.5A1.5 1.5 0 0 1 7 19.5z" />
          <path d="M9 8a3 3 0 0 1 6 0" />
        </svg>`;
      case "arrow":
        return html`<svg class="pc-btn__arrow" viewBox="0 0 24 24" fill="none"
          stroke="currentColor" stroke-width="2.4" stroke-linecap="round"
          stroke-linejoin="round">
          <path d="M5 12h14M13 6l6 6-6 6" />
        </svg>`;
      case "check":
        return html`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor"
          stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <path d="M20 6 9 17l-5-5" />
        </svg>`;
      case "chevron":
        return html`<svg viewBox="0 0 24 24"><path d="m9 6 6 6-6 6" /></svg>`;
    }
  }

  // ------------------------------------------------------------
  // Render
  // ------------------------------------------------------------

  render() {
    const c: ProductCardsConfig = this.config || {};
    const cards = this._cards();

    // --- Global visual resolution ---
    const imageLayout = this._pickValue<PcImageLayout>(c.image_layout, "inside");
    // Background cards are full-bleed in a coverflow that needs one uniform
    // silhouette, so we lock them to a tall portrait (the aspect field is hidden
    // in bg mode). Only "inside" exposes the merchant choice — there it sizes the
    // image frame at the card top.
    const aspect: PcAspect =
      imageLayout === "background"
        ? "3/4"
        : this._pickValue<PcAspect>(c.aspect_ratio, "1/1");
    // Image fit is layout-driven: background fills the card (cover); only
    // "inside" exposes the merchant choice.
    const imageFit: PcImageFit =
      imageLayout === "background"
        ? "cover"
        : this._pickValue<PcImageFit>(c.image_fit, "contain");
    const contentAlign = this._pickValue<PcContentAlign>(c.content_align, "right");
    const cardRadius = this._num(c.card_radius, 22);

    const sizeMobile = this._pickValue<PcCardSize>(c.card_size_mobile, "medium");
    const sizeDesktopRaw = this._pickValue<PcCardSizeDesktop>(
      c.card_size_desktop,
      "inherit"
    );
    const sizeDesktop =
      sizeDesktopRaw === "inherit" ? sizeMobile : sizeDesktopRaw;

    // Background layout overlays text on the image → light text on a dark scrim.
    const lightText = imageLayout === "background";
    const accent = c.accent_color || "#f0712c";
    // No solid surface behind the background-layout image (a rounded composited
    // image over a solid fill bleeds a corner sliver — see the webkit memory).
    const cardBgDefault =
      imageLayout === "background" ? "transparent" : "#ffffff";

    const sizeToCardW = (s: PcCardSize, desktop: boolean): string => {
      if (desktop) {
        return s === "compact" ? "300px" : s === "large" ? "382px" : "340px";
      }
      return s === "compact"
        ? "min(280px, 76vw)"
        : s === "large"
        ? "min(360px, 88vw)"
        : "min(322px, 82vw)";
    };

    const btnRadiusMap: Record<PcButtonRadius, string> = {
      square: "0px",
      soft: "12px",
      rounded: "22px",
      pill: "999px",
    };
    const btnRadius =
      btnRadiusMap[this._pickValue<PcButtonRadius>(c.button_radius, "pill")];

    const hostStyle = [
      `--pc-bg: ${c.bg_color || "#fbeee0"}`,
      `--pc-accent: ${accent}`,
      `--pc-card-bg: ${c.card_bg || cardBgDefault}`,
      `--pc-card-radius: ${cardRadius}px`,
      `--pc-aspect: ${aspect}`,
      `--pc-img-fit: ${imageFit}`,
      `--pc-card-w: ${sizeToCardW(sizeMobile, false)}`,
      `--pc-card-w-desk: ${sizeToCardW(sizeDesktop, true)}`,
      this._stageH ? `--pc-stage-h: ${this._stageH}px` : "",
      `--pc-title: ${c.title_color || (lightText ? "#ffffff" : "#14181f")}`,
      `--pc-text: ${
        c.text_color || (lightText ? "rgba(255,255,255,0.82)" : "#5b6470")
      }`,
      `--pc-price: ${c.price_color || accent}`,
      `--pc-compare: ${
        c.compare_color || (lightText ? "rgba(255,255,255,0.55)" : "#9aa1ac")
      }`,
      `--pc-badge-bg: ${c.badge_bg || accent}`,
      `--pc-badge-color: ${c.badge_color || "#ffffff"}`,
      `--pc-btn-bg: ${c.button_bg || accent}`,
      `--pc-btn-color: ${c.button_color || "#ffffff"}`,
      `--pc-btn-radius: ${btnRadius}`,
      `--pc-shipping: ${
        c.shipping_color || (lightText ? "rgba(255,255,255,0.6)" : "#8a93a0")
      }`,
      `--pc-dot-color: ${accent}`,
    ]
      .filter(Boolean)
      .join("; ");

    if (cards.length === 0) {
      return html`
        <section class="pc-empty" style=${hostStyle}>
          <p>
            ${this._lang() === "ar"
              ? "أضف بطاقة منتج واحدة على الأقل لعرض الكاروسيل."
              : "Add at least one product card to show the carousel."}
          </p>
        </section>
      `;
    }

    const isSingle = cards.length === 1;
    const title = this._t(c.section_title);
    const subtitle = this._t(c.section_subtitle);
    const showNav = c.show_nav_buttons !== false && !isSingle;
    const navPosition = this._pickValue<PcNavPosition>(c.nav_position, "sides");
    const showTopNav = showNav && navPosition === "top";
    const showSideNav = showNav && navPosition === "sides";
    const showDots = !!c.show_pagination && !isSingle;
    const enterState = c.enable_entrance_anim === false ? "in" : this._animState;

    const header =
      title || subtitle || showTopNav
        ? html`
            <div class="pc-head" data-enter=${enterState}>
              <div class="pc-head__text">
                ${title
                  ? html`<h2 class="pc-head-title">${title}</h2>`
                  : nothing}
                ${subtitle
                  ? html`<p class="pc-head-sub">${subtitle}</p>`
                  : nothing}
              </div>
              ${showTopNav
                ? html`<div class="pc-nav-group">
                    ${this._renderNav("prev", false)}
                    ${this._renderNav("next", false)}
                  </div>`
                : nothing}
            </div>
          `
        : nothing;

    return html`
      <section
        class="pc"
        style=${hostStyle}
        data-enter=${enterState}
        data-layout=${imageLayout}
        @mouseenter=${this._onHoverIn}
        @mouseleave=${this._onHoverOut}
      >
        ${header}

        <div class="pc-stage">
          <div
            class="pc-track"
            @pointerdown=${this._onPointerDown}
            @pointermove=${this._onPointerMove}
            @pointerup=${this._onPointerUp}
            @pointercancel=${this._onPointerUp}
          >
            ${cards.map((card, i) => {
              const diff = this._wrappedDiff(i);
              const pos = this._slidePos(i);
              const prev = this._prevDiff.get(i);
              const instant =
                prev !== undefined && Math.abs(diff - prev) > cards.length / 2;
              return html`
                <div
                  class="pc-slide"
                  data-pos=${pos}
                  data-index=${i}
                  data-instant=${instant ? "" : nothing}
                  @click=${this._onSlideClick}
                >
                  ${this._renderCard(card, i, {
                    imageLayout,
                    contentAlign,
                  })}
                </div>
              `;
            })}
          </div>

          ${showSideNav
            ? html`
                ${this._renderNav("prev", true)}${this._renderNav("next", true)}
              `
            : nothing}
        </div>

        ${showDots
          ? html`
              <div class="pc-dots" role="tablist">
                ${cards.map(
                  (_, i) => html`
                    <button
                      class="pc-dot"
                      type="button"
                      aria-current=${this._activeIndex === i ? "true" : "false"}
                      aria-label=${`${i + 1}`}
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

  private _renderNav(dir: "prev" | "next", side: boolean) {
    const onClick = dir === "prev" ? this._goPrev : this._goNext;
    const disabled =
      dir === "prev" ? this._isPrevDisabled() : this._isNextDisabled();
    const cls = side
      ? `pc-nav pc-nav--side pc-nav--${dir}`
      : `pc-nav pc-nav--${dir}`;
    return html`
      <button
        class=${cls}
        type="button"
        @click=${onClick}
        ?disabled=${disabled}
        aria-label=${dir === "prev" ? "Previous" : "Next"}
      >
        ${this._icon("chevron")}
      </button>
    `;
  }

  private _renderCard(
    card: PcCardItem,
    i: number,
    g: {
      imageLayout: PcImageLayout;
      contentAlign: PcContentAlign;
    }
  ) {
    const c = this.config || {};
    const product = this._resolveCardProduct(card);
    const hasLinkedProduct = !!pickerSelection(card.product);

    const badge = this._t(card.badge);
    const title = this._t(card.title) || product?.name || "";
    const description = this._t(card.description);
    const imageUrl = card.image || product?.image || "";
    const imageAlt = title || product?.imageAlt || "";

    // --- Pricing ---
    const showPrice = c.show_price !== false;
    const showSale = c.show_sale_price !== false;
    let priceMain = "";
    let priceCompare = "";
    if (showPrice) {
      const priceOverride = this._t(card.price as MaybeMultiLang);
      const compareOverride = this._t(card.compare_price as MaybeMultiLang);
      if (priceOverride) {
        priceMain = priceOverride;
        const a = parseMoney(priceOverride);
        const b = parseMoney(compareOverride);
        if (showSale && compareOverride && b !== undefined && a !== undefined && b > a) {
          priceCompare = compareOverride;
        }
      } else if (product) {
        if (product.onSale && product.sale !== undefined) {
          priceMain = formatMoney(product.sale, product.currency);
          if (showSale && product.regular !== undefined) {
            priceCompare = formatMoney(product.regular, product.currency);
          }
        } else if (product.regular !== undefined) {
          priceMain = formatMoney(product.regular, product.currency);
        }
      }
    }

    const shipping = this._t(c.free_shipping_text);

    // --- Button ---
    const showButton = c.show_button !== false;
    const action = this._pickValue<PcButtonAction>(
      c.button_action,
      "add_to_cart"
    );
    const sel = pickerSelection(card.product);
    const resolvedLink = this._resolveLink(card.link);
    const isLinkButton = !hasLinkedProduct || action === "view_product";
    const buttonHref =
      action === "view_product"
        ? product?.url || resolvedLink || ""
        : resolvedLink || product?.url || "";
    const buttonLabel =
      this._t(card.button_label) ||
      this._t(c.default_button_label) ||
      this._defaultButtonLabel(action);

    return html`
      <article class="pc-card" data-layout=${g.imageLayout}>
        <div class="pc-media">
          ${imageUrl
            ? html`<img
                class="pc-img"
                src=${imageUrl}
                alt=${imageAlt}
                loading="lazy"
                draggable="false"
              />`
            : nothing}
          ${badge ? html`<span class="pc-badge">${badge}</span>` : nothing}
        </div>

        <div class="pc-body" data-align=${g.contentAlign}>
          ${title ? html`<h3 class="pc-title">${title}</h3>` : nothing}
          ${priceMain
            ? html`
                <div class="pc-price-row">
                  <span class="pc-price">${priceMain}</span>
                  ${priceCompare
                    ? html`<span class="pc-compare">${priceCompare}</span>`
                    : nothing}
                </div>
              `
            : nothing}
          ${description ? html`<p class="pc-desc">${description}</p>` : nothing}
          ${showButton
            ? html`<div class="pc-actions">
                ${this._renderButton(
                  i,
                  isLinkButton,
                  buttonHref,
                  buttonLabel,
                  action,
                  sel?.id
                )}
              </div>`
            : nothing}
          ${shipping
            ? html`<p class="pc-shipping">${shipping}</p>`
            : nothing}
        </div>
      </article>
    `;
  }

  private _renderButton(
    i: number,
    isLink: boolean,
    href: string,
    label: string,
    action: PcButtonAction,
    productId: number | undefined
  ) {
    if (isLink) {
      return html`
        <a class="pc-btn" href=${href || "#"}>
          <span>${label}</span>${this._icon("arrow")}
        </a>
      `;
    }
    const ar = this._lang() === "ar";
    const state = this._cartStates.get(i) ?? "idle";
    if (state === "loading") {
      return html`
        <button class="pc-btn" type="button" disabled aria-busy="true">
          <span class="pc-spinner" aria-hidden="true"></span>
          <span>${ar ? "جارٍ الإضافة…" : "Adding…"}</span>
        </button>
      `;
    }
    if (state === "added") {
      return html`
        <button class="pc-btn" type="button" disabled>
          ${this._icon("check")}<span>${ar ? "تمت الإضافة" : "Added"}</span>
        </button>
      `;
    }
    return html`
      <button
        class="pc-btn"
        type="button"
        @click=${(e: Event) =>
          this._onPrimaryClick(e, i, productId, action, href)}
      >
        ${this._icon("bag")}<span>${label}</span>
      </button>
    `;
  }
}
