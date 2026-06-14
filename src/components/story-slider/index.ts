import { LitElement, html, nothing, type PropertyValues } from "lit";
import { property, state } from "lit/decorators.js";
import { keyed } from "lit/directives/keyed.js";
import type {
  StorySliderConfig,
  StorySlideItem,
  StoryTransition,
  StoryTransitionSpeed,
  StoryPaginationStyle,
  StoryPaginationPosition,
  StoryArrowStyle,
  StoryArrowPosition,
  StoryContentPosition,
  StoryAspect,
  StoryAspectDesktop,
  StoryOverlayStyle,
  StoryOverlayIntensity,
  StoryTextTheme,
  StoryAutoplayProgress,
  MaybeMultiLang,
} from "./types";
import { storySliderStyles } from "./style";

/**
 * <growth-story-slider> — Story Slider (سلايدر القصة)
 * Part of the Growth Kit bundle for Salla Twilight.
 *
 * Editorial-grade multi-slide carousel. Distinguishing features:
 *   • Fraction pagination as the signature ("02 / 04" inside the slide bottom).
 *   • Seven transition modes (fade / slide / kenburns / zoom / parallax / reveal / stack).
 *   • Five arrow treatments (circle / outline / minimal / bar / framed).
 *   • Optional progress ring on the next-arrow that ticks with autoplay.
 *   • Pause on hover + pause when scrolled off-screen (IntersectionObserver).
 *   • Drag/swipe, keyboard arrows, RTL-aware throughout, prefers-reduced-motion.
 *   • Per-slide native link picker (product / category / page / brand / blog / URL).
 */
export default class GrowthStorySlider extends LitElement {
  static styles = storySliderStyles;

  /** Twilight transform injects `Class.registerSallaComponent(...)`. */
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
  config?: StorySliderConfig;

  @state() private _activeIndex = 0;
  /** Direction of the last navigation — used to pick which slide is "prev" vs "next"
      when only two slides exist (where the same slide would otherwise be both). */
  @state() private _lastDir: "forward" | "backward" | "initial" = "initial";
  /** Index of the slide that is currently animating out. Cleared after the
      transition duration so bystander slides can reposition without a visible
      sweep across the screen. */
  @state() private _leavingIndex: number | null = null;
  /** Drives the header fade-in. */
  @state() private _animState: "ready" | "in" = "ready";
  /** Whether the section is currently visible — toggled by IntersectionObserver. */
  @state() private _inView = true;

  private _autoplayTimer: number | null = null;
  private _autoplayStartedAt = 0;
  private _autoplayElapsed = 0;
  private _leaveTimer: number | null = null;
  /** True while the visitor is engaged with the slider (mouse hovering or touch
      held). Autoplay pauses while true and resumes when it clears. */
  private _interactionPaused = false;
  private _hasInitializedActive = false;
  private _io: IntersectionObserver | null = null;

  /** Swipe tracking. */
  private _swipeStartX: number | null = null;
  private _swipeStartY: number | null = null;
  private _swipeActive = false;

  /** Keyboard listener (bound, so we can add/remove it). */
  private _onKeydown = (e: KeyboardEvent) => {
    if (this.config?.enable_keyboard === false) return;
    if (this._slides().length <= 1) return;
    // Only react when the slider (or a descendant) has focus.
    const root = this.renderRoot as ShadowRoot;
    const active = (root.activeElement || document.activeElement) as
      | HTMLElement
      | null;
    const focused =
      this.contains(active) || (root && root.contains(active));
    if (!focused) return;
    const isRtl = getComputedStyle(this).direction === "rtl";
    if (e.key === "ArrowLeft") {
      isRtl ? this._goNext() : this._goPrev();
    } else if (e.key === "ArrowRight") {
      isRtl ? this._goPrev() : this._goNext();
    } else {
      return;
    }
    e.preventDefault();
  };

  // ------------------------------------------------------------
  // Helpers
  // ------------------------------------------------------------

  private _isEnglish(): boolean {
    return (document.documentElement.lang || "ar")
      .toLowerCase()
      .startsWith("en");
  }

  private _t(val: MaybeMultiLang): string {
    if (!val) return "";
    if (typeof val === "string") return val;
    const lang = this._isEnglish() ? "en" : "ar";
    return (val[lang] || val.ar || val.en || "").trim();
  }

  /** Localized screen-reader strings (Arabic-first, English fallback). */
  private _aria = {
    prev: () => (this._isEnglish() ? "Previous slide" : "الشريحة السابقة"),
    next: () => (this._isEnglish() ? "Next slide" : "الشريحة التالية"),
    slide: (n: number) =>
      this._isEnglish() ? `Slide ${n}` : `الشريحة ${n}`,
  };

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

  /** Zero-pad to 2 digits — "02" / "10" / "04". */
  private _pad2(n: number): string {
    if (n < 10) return `0${n}`;
    return String(n);
  }

  /** Drop slides that have no usable media so we never render a blank frame. */
  private _slides(): StorySlideItem[] {
    const list = this.config?.slides;
    if (!Array.isArray(list)) return [];
    return list.filter((s) => {
      if (!s || typeof s !== "object") return false;
      return !!(s.image || s.image_desktop || s.video || s.link);
    });
  }

  // ------------------------------------------------------------
  // Link resolution
  //
  // `slide.link` is a Salla `variable-list` field: the platform resolves the
  // picked target (product / category / page / brand / blog / external URL) to
  // a final URL string server-side. We still parse defensively because the
  // value can arrive as a bare string, a `{ url | value }` object, or a
  // single-item array wrapping either — and we treat "" / "#" as "no link".
  // ------------------------------------------------------------

  private _resolveLink(slide: StorySlideItem): string {
    const raw = slide.link;
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

    // Pause autoplay when scrolled out of view (saves CPU and prevents the
    // slider from racing on a long page).
    if ("IntersectionObserver" in window) {
      this._io = new IntersectionObserver(
        (entries) => {
          const ent = entries[0];
          if (!ent) return;
          this._inView = ent.isIntersecting;
        },
        { threshold: 0.15 }
      );
      this._io.observe(this);
    }

    document.addEventListener("keydown", this._onKeydown);
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    this._teardownAutoplay();
    if (this._leaveTimer) {
      clearTimeout(this._leaveTimer);
      this._leaveTimer = null;
    }
    this._io?.disconnect();
    this._io = null;
    document.removeEventListener("keydown", this._onKeydown);
  }

  willUpdate(changed: PropertyValues) {
    if (!changed.has("config")) {
      // _inView and other state changes still need to retune autoplay.
      this._teardownAutoplay();
      this._setupAutoplay();
      return;
    }

    const slides = this._slides();
    if (!this._hasInitializedActive && slides.length > 0) {
      const wanted = this._num(this.config?.initial_slide, NaN);
      const start = Number.isNaN(wanted)
        ? 0
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
    if (!c.autoplay) return;
    if (this._slides().length < 2) return;
    if (c.pause_out_of_view !== false && !this._inView) return;
    // Pause while the visitor is interacting (hover or touch); resume on leave.
    if (this._interactionPaused && c.pause_on_interaction !== false) return;

    const delayMs = Math.max(1000, this._num(c.autoplay_delay, 5) * 1000);
    const remaining = Math.max(0, delayMs - this._autoplayElapsed);
    this._autoplayStartedAt = Date.now();

    this._autoplayTimer = window.setTimeout(() => {
      this._autoplayTimer = null;
      this._goNext();
    }, remaining);
  }

  private _teardownAutoplay() {
    if (this._autoplayTimer) {
      clearTimeout(this._autoplayTimer);
      this._autoplayTimer = null;
    }
    // Record elapsed time so we can resume from where we paused, not from zero.
    if (this._autoplayStartedAt) {
      this._autoplayElapsed += Date.now() - this._autoplayStartedAt;
      this._autoplayStartedAt = 0;
    }
  }

  /** Restart the autoplay countdown from a clean slate. Clears BOTH the elapsed
      accumulator AND the start timestamp — the latter is essential: without it,
      the very next `_teardownAutoplay` (which willUpdate fires on the state change
      that triggered this reset) would add the just-finished timer's full duration
      back onto elapsed, making the next interval ~0ms and causing a double-advance. */
  private _resetAutoplayCountdown() {
    this._autoplayElapsed = 0;
    this._autoplayStartedAt = 0;
  }

  // ------------------------------------------------------------
  // Navigation
  // ------------------------------------------------------------

  /** Returns the current transition duration in ms — keeps the leave timer in sync. */
  private _getTransitionDurMs(): number {
    const speed = this._pickValue<StoryTransitionSpeed>(
      this.config?.transition_speed,
      "normal"
    );
    if (speed === "fast") return 500;
    if (speed === "slow") return 1300;
    return 900;
  }

  /** Marks the current slide as "leaving" and schedules clearing that flag after
      the transition completes. This lets CSS distinguish the outgoing slide from
      bystander slides that merely need to reposition (invisibly). */
  private _setLeaving() {
    this._leavingIndex = this._activeIndex;
    if (this._leaveTimer) clearTimeout(this._leaveTimer);
    this._leaveTimer = window.setTimeout(() => {
      this._leavingIndex = null;
      this._leaveTimer = null;
    }, this._getTransitionDurMs() + 80);
  }

  private _goPrev = () => {
    const n = this._slides().length;
    if (n <= 1) return;
    const loop = this.config?.loop !== false;
    let next = this._activeIndex - 1;
    if (next < 0) next = loop ? n - 1 : 0;
    if (next === this._activeIndex) return;
    this._setLeaving();
    this._activeIndex = next;
    this._lastDir = "backward";
    this._resetAutoplayCountdown();
  };

  private _goNext = () => {
    const n = this._slides().length;
    if (n <= 1) return;
    const loop = this.config?.loop !== false;
    let next = this._activeIndex + 1;
    if (next >= n) next = loop ? 0 : n - 1;
    if (next === this._activeIndex) return;
    this._setLeaving();
    this._activeIndex = next;
    this._lastDir = "forward";
    this._resetAutoplayCountdown();
  };

  private _goTo = (idx: number) => {
    const n = this._slides().length;
    if (idx < 0 || idx >= n) return;
    if (idx === this._activeIndex) return;
    this._lastDir = idx > this._activeIndex ? "forward" : "backward";
    this._setLeaving();
    this._activeIndex = idx;
    this._resetAutoplayCountdown();
  };

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

  /** Compute data-pos for each slide index. */
  private _slidePos(
    i: number
  ): "active" | "prev" | "next" | "hidden" {
    const n = this._slides().length;
    if (n === 0) return "hidden";
    if (i === this._activeIndex) return "active";

    const loop = this.config?.loop !== false;
    const prevIdx = loop
      ? (this._activeIndex - 1 + n) % n
      : this._activeIndex - 1;
    const nextIdx = loop
      ? (this._activeIndex + 1) % n
      : this._activeIndex + 1;

    // With exactly 2 slides, the same index would be both prev and next.
    // Pick the side that the last navigation moved away from.
    if (n === 2) {
      if (this._lastDir === "forward") return "prev";
      return "next";
    }

    if (i === prevIdx) return "prev";
    if (i === nextIdx) return "next";
    return "hidden";
  }

  // ------------------------------------------------------------
  // Pointer + hover
  // ------------------------------------------------------------

  /** Pause autoplay while the visitor is engaged. Shared by hover (mouse) and
      press (touch). No-op when the merchant disabled `pause_on_interaction`. */
  private _pauseForInteraction() {
    if (this.config?.pause_on_interaction === false) return;
    if (this._interactionPaused) return;
    this._interactionPaused = true;
    this._teardownAutoplay();
    this.requestUpdate();
  }

  /** Resume autoplay once the visitor disengages (mouse leaves / touch ends). */
  private _resumeFromInteraction() {
    if (this.config?.pause_on_interaction === false) return;
    if (!this._interactionPaused) return;
    this._interactionPaused = false;
    this._setupAutoplay();
    this.requestUpdate();
  }

  private _onPointerDown = (e: PointerEvent) => {
    if (this._slides().length <= 1) return;
    // Touch has no hover, so a touch press is what "interaction" means there.
    // Mouse interaction is covered by the mouseenter/mouseleave hover handlers.
    if (e.pointerType === "touch") this._pauseForInteraction();
    if (this.config?.enable_drag === false) return;
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
    if (this._swipeStartX !== null) {
      const dx = e.clientX - this._swipeStartX;
      if (this._swipeActive && Math.abs(dx) > 40) {
        const isRtl = getComputedStyle(this).direction === "rtl";
        const advance = isRtl ? dx > 0 : dx < 0;
        if (advance) this._goNext();
        else this._goPrev();
      }
      this._swipeStartX = null;
      this._swipeStartY = null;
      window.setTimeout(() => {
        this._swipeActive = false;
      }, 50);
    }
    // Resume after a touch interaction ends (mouse resumes on mouseleave).
    if (e.pointerType === "touch") this._resumeFromInteraction();
  };

  private _onHoverIn = () => this._pauseForInteraction();
  private _onHoverOut = () => this._resumeFromInteraction();

  // ------------------------------------------------------------
  // Render helpers
  // ------------------------------------------------------------

  /** Builds the inline `style` attribute on the host with all custom-property overrides. */
  private _buildHostStyle(c: StorySliderConfig): string {
    const cardRadius = this._num(c.card_radius, 20);
    // Mobile-first: the mobile ratio is the base; desktop is an optional
    // override that defaults to "inherit" (reuse the mobile ratio).
    const aspectMobile = this._pickValue<StoryAspect>(
      c.aspect_ratio_mobile,
      "4/5"
    );
    const aspectDesktop = this._pickValue<StoryAspectDesktop>(
      c.aspect_ratio_desktop,
      "16/9"
    );
    const maxWidth = this._num(c.max_width, 1280);

    const overlayAlpha = (() => {
      const i = this._pickValue<StoryOverlayIntensity>(
        c.overlay_intensity,
        "medium"
      );
      if (i === "subtle") return 0.35;
      if (i === "strong") return 0.85;
      return 0.6;
    })();

    const parts = [
      c.bg_color ? `--ss-bg: ${c.bg_color}` : "",
      c.title_color ? `--ss-title-color: ${c.title_color}` : "",
      c.subtitle_color ? `--ss-subtitle-color: ${c.subtitle_color}` : "",
      c.slide_title_color
        ? `--ss-slide-title-color: ${c.slide_title_color}`
        : "",
      c.slide_text_color
        ? `--ss-slide-text-color: ${c.slide_text_color}`
        : "",
      c.arrow_bg ? `--ss-arrow-bg: ${c.arrow_bg}` : "",
      c.arrow_icon_color ? `--ss-arrow-icon: ${c.arrow_icon_color}` : "",
      c.pagination_color ? `--ss-pag-color: ${c.pagination_color}` : "",
      c.pagination_active_color
        ? `--ss-pag-active: ${c.pagination_active_color}`
        : "",
      c.cta_bg ? `--ss-cta-bg: ${c.cta_bg}` : "",
      c.cta_color ? `--ss-cta-color: ${c.cta_color}` : "",
      c.badge_bg ? `--ss-badge-bg: ${c.badge_bg}` : "",
      c.badge_color ? `--ss-badge-color: ${c.badge_color}` : "",
      `--ss-radius: ${cardRadius}px`,
      `--ss-aspect-mobile: ${aspectMobile}`,
      `--ss-aspect-desktop: ${
        aspectDesktop === "inherit" ? aspectMobile : aspectDesktop
      }`,
      `--ss-max-width: ${maxWidth}px`,
      `--ss-overlay-a: ${overlayAlpha}`,
    ];
    return parts.filter(Boolean).join("; ");
  }

  // ------------------------------------------------------------
  // Render
  // ------------------------------------------------------------

  render() {
    const c: StorySliderConfig = this.config || {};
    const slides = this._slides();

    const transition = this._pickValue<StoryTransition>(c.transition, "fade");
    const speed = this._pickValue<StoryTransitionSpeed>(
      c.transition_speed,
      "normal"
    );
    const arrowStyle = this._pickValue<StoryArrowStyle>(
      c.arrow_style,
      "circle"
    );
    const arrowPosition = this._pickValue<StoryArrowPosition>(
      c.arrow_position,
      "sides"
    );
    const paginationStyle = this._pickValue<StoryPaginationStyle>(
      c.pagination_style,
      "fraction"
    );
    const paginationPosition = this._pickValue<StoryPaginationPosition>(
      c.pagination_position,
      "inside-bottom-center"
    );
    const contentPosition = this._pickValue<StoryContentPosition>(
      c.content_position,
      "bottom-left"
    );
    const overlayStyle = this._pickValue<StoryOverlayStyle>(
      c.overlay_style,
      "dark-bottom"
    );
    const textTheme = this._pickValue<StoryTextTheme>(c.text_theme, "light");

    const showArrows = c.show_arrows !== false;
    const idleKenBurns = c.enable_idle_ken_burns === true;
    const enableAnim = c.enable_entrance_anim !== false;
    const fullWidth = c.full_width !== false;

    const hostStyle = this._buildHostStyle(c);

    const sectionTitle = this._t(c.section_title);
    const sectionSubtitle = this._t(c.section_subtitle);
    const defaultCtaLabel = this._t(c.default_cta_label) || "تسوّق الآن";

    if (slides.length === 0) {
      return html`
        <section class="ss-section" style=${hostStyle}>
          <p class="ss-empty">أضف صورة واحدة على الأقل لكل شريحة للبدء.</p>
        </section>
      `;
    }

    const isSingle = slides.length === 1;
    const total = slides.length;
    const currentNum = this._activeIndex + 1;
    const progressPct = ((currentNum) / total) * 100;
    const separator = (c.pagination_separator || "/").toString();

    // Where pagination lives — inside the bottom strip or below the frame.
    const pagInside = paginationPosition.startsWith("inside-bottom");
    const arrowsInsideBottom = arrowPosition === "inside-bottom";
    const hasBottomStrip =
      !isSingle &&
      ((pagInside &&
        paginationStyle !== "none" &&
        paginationStyle !== "thumbnails" &&
        paginationStyle !== "progress") ||
        arrowsInsideBottom);

    // Autoplay delay drives the progress bar fill duration (in seconds).
    const autoplayDelay = Math.max(1, this._num(c.autoplay_delay, 5));

    // Top-of-frame autoplay progress bar — same gating logic,
    // plus a "paused" flag so CSS can freeze (not reset) the active fill on
    // hover or when the slider scrolls out of view.
    const autoplayProgress = this._pickValue<StoryAutoplayProgress>(
      c.autoplay_progress,
      "none"
    );
    const apEnabled =
      autoplayProgress !== "none" && c.autoplay === true && !isSingle;
    // Out-of-view only pauses the bar when autoplay itself pauses out-of-view,
    // otherwise the bar would freeze while slides keep auto-advancing (desync).
    const pausedOutOfView = c.pause_out_of_view !== false && !this._inView;
    const apPaused =
      apEnabled &&
      (this._interactionPaused || this._swipeActive || pausedOutOfView);

    // Icons (kept as inline path strings so they're easy to tweak per variant).
    const chevronPath = "m9 6 6 6-6 6";
    const arrowPath = "M5 12h14M13 6l6 6-6 6";
    const longArrowPath = "M2 7h22M16 1l8 6-8 6";

    return html`
      <section
        class="ss-section"
        style=${hostStyle}
        data-transition=${transition}
        data-speed=${speed}
        data-text-theme=${textTheme}
        data-anim-entrance=${enableAnim ? "on" : "off"}
        data-idle-kenburns=${idleKenBurns ? "on" : "off"}
        data-full-width=${fullWidth ? "true" : "false"}
        data-dir=${this._lastDir}
      >
        ${sectionTitle || sectionSubtitle
          ? html`
              <header
                class="ss-header"
                data-anim=${enableAnim ? this._animState : "in"}
              >
                ${sectionTitle
                  ? html`<h2 class="ss-section-title">${sectionTitle}</h2>`
                  : nothing}
                ${sectionSubtitle
                  ? html`<p class="ss-section-subtitle">${sectionSubtitle}</p>`
                  : nothing}
              </header>
            `
          : nothing}

        <div
          class="ss-frame"
          data-arrow-position=${arrowPosition}
          data-content-position=${contentPosition}
          data-overlay=${overlayStyle}
          data-has-bottom-strip=${hasBottomStrip ? "true" : "false"}
          @mouseenter=${this._onHoverIn}
          @mouseleave=${this._onHoverOut}
          @pointerdown=${this._onPointerDown}
          @pointermove=${this._onPointerMove}
          @pointerup=${this._onPointerUp}
          @pointercancel=${this._onPointerUp}
          tabindex="0"
        >
          <!-- Top-of-frame autoplay progress (countdown of the active slide).
               "stories" splits into N segments; "bar" is a single sweep.
               The single-bar variant is wrapped in keyed() so a fresh DOM
               node is created on each slide change — that's what restarts
               the CSS animation from t=0 every cycle. -->
          ${apEnabled
            ? html`
                <div
                  class="ss-ap-bars"
                  data-style=${autoplayProgress}
                  data-paused=${apPaused ? "true" : "false"}
                  style=${`--ss-ap-dur: ${autoplayDelay}s`}
                  aria-hidden="true"
                >
                  ${autoplayProgress === "stories"
                    ? slides.map((_, i) => {
                        const barState =
                          i < this._activeIndex
                            ? "done"
                            : i === this._activeIndex
                            ? "active"
                            : "pending";
                        return html`
                          <div class="ss-ap-bar" data-state=${barState}>
                            <span class="ss-ap-fill"></span>
                          </div>
                        `;
                      })
                    : keyed(
                        this._activeIndex,
                        html`
                          <div class="ss-ap-bar" data-state="active">
                            <span class="ss-ap-fill"></span>
                          </div>
                        `
                      )}
                </div>
              `
            : nothing}

          <div class="ss-track">
            ${slides.map((slide, i) => {
              const pos = this._slidePos(i);
              // Mobile-first: `image` is the base (mobile) source used everywhere;
              // `image_desktop` is an optional larger/wider override for ≥768px.
              const baseSrc = slide.image || "";
              const desktopSrc = slide.image_desktop || baseSrc;
              const title = this._t(slide.title);
              const alt = title || `slide ${i + 1}`;
              const desc = this._t(slide.description);
              const eyebrow = this._t(slide.eyebrow);
              const badge = this._t(slide.badge);
              const ctaHref = this._resolveLink(slide);
              const ctaLabel =
                this._t(slide.cta_label) || (ctaHref ? defaultCtaLabel : "");
              const slideStyle = slide.text_color
                ? `--ss-slide-title-color: ${slide.text_color}; --ss-slide-text-color: ${slide.text_color};`
                : "";

              return html`
                <div
                  class="ss-slide"
                  data-pos=${pos}
                  data-leaving=${i === this._leavingIndex ? "true" : "false"}
                  data-index=${i}
                  style=${slideStyle}
                  role="group"
                  aria-roledescription="slide"
                  aria-label=${`${i + 1} / ${total}`}
                >
                  <div class="ss-media">
                    ${slide.video
                      ? html`
                          <video
                            src=${slide.video}
                            poster=${baseSrc || nothing}
                            autoplay
                            loop
                            .muted=${true}
                            muted
                            playsinline
                            preload="auto"
                          ></video>
                        `
                      : html`
                          <picture>
                            ${desktopSrc && desktopSrc !== baseSrc
                              ? html`<source
                                  media="(min-width: 768px)"
                                  srcset=${desktopSrc}
                                />`
                              : nothing}
                            <img
                              src=${baseSrc}
                              alt=${alt}
                              loading=${i === 0 ? "eager" : "lazy"}
                              decoding="async"
                              draggable="false"
                            />
                          </picture>
                        `}
                  </div>
                  <div class="ss-scrim"></div>
                  ${badge
                    ? html`<span class="ss-badge">${badge}</span>`
                    : nothing}
                  <div class="ss-content">
                    <div class="ss-content-inner">
                      ${eyebrow
                        ? html`<p class="ss-eyebrow">${eyebrow}</p>`
                        : nothing}
                      ${title
                        ? html`<h3 class="ss-title">${title}</h3>`
                        : nothing}
                      ${desc
                        ? html`<p class="ss-desc">${desc}</p>`
                        : nothing}
                      ${ctaHref && ctaLabel
                        ? html`
                            <div class="ss-cta-wrap">
                              <a
                                class="ss-cta"
                                href=${ctaHref}
                                aria-label=${ctaLabel}
                              >
                                <span>${ctaLabel}</span>
                                <svg viewBox="0 0 24 24">
                                  <path d=${arrowPath} />
                                </svg>
                              </a>
                            </div>
                          `
                        : nothing}
                    </div>
                  </div>
                </div>
              `;
            })}
          </div>

          <!-- Side-anchored arrows (when not clustered with pagination) -->
          ${!isSingle && showArrows && arrowPosition === "sides"
            ? html`
                <div class="ss-arrows-sides">
                  ${this._renderArrow("prev", arrowStyle, chevronPath, longArrowPath)}
                  ${this._renderArrow("next", arrowStyle, chevronPath, longArrowPath)}
                </div>
              `
            : nothing}

          <!-- Inside-bottom strip: arrows + fraction/lines/numbers pagination.
               data-pag-align controls which slot the pagination sits in when
               there are no inside-bottom arrows; when arrows ARE inside-bottom
               we always use the prev / pag / next space-between layout. -->
          ${hasBottomStrip
            ? html`
                <div
                  class="ss-controls-inside"
                  data-pag-align=${paginationPosition.replace(
                    "inside-bottom-",
                    ""
                  )}
                >
                  ${showArrows && arrowsInsideBottom
                    ? this._renderArrow("prev", arrowStyle, chevronPath, longArrowPath)
                    : html`<span class="ss-spacer"></span>`}
                  ${pagInside
                    ? this._renderPagination(
                        paginationStyle,
                        slides,
                        currentNum,
                        total,
                        progressPct,
                        separator
                      )
                    : html`<span class="ss-spacer"></span>`}
                  ${showArrows && arrowsInsideBottom
                    ? this._renderArrow("next", arrowStyle, chevronPath, longArrowPath)
                    : html`<span class="ss-spacer"></span>`}
                </div>
              `
            : nothing}

          <!-- Inline thin progress bar across the frame -->
          ${!isSingle && paginationStyle === "progress" && pagInside
            ? html`
                <div
                  class="ss-pag-progress"
                  style=${`--ss-pag-progress: ${progressPct}%`}
                ></div>
              `
            : nothing}

          <!-- Thumbnails INSIDE the frame (when an inside-bottom position is chosen) -->
          ${!isSingle && paginationStyle === "thumbnails" && pagInside
            ? this._renderThumbs(
                slides,
                true,
                paginationPosition.replace("inside-bottom-", "")
              )
            : nothing}
        </div>

        <!-- Thumbnails BELOW the frame (only when outside-below is chosen) -->
        ${!isSingle && paginationStyle === "thumbnails" && !pagInside
          ? this._renderThumbs(slides, false, "center")
          : nothing}

        <!-- Outside-below controls bar: pagination and/or arrows under the frame -->
        ${(() => {
          // Only fraction/lines/numbers actually render in the outside bar;
          // thumbnails render in their own row, progress/none render nothing.
          const inlinePag =
            paginationStyle === "fraction" ||
            paginationStyle === "lines" ||
            paginationStyle === "numbers";
          const outsidePag =
            paginationPosition === "outside-below" && inlinePag;
          const outsideArrows = showArrows && arrowPosition === "outside-below";
          if (isSingle || (!outsidePag && !outsideArrows)) return nothing;
          return html`
            <div
              class="ss-controls-outside"
              data-layout=${outsidePag && outsideArrows ? "split" : "center"}
            >
              ${outsidePag
                ? this._renderPagination(
                    paginationStyle,
                    slides,
                    currentNum,
                    total,
                    progressPct,
                    separator
                  )
                : nothing}
              ${outsideArrows
                ? html`
                    <div class="ss-arrows-outside">
                      ${this._renderArrow("prev", arrowStyle, chevronPath, longArrowPath)}
                      ${this._renderArrow("next", arrowStyle, chevronPath, longArrowPath)}
                    </div>
                  `
                : nothing}
            </div>
          `;
        })()}
      </section>
    `;
  }

  /** Thumbnails strip. `inside` overlays it at the frame bottom (aligned
      left/center/right); otherwise it renders as a centered row below the frame. */
  private _renderThumbs(
    slides: StorySlideItem[],
    inside: boolean,
    align: string
  ) {
    return html`
      <div
        class="ss-pag-thumbs"
        role="tablist"
        data-inside=${inside ? "true" : "false"}
        data-align=${align}
      >
        ${slides.map(
          (s, i) => html`
            <button
              type="button"
              aria-current=${this._activeIndex === i ? "true" : "false"}
              aria-label=${this._aria.slide(i + 1)}
              @click=${() => this._goTo(i)}
            >
              <img
                src=${s.image || s.image_desktop || ""}
                alt=""
                loading="lazy"
              />
            </button>
          `
        )}
      </div>
    `;
  }

  // ------------------------------------------------------------
  // Render helpers — arrows + pagination
  // ------------------------------------------------------------

  private _renderArrow(
    dir: "prev" | "next",
    style: StoryArrowStyle,
    chevron: string,
    longArrow: string
  ) {
    const onClick = dir === "prev" ? this._goPrev : this._goNext;
    const disabled =
      dir === "prev" ? this._isPrevDisabled() : this._isNextDisabled();
    const cls = `ss-arrow ss-arrow-${dir}`;
    // bar variant uses a long-arrow glyph instead of the chevron.
    const path = style === "bar" ? longArrow : chevron;
    const viewBox = style === "bar" ? "0 0 26 14" : "0 0 24 24";

    return html`
      <button
        type="button"
        class=${cls}
        data-arrow=${style}
        ?disabled=${disabled}
        aria-label=${dir === "prev" ? this._aria.prev() : this._aria.next()}
        @click=${onClick}
      >
        <svg viewBox=${viewBox} aria-hidden="true">
          <path d=${path} />
        </svg>
      </button>
    `;
  }

  private _renderPagination(
    style: StoryPaginationStyle,
    slides: StorySlideItem[],
    current: number,
    total: number,
    progressPct: number,
    separator: string
  ) {
    if (style === "none") return nothing;
    if (style === "progress" || style === "thumbnails") {
      // These render in their own slot (thin bar at frame bottom / strip below).
      return nothing;
    }

    if (style === "fraction") {
      // The signature: "02 / 04" with the merchant's chosen separator between.
      return html`
        <div class="ss-pagination ss-pag-fraction" role="status" aria-live="polite">
          <span class="ss-pag-current">${this._pad2(current)}</span>
          <span class="ss-pag-sep" aria-hidden="true">${separator}</span>
          <span class="ss-pag-total">${this._pad2(total)}</span>
        </div>
      `;
    }

    if (style === "lines") {
      return html`
        <div class="ss-pagination ss-pag-lines" role="tablist">
          ${slides.map(
            (_, i) => html`
              <button
                type="button"
                aria-current=${this._activeIndex === i ? "true" : "false"}
                aria-label=${this._aria.slide(i + 1)}
                @click=${() => this._goTo(i)}
              ></button>
            `
          )}
        </div>
      `;
    }

    if (style === "numbers") {
      return html`
        <div class="ss-pagination ss-pag-numbers" role="tablist">
          ${slides.map(
            (_, i) => html`
              <button
                type="button"
                aria-current=${this._activeIndex === i ? "true" : "false"}
                @click=${() => this._goTo(i)}
              >
                ${this._pad2(i + 1)}
              </button>
            `
          )}
        </div>
      `;
    }

    return nothing;
  }
}
