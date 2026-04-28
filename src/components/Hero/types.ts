/**
 * Growth Kit — Store Hero
 * Type definitions for the Hero component configuration.
 * All fields are optional except `headline`; smart defaults are applied in the component.
 */

export type HeroHeight = "full" | "large" | "medium" | "compact";
export type HeroAlignH = "start" | "center" | "end";
export type HeroAlignV = "top" | "middle" | "bottom";
export type HeroOverlayStyle = "none" | "dark-bottom" | "dark-full" | "light-full" | "vignette";
export type HeroOverlayIntensity = "subtle" | "medium" | "strong";
export type HeroTextTheme = "light" | "dark";

/** Value coming back from a Salla `multilanguage: true` field. */
export type MaybeMultiLang = string | { ar?: string; en?: string } | null | undefined;

export interface HeroConfig {
  // --- Background media ---
  video_url?: string;          // mp4/webm URL
  poster_image?: string;        // shown until video plays / on fallback
  background_image?: string;    // used when no video is set
  gradient_from?: string;       // fallback gradient start color
  gradient_to?: string;         // fallback gradient end color
  gradient_angle?: number;      // 0–360, default 135

  // --- Overlay ---
  overlay_style?: HeroOverlayStyle;
  overlay_intensity?: HeroOverlayIntensity;

  // --- Content ---
  eyebrow?: MaybeMultiLang;      // small text above headline
  headline?: MaybeMultiLang;     // required in practice
  subtitle?: MaybeMultiLang;     // paragraph below headline

  // --- CTAs ---
  primary_label?: MaybeMultiLang;
  primary_url?: string;
  primary_outline?: boolean;     // default false → filled

  secondary_label?: MaybeMultiLang;
  secondary_url?: string;
  secondary_outline?: boolean;   // default true → outline

  // --- Layout ---
  height?: HeroHeight;
  align_h?: HeroAlignH;
  align_v?: HeroAlignV;
  text_theme?: HeroTextTheme;
  content_max_width?: number;    // px cap for the inner content block

  // --- Video behaviour ---
  video_autoplay?: boolean;
  video_loop?: boolean;
  video_muted?: boolean;
  poster_on_mobile?: boolean;    // show poster instead of video on mobile

  // --- Motion ---
  enable_entrance_anim?: boolean;
  enable_ken_burns?: boolean;    // slow zoom on image
  enable_parallax?: boolean;     // subtle scroll parallax
}