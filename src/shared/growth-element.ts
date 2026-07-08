import { LitElement } from "lit";
import type { MaybeMultiLang } from "./types";

/** Convert Arabic-Indic / Eastern-Arabic digits to Latin for parsing. */
export function toLatinDigits(s: string): string {
  return s
    .replace(/[٠-٩]/g, (d) => String(d.charCodeAt(0) - 0x0660))
    .replace(/[۰-۹]/g, (d) => String(d.charCodeAt(0) - 0x06f0));
}

/**
 * Shared base for all Growth Kit components: the Salla registration bridge
 * plus the config-parsing helpers every component uses.
 *
 * ⚠️ sallaTransformPlugin appends `<Name>.registerSallaComponent('salla-…')`
 * to each `src/components/<dir>/index.ts`, taking `<Name>` from the FIRST
 * `class <word>` token in the file — comments included. In component files,
 * never write the word "class" followed by another word anywhere above the
 * component declaration, or registration silently targets the wrong name.
 */
export class GrowthElement extends LitElement {
  /**
   * Twilight transform injects `Component.registerSallaComponent(...)`.
   * Statics inherit, so `this` is the concrete component. The polling
   * fallback handles preview contexts where `Salla` loads after the
   * component file executes.
   */
  static registerSallaComponent(name: string) {
    const componentKey = String(name || "").trim();
    const normalizedBase = componentKey
      .toLowerCase()
      .replace(/[^a-z0-9._-]/g, "-");
    const safeBaseName = normalizedBase.includes("-")
      ? normalizedBase
      : `salla-${normalizedBase || "component"}`;
    const buildDynamicTagName = () =>
      `${safeBaseName}-${Math.random().toString(36).substring(2, 8)}`;

    const tryRegister = () => {
      const bundles = (
        window as Window & {
          Salla?: {
            bundles?: {
              registerComponent?: (
                key: string,
                payload: {
                  component: typeof HTMLElement;
                  dynamicTagName: string;
                }
              ) => void;
            };
          };
        }
      ).Salla?.bundles;

      if (bundles && typeof bundles.registerComponent === "function") {
        bundles.registerComponent(componentKey, {
          component: this as unknown as typeof HTMLElement,
          dynamicTagName: buildDynamicTagName(),
        });
        return true;
      }
      return false;
    };
    if (tryRegister()) return;
    const timer = window.setInterval(() => {
      if (tryRegister()) window.clearInterval(timer);
    }, 100);
    window.setTimeout(() => window.clearInterval(timer), 5000);
  }

  /** Resolved document language. */
  protected _lang(): "ar" | "en" {
    return (document.documentElement.lang || "ar")
      .toLowerCase()
      .startsWith("en")
      ? "en"
      : "ar";
  }

  /** Pull the right string out of a multilang value. */
  protected _t(val: MaybeMultiLang): string {
    if (!val) return "";
    if (typeof val === "string") return val;
    return (val[this._lang()] || val.ar || val.en || "").trim();
  }

  /** Dropdown-list values from settings may come as [{ label, value }]. */
  protected _pickValue<T extends string>(val: unknown, fallback: T): T {
    if (typeof val === "string" && val) return val as T;
    if (Array.isArray(val) && val.length > 0) {
      const first = val[0] as { value?: unknown } | undefined;
      if (first && typeof first.value === "string" && first.value)
        return first.value as T;
    }
    return fallback;
  }

  /** See module-level toLatinDigits; exposed for subclasses. */
  protected _toLatinDigits(s: string): string {
    return toLatinDigits(s);
  }

  /** Coerce a config number that may arrive as a string (Arabic-Indic
      digits included) or as a [{ value }] dropdown selection. */
  protected _num(val: unknown, fallback: number): number {
    if (typeof val === "number" && !Number.isNaN(val)) return val;
    if (typeof val === "string" && val.trim() !== "") {
      const n = Number(toLatinDigits(val.trim()));
      if (!Number.isNaN(n)) return n;
    }
    if (Array.isArray(val) && val.length > 0) {
      const first = val[0] as { value?: unknown } | undefined;
      if (first?.value !== undefined) return this._num(first.value, fallback);
    }
    return fallback;
  }
}
