/**
 * Growth Kit — Collection (مكونات المجموعة)
 * Type definitions for the Collection component configuration.
 */

export type MaybeMultiLang =
  | string
  | { ar?: string; en?: string }
  | null
  | undefined;

/**
 * Two distinct surfaces this component supports:
 *   • home   → curated collection on the storefront home (CTA links to product)
 *   • bundle → "what's inside this kit" on a product page (info-only, no CTA)
 */
export type CollectionUseCase = "home" | "bundle";

/**
 * Visual behaviour of each slide:
 *   • simple → active slide scales up & saturates (mirrors 360.html)
 *   • reveal → swap a "closed" image for an "opened" one on the active slide
 *              (mirrors daily.html — great for packaging → contents reveals)
 */
export type CollectionAnimation = "simple" | "reveal";

export type CollectionAspect = "1/1" | "4/3" | "3/4" | "16/9" | "9/16";
export type CollectionDesktopLayout = "coverflow" | "single";

/** Raw Salla product picker payload — parsed defensively at the call site. */
export type RawProductPick = unknown;

export interface CollectionSlideItem {
  /** Primary image. In `reveal` mode this is the "closed" state. */
  image?: string;
  /** Second image — only used in `reveal` mode for the "opened" state. */
  image_opened?: string;
  /** Slide title — shown under the carousel, synced with the active slide. */
  title?: MaybeMultiLang;
  /** Slide description — shown under the carousel, synced with active slide. */
  description?: MaybeMultiLang;
  /**
   * Linked product (home mode). When set, the CTA falls back to the product's
   * storefront URL and the slide image falls back to the product image if
   * the merchant didn't upload one.
   */
  product?: RawProductPick;
  /** Optional CTA URL override (takes precedence over linked product URL). */
  cta_url?: string;
  /** Optional per-slide CTA label override. */
  cta_label?: MaybeMultiLang;
}

export interface CollectionConfig {
  // --- Mode ---
  use_case?: CollectionUseCase;

  // --- Section header (title only — no subtitle) ---
  // NB: distinct id from the per-slide `title` (CollectionSlideItem.title) so
  // the two don't collide inside the Salla form builder.
  section_title?: MaybeMultiLang;
  /** @deprecated old id — kept for configs saved before the rename. */
  title?: MaybeMultiLang;

  // --- Slides ---
  slides?: CollectionSlideItem[];

  // --- Visual behaviour ---
  slide_animation?: CollectionAnimation;
  aspect_ratio?: CollectionAspect;
  desktop_layout?: CollectionDesktopLayout;
  card_radius?: number | string;

  // --- Caption block (per-slide title + description, under the carousel) ---
  show_caption?: boolean;

  // --- CTA (home mode only) ---
  show_cta?: boolean;
  default_cta_label?: MaybeMultiLang;

  // --- Carousel behaviour ---
  show_nav_buttons?: boolean;
  show_pagination?: boolean;
  loop?: boolean;
  autoplay?: boolean;
  autoplay_delay?: number | string;
  initial_slide?: number | string;

  // --- Styling ---
  bg_color?: string;
  title_color?: string;
  caption_title_color?: string;
  caption_text_color?: string;
  cta_bg?: string;
  cta_color?: string;
  nav_bg?: string;
  nav_icon_color?: string;
  dot_color?: string;

  // --- Motion ---
  enable_entrance_anim?: boolean;
}
