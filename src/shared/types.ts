/**
 * Shared types for Growth Kit components.
 *
 * Bundling note: `src/shared/` is a source-level convenience only. Each
 * component's dist file inlines its own copy at build time (only `lit` is
 * external), so components stay fully isolated in production.
 */

/** A field marked `multilanguage: true` in twilight-bundle.json arrives as
    a plain string, a per-language map, or nothing at all. */
export type MaybeMultiLang =
  | string
  | { ar?: string; en?: string }
  | null
  | undefined;
