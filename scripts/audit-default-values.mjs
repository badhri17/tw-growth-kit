import fs from "node:fs";
import path from "node:path";
import process from "node:process";

const root = process.cwd();
// `templates/` is optional: a bundle without landing-page templates (this one)
// has only twilight-bundle.json to check. Treat a missing directory as empty
// rather than crashing on ENOENT.
const templatesDir = path.join(root, "templates");
const templateFiles = fs.existsSync(templatesDir)
  ? fs
      .readdirSync(templatesDir, { withFileTypes: true })
      .filter((entry) => entry.isFile() && entry.name.endsWith(".json"))
      .map((entry) => path.join("templates", entry.name))
      .sort()
  : [];
const files = ["twilight-bundle.json", ...templateFiles];
const shouldFix = process.argv.includes("--fix");

function selectedValue(selected) {
  if (!Array.isArray(selected)) return selected;
  const first = selected[0];
  return first && typeof first === "object" ? first.value : undefined;
}

function collectComponents(value, output = []) {
  if (!value || typeof value !== "object") return output;
  if (typeof value.name === "string" && Array.isArray(value.fields)) {
    output.push(value);
  }
  for (const child of Object.values(value)) collectComponents(child, output);
  return output;
}

let issueCount = 0;
let conflictCount = 0;

for (const relativeFile of files) {
  const absoluteFile = path.join(root, relativeFile);
  const source = fs.readFileSync(absoluteFile, "utf8");
  const json = JSON.parse(source);
  const issues = [];

  for (const component of collectComponents(json)) {
    for (const field of component.fields) {
      if (!Object.prototype.hasOwnProperty.call(field, "selected")) continue;
      const value = selectedValue(field.selected);
      if (value === undefined) continue;
      const hasValue = Object.prototype.hasOwnProperty.call(field, "value");
      const conflicts = hasValue && field.value !== value;
      if (hasValue && !conflicts) continue;
      issues.push({
        component: component.name,
        field: field.id,
        value,
        kind: conflicts ? "conflict" : "missing",
      });
      if (conflicts) conflictCount += 1;
      if (shouldFix && !conflicts) field.value = value;
    }
  }

  issueCount += issues.length;
  console.log(`${relativeFile}: ${issues.length} unsafe selected defaults`);
  for (const issue of issues) {
    console.log(
      `  ${issue.kind} ${issue.component}.${issue.field} -> ${JSON.stringify(issue.value)}`,
    );
  }

  if (shouldFix && issues.length > 0) {
    const indent = source.match(/\n([ \t]+)\S/)?.[1]?.length ?? 2;
    const eol = source.includes("\r\n") ? "\r\n" : "\n";
    const output = `${JSON.stringify(json, null, indent)}${eol}`.replaceAll(
      "\n",
      eol,
    );
    fs.writeFileSync(absoluteFile, output, "utf8");
  }
}

if (shouldFix) {
  console.log(`Persisted ${issueCount - conflictCount} selected defaults.`);
  if (conflictCount > 0) {
    console.error(
      `${conflictCount} conflicting defaults require manual review and were not changed.`,
    );
    process.exitCode = 1;
  }
} else if (issueCount > 0) {
  console.error(
    `Found ${issueCount} unsafe defaults. Run pnpm run fix:defaults to persist them.`,
  );
  process.exitCode = 1;
} else {
  console.log("All selected defaults have persisted values.");
}
