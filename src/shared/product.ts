import { toLatinDigits } from "./growth-element";

/**
 * Salla product plumbing shared by the components that link real store
 * products (before-after, featured-product, product-cards, testimonials,
 * lifestyle-gallery). Each component keeps its own cache and fallback
 * policy; this module owns the SDK access and payload normalisation.
 */

/** Salla SDK global — the storefront exposes lowercase `salla`; some
    contexts attach `Salla`. Resolve defensively. */
export function sallaGlobal(): any {
  const w = window as any;
  return w.salla ?? w.Salla ?? null;
}

/** Product shape after fetching full details from the Salla SDK. Components
    that don't show pricing simply ignore the price fields. */
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

/** Pull { id, label } out of a `source: "products"` picker selection, which
    may arrive as a single object, an array of objects, or a bare id/string. */
export function pickerSelection(
  val: unknown
): { id: number; label: string } | null {
  if (!val) return null;
  if (typeof val === "string" || typeof val === "number") {
    const id = Number(val);
    if (!id || Number.isNaN(id)) return null;
    return { id, label: "" };
  }
  const picked = Array.isArray(val) ? val[0] : val;
  if (!picked) return null;
  if (typeof picked === "string" || typeof picked === "number") {
    const id = Number(picked);
    if (!id || Number.isNaN(id)) return null;
    return { id, label: "" };
  }
  if (typeof picked !== "object") return null;
  const obj = picked as Record<string, unknown>;
  const raw = obj.value ?? obj.id ?? obj.product_id;
  if (raw === undefined || raw === null) return null;
  const id = typeof raw === "number" ? raw : Number(raw);
  if (!id || Number.isNaN(id)) return null;
  const label = String(obj.label ?? obj.name ?? obj.title ?? "").trim();
  return { id, label };
}

/** Best-effort numeric extraction from a price value of any shape. */
export function parseMoney(v: unknown): number | undefined {
  if (typeof v === "number") return Number.isNaN(v) ? undefined : v;
  if (v && typeof v === "object") {
    const o = v as Record<string, unknown>;
    return parseMoney(o.amount ?? o.value ?? o.price);
  }
  if (typeof v !== "string") return undefined;
  const cleaned = toLatinDigits(v)
    .replace(/[^0-9.,]/g, "")
    .replace(/,/g, "");
  if (!cleaned) return undefined;
  const n = parseFloat(cleaned);
  return Number.isNaN(n) ? undefined : n;
}

/** Trim a number to a tidy string (drops trailing .00). */
function formatNum(n: number): string {
  return Number.isInteger(n) ? String(n) : n.toFixed(2).replace(/\.?0+$/, "");
}

/** Format a numeric amount as currency via the SDK, with a plain fallback. */
export function formatMoney(n?: number, currency?: string): string {
  if (n === undefined || n === null || Number.isNaN(n)) return "";
  const salla = sallaGlobal();
  try {
    if (salla && typeof salla.money === "function") {
      return currency ? salla.money({ amount: n, currency }) : salla.money(n);
    }
  } catch {
    /* fall through to plain formatting */
  }
  const v = formatNum(n);
  return currency ? `${v} ${currency}` : v;
}

/**
 * Fetch a product from the storefront SDK and normalise the payload.
 * Resolves the SDK ready-promise first so the API is available even when
 * the component loads before the storefront JS. Throws when the SDK is
 * missing, the API is unavailable, or the payload is empty — callers decide
 * how to degrade (fail vs. keep a loading skeleton).
 */
export async function fetchProductDetails(
  id: number,
  label = ""
): Promise<ResolvedProduct> {
  const salla = sallaGlobal();
  if (!salla) throw new Error("Salla SDK unavailable");

  if (typeof salla.onReady === "function") await salla.onReady();
  const getDetails =
    salla.product?.getDetails ?? salla.product?.api?.getDetails;
  if (typeof getDetails !== "function")
    throw new Error("getDetails unavailable");
  const res = await getDetails.call(salla.product, id);
  const data = (res?.data ?? res) as Record<string, any> | undefined;
  if (!data) throw new Error("empty product payload");

  // Be liberal in what we accept — products expose image as `{ url, alt }`
  // but some surfaces ship `images[0].url` or `thumbnail`.
  const image: string =
    data.image?.url ||
    data.image?.thumbnail ||
    (Array.isArray(data.images) && (data.images[0]?.url || data.images[0])) ||
    data.thumbnail ||
    data.main_image ||
    "";
  const url: string =
    data.url ||
    data.urls?.customer ||
    data.urls?.product ||
    data.permalink ||
    `/p${id}`;

  // --- Price normalisation (defensive: numbers, strings, or {amount}) ---
  const priceVal = parseMoney(data.price);
  const regularVal = parseMoney(data.regular_price);
  const saleVal = parseMoney(data.sale_price);

  let regular = regularVal ?? priceVal;
  let current = priceVal ?? regularVal;
  if (saleVal !== undefined && saleVal > 0) {
    current = saleVal;
    if (regular === undefined || regular <= saleVal)
      regular = regularVal ?? priceVal ?? saleVal;
  }
  const flagged = !!(data.is_on_sale ?? data.on_sale ?? data.has_offer);
  const onSale =
    (flagged || saleVal !== undefined) &&
    regular !== undefined &&
    current !== undefined &&
    current < regular;

  const currency: string | undefined =
    data.currency ||
    data.price?.currency ||
    data.regular_price?.currency ||
    undefined;

  return {
    name: String(data.name || data.title || label || `#${id}`),
    image: image || undefined,
    imageAlt: String(data.image?.alt || data.name || ""),
    url,
    regular,
    sale: onSale ? current : undefined,
    onSale,
    currency,
  };
}
