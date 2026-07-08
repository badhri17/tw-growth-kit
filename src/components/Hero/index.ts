import { html, nothing } from "lit";
import { property, state } from "lit/decorators.js";
import { GrowthElement } from "../../shared/growth-element";
import type {
  HeroConfig,
  HeroHeight,
  HeroHeightDesktop,
  HeroDesktopLayout,
  HeroSplitSide,
  HeroSplitRatio,
  HeroAlignH,
  HeroAlignV,
  HeroOverlayStyle,
  HeroOverlayIntensity,
  HeroTextTheme,
  HeroGradientType,
  HeroBgFill,
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
export default class GrowthHero extends GrowthElement {
  static styles = heroStyles;

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
  /** Polls for autoplay-blocked videos (Safari Low Power Mode). */
  private _autoplayCheckTimer: number | null = null;
  private _io: IntersectionObserver | null = null;
  private _rafId: number | null = null;
  private _onScroll?: () => void;
  private _mql?: MediaQueryList;
  private _onMqlChange?: () => void;

  // ------------------------------------------------------------
  // Helpers
  // ------------------------------------------------------------

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
      // "3g" is HSPA+ (up to 20 Mbps) and handles video fine; only block genuinely slow connections.
      const slow = ["slow-2g", "2g"];
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
    if (this.config?.smart_data_saver === false) return 12000;
    const isMobile = !window.matchMedia("(min-width: 768px)").matches;
    const hasNetAPI = !!(navigator as any).connection;
    // Safari mobile has no Network API; give remote CDN videos enough time for DNS+TLS+buffer.
    if (isMobile && !hasNetAPI) return 10000;
    return 12000;
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
   * Driven by the `bg_fill_type` dropdown (solid | gradient). For configs saved
   * before that field existed, we infer the mode from whether a "to" colour is
   * present, so existing gradients keep rendering.
   * - solid (or gradient with no "to") → the single colour.
   * - gradient with both stops         → gradient of the chosen type/angle.
   * - neither colour                   → null; CSS fallback in style.ts takes over.
   */
  private _buildBackground(): string | null {
    const c = this.config || {};
    const from = (c.gradient_from || "").trim();
    const to = (c.gradient_to || "").trim();

    if (!from && !to) return null;

    // Default the fill mode from legacy data: a saved "to" colour means gradient.
    const fill = this._pickValue<HeroBgFill>(
      c.bg_fill_type,
      to ? "gradient" : "solid"
    );
    // Solid, or gradient missing its second stop → render the single colour.
    if (fill !== "gradient" || !to) return from || to;

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

  /** Resolved document direction; split placement maps physical sides to inline edges. */
  private _dir(): "rtl" | "ltr" {
    const docDir = (document.documentElement.getAttribute("dir") || "").toLowerCase();
    if (docDir === "rtl" || docDir === "ltr") return docDir as "rtl" | "ltr";
    return getComputedStyle(this).direction === "ltr" ? "ltr" : "rtl";
  }

  /**
   * Resolve split-mode grid placement. Grid columns are line-based (line 1 =
   * inline-start), which flips with RTL — so we translate the merchant's PHYSICAL
   * left/right choice into an inline edge for the current direction, then assign
   * each column its width share (the bigger share goes to whatever the ratio names).
   */
  private _resolveSplit(
    side: HeroSplitSide,
    ratio: HeroSplitRatio
  ): { mediaCol: "start" | "end"; startFr: string; endFr: string } {
    const dir = this._dir();
    const mediaAtStart = dir === "ltr" ? side === "left" : side === "right";
    const big = "1.25fr";
    const one = "1fr";
    const mediaFr = ratio === "media" ? big : one;
    const contentFr = ratio === "content" ? big : one;
    return {
      mediaCol: mediaAtStart ? "start" : "end",
      startFr: mediaAtStart ? mediaFr : contentFr,
      endFr: mediaAtStart ? contentFr : mediaFr,
    };
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

    // Autoplay refused (Safari Low Power Mode & similar battery savers):
    // the video buffers fine but the browser won't start it, leaving a
    // frozen frame with a native play glyph that reads as "broken".
    // Swap to the image when the merchant kept the toggle on and an image
    // exists; otherwise leave the video so the visitor can tap to play.
    const autoplayBlocked = () => {
      if (gen !== this._videoGeneration) return;
      markStarted(); // stop the slow-network safety timer either way
      if (this.config?.battery_saver_fallback === false) return;
      if (!this._currentImageUrl()) return;
      this._videoFailed = true;
    };

    // play() in Low Power Mode may reject, hang, or silently no-op — so on
    // top of the rejection handler, poll until the video either really plays
    // (currentTime advances) or sits paused with data ready = blocked.
    let verifyAttempts = 0;
    const verifyPlayback = () => {
      if (gen !== this._videoGeneration) return;
      if (!v.isConnected || !v.paused || v.currentTime > 0) return;
      if (v.readyState >= 2) {
        autoplayBlocked();
        return;
      }
      if (++verifyAttempts < 10) {
        this._autoplayCheckTimer = window.setTimeout(verifyPlayback, 1500);
      }
    };

    const attemptPlay = () => {
      if (gen !== this._videoGeneration) return;
      const p = v.play();
      if (p && typeof p.then === "function") {
        p.catch((err: unknown) => {
          const name = (err as { name?: string } | null)?.name;
          if (name === "NotAllowedError") autoplayBlocked();
          else giveUp();
        });
      }
      if (this._autoplayCheckTimer) clearTimeout(this._autoplayCheckTimer);
      this._autoplayCheckTimer = window.setTimeout(verifyPlayback, 2000);
    };

    // Metadata may already be in by the time we run (autoplay attr starts the
    // load before this setup) — attach the listener only if it's still pending.
    if (v.readyState >= 1) attemptPlay();
    else v.addEventListener("loadedmetadata", attemptPlay, { once: true });

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
        const offset = Math.max(-1, Math.min(1, raw)) * 80; // px
        bg.style.setProperty("--gh-parallax", `${-offset}px`);
        ticking = false;
      });
    };
    window.addEventListener("scroll", this._onScroll, { passive: true });
    this._onScroll();
  }

  private _teardown() {
    if (this._fallbackTimer) clearTimeout(this._fallbackTimer);
    if (this._autoplayCheckTimer) clearTimeout(this._autoplayCheckTimer);
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

    // Desktop split layout (mobile always stays full-background — handled in CSS).
    const desktopLayout = this._pickValue<HeroDesktopLayout>(c.desktop_layout, "background");
    const splitSide = this._pickValue<HeroSplitSide>(c.split_media_side, "left");
    const splitRatio = this._pickValue<HeroSplitRatio>(c.split_ratio, "equal");
    const splitTextTheme = this._pickValue<HeroTextTheme>(
      c.split_text_theme,
      "light"
    );
    const split =
      desktopLayout === "split" ? this._resolveSplit(splitSide, splitRatio) : null;

    // Custom content colours: when enabled, the chosen colours override text_theme
    // per element; elements left blank keep following text_theme.
    const customColors = c.enable_custom_colors === true;

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
      split ? `--gh-split-start: ${split.startFr}` : "",
      split ? `--gh-split-end: ${split.endFr}` : "",
      split && c.split_content_bg
        ? `--gh-split-content-bg: ${c.split_content_bg}`
        : "",
      customColors && c.title_color ? `--gh-title-color: ${c.title_color}` : "",
      customColors && c.eyebrow_color ? `--gh-eyebrow-color: ${c.eyebrow_color}` : "",
      customColors && c.subtitle_color ? `--gh-subtitle-color: ${c.subtitle_color}` : "",
      customColors && c.button_bg_color ? `--gh-btn-bg: ${c.button_bg_color}` : "",
      customColors && c.button_text_color ? `--gh-btn-fg: ${c.button_text_color}` : "",
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
        data-layout=${desktopLayout}
        data-media-col=${split ? split.mediaCol : "start"}
        data-split-text-theme=${splitTextTheme}
        data-custom-colors=${customColors ? "on" : "off"}
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
                    fetchpriority="high"
                    decoding="async"
                  />
                </picture>
              `
            : nothing}
          ${overlayStyle !== "none"
            ? html`<div class="overlay" data-style=${overlayStyle}></div>`
            : nothing}
        </div>

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
