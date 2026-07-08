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
  FeaturedProductConfig,
  FeaturedImageLayout,
  FeaturedImageSide,
  FeaturedAspect,
  FeaturedBgEffect,
  FeaturedImageFit,
  FeaturedCardSize,
  FeaturedCardSizeDesktop,
  FeaturedBgType,
  FeaturedOverlayTone,
  FeaturedCardStyle,
  FeaturedContentAlign,
  FeaturedButtonRadius,
  FeaturedButtonAction,
  FeaturedFloatSpeed,
  MaybeMultiLang,
  ResolvedProduct,
} from "./types";
import { featuredProductStyles } from "./style";

/**
 * <growth-featured-product> — Featured Product (المنتج المميز)
 * Part of the Growth Kit bundle for Salla Twilight.
 *
 * A cinematic single-product spotlight with rich merchant controls:
 *   • Source: link a real store product (auto-fills name/image/price/url and
 *     enables add-to-cart) or type everything manually for crafted landings.
 *   • Image display: inside the card, floating above it, beside the details
 *     (split), or filling the card as a background.
 *   • Decorative background effect behind the product (none/circle/glow).
 *   • Card styles: minimal, soft, premium glass, bold offer.
 *   • Pricing, sale price + discount badge, free-shipping line, highlights.
 *   • Premium motion: entrance reveal, idle float, optional pointer tilt.
 *
 * RTL-first and mobile-first throughout; respects prefers-reduced-motion.
 */
export default class GrowthFeaturedProduct extends GrowthElement {
  static styles = featuredProductStyles;


  @property({ type: Object })
  config?: FeaturedProductConfig;

  /** Entrance gate. */
  @state() private _animState: "ready" | "in" = "ready";
  /** Add-to-cart button lifecycle. */
  @state() private _cartState: "idle" | "loading" | "added" = "idle";

  private _cartResetTimer: number | null = null;

  /** Salla SDK global — see shared/product.ts. */
  private get _salla(): any {
    return sallaGlobal();
  }

  // ------------------------------------------------------------
  // Value helpers
  // ------------------------------------------------------------


  // ------------------------------------------------------------
  // Product resolution (store source)
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
      console.warn("[growth-featured-product] product fetch failed", id, err);
      this._productCache.set(id, { status: "failed" });
    }
    this.requestUpdate();
  }

  private _resolveProduct(): ResolvedProduct | null {
    const sel = pickerSelection(this.config?.product);
    if (!sel) return null;
    const cached = this._productCache.get(sel.id);
    if (!cached) {
      void this._fetchProduct(sel.id);
      return sel.label
        ? { name: sel.label, url: "", onSale: false }
        : null;
    }
    if (cached.status === "loaded") return cached.data;
    if (cached.status === "loading")
      return sel.label ? { name: sel.label, url: "", onSale: false } : null;
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
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    if (this._cartResetTimer) {
      clearTimeout(this._cartResetTimer);
      this._cartResetTimer = null;
    }
  }

  willUpdate(changed: PropertyValues) {
    // A new product selection resets the cart button state.
    if (changed.has("config")) this._cartState = "idle";
  }

  // ------------------------------------------------------------
  // Pointer tilt (desktop, fine pointers, motion-allowed)
  // ------------------------------------------------------------

  private _tiltAllowed(e: PointerEvent): boolean {
    // Check the actual event instead of the device's primary pointer. Hybrid
    // laptops often report `pointer: coarse` even while a mouse is in use.
    return (
      e.pointerType !== "touch" &&
      !window.matchMedia("(prefers-reduced-motion: reduce)").matches
    );
  }

  private _onTiltMove = (e: PointerEvent) => {
    if (!this._tiltAllowed(e)) return;
    const media = e.currentTarget as HTMLElement;
    const inner = media.querySelector(".fp-media-inner") as HTMLElement | null;
    if (!inner) return;
    const r = media.getBoundingClientRect();
    if (!r.width || !r.height) return;
    const px = Math.max(-1, Math.min(1, ((e.clientX - r.left) / r.width) * 2 - 1));
    const py = Math.max(-1, Math.min(1, ((e.clientY - r.top) / r.height) * 2 - 1));
    const max = 10;
    inner.style.transform = `rotateY(${px * max}deg) rotateX(${
      -py * max
    }deg) scale3d(1.025, 1.025, 1.025)`;
  };

  private _onTiltLeave = (e: PointerEvent) => {
    const media = e.currentTarget as HTMLElement;
    const inner = media.querySelector(".fp-media-inner") as HTMLElement | null;
    if (inner) inner.style.transform = "";
  };

  // ------------------------------------------------------------
  // Primary button
  // ------------------------------------------------------------

  private _onPrimaryClick = async (e: Event) => {
    e.preventDefault();
    if (this._cartState === "loading") return;

    const c = this.config || {};
    const action = this._pickValue<FeaturedButtonAction>(
      c.button_action,
      "add_to_cart"
    );
    const sel = pickerSelection(c.product);
    const product = this._resolveProduct();
    const id = sel?.id;

    const salla = this._salla;
    const addItem = salla?.cart?.addItem ?? salla?.cart?.api?.addItem;

    // No usable product id or no cart API → degrade to navigation.
    if (!id || typeof addItem !== "function") {
      if (product?.url) window.location.href = product.url;
      return;
    }

    this._cartState = "loading";
    try {
      await addItem.call(salla.cart, { id, quantity: 1 });
      this._cartState = "added";
      if (action === "buy_now") {
        window.location.href = "/cart";
        return;
      }
      if (this._cartResetTimer) clearTimeout(this._cartResetTimer);
      this._cartResetTimer = window.setTimeout(() => {
        this._cartState = "idle";
      }, 2500);
    } catch (err) {
      console.warn("[growth-featured-product] add to cart failed", err);
      this._cartState = "idle";
    }
  };

  private _defaultButtonLabel(action: FeaturedButtonAction): string {
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

  private _icon(name: "bag" | "arrow" | "check" | "truck") {
    switch (name) {
      case "bag":
        return html`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor"
          stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M6 8h12l-1 11.5a1.5 1.5 0 0 1-1.5 1.4H8.5A1.5 1.5 0 0 1 7 19.5z" />
          <path d="M9 8a3 3 0 0 1 6 0" />
        </svg>`;
      case "arrow":
        return html`<svg class="fp-btn__arrow" viewBox="0 0 24 24" fill="none"
          stroke="currentColor" stroke-width="2.4" stroke-linecap="round"
          stroke-linejoin="round">
          <path d="M5 12h14M13 6l6 6-6 6" />
        </svg>`;
      case "check":
        return html`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor"
          stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <path d="M20 6 9 17l-5-5" />
        </svg>`;
      case "truck":
        return html`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor"
          stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round">
          <path d="M3 7h11v9H3z" />
          <path d="M14 10h3.5L21 13v3h-7z" />
          <circle cx="7" cy="18.5" r="1.6" />
          <circle cx="17" cy="18.5" r="1.6" />
        </svg>`;
    }
  }

  // ------------------------------------------------------------
  // Render
  // ------------------------------------------------------------

  render() {
    const c: FeaturedProductConfig = this.config || {};

    const layout = this._pickValue<FeaturedImageLayout>(
      c.image_layout,
      "floating"
    );
    const side = this._pickValue<FeaturedImageSide>(c.image_side, "start");
    // Aspect, image-fit, bg-effect and its colour are configured per layout in
    // twilight-bundle.json (Salla's form builder can't hide one field for a
    // single value, and breaks when copies share an id — so each layout owns a
    // uniquely-id'd field). The component reads whichever matches the active
    // layout; "background" falls back to the inside/base field (it ignores them).
    const aspect = this._pickValue<FeaturedAspect>(
      layout === "floating"
        ? c.aspect_ratio_floating
        : layout === "split"
        ? c.aspect_ratio_split
        : c.aspect_ratio,
      "1/1"
    );
    const imageFit = this._pickValue<FeaturedImageFit>(
      layout === "split" ? c.image_fit_split : c.image_fit,
      "contain"
    );
    const bgEffect = this._pickValue<FeaturedBgEffect>(
      layout === "floating"
        ? c.bg_effect_floating
        : layout === "split"
        ? c.bg_effect_split
        : c.bg_effect,
      "none"
    );
    const effectColor =
      bgEffect === "none"
        ? ""
        : (layout === "floating"
            ? bgEffect === "glow"
              ? c.bg_effect_color_floating_glow
              : c.bg_effect_color_floating
            : layout === "split"
              ? bgEffect === "glow"
                ? c.bg_effect_color_split_glow
                : c.bg_effect_color_split
              : bgEffect === "glow"
                ? c.bg_effect_color_glow
                : c.bg_effect_color) || "";
    const cardStyle = this._pickValue<FeaturedCardStyle>(c.card_style, "soft");
    const cardRadius = this._num(c.card_radius, 24);
    const mediaRadius = Math.max(8, cardRadius - 6);
    const cardSizeMobile = this._pickValue<FeaturedCardSize>(
      c.card_size_mobile,
      "compact"
    );
    const cardSizeDesktopRaw = this._pickValue<FeaturedCardSizeDesktop>(
      c.card_size_desktop,
      "inherit"
    );
    const cardSizeDesktop =
      cardSizeDesktopRaw === "inherit" ? cardSizeMobile : cardSizeDesktopRaw;
    const bgType = this._pickValue<FeaturedBgType>(c.bg_type, "color");
    const bgOverlayTone = this._pickValue<FeaturedOverlayTone>(
      c.bg_overlay_tone,
      "dark"
    );
    const contentAlign = this._pickValue<FeaturedContentAlign>(c.content_align, "right");
    const highlightsBg = c.highlights_bg || "";

    const sectionTitle = this._t(c.section_title);
    const product = this._resolveProduct();
    const hasLinkedProduct = !!pickerSelection(c.product);

    // --- Content (overrides fall back to the linked product) ---
    const eyebrow = this._t(c.eyebrow);
    const title = this._t(c.title) || product?.name || "";
    const description = this._t(c.description);
    const imageUrl = c.image || product?.image || "";
    const imageHover = c.enable_hover_image ? (c.image_hover || "") : "";
    const imageAlt = title || product?.imageAlt || "";

    const highlights = (Array.isArray(c.highlights) ? c.highlights : [])
      .map((h) => this._t(h?.text))
      .filter(Boolean)
      .slice(0, 3);

    // --- Pricing ---
    const showPrice = c.show_price !== false;
    const showSale = c.show_sale_price !== false;

    let priceMain = "";
    let priceCompare = "";
    if (showPrice) {
      // Override fields always win; fall back to linked product data.
      const priceOverride = this._t(c.price as MaybeMultiLang);
      const compareOverride = this._t(c.compare_price as MaybeMultiLang);
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
    const btnRadiusMap: Record<FeaturedButtonRadius, string> = {
      square: "0px", soft: "12px", rounded: "22px", pill: "999px",
    };
    const btnRadius = btnRadiusMap[
      this._pickValue<FeaturedButtonRadius>(c.button_radius, "pill")
    ];
    const action = this._pickValue<FeaturedButtonAction>(
      c.button_action,
      "add_to_cart"
    );
    // Link mode: no product linked, or "view product" action (both degrade to <a>).
    const isLinkButton = !hasLinkedProduct || action === "view_product";
    const buttonHref =
      action === "view_product"
        ? product?.url || c.button_url || ""
        : c.button_url || "";
    const buttonLabel =
      this._t(c.button_label) || this._defaultButtonLabel(action);

    // --- Motion ---
    const enableFloat = c.enable_float_anim !== false;
    const floatSpeed = this._pickValue<FeaturedFloatSpeed>(
      c.float_anim_speed,
      "normal"
    );
    const floatDurationMap: Record<FeaturedFloatSpeed, string> = {
      slow: "6.8s",
      normal: "5s",
      fast: "3.6s",
    };
    const floatDistanceMap: Record<FeaturedFloatSpeed, string> = {
      slow: "14px",
      normal: "18px",
      fast: "22px",
    };
    const tiltEnabled = !!c.enable_tilt && layout !== "background";

    // --- Layout-aware colour resolution (merchant always wins) ---
    // In the background layout the frosted panel sets the text tone: a dark
    // veil wants light text, a light veil wants dark text. "bold" card always
    // runs light text on its rich gradient.
    const lightText =
      (layout === "background" && bgOverlayTone === "dark") ||
      cardStyle === "bold";
    const cardBgDefault =
      cardStyle === "minimal"
        ? "transparent"
        : cardStyle === "glass"
        ? "rgba(255,255,255,0.55)"
        : cardStyle === "bold"
        ? "linear-gradient(135deg,#283548,#11161f)"
        : "#ffffff";

    // Card size → card max-width, resolved separately per breakpoint.
    // "compact"/"large" use min() so the % clamps width where px > screen width;
    // "medium" defers to the layout default (--fp-maxw, itself breakpoint-aware).
    const sizeToMaxW = (s: FeaturedCardSize): string =>
      s === "compact" ? "min(420px, 82%)"
      : s === "large" ? "min(860px, 96%)"
      : s === "full" ? "100%"
      : "var(--fp-maxw)"; // medium

    const hostStyle = [
      c.bg_color ? `--fp-bg: ${c.bg_color}` : "",
      `--fp-maxw-mob: ${sizeToMaxW(cardSizeMobile)}`,
      `--fp-maxw-desk: ${sizeToMaxW(cardSizeDesktop)}`,
      `--fp-card-bg: ${c.card_bg || cardBgDefault}`,
      `--fp-card-radius: ${cardRadius}px`,
      `--fp-media-radius: ${mediaRadius}px`,
      `--fp-aspect: ${aspect}`,
      `--fp-img-fit: ${imageFit}`,
      `--fp-eyebrow: ${c.eyebrow_color || (lightText ? "#d8b478" : "#b08948")}`,
      `--fp-title: ${c.title_color || (lightText ? "#ffffff" : "#14181f")}`,
      `--fp-text: ${
        c.text_color || (lightText ? "rgba(255,255,255,0.85)" : "#4b5563")
      }`,
      `--fp-price: ${c.price_color || (lightText ? "#ffffff" : "#14181f")}`,
      `--fp-compare: ${
        c.compare_color || (lightText ? "rgba(255,255,255,0.6)" : "#9aa1ac")
      }`,
      `--fp-badge-bg: ${c.badge_bg || "#e23744"}`,
      `--fp-badge-color: ${c.badge_color || "#ffffff"}`,
      `--fp-highlight: ${
        c.highlight_color || (lightText ? "#d8b478" : "#b08948")
      }`,
      `--fp-highlight-text: ${
        c.highlight_text_color ||
        c.text_color ||
        (lightText ? "rgba(255,255,255,0.85)" : "#4b5563")
      }`,
      `--fp-btn-bg: ${c.button_bg || (lightText ? "#ffffff" : "#14181f")}`,
      `--fp-btn-color: ${c.button_color || (lightText ? "#14181f" : "#ffffff")}`,
      `--fp-btn-radius: ${btnRadius}`,
      `--fp-shipping: ${lightText ? "#7ee0aa" : "#2e7d52"}`,
      `--fp-effect: ${
        effectColor || (lightText ? "#d8b478" : "#b08948")
      }`,
      `--fp-float-duration: ${floatDurationMap[floatSpeed]}`,
      `--fp-float-distance: ${floatDistanceMap[floatSpeed]}`,
      // Highlights wrapper background. The framing (tinted box) always renders
      // with a context-aware default tint resolved in CSS; a merchant colour,
      // when set, overrides that default.
      highlightsBg ? `--fp-hl-bg: ${highlightsBg}` : "",
    ]
      .filter(Boolean)
      .join("; ");

    const hasCardContent = !!(
      imageUrl || title || description || highlights.length || priceMain || hasLinkedProduct
    );
    if (!hasCardContent && !sectionTitle) {
      return html`
        <section class="fp-empty" style=${hostStyle}>
          <p>
            ${this._lang() === "ar"
              ? "اربط منتجًا أو أضف صورة وعنوانًا لعرض المنتج المميز."
              : "Link a product or add an image and title to show the featured product."}
          </p>
        </section>
      `;
    }

    const showEffect = bgEffect !== "none" && layout !== "background";

    const media = imageUrl
      ? html`
          <div
            class="fp-media"
            data-tilt=${tiltEnabled ? "on" : "off"}
            @pointermove=${tiltEnabled ? this._onTiltMove : null}
            @pointerleave=${tiltEnabled ? this._onTiltLeave : null}
          >
            ${showEffect
              ? html`<div class="fp-effect" data-effect=${bgEffect}></div>`
              : nothing}
            <div class="fp-media-inner">
              <img
                class="fp-img"
                src=${imageUrl}
                alt=${imageAlt}
                loading="lazy"
                draggable="false"
              />
              ${imageHover && layout !== "background"
                ? html`<img
                    class="fp-img fp-img--hover"
                    src=${imageHover}
                    alt=${imageAlt}
                    loading="lazy"
                    draggable="false"
                  />`
                : nothing}
            </div>
          </div>
        `
      : nothing;

    const content = html`
      <div class="fp-content" data-align=${contentAlign}>
        ${eyebrow ? html`<p class="fp-eyebrow">${eyebrow}</p>` : nothing}
        ${title ? html`<h2 class="fp-title">${title}</h2>` : nothing}
        ${highlights.length
          ? html`
              <ul class="fp-highlights">
                ${highlights.map(
                  (h) => html`
                    <li class="fp-highlight">${this._icon("check")}<span>${h}</span></li>
                  `
                )}
              </ul>
            `
          : nothing}
        ${description ? html`<p class="fp-desc">${description}</p>` : nothing}
        ${priceMain
          ? html`
              <div class="fp-price-row">
                <span class="fp-price">${priceMain}</span>
                ${priceCompare
                  ? html`<span class="fp-compare">${priceCompare}</span>`
                  : nothing}
              </div>
            `
          : nothing}
        ${shipping
          ? html`<p class="fp-shipping">${this._icon("truck")}<span>${shipping}</span></p>`
          : nothing}
        ${showButton ? html`<div class="fp-actions">${this._renderButton(isLinkButton, buttonHref, buttonLabel, action)}</div>` : nothing}
      </div>
    `;

    const bgMedia =
      bgType === "image" && c.bg_image
        ? html`<img class="fp-sbg" src=${c.bg_image} alt="" aria-hidden="true" />`
        : bgType === "video" && c.bg_video
        ? html`<video
            class="fp-sbg"
            src=${c.bg_video}
            autoplay
            muted
            loop
            playsinline
          ></video>`
        : nothing;

    // Background layout is intentionally NOT a card: it's a full-bleed hero
    // image with the content overlaid on top. The image keeps its natural
    // aspect ratio (never cropped into a fixed box) and nothing is rounded, so
    // there is no card surface and no corners to clip or bleed.
    if (layout === "background") {
      return html`
        <section
          class="fp"
          style=${hostStyle}
          data-enter=${this._animState}
          data-layout="background"
        >
          ${bgMedia}
          ${sectionTitle
            ? html`<h2 class="fp-section-title">${sectionTitle}</h2>`
            : nothing}
          <div class="fp-hero" data-tone=${bgOverlayTone}>
            ${imageUrl
              ? html`<img
                  class="fp-hero-img"
                  src=${imageUrl}
                  alt=${imageAlt}
                  loading="lazy"
                  draggable="false"
                />`
              : nothing}
            ${content}
          </div>
        </section>
      `;
    }

    return html`
      <section
        class="fp"
        style=${hostStyle}
        data-enter=${this._animState}
        data-float=${enableFloat ? "on" : "off"}
        data-layout=${layout}
      >
        ${bgMedia}
        ${sectionTitle
          ? html`<h2 class="fp-section-title">${sectionTitle}</h2>`
          : nothing}
        ${hasCardContent ? html`<div
          class="fp-card"
          data-layout=${layout}
          data-side=${side}
          data-card=${cardStyle}
          data-tone=${bgOverlayTone}
        >
          ${media} ${content}
        </div>` : nothing}
      </section>
    `;
  }

  private _renderButton(
    isLink: boolean,
    href: string,
    label: string,
    action: FeaturedButtonAction
  ) {
    if (isLink) {
      return html`
        <a class="fp-btn" href=${href || "#"}>
          <span>${label}</span>${this._icon("arrow")}
        </a>
      `;
    }
    // Add-to-cart / buy-now button with lifecycle states.
    const ar = this._lang() === "ar";
    if (this._cartState === "loading") {
      return html`
        <button class="fp-btn" type="button" disabled aria-busy="true">
          <span class="fp-spinner" aria-hidden="true"></span>
          <span>${ar ? "جارٍ الإضافة…" : "Adding…"}</span>
        </button>
      `;
    }
    if (this._cartState === "added") {
      return html`
        <button class="fp-btn" type="button" disabled>
          ${this._icon("check")}
          <span>${ar ? "تمت الإضافة" : "Added"}</span>
        </button>
      `;
    }
    return html`
      <button class="fp-btn" type="button" @click=${this._onPrimaryClick}>
        ${this._icon("bag")}<span>${label}</span>
      </button>
    `;
  }
}
