/**
 * Growth Kit — Featured Product (المنتج المميز)
 * Type definitions for the Featured Product component configuration.
 *
 * A cinematic single-product spotlight. Two data sources:
 *   • store  → pick a real product (auto-fills name/image/price/url, enables add-to-cart)
 *   • manual → merchant types everything by hand (great for crafted landing sections)
 *
 * All fields are optional; the component applies premium, layout-aware defaults.
 */

/** Value coming back from a Salla `multilanguage: true` field. */
export type MaybeMultiLang =
  | string
  | { ar?: string; en?: string }
  | null
  | undefined;

/** Card max-width tier. */
export type FeaturedCardSize = "compact" | "medium" | "large" | "full";

/** Desktop card-size override; "inherit" reuses the mobile size. */
export type FeaturedCardSizeDesktop = FeaturedCardSize | "inherit";

/** Text/content alignment within the details column. */
export type FeaturedContentAlign = "right" | "center" | "left";

/** What fills the section background behind the card. */
export type FeaturedBgType = "color" | "image" | "video";

/**
 * How the product image relates to the card (the merchant-facing
 * "طريقة عرض صورة المنتج"):
 *   • inside     → image sits inside the card, content below (classic).
 *   • floating   → image floats above the card's top edge with a shadow.
 *   • split      → image on one side, details on the other (side-by-side on desktop).
 *   • background → image fills the card; content overlays a scrim (cinematic).
 */
export type FeaturedImageLayout =
  | "inside"
  | "floating"
  | "split"
  | "background";

/** Which side the image sits on in the split layout (auto-mirrors in RTL). */
export type FeaturedImageSide = "start" | "end";

/** How the image fills its frame. */
export type FeaturedImageFit = "contain" | "cover";

/** Border-radius style of the primary button. */
export type FeaturedButtonRadius = "square" | "soft" | "rounded" | "pill";

export type FeaturedAspect = "1/1" | "4/3" | "3/4" | "16/9" | "9/16";

/** Decorative shape rendered behind the product image. */
export type FeaturedBgEffect = "none" | "circle" | "glow" | "pattern" | "blob";

/** Visual treatment of the card container. */
export type FeaturedCardStyle = "minimal" | "soft" | "glass" | "bold";

/** What the primary button does (store source only). */
export type FeaturedButtonAction = "add_to_cart" | "buy_now" | "view_product";

/** One short selling point under the product name (max 3). */
export interface FeaturedHighlight {
  text?: MaybeMultiLang;
}

/** Raw Salla product-picker payload — parsed defensively at the call site. */
export type RawProductPick = unknown;

export interface FeaturedProductConfig {
  // --- Section-level (renders outside / above the card) ---
  section_title?: MaybeMultiLang;

  // --- Product (always optional; data auto-fills, overrides win field-by-field) ---
  product?: RawProductPick;

  // --- Content (overrides; when a product is linked these fall back to it) ---
  image?: string; // empty → product image when linked
  image_hover?: string; // optional second image, cross-faded on hover (desktop)
  eyebrow?: MaybeMultiLang; // small label above the title
  title?: MaybeMultiLang; // empty → product name (store mode)
  description?: MaybeMultiLang; // short paragraph under the title
  highlights?: FeaturedHighlight[]; // up to 3 bullet features

  // --- Image display ---
  image_layout?: FeaturedImageLayout;
  image_side?: FeaturedImageSide; // split layout only
  aspect_ratio?: FeaturedAspect;
  image_fit?: FeaturedImageFit;

  // --- Background effect (behind the product image) ---
  bg_effect?: FeaturedBgEffect;
  bg_effect_color?: string;

  // --- Card ---
  card_style?: FeaturedCardStyle;
  card_radius?: number | string;

  // --- Pricing / offer ---
  show_price?: boolean;
  show_sale_price?: boolean; // strike-through original + sale price
  price?: string; // override — current price; falls back to linked product
  compare_price?: string; // override — original price (struck through)
  free_shipping_text?: MaybeMultiLang;

  // --- Primary button ---
  show_button?: boolean;
  button_radius?: FeaturedButtonRadius;
  button_action?: FeaturedButtonAction;
  button_label?: MaybeMultiLang; // empty → sensible default per action
  button_url?: string; // used for view_product or when no product is linked

  // --- Card size & content alignment ---
  card_size_mobile?: FeaturedCardSize; // base card width (mobile, primary)
  card_size_desktop?: FeaturedCardSizeDesktop; // desktop override; "inherit" → same as mobile
  content_align?: FeaturedContentAlign;

  // --- Section background ---
  bg_type?: FeaturedBgType;
  bg_image?: string;
  bg_video?: string;

  // --- Highlights wrapper ---
  highlights_bg?: string;

  // --- Colors ---
  bg_color?: string;
  card_bg?: string;
  eyebrow_color?: string;
  title_color?: string;
  text_color?: string;
  price_color?: string;
  compare_color?: string;
  badge_bg?: string;
  badge_color?: string;
  highlight_color?: string; // bullet check icon
  button_bg?: string;
  button_color?: string;
  shipping_color?: string;

  // --- Motion ---
  enable_entrance_anim?: boolean;
  enable_float_anim?: boolean; // gentle bob of the product image
  enable_tilt?: boolean; // 3D tilt on pointer move (desktop)
  enable_hover_image?: boolean; // cross-fade to a second image on hover
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
