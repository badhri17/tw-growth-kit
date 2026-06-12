/**
 * Growth Kit — Lifestyle Gallery (معرض لايف ستايل)
 * Type definitions for the Lifestyle Gallery component configuration.
 */

export type MaybeMultiLang =
  | string
  | { ar?: string; en?: string }
  | null
  | undefined;

/** Raw Salla product picker payload — parsed defensively at the call site. */
export type RawProductPick = unknown;

export type GalleryHeightMobile = "340" | "420" | "500";
export type GalleryHeightDesktop = "inherit" | "380" | "460" | "540";
export type GalleryDesktopSlides = "2" | "3";
export type GalleryRadius = "0" | "14" | "24" | "32";

export interface GallerySlideItem {
  /** Slide image. Falls back to the linked product's image when omitted. */
  image?: string;
  /** Name shown on the overlay. Falls back to the linked product's name. */
  title?: MaybeMultiLang;
  /**
   * Linked product. When set, the CTA falls back to the product's storefront
   * URL and the image/name fall back to the product's own.
   */
  product?: RawProductPick;
  /** Optional CTA URL override (takes precedence over linked product URL). */
  cta_url?: string;
  /** Optional per-slide CTA label override. */
  cta_label?: MaybeMultiLang;
}

export interface GalleryConfig {
  // --- Section header ---
  section_title?: MaybeMultiLang;
  /** Optional extra line rendered above the title (e.g. a Latin tagline). */
  section_pretitle?: MaybeMultiLang;

  // --- Slides ---
  slides?: GallerySlideItem[];

  // --- Display ---
  height_mobile?: GalleryHeightMobile;
  card_radius?: GalleryRadius;
  show_overlay?: boolean;
  default_cta_label?: MaybeMultiLang;

  // --- Carousel behaviour ---
  loop?: boolean;
  autoplay?: boolean;
  autoplay_delay?: number | string;
  show_nav_buttons?: boolean;

  // --- Desktop (optional overrides; mobile is the primary value) ---
  height_desktop?: GalleryHeightDesktop;
  desktop_slides?: GalleryDesktopSlides;

  // --- Styling ---
  bg_color?: string;
  title_color?: string;
  overlay_text_color?: string;

  // --- Motion ---
  enable_entrance_anim?: boolean;
}
