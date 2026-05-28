import { LitElement, html, nothing } from "lit";
import { property, state } from "lit/decorators.js";
import type {
  HeroConfig,
  HeroHeight,
  HeroHeightDesktop,
  HeroAlignH,
  HeroAlignV,
  HeroOverlayStyle,
  HeroOverlayIntensity,
  HeroTextTheme,
  HeroGradientType,
  MaybeMultiLang,
} from "./types";
import { heroStyles } from "./style";

/**
 * <growth-hero> — Store Hero (واجهة المتجر)
 * Part of the Growth Bundle for Salla Twilight.
 *
 * Behaviour:
 *   • Auto-picks mode: video → image → gradient based on which URLs are filled.
 *   • Device-responsive: desktop variants for video/image (≥768 px), reactive on resize.
 *   • Robust video fallback (timeout, error/abort guard) with generation counter so stale
 *     callbacks from a superseded src never corrupt state.
 *   • smart_data_saver skips video on slow/data-saver connections (default ON).
 *   • RTL-aware; inherits document direction by default.
 *   • Respects prefers-reduced-motion for all motion effects.
 */
export default class GrowthHero extends LitElement {
  static styles = heroStyles;

  /**
   * Twilight transform injects `Class.registerSallaComponent(...)`.
   * In some preview contexts, the helper is attached to HTMLElement later,
   * so we provide a safe bridge to avoid runtime crashes.
   */
  static registerSallaComponent(name: string) {
    const componentKey = String(name || "").trim();
    const normalizedBase = componentKey
      .toLowerCase()
      .replace(/[^a-z0-9._-]/g, "-");
    const safeBaseName = normalizedBase.includes("-") ? normalizedBase : `salla-${normalizedBase || "component"}`;
    const buildDynamicTagName = () => `${safeBaseName}-${Math.random().toString(36).substring(2, 8)}`;

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
    // In demo mode the helper may load after component evaluation.
    const timer = window.setInterval(() => {
      if (tryRegister()) window.clearInterval(timer);
    }, 100);
    window.setTimeout(() => window.clearInterval(timer), 5000);
  }

  @property({ type: Object })
  config?: HeroConfig;

  /** Reactive state for video fallback handling. */
  @state() private _videoFailed = false;

  /** Entrance animation gate. */
  @state() private _animState: "ready" | "in" = "ready";

  /** Tracks whether viewport is ≥768 px; reactive so mode re-evaluates on resize. */
  @state() private _isDesktop = false;

  private _videoEl: HTMLVideoElement | null = null;
  /** Incremented each time _setupVideo() is called; stale callbacks check against it. */
  private _videoGeneration = 0;
  /** Last src passed to _setupVideo(); detects when src changes on the same element. */
  private _lastVideoSrc = "";
  private _fallbackTimer: number | null = null;
  private _io: IntersectionObserver | null = null;
  private _rafId: number | null = null;
  private _onScroll?: () => void;
  private _mql?: MediaQueryList;
  private _onMqlChange?: () => void;

  // ------------------------------------------------------------
  // Helpers
  // ------------------------------------------------------------

  /** Pull the right string out of a multilang value. */
  private _t(val: MaybeMultiLang): string {
    if (!val) return "";
    if (typeof val === "string") return val;
    const lang = (document.documentElement.lang || "ar").toLowerCase().startsWith("en") ? "en" : "ar";
    return (val[lang] || val.ar || val.en || "").trim();
  }

  /** Active video URL for the current device tier, falling back to mobile when desktop is unset. */
  private _currentVideoUrl(): string {
    const c = this.config || {};
    return (this._isDesktop && c.video_url_desktop) ? c.video_url_desktop : (c.video_url || "");
  }

  /** Active image URL for the current device tier, falling back to mobile when desktop is unset. */
  private _currentImageUrl(): string {
    const c = this.config || {};
    return (this._isDesktop && c.background_image_desktop) ? c.background_image_desktop : (c.background_image || "");
  }

  /** Returns true when smart_data_saver is ON and the connection is slow/data-restricted. */
  private _shouldSkipVideo(): boolean {
    if (this.config?.smart_data_saver === false) return false;
    const conn = (navigator as any).connection;
    if (conn) {
      if (conn.saveData === true) return true;
      const slow = ["slow-2g", "2g", "3g"];
      if (slow.includes(conn.effectiveType)) return true;
    }
    return false;
  }

  /**
   * Returns the video fallback timeout in ms.
   * On mobile without the Network Information API (e.g. Safari), we use a shorter
   * 3 s window since we have no signal to rely on and want to fail fast.
   */
  private _pickVideoTimeout(): number {
    if (this.config?.smart_data_saver === false) return 5000;
    const isMobile = !window.matchMedia("(min-width: 768px)").matches;
    const hasNetAPI = !!(navigator as any).connection;
    if (isMobile && !hasNetAPI) return 3000;
    return 5000;
  }

  /** Which background mode should we render? */
  private get _mode(): "video" | "image" | "gradient" {
    const videoUrl = this._currentVideoUrl();
    if (videoUrl && !this._shouldSkipVideo() && !this._videoFailed) return "video";
    const img = this._currentImageUrl();
    if (img) return "image";
    return "gradient";
  }

  /**
   * Build the CSS `background` value for the gradient mode.
   * - Only `gradient_from`  → solid colour (no gradient artefact when "to" is empty).
   * - Only `gradient_to`    → solid colour using that value.
   * - Both                  → gradient of the chosen type/angle.
   * - Neither               → null; CSS fallback in style.ts takes over.
   */
  private _buildBackground(): string | null {
    const c = this.config || {};
    const from = (c.gradient_from || "").trim();
    const to = (c.gradient_to || "").trim();

    if (!from && !to) return null;
    if (from && !to) return from;
    if (!from && to) return to;

    const type = this._pickValue<HeroGradientType>(c.gradient_type, "linear");
    const angle = typeof c.gradient_angle === "number" ? c.gradient_angle : 135;

    switch (type) {
      case "radial":
        return `radial-gradient(circle at center, ${from} 0%, ${to} 100%)`;
      case "radial-corner":
        return `radial-gradient(circle at top left, ${from} 0%, ${to} 75%)`;
      case "conic":
        return `conic-gradient(from ${angle}deg at 50% 50%, ${from}, ${to}, ${from})`;
      case "linear":
      default:
        return `linear-gradient(${angle}deg, ${from}, ${to})`;
    }
  }

  private _overlayAlpha(intensity: HeroOverlayIntensity = "medium"): number {
    switch (intensity) {
      case "subtle":  return 0.35;
      case "strong":  return 0.85;
      case "medium":
      default:        return 0.6;
    }
  }

  /** Dropdown-list values from settings may come as [{label, value}]. */
  private _pickValue<T extends string>(val: unknown, fallback: T): T {
    if (typeof val === "string" && val) return val as T;
    if (Array.isArray(val) && val.length > 0) {
      const first = val[0] as { value?: unknown } | undefined;
      if (first && typeof first.value === "string" && first.value) return first.value as T;
    }
    return fallback;
  }

  // ------------------------------------------------------------
  // Lifecycle
  // ------------------------------------------------------------

  connectedCallback() {
    super.connectedCallback();
    // Kick entrance animation on next frame (after first paint).
    requestAnimationFrame(() => {
      requestAnimationFrame(() => (this._animState = "in"));
    });

    // Track desktop breakpoint reactively so _mode re-evaluates on resize.
    this._mql = window.matchMedia("(min-width: 768px)");
    this._isDesktop = this._mql.matches;
    this._onMqlChange = () => {
      this._isDesktop = this._mql!.matches;
      // Give video another chance on the new device tier.
      this._videoFailed = false;
    };
    this._mql.addEventListener("change", this._onMqlChange);
  }

  firstUpdated() {
    // _setupVideo() is handled by updated() via src-change detection (first + subsequent).
    this._setupParallax();
  }

  updated() {
    const v = this.renderRoot.querySelector("video") as HTMLVideoElement | null;
    if (!v) {
      this._videoEl = null;
      return;
    }
    const newSrc = this._currentVideoUrl();
    // Re-wire whenever the element reference changes OR the src changes (e.g. desktop swap).
    if (v !== this._videoEl || newSrc !== this._lastVideoSrc) {
      if (this._fallbackTimer) {
        clearTimeout(this._fallbackTimer);
        this._fallbackTimer = null;
      }
      this._lastVideoSrc = newSrc;
      this._videoEl = v;
      this._setupVideo();
    }
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    if (this._mql && this._onMqlChange) {
      this._mql.removeEventListener("change", this._onMqlChange);
    }
    this._teardown();
  }

  // ------------------------------------------------------------
  // Video: autoplay + robust fallback
  // Generation counter ensures that stale abort/error callbacks from a previous src
  // (e.g. the browser firing abort when we swap to a desktop variant) are ignored.
  // ------------------------------------------------------------

  private _setupVideo() {
    const v = this.renderRoot.querySelector("video") as HTMLVideoElement | null;
    if (!v) return;
    this._videoEl = v;

    const gen = ++this._videoGeneration;
    let started = false;

    const markStarted = () => {
      if (gen !== this._videoGeneration) return;
      if (started) return;
      started = true;
      if (this._fallbackTimer) {
        clearTimeout(this._fallbackTimer);
        this._fallbackTimer = null;
      }
    };

    const giveUp = () => {
      if (gen !== this._videoGeneration) return;
      markStarted(); // stop the timer either way
      this._videoFailed = true;
    };

    v.addEventListener("playing", markStarted, { once: true });
    v.addEventListener("canplaythrough", markStarted, { once: true });
    v.addEventListener("error", giveUp, { once: true });
    v.addEventListener("abort", giveUp, { once: true });

    const onTimeTick = () => {
      if (v.currentTime > 0) {
        markStarted();
        v.removeEventListener("timeupdate", onTimeTick);
      }
    };
    v.addEventListener("timeupdate", onTimeTick);

    v.addEventListener(
      "loadedmetadata",
      () => {
        if (gen !== this._videoGeneration) return;
        const p = v.play();
        if (p && typeof p.then === "function") p.catch(() => giveUp());
      },
      { once: true }
    );

    // Safety net: if nothing started within the timeout window, swap to image fallback.
    this._fallbackTimer = window.setTimeout(() => {
      if (gen !== this._videoGeneration) return;
      if (!started) giveUp();
    }, this._pickVideoTimeout());
  }

  // ------------------------------------------------------------
  // Parallax: subtle Y-transform tied to scroll, throttled via rAF.
  // ------------------------------------------------------------

  private _setupParallax() {
    if (!this.config?.enable_parallax) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const bg = this.renderRoot.querySelector(".bg") as HTMLElement | null;
    if (!bg) return;

    let ticking = false;
    this._onScroll = () => {
      if (ticking) return;
      ticking = true;
      this._rafId = requestAnimationFrame(() => {
        const rect = this.getBoundingClientRect();
        const vh = window.innerHeight || 800;
        // 0 at centre, +/- as we scroll away. Clamp to keep things subtle.
        const raw = (rect.top + rect.height / 2 - vh / 2) / vh;
        const offset = Math.max(-1, Math.min(1, raw)) * 40; // px
        bg.style.setProperty("--gh-parallax", `${-offset}px`);
        ticking = false;
      });
    };
    window.addEventListener("scroll", this._onScroll, { passive: true });
    this._onScroll();
  }

  private _teardown() {
    if (this._fallbackTimer) clearTimeout(this._fallbackTimer);
    if (this._rafId) cancelAnimationFrame(this._rafId);
    if (this._onScroll) window.removeEventListener("scroll", this._onScroll);
    this._io?.disconnect();
    this._io = null;
    this._videoEl = null;
  }

  // ------------------------------------------------------------
  // Render
  // ------------------------------------------------------------

  render() {
    const c: HeroConfig = this.config || {};

    const heightMobile: HeroHeight = this._pickValue<HeroHeight>(c.height_mobile, "large");
    const heightDesktop: HeroHeightDesktop = this._pickValue<HeroHeightDesktop>(c.height_desktop, "inherit");
    const height: HeroHeight =
      this._isDesktop && heightDesktop !== "inherit" ? heightDesktop : heightMobile;
    const alignH: HeroAlignH = this._pickValue<HeroAlignH>(c.align_h, "start");
    const alignV: HeroAlignV = this._pickValue<HeroAlignV>(c.align_v, "middle");
    const textTheme: HeroTextTheme = this._pickValue<HeroTextTheme>(c.text_theme, "light");
    const overlayStyle: HeroOverlayStyle = this._pickValue<HeroOverlayStyle>(c.overlay_style, "dark-bottom");
    const overlayIntensity = this._pickValue<HeroOverlayIntensity>(c.overlay_intensity, "medium");
    const overlayAlpha = this._overlayAlpha(overlayIntensity);
    const enableAnim = c.enable_entrance_anim !== false;
    const enableKenBurns = !!c.enable_ken_burns;
    const enableParallax = !!c.enable_parallax;

    const eyebrow = this._t(c.eyebrow);
    const headline = this._t(c.headline) || "Welcome";
    const subtitle = this._t(c.subtitle);
    const primaryLabel = this._t(c.primary_label);

    const trustPoints = (Array.isArray(c.trust_points) ? c.trust_points : [])
      .map((tp) => this._t(tp?.text))
      .filter(Boolean)
      .slice(0, 3);

    const mode = this._mode;

    const bgValue = this._buildBackground();

    // Inline CSS custom properties for dynamic values.
    const hostStyle = [
      `--gh-overlay-a: ${overlayAlpha}`,
      c.content_max_width ? `--gh-content-max: ${c.content_max_width}px` : "",
      bgValue ? `--gh-bg: ${bgValue}` : "",
    ]
      .filter(Boolean)
      .join("; ");

    const bgClasses = [
      "bg",
      mode === "gradient" ? "is-gradient" : "",
      mode === "image" && enableKenBurns ? "is-ken-burns" : "",
      enableParallax ? "is-parallax" : "",
    ]
      .filter(Boolean)
      .join(" ");

    return html`
      <section
        class="hero"
        style=${hostStyle}
        data-height=${height}
        data-align-h=${alignH}
        data-align-v=${alignV}
        data-text-theme=${textTheme}
        aria-label=${headline}
      >
        <div class=${bgClasses}>
          ${mode === "video"
            ? html`
                <video
                  src=${this._currentVideoUrl()}
                  poster=${this._currentImageUrl() || ""}
                  ?autoplay=${c.video_autoplay !== false}
                  ?loop=${c.video_loop !== false}
                  ?muted=${c.video_muted !== false}
                  muted
                  playsinline
                  webkit-playsinline
                  preload="auto"
                ></video>
              `
            : mode === "image"
            ? html`
                <picture>
                  ${c.background_image_desktop
                    ? html`<source media="(min-width: 768px)" srcset=${c.background_image_desktop}>`
                    : nothing}
                  <img
                    src=${c.background_image || ""}
                    alt=""
                    loading="eager"
                    decoding="async"
                  />
                </picture>
              `
            : nothing}
        </div>

        ${overlayStyle !== "none"
          ? html`<div class="overlay" data-style=${overlayStyle}></div>`
          : nothing}

        <div class="content-wrap">
          <div class="content" data-anim=${enableAnim ? this._animState : "in"}>
            ${eyebrow ? html`<p class="eyebrow">${eyebrow}</p>` : nothing}
            <h1 class="headline">${headline}</h1>
            ${subtitle ? html`<p class="subtitle">${subtitle}</p>` : nothing}
            ${primaryLabel
              ? html`
                  <div class="ctas">
                    <a
                      class="btn ${c.primary_outline ? "btn-outline" : "btn-primary"}"
                      href=${c.primary_url || "#"}
                    >
                      ${primaryLabel}
                    </a>
                  </div>
                `
              : nothing}
            ${trustPoints.length
              ? html`
                  <ul class="trust">
                    ${trustPoints.map(
                      (t) => html`
                        <li class="trust-item">
                          <svg
                            class="trust-icon"
                            viewBox="0 0 24 24"
                            fill="none"
                            aria-hidden="true"
                          >
                            <path
                              d="M20 6 9 17l-5-5"
                              stroke="currentColor"
                              stroke-width="2.5"
                              stroke-linecap="round"
                              stroke-linejoin="round"
                            />
                          </svg>
                          <span>${t}</span>
                        </li>
                      `
                    )}
                  </ul>
                `
              : nothing}
          </div>
        </div>
      </section>
    `;
  }
}
