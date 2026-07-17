/**
 * Growth Kit — Story Slider (سلايدر القصة)
 * Type definitions for the Story Slider component configuration.
 *
 * The Story Slider is a premium multi-slide carousel for brand storytelling.
 * It deliberately avoids the "generic carousel" feel — every visual axis is a
 * dropdown with multiple curated variants:
 *   • 7 transition animations (fade / slide / ken-burns / zoom / parallax / reveal / stack)
 *   • 6 pagination styles  (fraction / lines / numbers / progress / thumbnails / none)
 *   • 5 arrow styles       (circle / outline / minimal / bar / framed)
 *   • 9 content positions  (3×3 grid)
 */

/** Value coming back from a Salla `multilanguage: true` field. */
export type MaybeMultiLang =
  | string
  | { ar?: string; en?: string }
  | null
  | undefined;

/**
 * Value from a Salla `variable-list` link field. The platform resolves the
 * picked target (product / category / page / brand / blog / external URL) to a
 * final URL string; we type it loosely because it may arrive as a bare string,
 * a `{ url | value }` object, or a single-item array wrapping either.
 * Resolved via `_resolveLink`.
 */
export type RawLinkValue =
  | string
  | { url?: string; value?: string; label?: string }
  | Array<string | { url?: string; value?: string; label?: string }>
  | null
  | undefined;

/* ------------------------------------------------------------------------
 * Variant unions — every visual axis is a curated enum.
 *
 * The merchant picks from named, opinionated options; we never expose
 * free-form CSS in the panel. Each variant maps to a `data-*` attribute on
 * the host so style.ts can target it.
 * ---------------------------------------------------------------------- */

/** How the active slide transitions to the next one. */
export type StoryTransition =
  | "fade" // soft crossfade — editorial, premium default
  | "slide" // classic horizontal slide
  | "kenburns" // slow zoom & pan + crossfade (cinematic)
  | "zoom" // active scales in from 1.08 with crossfade
  | "parallax" // image and text move at different speeds
  | "reveal" // clip-path wipe in from the leading edge
  | "stack"; // cards stack & slide off like a deck

/** How the pagination index is rendered. */
export type StoryPaginationStyle =
  | "fraction" // "2 / 4" — premium signature, inside the slide bottom
  | "lines" // thin animated lines (Apple-style)
  | "numbers" // 1·2·3·4 number chips
  | "progress" // single thin progress bar
  | "thumbnails" // mini-thumbnails strip under the slide
  | "none";

/** Where pagination sits relative to the slide. */
export type StoryPaginationPosition =
  | "inside-bottom-left"
  | "inside-bottom-center"
  | "inside-bottom-right"
  | "outside-below";

/** Premium arrow button treatment. */
export type StoryArrowStyle =
  | "circle" // round, soft shadow — classic premium
  | "outline" // outlined, transparent fill — minimal
  | "minimal" // chevron only, no chrome
  | "bar" // long thin line with arrow head — editorial
  | "framed"; // squared with crisp border

/** Where the arrows live on the slide. */
export type StoryArrowPosition =
  | "sides" // anchored to left/right edges of the slide
  | "inside-bottom" // both arrows clustered with the fraction at bottom
  | "outside-below"; // below the slide, near pagination

/** 3×3 grid for the content overlay anchor. */
export type StoryContentPosition =
  | "top-left"
  | "top-center"
  | "top-right"
  | "center-left"
  | "center"
  | "center-right"
  | "bottom-left"
  | "bottom-center"
  | "bottom-right";

/**
 * Slide aspect ratio for the media frame.
 *
 * Mobile-first: this is the base (mobile) set. `4/5` is included because it's
 * the premium insta-portrait default for phones. The desktop override reuses
 * the same set plus an `inherit` option (see `StoryAspectDesktop`).
 */
export type StoryAspect =
  | "21/9" // ultra-wide cinematic
  | "16/9" // widescreen
  | "4/3" // classic
  | "1/1" // square
  | "4/5" // insta-portrait — premium mobile default
  | "3/4" // portrait
  | "9/16"; // story / vertical

/** Desktop aspect ratio adds `inherit` (reuse the mobile/base ratio). */
export type StoryAspectDesktop = StoryAspect | "inherit";

/** Scrim painted between the media and the text. */
export type StoryOverlayStyle =
  | "none"
  | "dark-bottom" // gradient up from bottom
  | "glass-bottom" // frosted-glass region fading up from bottom
  | "dark-top" // gradient down from top
  | "dark-full" // even dark wash
  | "light-full" // even light wash
  | "vignette"; // soft radial fade

export type StoryOverlayIntensity = "subtle" | "medium" | "strong";

/** Tonal mode for the text — flips defaults for inherit-able colors. */
export type StoryTextTheme = "light" | "dark";

/** Speed curve for the autoplay timer. */
export type StoryTransitionSpeed = "fast" | "normal" | "slow";

/**
 * Autoplay countdown progress indicator.
 *  - "none"    → hidden (default; preserves existing behaviour)
 *  - "bar"     → single thin bar at the top of the frame, fills with the
 *                autoplay countdown of the active slide (right→left in RTL).
 *  - "stories" → Instagram-stories style: one segment per slide; past slides
 *                show filled, the active segment animates, future slides empty.
 *
 * In both styles the animation runs only when autoplay is on and the slider
 * is visible + un-hovered; pauses with the autoplay timer; restarts whenever
 * the active slide changes (whether by autoplay, arrows, or pagination).
 */
export type StoryAutoplayProgress = "none" | "bar" | "stories";

/* ------------------------------------------------------------------------
 * Per-slide payload
 * ---------------------------------------------------------------------- */

export interface StorySlideItem {
  /** Primary image — the mobile-first base, used on every screen by default. */
  image?: string;
  /** Optional larger/wider desktop variant used at ≥768 px. Falls back to `image`. */
  image_desktop?: string;
  /** Optional MP4 — when set it plays in place of the image. */
  video?: string;
  /** Small uppercase eyebrow text above the title. */
  eyebrow?: MaybeMultiLang;
  /** Main slide title. */
  title?: MaybeMultiLang;
  /** Short description shown under the title. */
  description?: MaybeMultiLang;
  /** Tiny corner badge ("جديد", "حصري", "Sale 20%"). */
  badge?: MaybeMultiLang;
  /** CTA button label (optional). */
  cta_label?: MaybeMultiLang;
  /**
   * CTA target — Salla `variable-list` link picker. Points the button at a
   * product / category / page / brand / blog article / offers page / external
   * URL; resolved to a final URL string by the platform.
   */
  link?: RawLinkValue;
  /** Optional per-slide text colour override (rare — only when the bg fights the default). */
  text_color?: string;
}

/* ------------------------------------------------------------------------
 * Full config — what the merchant configures in the Salla admin panel.
 *
 * Every field is optional. Sensible defaults are applied inside the
 * component so a half-configured slider still looks great.
 * ---------------------------------------------------------------------- */

export interface StorySliderConfig {
  // --- Section header (above the slider, optional) ---
  section_title?: MaybeMultiLang;
  section_subtitle?: MaybeMultiLang;

  // --- Slides ---
  slides?: StorySlideItem[];

  // --- Frame / size (mobile-first: mobile is the base, desktop is the optional override) ---
  /** Primary frame ratio — designed for mobile first. */
  aspect_ratio_mobile?: StoryAspect;
  /** Optional desktop override (≥768px). `inherit` reuses the mobile ratio. */
  aspect_ratio_desktop?: StoryAspectDesktop;
  card_radius?: number | string;
  /** Optional max-width (px) for the slider on huge monitors. */
  max_width?: number | string;
  /** Stretch the slider edge-to-edge (no horizontal padding, no max-width cap, no radius). */
  full_width?: boolean;

  // --- Transition + speed ---
  transition?: StoryTransition;
  transition_speed?: StoryTransitionSpeed;

  // --- Content overlay ---
  content_position?: StoryContentPosition;
  text_theme?: StoryTextTheme;

  // --- Pagination (the user's signature feature) ---
  pagination_style?: StoryPaginationStyle;
  pagination_position?: StoryPaginationPosition;
  /** Custom separator for the fraction style (defaults to a thin slash). */
  pagination_separator?: string;

  // --- Arrows ---
  arrow_style?: StoryArrowStyle;
  arrow_position?: StoryArrowPosition;
  show_arrows?: boolean;
  /** Top-of-frame autoplay progress indicator — fills with each slide's countdown. */
  autoplay_progress?: StoryAutoplayProgress;

  // --- Carousel behaviour ---
  loop?: boolean;
  autoplay?: boolean;
  autoplay_delay?: number | string; // seconds
  /** Pause autoplay while the visitor interacts (hover or touch); resume on leave. */
  pause_on_interaction?: boolean;
  pause_out_of_view?: boolean;
  enable_drag?: boolean;
  enable_keyboard?: boolean;
  initial_slide?: number | string;

  // --- Default CTA fallback when a slide doesn't override ---
  default_cta_label?: MaybeMultiLang;

  // --- Overlay scrim ---
  overlay_style?: StoryOverlayStyle;
  overlay_intensity?: StoryOverlayIntensity;

  // --- Premium polish toggles ---
  enable_idle_ken_burns?: boolean; // subtle slow zoom on the active slide
  enable_entrance_anim?: boolean; // header fade & first-slide reveal

  // --- Colors ---
  bg_color?: string;
  title_color?: string; // section title
  subtitle_color?: string; // section subtitle
  slide_title_color?: string;
  slide_text_color?: string;
  arrow_bg?: string;
  arrow_icon_color?: string;
  pagination_color?: string;
  pagination_active_color?: string;
  cta_bg?: string;
  cta_color?: string;
  badge_bg?: string;
  badge_color?: string;
}
