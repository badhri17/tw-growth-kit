/**
 * Growth Kit — Store Hero
 * Type definitions for the Hero component configuration.
 * All fields are optional except `headline`; smart defaults are applied in the component.
 */

export type HeroHeight = "full" | "large" | "medium" | "compact";
export type HeroHeightDesktop = HeroHeight | "inherit";
/** Desktop layout mode: full-bleed background (default) or a split media/content panel. */
export type HeroDesktopLayout = "background" | "split";
/** In split mode, which side the media (image/video/gradient) sits on (desktop, physical). */
export type HeroSplitSide = "left" | "right";
/** In split mode, how the two columns share the width. */
export type HeroSplitRatio = "equal" | "media" | "content";
export type HeroAlignH = "start" | "center" | "end";
export type HeroAlignV = "top" | "middle" | "bottom";
export type HeroOverlayStyle = "none" | "dark-bottom" | "dark-full" | "light-full" | "vignette";
export type HeroOverlayIntensity = "subtle" | "medium" | "strong";
export type HeroTextTheme = "light" | "dark";
export type HeroGradientType = "linear" | "radial" | "radial-corner" | "conic";
/** Background fill when no image/video: a single solid colour or a two-stop gradient. */
export type HeroBgFill = "solid" | "gradient";

/** Value coming back from a Salla `multilanguage: true` field. */
export type MaybeMultiLang = string | { ar?: string; en?: string } | null | undefined;

/** One entry in the `trust_points` collection — a short reassurance line with a check icon. */
export interface TrustPoint {
  text?: MaybeMultiLang;
}

export interface HeroConfig {
  // --- Background media (mobile / default) ---
  video_url?: string;
  background_image?: string;

  // --- Background media (desktop override, ≥768 px) ---
  video_url_desktop?: string;
  background_image_desktop?: string;

  // --- Background colour (fallback when no image/video) ---
  bg_fill_type?: HeroBgFill;    // "solid" (default) | "gradient"
  gradient_from?: string;       // the colour (solid) / the start stop (gradient)
  gradient_to?: string;         // the end stop, only used in gradient mode
  gradient_angle?: number;      // 0–360, default 135
  gradient_type?: HeroGradientType;

  // --- Overlay ---
  overlay_style?: HeroOverlayStyle;
  overlay_intensity?: HeroOverlayIntensity;

  // --- Content ---
  eyebrow?: MaybeMultiLang;      // small text above headline
  headline?: MaybeMultiLang;     // required in practice
  subtitle?: MaybeMultiLang;     // paragraph below headline

  // --- Custom content colours (when enabled, override text_theme per element) ---
  enable_custom_colors?: boolean;  // off → follow text_theme; on → use the colours below
  title_color?: string;            // headline
  eyebrow_color?: string;          // eyebrow
  subtitle_color?: string;         // subtitle + trust points
  button_bg_color?: string;        // filled CTA background
  button_text_color?: string;      // CTA text/border

  // --- CTA ---
  primary_label?: MaybeMultiLang;
  primary_url?: string;
  primary_outline?: boolean;     // default false → filled

  // --- Trust points (up to 3 short reassurance lines under the CTA) ---
  trust_points?: TrustPoint[];

  // --- Layout ---
  height_mobile?: HeroHeight;
  height_desktop?: HeroHeightDesktop;  // "inherit" → use height_mobile on desktop too

  // --- Desktop layout (≥768 px only; mobile always stays full background) ---
  desktop_layout?: HeroDesktopLayout;  // "background" (default) | "split"
  split_media_side?: HeroSplitSide;    // which side the media sits on in split mode
  split_ratio?: HeroSplitRatio;        // column width distribution in split mode
  split_content_bg?: string;           // optional bg colour of the content panel

  align_h?: HeroAlignH;
  align_v?: HeroAlignV;
  text_theme?: HeroTextTheme;
  content_max_width?: number;    // px cap for the inner content block

  // --- Video behaviour ---
  video_autoplay?: boolean;
  video_loop?: boolean;
  video_muted?: boolean;

  // --- Smart connection-aware fallback (default ON when undefined) ---
  smart_data_saver?: boolean;

  // --- Motion ---
  enable_entrance_anim?: boolean;
  enable_ken_burns?: boolean;    // slow zoom on image
  enable_parallax?: boolean;     // subtle scroll parallax
}
