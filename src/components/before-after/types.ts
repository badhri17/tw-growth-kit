/**
 * Growth Kit — Before & After (سلايدر قبل وبعد)
 * Type definitions for the Before & After component configuration.
 * All fields optional; smart defaults applied in the component.
 */

export type MaybeMultiLang = string | { ar?: string; en?: string } | null | undefined;

export type BeforeAfterAspect = "1/1" | "4/3" | "16/9" | "3/4" | "9/16";
export type BeforeAfterDesktopLayout = "coverflow" | "single";

/**
 * Raw shape from a Salla `source: "products"` picker. Salla resolves this
 * into an array of picked products (one per selection), but the exact field
 * names vary by surface — we parse defensively at the call site.
 */
export type RawProductPick = unknown;

export interface BeforeAfterSlideItem {
  before_image?: string;
  after_image?: string;
  caption?: MaybeMultiLang;
  /** Salla product picker value — array of resolved product objects (length 0 or 1). */
  product?: RawProductPick;
}

export interface BeforeAfterConfig {
  // --- Section header ---
  title?: MaybeMultiLang;
  subtitle?: MaybeMultiLang;

  // --- Slides ---
  slides?: BeforeAfterSlideItem[];

  // --- Labels (global defaults) ---
  show_labels?: boolean;
  label_before?: MaybeMultiLang;
  label_after?: MaybeMultiLang;

  // --- Layout ---
  aspect_ratio?: BeforeAfterAspect;
  desktop_layout?: BeforeAfterDesktopLayout;
  initial_position?: number | string;     // 0–100 (start of the divider)
  reverse_direction?: boolean;            // mirror: after on the right, before on the left
  card_radius?: number | string;          // px

  // --- Carousel behaviour ---
  show_nav_buttons?: boolean;
  show_pagination?: boolean;
  autoplay?: boolean;
  autoplay_delay?: number | string;       // seconds
  loop?: boolean;
  initial_slide?: number | string;        // 1-indexed for merchants; clamped in code

  // --- Styling ---
  bg_color?: string;
  title_color?: string;
  text_color?: string;
  handle_bg?: string;
  handle_icon_color?: string;
  line_color?: string;
  label_bg?: string;
  label_text_color?: string;
  nav_bg?: string;
  nav_icon_color?: string;
  /** Background of the product chip overlay. */
  product_chip_bg?: string;
  /** Text colour inside the product chip. */
  product_chip_color?: string;

  // --- Motion ---
  enable_entrance_anim?: boolean;
}
