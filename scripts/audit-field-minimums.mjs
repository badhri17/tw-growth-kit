import fs from "node:fs";
import process from "node:process";

/**
 * Salla's server turns a number field's `minimum` / `maximum` into Laravel
 * `min:` / `max:` rules WITHOUT a companion `numeric` / `integer` rule. Laravel's
 * getSize() therefore falls through to mb_strlen(), so both rules measure the
 * value's STRING LENGTH, and the 422 comes back as validation.min.string —
 * «يجب أن يكون طول النص <field> أكبر من أو يساوي N حروف/حرفًا».
 *
 * A save fails whenever String(value).length < minimum, which is true for
 * essentially every slider with a positive minimum: a merchant saving 44 into a
 * field declared `minimum: 10` is submitting a 2-character string.
 *
 * The local demo panel posts to /api/v1/form-builder-mock, which accepts
 * anything, so this NEVER reproduces in `pnpm dev` — only in production.
 *
 * Guard: `minimum` must be <= 0, and `maximum` must be at least as large as the
 * longest value string the field can hold (e.g. a field reaching -200 needs
 * `maximum` >= 4, because "-200" is 4 characters).
 */

const bundle = JSON.parse(fs.readFileSync("twilight-bundle.json", "utf8"));

function collectComponents(value, output = []) {
  if (!value || typeof value !== "object") return output;
  if (typeof value.name === "string" && Array.isArray(value.fields)) {
    output.push(value);
  }
  for (const child of Object.values(value)) collectComponents(child, output);
  return output;
}

function collectFields(fields, prefix = "", output = []) {
  for (const field of fields || []) {
    if (!field || typeof field !== "object") continue;
    if (field.id) output.push({ ...field, path: prefix + field.id });
    if (Array.isArray(field.fields)) {
      collectFields(field.fields, `${prefix}${field.id}[].`, output);
    }
  }
  return output;
}

const problems = [];
let checked = 0;

for (const component of collectComponents(bundle)) {
  for (const field of collectFields(component.fields)) {
    if (field.minimum == null && field.maximum == null) continue;
    checked++;

    if (typeof field.minimum === "number" && field.minimum > 0) {
      problems.push(
        `${component.name}.${field.path}: minimum=${field.minimum} — a saved value of ` +
          `${JSON.stringify(field.value)} is ${String(field.value ?? "").length} characters, ` +
          `so Salla rejects the save. Use minimum: 0.`,
      );
    }

    if (typeof field.maximum === "number") {
      const widest = Math.max(
        String(field.minimum ?? 0).length,
        String(field.maximum).length,
      );
      if (field.maximum < widest) {
        problems.push(
          `${component.name}.${field.path}: maximum=${field.maximum} is shorter than the ` +
            `${widest}-character value this field can hold — Salla rejects the save. ` +
            `Raise maximum to at least ${widest}.`,
        );
      }
    }
  }
}

for (const problem of problems) console.error(problem);

if (problems.length > 0) {
  console.error(
    `\n${problems.length} field(s) would be rejected by Salla's string-length validation.`,
  );
  process.exitCode = 1;
} else {
  console.log(`Checked ${checked} constrained number fields; no string-length landmines.`);
}
