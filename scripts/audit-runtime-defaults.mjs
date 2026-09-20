import fs from "node:fs";
import path from "node:path";
import process from "node:process";

const bundle = JSON.parse(fs.readFileSync("twilight-bundle.json", "utf8"));

function collectComponents(value, output = []) {
  if (!value || typeof value !== "object") return output;
  if (typeof value.name === "string" && Array.isArray(value.fields)) {
    output.push(value);
  }
  for (const child of Object.values(value)) collectComponents(child, output);
  return output;
}

function selectedValue(selected) {
  if (!Array.isArray(selected)) return selected;
  return selected[0]?.value;
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function runtimeFallback(source, fieldId) {
  const field = escapeRegExp(fieldId);
  const access = `(?:c|this\\.config\\?)\\.${field}`;
  const pick = source.match(
    new RegExp(
      `_pickValue(?:<[^>]*>)?\\(\\s*${access}\\s*,\\s*["']([^"']+)`,
      "s",
    ),
  );
  if (pick) return { kind: "dropdown", value: pick[1] };

  const number = source.match(
    new RegExp(`_num\\(\\s*${access}\\s*,\\s*([0-9.]+)`, "s"),
  );
  if (number) return { kind: "number", value: Number(number[1]) };

  if (new RegExp(`${access}\\s*!==\\s*false`).test(source)) {
    return { kind: "boolean", value: true };
  }
  if (new RegExp(`${access}\\s*===\\s*true`).test(source)) {
    return { kind: "boolean", value: false };
  }
  return null;
}

let resolved = 0;
let unresolved = 0;
const unresolvedFields = [];
const mismatches = [];

for (const component of collectComponents(bundle)) {
  const componentFile = path.join(
    "src",
    "components",
    component.name,
    "index.ts",
  );
  if (!fs.existsSync(componentFile)) continue;
  const source = fs.readFileSync(componentFile, "utf8");

  for (const field of component.fields) {
    if (!Object.prototype.hasOwnProperty.call(field, "selected")) continue;
    const declared = selectedValue(field.selected);
    const runtime = runtimeFallback(source, field.id);
    if (!runtime) {
      unresolved += 1;
      unresolvedFields.push({
        component: component.name,
        field: field.id,
        declared,
      });
      continue;
    }
    resolved += 1;
    if (String(runtime.value) !== String(declared)) {
      mismatches.push({
        component: component.name,
        field: field.id,
        declared,
        runtime: runtime.value,
        kind: runtime.kind,
      });
    }
  }
}

console.log(`Resolved ${resolved} runtime fallbacks; ${unresolved} need manual review.`);
if (process.argv.includes("--verbose")) {
  for (const field of unresolvedFields) {
    console.log(
      `UNRESOLVED ${field.component}.${field.field} schema=${JSON.stringify(field.declared)}`,
    );
  }
}
for (const mismatch of mismatches) {
  console.error(
    `${mismatch.component}.${mismatch.field}: schema=${JSON.stringify(mismatch.declared)} runtime=${JSON.stringify(mismatch.runtime)} (${mismatch.kind})`,
  );
}

if (mismatches.length > 0) process.exitCode = 1;
else console.log("No detected runtime fallback mismatches.");
