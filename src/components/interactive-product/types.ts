/**
 * Growth Kit — Interactive Product (المنتج التفاعلي)
 * Type definitions for the Interactive Product component configuration.
 *
 * A large product image overlaid with numbered, interactive hotspots. Selecting
 * a hotspot (or one of the numbered nav pills) updates a side detail card with
 * that feature's image, title and description.
 *
 * Hotspot positions are stored as plain percentages relative to the IMAGE box
 * (x = from the left edge, y = from the top edge) so they line up with the photo
 * itself and never flip with RTL text direction.
 *
 * All fields are optional; the component applies premium, RTL-first defaults.
 */

/** Value coming back from a Salla `multilanguage: true` field. */
export type MaybeMultiLang =
  | string
  | { ar?: string; en?: string }
  | null
  | undefined;

/** Base colour palette preset. Individual colour overrides always win. */
export type InteractiveTheme = "light" | "dark";

/** Diameter tier for the numbered markers placed on the image. */
export type HotspotSize = "small" | "medium" | "large";

/** Aspect ratio of the image inside the detail card. */
export type DetailImageAspect = "16/9" | "4/3" | "1/1" | "3/4" | "natural";

/** Auto-cycle cadence (seconds) when autoplay is enabled. */
export type AutoplayDelay = "3" | "5" | "7";

/** A single interactive marker + the feature it reveals. */
export interface Hotspot {
  /** Feature image shown in the detail card when this hotspot is active. */
  image?: string;
  /** Feature title shown in the detail card. */
  title?: MaybeMultiLang;
  /** Feature description shown in the detail card. */
  description?: MaybeMultiLang;
  /** Horizontal position as a percentage of the image width (0 = left, 100 = right). */
  x?: number | string;
  /** Vertical position as a percentage of the image height (0 = top, 100 = bottom). */
  y?: number | string;
}

export interface InteractiveProductConfig {
  // --- Header ---
  eyebrow?: MaybeMultiLang;
  section_title?: MaybeMultiLang;
  section_subtitle?: MaybeMultiLang;

  // --- Image + hotspots ---
  product_image?: string;
  hotspots?: Hotspot[];

  // --- Layout / display ---
  reverse_layout?: boolean; // swap image / details columns on desktop
  hotspot_size?: HotspotSize;
  enable_pulse?: boolean; // pulsing ring around idle markers
  show_pills?: boolean; // numbered nav pills inside the detail card
  detail_image_aspect?: DetailImageAspect;
  autoplay?: boolean; // auto-advance through hotspots
  autoplay_delay?: AutoplayDelay;

  // --- Motion ---
  enable_entrance_anim?: boolean;

  // --- Colours ---
  theme?: InteractiveTheme;
  bg_color?: string;
  title_color?: string;
  subtitle_color?: string;
  accent_color?: string; // markers, pills, active states, title underline
  card_bg?: string;
  card_title_color?: string;
  card_text_color?: string;
  marker_bg?: string; // idle marker fill
}
