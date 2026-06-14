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
 *   • home   → curated collection on the storefront home (CTA links anywhere)
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

/**
 * Overall presentation of the section:
 *   • carousel → the classic horizontal coverflow (default).
 *   • bag      → "وضع الشنطة": products rise out of / sink into a
 *                merchant-uploaded bag image on a vertical stage.
 */
export type CollectionDisplayMode = "carousel" | "bag";
export type CollectionBagSize = "small" | "medium" | "large";

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
   * CTA target (home mode) — Salla `variable-list` link picker. Points the
   * button at a product / category / page / brand / blog article / offers page
   * / external URL; resolved to a final URL string by the platform.
   */
  link?: RawLinkValue;
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

  // --- Display mode ---
  display_mode?: CollectionDisplayMode;

  // --- Bag mode (وضع الشنطة) ---
  /** Bag/box image the products appear to rise out of. Transparent bg works best. */
  bag_image?: string;
  bag_size?: CollectionBagSize;
  /** Product size, independent of the bag so merchants can tune the ratio. */
  bag_product_size?: CollectionBagSize;
  /** Color of the half-dome + fog backdrop behind the products. */
  bag_circle_color?: string;
  /** Optional closing line rendered under the stage. */
  bag_bottom_title?: MaybeMultiLang;

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
