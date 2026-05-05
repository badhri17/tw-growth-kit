import { LitElement, html, nothing } from "lit";
import { property, state } from "lit/decorators.js";
import type {
  HeroConfig,
  HeroHeight,
  HeroAlignH,
  HeroAlignV,
  HeroOverlayStyle,
  HeroOverlayIntensity,
  HeroTextTheme,
  MaybeMultiLang,
} from "./types";
import { heroStyles } from "./style";

/**
 * <growth-hero> — Store Hero (واجهة المتجر)
 * Part of the Growth Bundle for Salla Twilight.
 *
 * Behaviour:
 *   • Auto-picks mode: video → image → gradient based on which URLs are filled.
 *   • Robust video fallback (5s timeout, error/abort guard, poster swap) — preserved
 *     from the client injection script that inspired this component.
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

  private _videoEl: HTMLVideoElement | null = null;
  private _fallbackTimer: number | null = null;
  private _io: IntersectionObserver | null = null;
  private _rafId: number | null = null;
  private _onScroll?: () => void;

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

  /** Which background mode should we render? */
  private get _mode(): "video" | "image" | "gradient" {
    const c = this.config || {};
    const isMobile = window.matchMedia("(max-width: 640px)").matches;
    const videoBlockedOnMobile = isMobile && c.poster_on_mobile !== false;

    if (c.video_url && !videoBlockedOnMobile && !this._videoFailed) return "video";
    const imgCandidate = c.background_image || c.poster_image;
    if (imgCandidate) return "image";
    return "gradient";
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
  }

  firstUpdated() {
    this._setupVideo();
    this._setupParallax();
  }

  updated() {
    // If the config swapped between modes, re-wire the video.
    const v = this.renderRoot.querySelector("video") as HTMLVideoElement | null;
    if (v && v !== this._videoEl) {
      this._videoEl = v;
      this._setupVideo();
    }
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    this._teardown();
  }

  // ------------------------------------------------------------
  // Video: autoplay + robust fallback
  // Mirrors the 5s-timeout / error / abort strategy from the original
  // injection script, adapted for a reactive component.
  // ------------------------------------------------------------

  private _setupVideo() {
    const v = this.renderRoot.querySelector("video") as HTMLVideoElement | null;
    if (!v) return;
    this._videoEl = v;

    let started = false;

    const markStarted = () => {
      if (started) return;
      started = true;
      if (this._fallbackTimer) {
        clearTimeout(this._fallbackTimer);
        this._fallbackTimer = null;
      }
    };

    const giveUp = () => {
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
        const p = v.play();
        if (p && typeof p.then === "function") p.catch(() => giveUp());
      },
      { once: true }
    );

    // Safety net: if nothing started within 5s, swap to image fallback.
    this._fallbackTimer = window.setTimeout(() => {
      if (!started) giveUp();
    }, 5000);
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

    const height: HeroHeight = this._pickValue<HeroHeight>(c.height, "large");
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
    const secondaryLabel = this._t(c.secondary_label);

    const mode = this._mode;

    // Inline CSS custom properties for dynamic values.
    const hostStyle = [
      `--gh-overlay-a: ${overlayAlpha}`,
      c.content_max_width ? `--gh-content-max: ${c.content_max_width}px` : "",
      c.gradient_from ? `--gh-gradient-from: ${c.gradient_from}` : "",
      c.gradient_to ? `--gh-gradient-to: ${c.gradient_to}` : "",
      c.gradient_angle != null ? `--gh-gradient-angle: ${c.gradient_angle}deg` : "",
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
                  src=${c.video_url!}
                  poster=${c.poster_image || c.background_image || ""}
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
            ? html`<img
                src=${c.background_image || c.poster_image || ""}
                alt=""
                loading="eager"
                decoding="async"
              />`
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
            ${primaryLabel || secondaryLabel
              ? html`
                  <div class="ctas">
                    ${primaryLabel
                      ? html`
                          <a
                            class="btn ${c.primary_outline ? "btn-outline" : "btn-primary"}"
                            href=${c.primary_url || "#"}
                          >
                            ${primaryLabel}
                          </a>
                        `
                      : nothing}
                    ${secondaryLabel
                      ? html`
                          <a
                            class="btn ${c.secondary_outline === false ? "btn-primary" : "btn-outline"}"
                            href=${c.secondary_url || "#"}
                          >
                            ${secondaryLabel}
                          </a>
                        `
                      : nothing}
                  </div>
                `
              : nothing}
          </div>
        </div>
      </section>
    `;
  }
}
