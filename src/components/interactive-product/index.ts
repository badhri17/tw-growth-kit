import { LitElement, html, nothing, type PropertyValues } from "lit";
import { property, state } from "lit/decorators.js";
import type {
  InteractiveProductConfig,
  Hotspot,
  InteractiveTheme,
  HotspotSize,
  DetailImageAspect,
  CardSize,
  DetailMediaWidth,
  ContentAlign,
  AutoplayDelay,
  MaybeMultiLang,
} from "./types";
import { interactiveProductStyles } from "./style";

/**
 * <growth-interactive-product> — Interactive Product (المنتج التفاعلي)
 * Part of the Growth Kit bundle for Salla Twilight.
 *
 * A large product image overlaid with numbered, interactive hotspots. Selecting
 * a hotspot — or one of the numbered nav pills in the detail card — reveals that
 * feature's image, title and description, with a smooth cross-fade and an active
 * highlight on the chosen marker.
 *
 *   • Editable hotspot positions: each marker is placed by x/y percentage of the
 *     image box (RTL-safe, since the coordinates track the photo, not the text).
 *   • Per-hotspot image + title + description.
 *   • Light/dark palette presets with full colour overrides.
 *   • Optional pulsing markers, nav pills, and auto-cycling.
 *   • Premium motion: staggered entrance + detail cross-fade.
 *
 * RTL-first and mobile-first throughout; respects prefers-reduced-motion.
 */
export default class GrowthInteractiveProduct extends LitElement {
  static styles = interactiveProductStyles;

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
  config?: InteractiveProductConfig;

  /** Index of the currently revealed hotspot. */
  @state() private _active = 0;
  /** Entrance gate. */
  @state() private _animState: "ready" | "in" = "ready";

  private _autoplayTimer: number | null = null;
  private _interactionPaused = false;
  /** Last index the detail card rendered, so we only replay the fade on change. */
  private _lastRenderedActive = 0;

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

  /** Convert Arabic-Indic / Eastern-Arabic digits to Latin for parsing. */
  private _toLatinDigits(s: string): string {
    return s
      .replace(/[٠-٩]/g, (d) => String(d.charCodeAt(0) - 0x0660))
      .replace(/[۰-۹]/g, (d) => String(d.charCodeAt(0) - 0x06f0));
  }

  private _num(val: unknown, fallback: number): number {
    if (typeof val === "number" && !Number.isNaN(val)) return val;
    if (typeof val === "string" && val.trim() !== "") {
      const n = Number(this._toLatinDigits(val.trim()));
      if (!Number.isNaN(n)) return n;
    }
    if (Array.isArray(val) && val.length > 0) {
      const first = val[0] as { value?: unknown } | undefined;
      if (first?.value !== undefined) return this._num(first.value, fallback);
    }
    return fallback;
  }

  private _clampPct(val: unknown, fallback: number): number {
    const n = this._num(val, fallback);
    return Math.max(0, Math.min(100, n));
  }

  // ------------------------------------------------------------
  // Hotspots
  // ------------------------------------------------------------

  /** Hotspots that carry renderable feature content (image/title/description). */
  private _hotspots(): Hotspot[] {
    const list = this.config?.hotspots;
    if (!Array.isArray(list)) return [];
    return list.filter(
      (h) =>
        !!h &&
        typeof h === "object" &&
        (!!h.image || !!this._t(h.title) || !!this._t(h.description))
    );
  }

  /** Clamp the active index against the current hotspot count. */
  private _activeIndex(total: number): number {
    if (total <= 0) return 0;
    return Math.max(0, Math.min(total - 1, this._active));
  }

  /** Resolve a marker position, falling back to a tidy staggered layout. */
  private _pos(h: Hotspot, i: number): { x: number; y: number } {
    const hasX = h.x !== undefined && h.x !== null && h.x !== "";
    const hasY = h.y !== undefined && h.y !== null && h.y !== "";
    const fallbackX = 20 + (i % 4) * 20; // 20 / 40 / 60 / 80 …
    const fallbackY = 25 + Math.floor(i / 4) * 25;
    return {
      x: this._clampPct(h.x, hasX ? 50 : fallbackX),
      y: this._clampPct(h.y, hasY ? 50 : fallbackY),
    };
  }

  private _setActive(index: number) {
    const total = this._hotspots().length;
    if (total === 0) return;
    const next = Math.max(0, Math.min(total - 1, index));
    if (next === this._active) return;
    this._active = next;
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
    this._teardownAutoplay();
  }

  updated(_changed: PropertyValues) {
    // Replay the detail cross-fade only when the active hotspot changed.
    const active = this._activeIndex(this._hotspots().length);
    if (active !== this._lastRenderedActive) {
      this._lastRenderedActive = active;
      this._replayDetailFade();
    }
    // (Re)wire autoplay after every settled render.
    this._teardownAutoplay();
    this._setupAutoplay();
  }

  private _replayDetailFade() {
    const sels = [".ip-detail-img", ".ip-detail-title", ".ip-detail-desc"];
    for (const sel of sels) {
      const el = this.renderRoot.querySelector(sel) as HTMLElement | null;
      if (!el) continue;
      el.classList.remove("is-enter");
      // Force reflow so the animation restarts.
      void el.offsetWidth;
      el.classList.add("is-enter");
    }
  }

  // ------------------------------------------------------------
  // Autoplay (auto-advance through hotspots)
  // ------------------------------------------------------------

  private _setupAutoplay() {
    const c = this.config || {};
    if (!c.autoplay) return;
    if (this._interactionPaused) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const total = this._hotspots().length;
    if (total < 2) return;

    const delay =
      Math.max(2, this._num(this._pickValue<AutoplayDelay>(c.autoplay_delay, "5"), 5)) *
      1000;
    this._autoplayTimer = window.setTimeout(() => {
      this._autoplayTimer = null;
      const next = (this._activeIndex(total) + 1) % total;
      this._active = next;
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
  // Host style (CSS custom properties)
  // ------------------------------------------------------------

  private _buildHostStyle(
    c: InteractiveProductConfig,
    aspect: DetailImageAspect
  ): string {
    const aspectVal =
      aspect === "natural" ? "4 / 3" : aspect.replace("/", " / ");
    const parts = [
      c.bg_color ? `--ip-bg:${c.bg_color}` : "",
      c.title_color ? `--ip-title:${c.title_color}` : "",
      c.subtitle_color ? `--ip-subtitle:${c.subtitle_color}` : "",
      c.accent_color ? `--ip-accent:${c.accent_color}` : "",
      c.card_bg ? `--ip-card-bg:${c.card_bg}` : "",
      c.card_title_color ? `--ip-card-title:${c.card_title_color}` : "",
      c.card_text_color ? `--ip-card-text:${c.card_text_color}` : "",
      c.marker_bg ? `--ip-marker-bg:${c.marker_bg}` : "",
      `--ip-detail-aspect:${aspectVal}`,
    ];
    return parts.filter(Boolean).join("; ");
  }

  // ------------------------------------------------------------
  // Render
  // ------------------------------------------------------------

  render() {
    const c: InteractiveProductConfig = this.config || {};
    const ar = this._lang() === "ar";

    const theme = this._pickValue<InteractiveTheme>(c.theme, "light");
    const hsSize = this._pickValue<HotspotSize>(c.hotspot_size, "medium");
    const detailAspect = this._pickValue<DetailImageAspect>(
      c.detail_image_aspect,
      "4/3"
    );
    const cardSize = this._pickValue<CardSize>(c.card_size, "medium");
    const mediaWidth = this._pickValue<DetailMediaWidth>(
      c.detail_media_width,
      "medium"
    );
    const contentAlign = this._pickValue<ContentAlign>(c.content_align, "start");
    const reverse = !!c.reverse_layout;
    const pulse = c.enable_pulse !== false;
    const showPills = c.show_pills !== false;
    const enableAnim = c.enable_entrance_anim !== false;
    const enterState = enableAnim ? this._animState : "in";

    const hostStyle = this._buildHostStyle(c, detailAspect);

    const eyebrow = this._t(c.eyebrow);
    const title = this._t(c.section_title);
    const subtitle = this._t(c.section_subtitle);

    const image = (c.product_image || "").trim();
    const hotspots = this._hotspots();
    const active = this._activeIndex(hotspots.length);

    // Empty state: nothing to show at all.
    if (!image && hotspots.length === 0) {
      return html`<section class="ip" data-theme=${theme} style=${hostStyle}>
        <p class="ip-empty">
          ${ar
            ? "أضف صورة المنتج ومؤشرًا واحدًا على الأقل لعرض هذا القسم."
            : "Add a product image and at least one hotspot to display this section."}
        </p>
      </section>`;
    }

    const header =
      eyebrow || title || subtitle
        ? html`<header class="ip-header">
            ${eyebrow ? html`<p class="ip-eyebrow">${eyebrow}</p>` : nothing}
            ${title ? html`<h2 class="ip-title">${title}</h2>` : nothing}
            ${subtitle
              ? html`<p class="ip-subtitle">${subtitle}</p>`
              : nothing}
          </header>`
        : nothing;

    const activeHotspot = hotspots[active];

    return html`
      <section
        class="ip"
        data-theme=${theme}
        data-hs=${hsSize}
        data-card-size=${cardSize}
        data-media-width=${mediaWidth}
        data-content-align=${contentAlign}
        data-pulse=${pulse ? "on" : "off"}
        data-enter=${enterState}
        style=${hostStyle}
        aria-label=${title || (ar ? "مميزات المنتج" : "Product features")}
        @pointerenter=${this._pauseInteraction}
        @pointerleave=${this._resumeInteraction}
        @focusin=${this._pauseInteraction}
        @focusout=${this._resumeInteraction}
      >
        ${header}
        <div class="ip-content" data-reverse=${reverse ? "on" : "off"}>
          ${this._renderStage(image, hotspots, active, ar)}
          ${hotspots.length
            ? this._renderDetails(activeHotspot, hotspots, active, showPills, ar)
            : nothing}
        </div>
      </section>
    `;
  }

  private _renderStage(
    image: string,
    hotspots: Hotspot[],
    active: number,
    ar: boolean
  ) {
    return html`
      <div class="ip-stage-wrap">
        <div class="ip-stage">
          ${image
            ? html`<img
                class="ip-img"
                src=${image}
                alt=${ar ? "صورة المنتج" : "Product image"}
                draggable="false"
              />`
            : html`<div class="ip-stage-empty">
                ${ar ? "أضف صورة المنتج" : "Add a product image"}
              </div>`}
          ${image
            ? hotspots.map((h, i) => {
                const { x, y } = this._pos(h, i);
                const label = this._t(h.title) || `${ar ? "ميزة" : "Feature"} ${i + 1}`;
                return html`<button
                  type="button"
                  class="ip-hotspot"
                  data-active=${i === active ? "true" : "false"}
                  style=${`left:${x}%; top:${y}%; --ip-hs-delay:${(0.4 + i * 0.08).toFixed(2)}s`}
                  aria-pressed=${i === active ? "true" : "false"}
                  aria-label=${label}
                  @click=${() => this._setActive(i)}
                >
                  ${i + 1}
                </button>`;
              })
            : nothing}
        </div>
      </div>
    `;
  }

  private _renderDetails(
    activeHotspot: Hotspot | undefined,
    hotspots: Hotspot[],
    active: number,
    showPills: boolean,
    ar: boolean
  ) {
    const detailAspect = this._pickValue<DetailImageAspect>(
      this.config?.detail_image_aspect,
      "4/3"
    );
    const img = activeHotspot?.image || "";
    const title = this._t(activeHotspot?.title);
    const desc = this._t(activeHotspot?.description);

    return html`
      <aside class="ip-details" aria-live="polite">
        <div
          class="ip-detail-media"
          data-aspect=${detailAspect}
          data-empty=${img ? "false" : "true"}
        >
          ${img
            ? html`<img
                class="ip-detail-img is-enter"
                src=${img}
                alt=${title || (ar ? "صورة الميزة" : "Feature image")}
                loading="lazy"
              />`
            : nothing}
        </div>
        ${title
          ? html`<h3 class="ip-detail-title is-enter">${title}</h3>`
          : nothing}
        ${desc
          ? html`<p class="ip-detail-desc is-enter">${desc}</p>`
          : nothing}
        ${showPills && hotspots.length > 1
          ? html`<div class="ip-pills">
              ${hotspots.map(
                (h, i) => html`<button
                  type="button"
                  class="ip-pill"
                  data-active=${i === active ? "true" : "false"}
                  aria-pressed=${i === active ? "true" : "false"}
                  aria-label=${this._t(h.title) ||
                  `${ar ? "ميزة رقم" : "Feature"} ${i + 1}`}
                  @click=${() => this._setActive(i)}
                >
                  ${i + 1}
                </button>`
              )}
            </div>`
          : nothing}
      </aside>
    `;
  }
}
