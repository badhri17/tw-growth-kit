import fs from "node:fs";
import process from "node:process";

/**
 * Every `sicon-*` in twilight-bundle.json must exist in Salla's admin icon font.
 * An unknown name is not an error anywhere — the panel just renders an empty
 * box where the icon should be, which is easy to ship and easy to miss. The
 * bundle carried 9 invented names across 91 references before this guard.
 *
 * scripts/sallaicons.txt is the vendored class list. Refresh it with:
 *
 *   curl -sS https://cdn.assets.salla.network/prod/admin/cp/assets/css/icons/sallaicons/style.css \
 *     | grep -oE '\.sicon-[a-zA-Z0-9_-]+' | sed 's/^\.//' | sort -u > scripts/sallaicons.txt
 *
 * It is vendored rather than fetched so the build stays offline-capable.
 *
 * Keep the character class permissive: 14 of the names are Material-style
 * (sicon-keyboard_arrow_down), and an extraction that allows only [a-z0-9-]
 * silently drops them, which reports 72 valid references as broken.
 */

const known = new Set(
  fs
    .readFileSync("scripts/sallaicons.txt", "utf8")
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean),
);

const source = fs.readFileSync("twilight-bundle.json", "utf8");
const bundle = JSON.parse(source);

const used = new Map();

function walk(value, trail) {
  if (Array.isArray(value)) {
    for (const child of value) walk(child, trail);
    return;
  }
  if (!value || typeof value !== "object") return;
  const where = value.name || value.id || trail;
  if (typeof value.icon === "string" && value.icon.startsWith("sicon-")) {
    if (!used.has(value.icon)) used.set(value.icon, []);
    used.get(value.icon).push(where);
  }
  for (const child of Object.values(value)) walk(child, where);
}

walk(bundle.components, "bundle");

const unknown = [...used.entries()].filter(([icon]) => !known.has(icon));

for (const [icon, places] of unknown) {
  const sample = [...new Set(places)].slice(0, 6).join(", ");
  console.error(
    `${icon}: not in Salla's icon font — renders as an empty box. ` +
      `${places.length} reference(s): ${sample}${places.length > 6 ? ", …" : ""}`,
  );
}

if (unknown.length > 0) {
  const total = unknown.reduce((sum, [, places]) => sum + places.length, 0);
  console.error(
    `\n${unknown.length} unknown icon name(s) across ${total} reference(s).`,
  );
  process.exitCode = 1;
} else {
  console.log(
    `Checked ${used.size} distinct sicon-* names against ${known.size} known icons; all valid.`,
  );
}
