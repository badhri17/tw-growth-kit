/**
 * Growth Kit — 3D Product Cards (بطاقات المنتجات ٣D)
 * Type definitions for the Product Cards component configuration.
 *
 * A premium 3D coverflow carousel where every slide is a full product card
 * (à la Featured Product): the active card sits centered at full size while its
 * neighbours shrink and recede behind it with reduced opacity.
 *
 * Each card resolves its content per-card — link a real store product
 * (auto-fills name / image / price / url and enables add-to-cart) or override
 * any field by hand. Visual styling (card style, colours, button, image
 * treatment) is configured ONCE at the section level so every card stays
 * consistent — RTL-first and mobile-first throughout.
 */

/** Value coming back from a Salla `multilanguage: true` field. */
export type MaybeMultiLang =
  | string
  | { ar?: string; en?: string }
  | null
  | undefined;

/**
 * How the product image relates to the card (global) — mirrors Featured
 * Product's "طريقة عرض المنتج" minus "split"/"floating", which don't suit a
 * coverflow of compact cards:
 *   • inside     → image in a framed box at the card top, details below.
 *   • background → image fills the card; details overlay a gradient scrim.
 */
export type PcImageLayout = "inside" | "background";

/** Product image aspect ratio inside the card. */
export type PcAspect = "1/1" | "4/3" | "3/4" | "16/9" | "9/16";

/** How the product image fills its frame. */
export type PcImageFit = "contain" | "cover";

/** Text/content alignment within the card body. */
export type PcContentAlign = "right" | "center" | "left";

/** Card width tier (mobile is primary; desktop can inherit or override). */
export type PcCardSize = "compact" | "medium" | "large";
export type PcCardSizeDesktop = PcCardSize | "inherit";

/** Border-radius style of the primary button. */
export type PcButtonRadius = "square" | "soft" | "rounded" | "pill";

/** What the primary button does (store source only; degrades to a link). */
export type PcButtonAction = "add_to_cart" | "buy_now" | "view_product";

/** Where the prev/next controls render. */
export type PcNavPosition = "sides" | "top";

/** Raw Salla product-picker payload — parsed defensively at the call site. */
export type RawProductPick = unknown;

/**
 * Value from a Salla `variable-list` link field. The platform resolves the
 * picked target (product / category / page / brand / blog / external URL) to a
 * final URL string; we type it loosely because it may arrive as a bare string,
 * a `{ url | value }` object, or a single-item array wrapping either.
 */
export type RawLinkValue =
  | string
  | { url?: string; value?: string; label?: string }
  | Array<string | { url?: string; value?: string; label?: string }>
  | null
  | undefined;

/**
 * One card in the carousel. Every field is optional: link a product and the
 * data auto-fills, or type overrides field-by-field (an override always wins).
 */
export interface PcCardItem {
  /** Link a real store product (auto-fills name/image/price/url + add-to-cart). */
  product?: RawProductPick;
  /** Image override — empty falls back to the linked product's image. */
  image?: string;
  /** Corner ribbon/pill text, e.g. "جديد" / "الأكثر مبيعًا". No product fallback. */
  badge?: MaybeMultiLang;
  /** Title override — empty falls back to the linked product's name. */
  title?: MaybeMultiLang;
  /** Short description under the title (override only — no product fallback). */
  description?: MaybeMultiLang;
  /** Current price override — falls back to the linked product's price. */
  price?: string;
  /** Original (struck-through) price override — falls back to product. */
  compare_price?: string;
  /**
   * Button target (variable-list picker). Used for the "view product" action,
   * or when no store product is linked. Resolved to a URL by the platform.
   */
  link?: RawLinkValue;
  /** Per-card button label override — empty uses the global default label. */
  button_label?: MaybeMultiLang;
}

export interface ProductCardsConfig {
  // --- Section header ---
  section_title?: MaybeMultiLang;
  section_subtitle?: MaybeMultiLang;

  // --- Cards (repeatable) ---
  cards?: PcCardItem[];

  // --- Product display (global, applies to every card) ---
  image_layout?: PcImageLayout;
  card_radius?: number | string;
  card_size_mobile?: PcCardSize;
  card_size_desktop?: PcCardSizeDesktop;
  aspect_ratio?: PcAspect;
  image_fit?: PcImageFit;
  content_align?: PcContentAlign;

  // --- Pricing ---
  show_price?: boolean;
  show_sale_price?: boolean;
  /** Free-shipping/returns line shown on every card. Empty hides it. */
  free_shipping_text?: MaybeMultiLang;

  // --- Primary button (global) ---
  show_button?: boolean;
  button_radius?: PcButtonRadius;
  button_action?: PcButtonAction;
  default_button_label?: MaybeMultiLang;

  // --- Carousel behaviour ---
  show_nav_buttons?: boolean;
  nav_position?: PcNavPosition;
  show_pagination?: boolean;
  loop?: boolean;
  autoplay?: boolean;
  autoplay_delay?: number | string;
  initial_slide?: number | string;

  // --- Colours ---
  /** Theme accent — drives price/button/badge/underline defaults. */
  accent_color?: string;
  bg_color?: string;
  card_bg?: string;
  title_color?: string;
  text_color?: string;
  price_color?: string;
  compare_color?: string;
  badge_bg?: string;
  badge_color?: string;
  button_bg?: string;
  button_color?: string;
  shipping_color?: string;

  // --- Motion ---
  enable_entrance_anim?: boolean;
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
