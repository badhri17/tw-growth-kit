import { LitElement, html, nothing, type PropertyValues } from "lit";
import { property, state } from "lit/decorators.js";
import type {
  FeaturedProductConfig,
  FeaturedImageLayout,
  FeaturedImageSide,
  FeaturedAspect,
  FeaturedBgEffect,
  FeaturedImageFit,
  FeaturedCardSize,
  FeaturedBgType,
  FeaturedCardStyle,
  FeaturedContentAlign,
  FeaturedButtonRadius,
  FeaturedButtonAction,
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
 *   • Decorative background effect behind the product (circle/glow/pattern/blob).
 *   • Card styles: minimal, soft, premium glass, bold offer.
 *   • Pricing, sale price + discount badge, free-shipping line, highlights.
 *   • Premium motion: entrance reveal, idle float, optional pointer tilt.
 *
 * RTL-first and mobile-first throughout; respects prefers-reduced-motion.
 */
export default class GrowthFeaturedProduct extends LitElement {
  static styles = featuredProductStyles;

  /**
   * Twilight transform injects `Class.registerSallaComponent(...)`.
   * The polling fallback handles preview contexts where `Salla` loads after
   * this file executes.
   */
  static registerSallaComponent(name: string) {
    const componentKey = String(name || "").trim();
    const normalizedBase = componentKey
      .toLowerCase()
      .replace(/[^a-z0-9._-]/g, "-");
    const safeBaseName = normalizedBase.includes("-")
      ? normalizedBase
      : `salla-${normalizedBase || "component"}`;
    const buildDynamicTagName = () =>
      `${safeBaseName}-${Math.random().toString(36).substring(2, 8)}`;

    const tryRegister = () => {
      const bundles = (
        window as Window & {
          Salla?: {
            bundles?: {
              registerComponent?: (
                key: string,
                payload: {
                  component: typeof HTMLElement;
                  dynamicTagName: string;
                }
              ) => void;
            };
          };
        }
      ).Salla?.bundles;

      if (bundles && typeof bundles.registerComponent === "function") {
        bundles.registerComponent(componentKey, {
          component: this as unknown as typeof HTMLElement,
          dynamicTagName: buildDynamicTagName(),
        });
        return true;
      }
      return false;
    };
    if (tryRegister()) return;
    const timer = window.setInterval(() => {
      if (tryRegister()) window.clearInterval(timer);
    }, 100);
    window.setTimeout(() => window.clearInterval(timer), 5000);
  }

  @property({ type: Object })
  config?: FeaturedProductConfig;

  /** Entrance gate. */
  @state() private _animState: "ready" | "in" = "ready";
  /** Add-to-cart button lifecycle. */
  @state() private _cartState: "idle" | "loading" | "added" = "idle";

  private _cartResetTimer: number | null = null;

  // ------------------------------------------------------------
  // Salla global (the SDK exposes lowercase `salla`; some contexts
  // also attach `Salla`). Resolve defensively.
  // ------------------------------------------------------------
  private get _salla(): any {
    const w = window as any;
    return w.salla ?? w.Salla ?? null;
  }

  // ------------------------------------------------------------
  // Value helpers
  // ------------------------------------------------------------

  private _lang(): "ar" | "en" {
    return (document.documentElement.lang || "ar").toLowerCase().startsWith("en")
      ? "en"
      : "ar";
  }

  private _t(val: MaybeMultiLang): string {
    if (!val) return "";
    if (typeof val === "string") return val;
    const lang = this._lang();
    return (val[lang] || val.ar || val.en || "").trim();
  }

  private _pickValue<T extends string>(val: unknown, fallback: T): T {
    if (typeof val === "string" && val) return val as T;
    if (Array.isArray(val) && val.length > 0) {
      const first = val[0] as { value?: unknown } | undefined;
      if (first && typeof first.value === "string" && first.value)
        return first.value as T;
    }
    return fallback;
  }

  private _num(val: unknown, fallback: number): number {
    if (typeof val === "number" && !Number.isNaN(val)) return val;
    if (typeof val === "string" && val.trim() !== "") {
      const n = Number(val);
      if (!Number.isNaN(n)) return n;
    }
    if (Array.isArray(val) && val.length > 0) {
      const first = val[0] as { value?: unknown } | undefined;
      if (first?.value !== undefined) return this._num(first.value, fallback);
    }
    return fallback;
  }

  /** Convert Arabic-Indic / Eastern-Arabic digits to Latin for parsing. */
  private _toLatinDigits(s: string): string {
    return s
      .replace(/[٠-٩]/g, (d) => String(d.charCodeAt(0) - 0x0660))
      .replace(/[۰-۹]/g, (d) => String(d.charCodeAt(0) - 0x06f0));
  }

  /** Best-effort numeric extraction from a price value of any shape. */
  private _parseMoney(v: unknown): number | undefined {
    if (typeof v === "number") return Number.isNaN(v) ? undefined : v;
    if (v && typeof v === "object") {
      const o = v as Record<string, unknown>;
      return this._parseMoney(o.amount ?? o.value ?? o.price);
    }
    if (typeof v !== "string") return undefined;
    const cleaned = this._toLatinDigits(v)
      .replace(/[^0-9.,]/g, "")
      .replace(/,/g, "");
    if (!cleaned) return undefined;
    const n = parseFloat(cleaned);
    return Number.isNaN(n) ? undefined : n;
  }

  /** Trim a number to a tidy string (drops trailing .00). */
  private _formatNum(n: number): string {
    return Number.isInteger(n) ? String(n) : n.toFixed(2).replace(/\.?0+$/, "");
  }

  /** Format a numeric amount as currency via the SDK, with a plain fallback. */
  private _money(n?: number, currency?: string): string {
    if (n === undefined || n === null || Number.isNaN(n)) return "";
    const salla = this._salla;
    try {
      if (salla && typeof salla.money === "function") {
        return currency ? salla.money({ amount: n, currency }) : salla.money(n);
      }
    } catch {
      /* fall through to plain formatting */
    }
    const v = this._formatNum(n);
    return currency ? `${v} ${currency}` : v;
  }

  // ------------------------------------------------------------
  // Product resolution (store source)
  // ------------------------------------------------------------

  private _productCache = new Map<
    number,
    | { status: "loading" }
    | { status: "loaded"; data: ResolvedProduct }
    | { status: "failed" }
  >();

  private _pickerSelection(
    val: unknown
  ): { id: number; label: string } | null {
    if (!val) return null;
    if (typeof val === "string" || typeof val === "number") {
      const id = Number(val);
      if (!id || Number.isNaN(id)) return null;
      return { id, label: "" };
    }
    const picked = Array.isArray(val) ? val[0] : val;
    if (!picked) return null;
    if (typeof picked === "string" || typeof picked === "number") {
      const id = Number(picked);
      if (!id || Number.isNaN(id)) return null;
      return { id, label: "" };
    }
    if (typeof picked !== "object") return null;
    const obj = picked as Record<string, unknown>;
    const raw = obj.value ?? obj.id ?? obj.product_id;
    if (raw === undefined || raw === null) return null;
    const id = typeof raw === "number" ? raw : Number(raw);
    if (!id || Number.isNaN(id)) return null;
    const label = String(obj.label ?? obj.name ?? obj.title ?? "").trim();
    return { id, label };
  }

  private async _fetchProduct(id: number) {
    if (this._productCache.has(id)) return;

    this._productCache.set(id, { status: "loading" });
    this.requestUpdate();

    const salla = this._salla;
    if (!salla) {
      this._productCache.set(id, { status: "failed" });
      this.requestUpdate();
      return;
    }

    try {
      if (typeof salla.onReady === "function") await salla.onReady();
      const getDetails =
        salla.product?.getDetails ?? salla.product?.api?.getDetails;
      if (typeof getDetails !== "function")
        throw new Error("getDetails unavailable");
      const res = await getDetails.call(salla.product, id);
      const data = (res?.data ?? res) as Record<string, any> | undefined;
      if (!data) throw new Error("empty product payload");

      const image: string =
        data.image?.url ||
        data.image?.thumbnail ||
        (Array.isArray(data.images) &&
          (data.images[0]?.url || data.images[0])) ||
        data.thumbnail ||
        data.main_image ||
        "";
      const url: string =
        data.url ||
        data.urls?.customer ||
        data.urls?.product ||
        data.permalink ||
        `/p${id}`;

      // --- Price normalisation (defensive: numbers, strings, or {amount}) ---
      const priceVal = this._parseMoney(data.price);
      const regularVal = this._parseMoney(data.regular_price);
      const saleVal = this._parseMoney(data.sale_price);

      let regular = regularVal ?? priceVal;
      let current = priceVal ?? regularVal;
      if (saleVal !== undefined && saleVal > 0) {
        current = saleVal;
        if (regular === undefined || regular <= saleVal)
          regular = regularVal ?? priceVal ?? saleVal;
      }
      const flagged = !!(data.is_on_sale ?? data.on_sale ?? data.has_offer);
      const onSale =
        (flagged || saleVal !== undefined) &&
        regular !== undefined &&
        current !== undefined &&
        current < regular;

      const currency: string | undefined =
        data.currency ||
        data.price?.currency ||
        data.regular_price?.currency ||
        undefined;

      this._productCache.set(id, {
        status: "loaded",
        data: {
          name: String(data.name || data.title || `#${id}`),
          image: image || undefined,
          imageAlt: String(data.image?.alt || data.name || ""),
          url,
          regular,
          sale: onSale ? current : undefined,
          onSale,
          currency,
        },
      });
    } catch (err) {
      console.warn("[growth-featured-product] product fetch failed", id, err);
      this._productCache.set(id, { status: "failed" });
    }
    this.requestUpdate();
  }

  private _resolveProduct(): ResolvedProduct | null {
    const sel = this._pickerSelection(this.config?.product);
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

  private _tiltAllowed(): boolean {
    return (
      window.matchMedia("(min-width: 768px) and (pointer: fine)").matches &&
      !window.matchMedia("(prefers-reduced-motion: reduce)").matches
    );
  }

  private _onTiltMove = (e: PointerEvent) => {
    if (!this._tiltAllowed()) return;
    const media = e.currentTarget as HTMLElement;
    const inner = media.querySelector(".fp-media-inner") as HTMLElement | null;
    if (!inner) return;
    const r = media.getBoundingClientRect();
    const px = (e.clientX - r.left) / r.width - 0.5; // -0.5 … 0.5
    const py = (e.clientY - r.top) / r.height - 0.5;
    const max = 7;
    inner.style.transform = `perspective(900px) rotateY(${px * max}deg) rotateX(${
      -py * max
    }deg)`;
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
    const sel = this._pickerSelection(c.product);
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
    const aspect = this._pickValue<FeaturedAspect>(c.aspect_ratio, "1/1");
    const imageFit = this._pickValue<FeaturedImageFit>(c.image_fit, "contain");
    const bgEffect = this._pickValue<FeaturedBgEffect>(c.bg_effect, "glow");
    const cardStyle = this._pickValue<FeaturedCardStyle>(c.card_style, "soft");
    const cardRadius = this._num(c.card_radius, 24);
    const mediaRadius = Math.max(8, cardRadius - 6);
    const cardSize = this._pickValue<FeaturedCardSize>(c.card_size, "compact");
    const bgType = this._pickValue<FeaturedBgType>(c.bg_type, "color");
    const contentAlign = this._pickValue<FeaturedContentAlign>(c.content_align, "right");
    const highlightsBg = c.highlights_bg || "";

    const sectionTitle = this._t(c.section_title);
    const product = this._resolveProduct();
    const hasLinkedProduct = !!this._pickerSelection(c.product);

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
        const a = this._parseMoney(priceOverride);
        const b = this._parseMoney(compareOverride);
        if (showSale && compareOverride && b !== undefined && a !== undefined && b > a) {
          priceCompare = compareOverride;
        }
      } else if (product) {
        if (product.onSale && product.sale !== undefined) {
          priceMain = this._money(product.sale, product.currency);
          if (showSale && product.regular !== undefined) {
            priceCompare = this._money(product.regular, product.currency);
          }
        } else if (product.regular !== undefined) {
          priceMain = this._money(product.regular, product.currency);
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
    const tiltEnabled = !!c.enable_tilt && layout !== "background";

    // --- Layout-aware colour resolution (merchant always wins) ---
    const lightText = layout === "background" || cardStyle === "bold";
    const cardBgDefault =
      cardStyle === "minimal"
        ? "transparent"
        : cardStyle === "glass"
        ? "rgba(255,255,255,0.55)"
        : cardStyle === "bold"
        ? "linear-gradient(135deg,#283548,#11161f)"
        : "#ffffff";

    // Card size → override the layout-default --fp-maxw when set.
    // "compact" uses min() so the % clamps width on mobile (where px > screen width).
    const cardSizeMaxW =
      cardSize === "compact" ? "min(420px, 82%)"
      : cardSize === "large" ? "min(860px, 96%)"
      : cardSize === "full" ? "100%"
      : null; // "medium" → let layout CSS vars handle it

    const hostStyle = [
      c.bg_color ? `--fp-bg: ${c.bg_color}` : "",
      cardSizeMaxW ? `--fp-maxw-user: ${cardSizeMaxW}` : "",
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
      `--fp-btn-bg: ${c.button_bg || (lightText ? "#ffffff" : "#14181f")}`,
      `--fp-btn-color: ${c.button_color || (lightText ? "#14181f" : "#ffffff")}`,
      `--fp-btn-radius: ${btnRadius}`,
      `--fp-shipping: ${
        c.shipping_color || (lightText ? "#7ee0aa" : "#2e7d52")
      }`,
      `--fp-effect: ${
        c.bg_effect_color || (lightText ? "#d8b478" : "#b08948")
      }`,
      // Highlights wrapper background (only when set)
      highlightsBg ? `--fp-hl-bg: ${highlightsBg}` : "",
      highlightsBg ? `--fp-hl-radius: 14px` : "",
      highlightsBg ? `--fp-hl-gap: 0` : "",
      highlightsBg ? `--fp-hl-item-pad: 0.72rem 1rem` : "",
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
