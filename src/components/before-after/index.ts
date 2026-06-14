import { LitElement, html, nothing, type PropertyValues } from "lit";
import { property, state } from "lit/decorators.js";
import type {
  BeforeAfterConfig,
  BeforeAfterAspect,
  BeforeAfterDesktopLayout,
  BeforeAfterSlideItem,
  CrossoverItemSize,
  CrossoverSpeed,
  MaybeMultiLang,
} from "./types";
import { beforeAfterStyles } from "./style";

/** Product shape after we fetch full details from the Salla SDK. */
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
export default class GrowthBeforeAfter extends LitElement {
  static styles = beforeAfterStyles;

  /**
   * Twilight transform injects `Class.registerSallaComponent(...)`.
   * The polling fallback handles preview contexts where `Salla` loads after this file.
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
      const bundles = (window as Window & {
        Salla?: {
          bundles?: {
            registerComponent?: (
              key: string,
              payload: { component: typeof HTMLElement; dynamicTagName: string }
            ) => void;
          };
        };
      }).Salla?.bundles;

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

  // ------------------------------------------------------------
  // Helpers
  // ------------------------------------------------------------

  private _t(val: MaybeMultiLang): string {
    if (!val) return "";
    if (typeof val === "string") return val;
    const lang = (document.documentElement.lang || "ar")
      .toLowerCase()
      .startsWith("en")
      ? "en"
      : "ar";
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

  /** Coerce a config number value that may arrive as a string from settings. */
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

  /** Pull { id, label } out of the picker selection. */
  private _pickerSelection(
    val: unknown
  ): { id: number; label: string } | null {
    if (!val) return null;
    // Picker may arrive as: a single object, an array of objects, or a bare id/string.
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

  /**
   * Kick off (or no-op if already done/in-flight) a fetch for the picked
   * product. Resolves the Salla SDK ready-promise first so the API is
   * available even when this component loads before the storefront JS.
   */
  private async _fetchProduct(id: number, label: string) {
    if (this._productCache.has(id)) return;

    this._productCache.set(id, { status: "loading", label });
    this.requestUpdate();

    const Salla = (window as Window & { Salla?: any }).Salla;
    if (!Salla) {
      // No SDK (e.g. local Vite demo) — keep the loading state so the chip
      // still renders with the picker label + skeleton thumb instead of vanishing.
      return;
    }

    try {
      if (typeof Salla.onReady === "function") await Salla.onReady();
      const api = Salla.product?.api?.getDetails;
      if (typeof api !== "function") throw new Error("getDetails unavailable");
      const res = await api(id);
      const data = (res?.data ?? res) as Record<string, any> | undefined;
      if (!data) throw new Error("empty product payload");

      // Be liberal in what we accept — Salla products expose image as
      // `{ url, alt }` but some surfaces ship `images[0].url` or `thumbnail`.
      const image: string =
        data.image?.url ||
        data.image?.thumbnail ||
        (Array.isArray(data.images) && (data.images[0]?.url || data.images[0])) ||
        data.thumbnail ||
        data.main_image ||
        "";
      const url: string =
        data.url ||
        data.urls?.customer ||
        data.urls?.product ||
        data.permalink ||
        `/p${id}`;

      const resolved = {
        name: String(data.name || data.title || label || `#${id}`),
        image: image || undefined,
        imageAlt: String(data.image?.alt || data.name || ""),
        url,
      };
      this._productCache.set(id, { status: "loaded", data: resolved });
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
    const sel = this._pickerSelection(slide.product);
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
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    this._teardownAutoplay();
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
