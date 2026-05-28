/**
 * Growth Kit — Store Hero
 * Type definitions for the Hero component configuration.
 * All fields are optional except `headline`; smart defaults are applied in the component.
 */

export type HeroHeight = "full" | "large" | "medium" | "compact";
export type HeroHeightDesktop = HeroHeight | "inherit";
export type HeroAlignH = "start" | "center" | "end";
export type HeroAlignV = "top" | "middle" | "bottom";
export type HeroOverlayStyle = "none" | "dark-bottom" | "dark-full" | "light-full" | "vignette";
export type HeroOverlayIntensity = "subtle" | "medium" | "strong";
export type HeroTextTheme = "light" | "dark";
export type HeroGradientType = "linear" | "radial" | "radial-corner" | "conic";

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

  // --- Gradient fallback ---
  gradient_from?: string;
  gradient_to?: string;
  gradient_angle?: number;      // 0–360, default 135
  gradient_type?: HeroGradientType;

  // --- Overlay ---
  overlay_style?: HeroOverlayStyle;
  overlay_intensity?: HeroOverlayIntensity;

  // --- Content ---
  eyebrow?: MaybeMultiLang;      // small text above headline
  headline?: MaybeMultiLang;     // required in practice
  subtitle?: MaybeMultiLang;     // paragraph below headline

  // --- CTA ---
  primary_label?: MaybeMultiLang;
  primary_url?: string;
  primary_outline?: boolean;     // default false → filled

  // --- Trust points (up to 3 short reassurance lines under the CTA) ---
  trust_points?: TrustPoint[];

  // --- Layout ---
  height_mobile?: HeroHeight;
  height_desktop?: HeroHeightDesktop;  // "inherit" → use height_mobile on desktop too
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
