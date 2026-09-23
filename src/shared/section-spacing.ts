/**
 * المسافات حول القسم — Section spacing.
 *
 * One vertical rhythm for the whole page, expressed as a tier per edge rather
 * than a pixel value. Padding, never margin, for two reasons:
 *
 *  1. Each section paints its own background, so a margin would put the gap
 *     OUTSIDE the paint and expose the merchant's theme colour at every
 *     section boundary.
 *  2. Adjacent vertical margins collapse (64 below + 40 above = 64, not 104),
 *     so half the merchant's settings would silently do nothing. Padding
 *     never collapses.
 *
 * ⚠️ The visible gap between two stacked sections is the FIRST one's bottom
 * plus the SECOND one's top. That doubling is not a bug — it is why each edge
 * is its own field, so a merchant can zero one side to pull two sections
 * flush against each other.
 *
 * A tier resolves through two tables, not one: desktop sections are far
 * taller, so the same tier has to mean more room there. The merchant picks a
 * rhythm once and it scales.
 *
 * The tiers and the `--sp-*` names are deliberately identical to the ones in
 * tw-landing-bundle: a merchant may stack sections from both bundles on one
 * page, and "متوسطة" has to mean the same gap in both. Keep them in sync.
 *
 * Each component renders into its own shadow root, so the un-prefixed custom
 * property names cannot collide and the CSS stays identical everywhere.
 */

/** Spacing tiers, smallest first. */
export type SectionSpaceTier = "none" | "xs" | "sm" | "md" | "lg" | "xl";

/** Mobile is the primary canvas; these are the concrete values. */
const SPACE_MOBILE: Record<SectionSpaceTier, number> = {
  none: 0,
  xs: 12,
  sm: 24,
  md: 40,
  lg: 56,
  xl: 72,
};

/**
 * Desktop resolves the same tier through its own, larger table — so desktop
 * "md" is bigger than mobile "md" and the merchant never has to set it twice.
 */
const SPACE_DESKTOP: Record<SectionSpaceTier, number> = {
  none: 0,
  xs: 20,
  sm: 32,
  md: 64,
  lg: 96,
  xl: 128,
};

/** Mixed into a component's own config; both fields are top-level in the panel. */
export interface SectionSpacingFields {
  space_top?: SectionSpaceTier | Array<{ value?: string }> | string;
  space_bottom?: SectionSpaceTier | Array<{ value?: string }> | string;
}

/**
 * Resolve both edges into four plain custom properties for the SECTION element.
 *
 * They are plain values, not derived ones, so they are safe to read anywhere —
 * there is no var()-referencing-var() substitution trap to fall into.
 *
 * `pick` is passed in rather than imported so this module stays free of any
 * base-class dependency; it is `GrowthElement._pickValue`.
 *
 * `fallbackTop` / `fallbackBottom` let a section whose intrinsic padding was
 * never on the shared scale keep its own default tier (interactive-text ships
 * "lg"), and MUST match the `selected` value its fields carry in
 * twilight-bundle.json — otherwise the panel and the render disagree before
 * the merchant touches anything.
 */
export function resolveSectionSpacing(
  cfg: SectionSpacingFields | undefined,
  pick: <T extends string>(v: unknown, fallback: T) => T,
  fallbackTop: SectionSpaceTier = "md",
  fallbackBottom: SectionSpaceTier = "md"
): string[] {
  const top = pick<SectionSpaceTier>(cfg?.space_top, fallbackTop);
  const bottom = pick<SectionSpaceTier>(cfg?.space_bottom, fallbackBottom);
  const mTop = SPACE_MOBILE[top] ?? SPACE_MOBILE.md;
  const mBot = SPACE_MOBILE[bottom] ?? SPACE_MOBILE.md;
  const dTop = SPACE_DESKTOP[top] ?? SPACE_DESKTOP.md;
  const dBot = SPACE_DESKTOP[bottom] ?? SPACE_DESKTOP.md;
  return [
    `--sp-top-m:${mTop}px`,
    `--sp-bot-m:${mBot}px`,
    `--sp-top-d:${dTop}px`,
    `--sp-bot-d:${dBot}px`,
  ];
}
