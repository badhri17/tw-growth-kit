/**
 * Growth Kit — Interactive Text (النص التفاعلي)
 * Type definitions for the Interactive Text component configuration.
 *
 * A premium animated text section: eyebrow + title (with optional highlighted
 * words) + subtitle + paragraph + optional CTA button. The merchant picks one
 * of several entrance animations (fade / slide / curtain reveal / typewriter /
 * word-by-word / line-by-line) that plays once when the section scrolls into
 * view.
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
export type TextTheme = "light" | "dark";

/** Entrance animation played once when the section enters the viewport. */
export type AnimationStyle =
  | "none"
  | "fade"
  | "slide"
  | "reveal"
  | "typing"
  | "words"
  | "lines";

/** Global speed multiplier applied to every duration / stagger / typing tick. */
export type AnimationSpeed = "slow" | "normal" | "fast";

/** Where slide-mode blocks enter from. start/end follow the writing direction. */
export type EnterDirection = "up" | "down" | "start" | "end";

/** Text alignment of the whole section (logical: start = right in Arabic). */
export type TextAlign = "start" | "center" | "end";

/** Font-size tier. Mobile value is primary; desktop may inherit it. */
export type TextSize = "small" | "medium" | "large";
export type TextSizeDesktop = "inherit" | TextSize;

/** Max-width tier of the inner content column. */
export type ContentWidth = "narrow" | "medium" | "wide";

/** Vertical padding tier of the section. */
export type SectionSpacing = "compact" | "normal" | "spacious";

/** Section background treatment. */
export type BgStyle = "transparent" | "solid" | "gradient";

/** Visual treatment of the highlighted words inside the title. */
export type HighlightStyle = "color" | "gradient" | "marker" | "underline";

/** CTA button visual style. */
export type ButtonStyle = "solid" | "outline" | "ghost";

export interface InteractiveTextConfig {
  // --- Content ---
  eyebrow?: MaybeMultiLang;
  title?: MaybeMultiLang;
  /** Exact substring of the title to emphasise (matched case-insensitively). */
  highlight_words?: MaybeMultiLang;
  highlight_style?: HighlightStyle;
  subtitle?: MaybeMultiLang;
  /** Long text. Manual line breaks become the units of the "lines" animation. */
  paragraph?: MaybeMultiLang;

  // --- CTA ---
  button_text?: MaybeMultiLang;
  button_url?: string;
  button_style?: ButtonStyle;

  // --- Motion ---
  animation_style?: AnimationStyle;
  animation_speed?: AnimationSpeed;
  /** Only used when animation_style === "slide". */
  enter_direction?: EnterDirection;

  // --- Layout ---
  text_align?: TextAlign;
  text_size_mobile?: TextSize;
  text_size_desktop?: TextSizeDesktop;
  content_width?: ContentWidth;
  spacing?: SectionSpacing;

  // --- Colours ---
  theme?: TextTheme;
  bg_style?: BgStyle;
  bg_color?: string; // used when bg_style === "solid"
  bg_grad_1?: string; // used when bg_style === "gradient"
  bg_grad_2?: string;
  title_color?: string;
  subtitle_color?: string;
  text_color?: string;
  /** Highlight + button colour. */
  accent_color?: string;
  /** Second stop of the gradient highlight. */
  accent_color_2?: string;
  button_text_color?: string;
}

/** A run of title text, flagged when it falls inside the highlight match. */
export interface TextSegment {
  text: string;
  hl: boolean;
}
