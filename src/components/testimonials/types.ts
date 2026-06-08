/**
 * Growth Kit — Testimonials (آراء العملاء)
 * Type definitions for the Testimonials component configuration.
 *
 * A premium, heavily-configurable social-proof wall. Each testimonial can link a
 * real store product (auto-fills name/image/price/url) so the review doubles as a
 * shoppable card — the signature feature of this component.
 *
 * All fields are optional; the component applies premium, layout-aware defaults.
 */

/** Value coming back from a Salla `multilanguage: true` field. */
export type MaybeMultiLang =
  | string
  | { ar?: string; en?: string }
  | null
  | undefined;

/** Raw Salla product-picker payload — parsed defensively at the call site. */
export type RawProductPick = unknown;

/** How the testimonials are arranged on the page. */
export type TestimonialsLayout = "marquee" | "carousel" | "grid" | "masonry";

/** Visual treatment / shape of each testimonial card. */
export type TestimonialCardStyle =
  | "modern" // photo-led card with a name chip overlaid on the image (reference design)
  | "quote" // large quotation mark, text-forward
  | "bubble" // chat speech-bubble with a tail, author sits below
  | "minimal" // clean hairline-bordered card, no elevation
  | "glass"; // translucent, blurred surface

/** Column count tiers (also used as "cards per view" for the carousel). */
export type TestimonialsColumns = "1" | "2" | "3" | "4";
export type TestimonialsColumnsDesktop = TestimonialsColumns | "inherit";

/** How the rating is presented. */
export type TestimonialRatingStyle = "stars" | "stars-number" | "number";

/** Product chip presentation under the review. */
export type TestimonialChipStyle = "card" | "inline";

/** Marquee tuning. */
export type TestimonialMarqueeRows = "1" | "2";
export type TestimonialMarqueeSpeed = "slow" | "normal" | "fast";
export type TestimonialMarqueeDirection = "forward" | "backward";

/** Carousel autoplay cadence (seconds). */
export type TestimonialAutoplayDelay = "3" | "5" | "7" | "10";

/** Card image aspect ratio (the large photo in photo-led styles). */
export type TestimonialPhotoAspect = "1/1" | "4/3" | "3/4" | "4/5" | "16/9";

/** Card corner roundness in px (resolved as a number). */
export type TestimonialCardRadius = string | number;

/** One testimonial entry. */
export interface TestimonialItem {
  // --- Author ---
  name?: MaybeMultiLang; // e.g. "تايلور" / "Taylor"
  meta?: MaybeMultiLang; // e.g. "33" or "الرياض" — rendered as "Name · meta"
  avatar?: string; // small round portrait (quote/minimal/glass styles)
  photo?: string; // large hero photo (modern/polaroid styles)

  // --- Review ---
  rating?: number | string; // 0–5, supports fractions (e.g. 4.9)
  quote?: MaybeMultiLang; // the testimonial body

  // --- Linked product (the shoppable chip) ---
  product?: RawProductPick; // pick a real store product
  product_name?: MaybeMultiLang; // manual override of the chip name
  product_image?: string; // manual override of the chip image
  product_price?: string; // manual override — current price
  product_compare?: string; // manual override — original price (struck)
  product_url?: string; // manual override / custom link target
}

export interface TestimonialsConfig {
  // --- Header ---
  eyebrow?: MaybeMultiLang;
  section_title?: MaybeMultiLang;
  section_subtitle?: MaybeMultiLang;

  // --- Aggregate summary (optional rating headline) ---
  show_summary?: boolean;
  summary_rating?: number | string; // e.g. 4.9
  summary_count_text?: MaybeMultiLang; // e.g. "بناءً على ٢٬٣٠٠ تقييم"

  // --- Items ---
  items?: TestimonialItem[];

  // --- Layout ---
  layout?: TestimonialsLayout;
  columns_mobile?: TestimonialsColumns; // grid/masonry cols + carousel cards-per-view
  columns_desktop?: TestimonialsColumnsDesktop; // "inherit" → reuse mobile
  card_style?: TestimonialCardStyle;
  card_radius?: TestimonialCardRadius;
  photo_aspect?: TestimonialPhotoAspect;

  // --- Element toggles ---
  show_rating?: boolean;
  rating_style?: TestimonialRatingStyle;
  show_avatar?: boolean;
  show_photo?: boolean; // large photo on photo-led styles
  show_quote_mark?: boolean;
  show_product?: boolean; // the shoppable product chip
  chip_style?: TestimonialChipStyle;

  // --- Marquee ---
  marquee_rows?: TestimonialMarqueeRows;
  marquee_speed?: TestimonialMarqueeSpeed;
  marquee_direction?: TestimonialMarqueeDirection;
  marquee_pause_hover?: boolean;

  // --- Carousel ---
  carousel_autoplay?: boolean;
  carousel_autoplay_delay?: TestimonialAutoplayDelay;
  carousel_arrows?: boolean;
  carousel_dots?: boolean;
  carousel_loop?: boolean;

  // --- Motion ---
  enable_entrance_anim?: boolean;
  enable_hover_lift?: boolean;

  // --- Colors ---
  bg_color?: string;
  title_color?: string;
  subtitle_color?: string;
  card_bg?: string;
  border_color?: string;
  name_color?: string;
  meta_color?: string;
  text_color?: string;
  star_color?: string;
  star_empty_color?: string;
  accent_color?: string; // quote marks, eyebrow, dots, arrows
  chip_bg?: string;
  chip_name_color?: string;
  chip_price_color?: string;
  chip_compare_color?: string;
}

/** Product shape after we fetch full details from the Salla SDK. */
export interface ResolvedProduct {
  name: string;
  image?: string;
  imageAlt?: string;
  url: string;
  /** Original (pre-discount) price as a number, when resolvable. */
  regular?: number;
  /** Current selling price when on sale. */
  sale?: number;
  onSale: boolean;
  /** Currency code, when the payload exposed it. */
  currency?: string;
}
